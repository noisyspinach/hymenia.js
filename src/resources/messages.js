
export const messages = {
  getMessages(chatId, options = {}) {
    this.requireId(chatId, "chatId");

    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new TypeError("getMessages options must be an object");
    }

    const { beforeAt, beforeId } = options;

    if ((beforeAt == null) !== (beforeId == null)) {
      throw new TypeError(
        "beforeAt and beforeId must be provided together"
      );
    }

    const query = new URLSearchParams({
      chat_id: String(chatId),
    });

    if (beforeAt != null) {
      if (
        typeof beforeAt !== "string" ||
        Number.isNaN(Date.parse(beforeAt))
      ) {
        throw new TypeError("beforeAt must be a valid timestamp string");
      }

      if (typeof beforeId !== "string" || !beforeId.trim()) {
        throw new TypeError("beforeId must be a non-empty message ID");
      }

      query.set("before_at", beforeAt);
      query.set("before_id", beforeId);
    }

    return this.request(`/api/messages?${query}`);
  },

  async getAllMessages(chatId, options = {}) {
    this.requireId(chatId, "chatId");

    const allMessages = [];
    const maxPages = options.maxPages ?? Infinity;

    if (
      typeof maxPages !== "number" ||
      maxPages < 1 ||
      (!Number.isInteger(maxPages) && maxPages !== Infinity)
    ) {
      throw new TypeError("maxPages must be a positive integer");
    }

    let beforeAt;
    let beforeId;
    let pagesFetched = 0;

    while (pagesFetched < maxPages) {
      const page = await this.getMessages(chatId, {
        ...(beforeAt ? { beforeAt, beforeId } : {}),
      });

      if (!page || !Array.isArray(page.messages)) {
        throw new Error("Unexpected getMessages response");
      }

      allMessages.push(...page.messages);
      pagesFetched++;

      if (!page.hasMore || page.messages.length === 0) {
        break;
      }

      // newest first
      const oldest = page.messages[page.messages.length - 1];

      if (!oldest.created_at || !oldest.id) {
        throw new Error(
          "Cannot paginate: message is missing created_at or id"
        );
      }

      beforeAt = oldest.created_at;
      beforeId = oldest.id;
    }

    return allMessages;
  },

   async sendMessage(payload) {
    return this.request('/messages', {
      method: 'POST',
      body: payload
    });
  },

  async editMessage(messageId, payload) {
    return this.request(`/messages/${messageId}`, {
      method: 'PATCH',
      body: payload
    });
  },

  async deleteMessage(messageId) {
    return this.request(`/messages/${messageId}`, {
      method: 'DELETE'
    });
  }
};
