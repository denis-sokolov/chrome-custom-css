window.Persist = (function() {
  const prefix = "custom-css-";
  const keyFor = domain => prefix + domain;
  const isDomainKey = key => key.startsWith(prefix);
  const domainFromKey = key => key.substr(prefix.length);

  return {
    get: function(domain) {
      return new Promise(function(resolve) {
        const key = keyFor(domain);
        chrome.storage.sync.get(key, function(storage) {
          const data = storage[key] || {};
          resolve(data.css || "");
        });
      });
    },
    getAll: function() {
      return new Promise(function(resolve) {
        chrome.storage.sync.get(null, function(storage) {
          const result = Object.keys(storage)
            .filter(isDomainKey)
            .map(key => ({
              domain: domainFromKey(key),
              css: storage[key].css || ""
            }));
          resolve(result);
        });
      });
    },
    remove: function(domains) {
      return new Promise(function(resolve) {
        const keys = domains.map(keyFor);
        chrome.storage.sync.remove(keys, () => resolve());
      });
    },
    set: function(domain, css) {
      return new Promise(function(resolve) {
        chrome.storage.sync.set(
          {
            [keyFor(domain)]: {
              css: css,
              updated: Date.now()
            }
          },
          () => resolve()
        );
      });
    }
  };
})();
