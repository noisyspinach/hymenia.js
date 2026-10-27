
import { request } from "./request.js";

import { chats } from "./resources/chats.js";
import { messages } from "./resources/messages.js";
import { profiles } from "./resources/profiles.js";
import { spaces } from "./resources/spaces.js";

export class HmJS {
  constructor(options = {}) {
    if (
      typeof options.token !== "string" ||
      !options.token.trim()
    ) {
      throw new Error("A bot token is required");
    }

    this.baseURL = (
      options.baseURL || "https://api.hymenia.com"
    ).replace(/\/+$/, "");

    this.token = options.token.trim();
    this.timeout = options.timeout ?? 15000;
    this.maxRateLimitRetries =
      options.maxRateLimitRetries ?? 2;
  }

  request(path, options = {}) {
    return request(this, path, options);
  }

  requireId(value, name) {
    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {
      throw new TypeError(`${name} is required.`);
    }
  }

  ping() {
    return this.request("/health");
  }
}

// attach resource methods to the HmJS prototype
// this allows us to call methods like bot.getChats(spaceId)
Object.assign(
  HmJS.prototype,
  spaces,
  chats,
  messages,
  profiles
);
