export const Permissions = (function () {
  const api = {
    checkOrigin: async function (origin: string) {
      const permissions = await chrome.permissions.getAll();
      const allowed = permissions.origins!.some((or) => or === origin);
      return allowed;
    },
    getAllOrigins: async function () {
      const permissions = await chrome.permissions.getAll();
      return permissions.origins!;
    },
    onAddedOrigins: function (cb: (origins: string[]) => void) {
      chrome.permissions.onAdded.addListener(function (permissions) {
        cb(permissions.origins!);
      });
    },
    remove: async function (origins: string[]) {
      await chrome.permissions.remove({ origins: origins });
    },
    request: async function (origins: string[]) {
      const granted = await chrome.permissions.request({ origins: origins });
      if (!granted) throw new Error("Not granted");
    },
  };
  return api;
})();
