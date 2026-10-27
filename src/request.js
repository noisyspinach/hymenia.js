
export async function request(client, path, options = {}) {
  if (typeof path !== "string" || !path.startsWith("/")) {
    throw new TypeError("API path must start with '/'");
  }

  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

  headers.set("Authorization", `App ${client.token}`);

  const config = { method, headers };

  if (options.body !== undefined && options.body !== null) {
    const isFormData =
      typeof FormData !== "undefined" &&
      options.body instanceof FormData;

    const isBlob =
      typeof Blob !== "undefined" &&
      options.body instanceof Blob;

    if (
      typeof options.body === "string" ||
      isFormData ||
      isBlob
    ) {
      config.body = options.body;
    } else {
      headers.set("Content-Type", "application/json");
      config.body = JSON.stringify(options.body);
    }
  }

  const timeout = options.timeout ?? client.timeout;
  const retries =
    options.retries ??
    (method === "GET" ? client.maxRateLimitRetries : 0);

  if (!Number.isFinite(timeout) || timeout <= 0) {
    throw new TypeError("timeout must be a positive number");
  }

  if (!Number.isInteger(retries) || retries < 0) {
    throw new TypeError("retries must be a non-negative integer");
  }

  const url = `${client.baseURL}${path}`;

  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const externalSignal = options.signal;
    let timedOut = false;

    const abortFromExternal = () => controller.abort();

    if (externalSignal?.aborted) {
      throw new Error(`Request aborted: ${method} ${path}`);
    }

    externalSignal?.addEventListener(
      "abort",
      abortFromExternal,
      { once: true }
    );

    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);

    let response;

    try {
      response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
    } catch (cause) {
      const error = new Error(
        timedOut
          ? `Request timed out after ${timeout}ms: ${method} ${path}`
          : externalSignal?.aborted
            ? `Request aborted: ${method} ${path}`
            : `Network request failed: ${method} ${path}`,
        { cause }
      );

      error.method = method;
      error.path = path;
      throw error;
    } finally {
      clearTimeout(timer);
      externalSignal?.removeEventListener(
        "abort",
        abortFromExternal
      );
    }

    const text = await response.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (response.ok) {
      return data;
    }

    const retryHeader = response.headers.get("retry-after");
    let retryAfter = null;

    if (retryHeader) {
      const seconds = Number(retryHeader);

      if (Number.isFinite(seconds) && seconds >= 0) {
        retryAfter = seconds;
      } else {
        const date = Date.parse(retryHeader);

        if (!Number.isNaN(date)) {
          retryAfter = Math.max(0, (date - Date.now()) / 1000);
        }
      }
    }

    if (
      response.status === 429 &&
      method === "GET" &&
      attempt < retries
    ) {
      const delaySeconds =
        retryAfter ?? Math.min(2 ** attempt, 30);

      await new Promise((resolve, reject) => {
        if (externalSignal?.aborted) {
          reject(new Error(`Request aborted: ${method} ${path}`));
          return;
        }

        const delayTimer = setTimeout(() => {
          externalSignal?.removeEventListener("abort", abort);
          resolve();
        }, delaySeconds * 1000);

        function abort() {
          clearTimeout(delayTimer);
          externalSignal?.removeEventListener("abort", abort);
          reject(new Error(`Request aborted: ${method} ${path}`));
        }

        externalSignal?.addEventListener("abort", abort, {
          once: true,
        });
      });

      continue;
    }

    const message =
      data &&
      typeof data === "object" &&
      typeof data.error === "string"
        ? data.error
        : typeof data === "string" && data
          ? data
          : `HTTP ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    error.retryAfter = retryAfter;
    error.method = method;
    error.path = path;

    throw error;
  }
}
