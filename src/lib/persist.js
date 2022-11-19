globalThis.Persist = (function () {
  const mapToObject = (input) => {
    const output = {};
    for (let [k, v] of input) output[k] = v;
    return output;
  };
  const prefix = "custom-css-";
  const keyFor = (domain) => prefix + domain;
  const isDomainKey = (key) => key.startsWith(prefix);
  const domainFromKey = (key) => key.substr(prefix.length);
  const cssFromValue = (value) => value.css || "";
  const writeCache = new globalThis.Map();
  let writeQueued = false;

  return {
    get: async function (domain) {
      const key = keyFor(domain);
      if (writeCache.has(key)) return cssFromValue(writeCache.get(key));
      const storage = await chrome.storage.sync.get(key);
      return cssFromValue(storage[key] || {});
    },
    getAll: async function () {
      const storage = await chrome.storage.sync.get(null);
      const result = Object.keys(storage)
        .filter(isDomainKey)
        .map((key) => ({
          domain: domainFromKey(key),
          css: cssFromValue(storage[key]),
        }));
      for (let [k, v] of writeCache) result[domainFromKey(k)] = cssFromValue(v);
      return result;
    },
    remove: async function (domains) {
      const keys = domains.map(keyFor);
      keys.forEach((key) => writeCache.delete(key));
      await chrome.storage.sync.remove(keys);
    },
    set: function (domain, css) {
      writeCache.set(keyFor(domain), {
        css,
        updated: Date.now(),
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
    },
  };
})();
