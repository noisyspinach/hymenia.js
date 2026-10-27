export const profiles = {
  getProfile(username) {
    this.requireId(username, "username");

    return this.request(
      `/api/profile/${encodeURIComponent(username)}`
    );
  },

  updateProfile(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new TypeError("updateProfile expects a payload objet");
    }

    return this.request("/api/account/profile", {
      method: "PATCH",
      body: payload,
    });
  },

  setAvatar(avatar) {
    if (typeof avatar !== "string" || !avatar.trim()) {
      throw new TypeError("Avatar must be a non-empty string");
    }

    return this.updateProfile({ avatar: avatar.trim() });
  },
};
