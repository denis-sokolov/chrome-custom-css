window.Persist = (function() {
  const mapToObject = input => {
    const output = {};
    for (let [k, v] of input) output[k] = v;
    return output;
  };
  const prefix = "custom-css-";
  const keyFor = domain => prefix + domain;
  const isDomainKey = key => key.startsWith(prefix);
  const domainFromKey = key => key.substr(prefix.length);
  const cssFromValue = value => value.css || "";
  const writeCache = new window.Map();
  let writeQueued = false;

  return {
    get: function(domain) {
      return new Promise(function(resolve) {
        const key = keyFor(domain);
        if (writeCache.has(key))
          return resolve(cssFromValue(writeCache.get(key)));
        chrome.storage.sync.get(key, function(storage) {
          resolve(cssFromValue(storage[key] || {}));
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
              css: cssFromValue(storage[key])
            }));
          for (let [k, v] of writeCache)
            result[domainFromKey(k)] = cssFromValue(v);
          resolve(result);
        });
      });
    },
    remove: function(domains) {
      return new Promise(function(resolve) {
        const keys = domains.map(keyFor);
        keys.forEach(key => writeCache.delete(key));
        chrome.storage.sync.remove(keys, () => resolve());
      });
    },
    set: function(domain, css) {
      writeCache.set(keyFor(domain), {
        css,
        updated: Date.now()
      });
      if (!writeQueued) {
        writeQueued = true;
        // Chrome limits writes at 120 per minute
        setTimeout(() => {
          chrome.storage.sync.set(mapToObject(writeCache));
          writeCache.clear();
          writeQueued = false;
        }, 1000);
      }
      return Promise.resolve();
    }
  };
})();
