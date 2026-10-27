
export const chats = {
  getChats(spaceId) {
    this.requireId(spaceId, "spaceId");

    return this.request(
      `/api/spaces/${encodeURIComponent(spaceId)}/chats`
    );
  },
};
