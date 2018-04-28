Permissions = (function() {
  const api = {
    checkOrigin: function(origin) {
      return new Promise(function(resolve) {
        chrome.permissions.getAll(function(permissions) {
          const allowed = permissions.origins.some(or => or === origin);
          resolve(allowed);
        });
      });
    },
    getAllOrigins: function() {
      return new Promise(function(resolve) {
        chrome.permissions.getAll(function(permissions) {
          resolve(permissions.origins);
        });
      });
    },
    onAddedOrigins: function(cb) {
      chrome.permissions.onAdded.addListener(function(permissions) {
        cb(permissions.origins);
      });
    },
    remove: function(origins) {
      return new Promise(function(resolve) {
        chrome.permissions.remove({ origins: origins }, function() {
          resolve();
        });
      });
    },
    request: function(origins) {
      return new Promise(function(resolve, reject) {
        chrome.permissions.request({ origins: origins }, function(granted) {
          if (!granted) return reject(new Error("Not granted"));
          resolve();
        });
      });
    }
  };
  return api;
})();
