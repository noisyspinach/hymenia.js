
export const spaces = {
  getSpaces() {
    return this.request("/api/spaces");
  },

  discoverSpaces() {
    return this.request("/api/spaces/discover");
  },

  getSpaceMembers(spaceId) {
    this.requireId(spaceId, "spaceId");

    return this.request(
      `/api/spaces/${encodeURIComponent(spaceId)}/members`
    );
  },
};
