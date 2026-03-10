export type Settings = {
  css: string;
  textAttributesSelector: string;
};

export const Persist = (function () {
  const mapToObject = (input: Iterable<[string, any]>) => {
    const output: Record<string, any> = {};
    for (let [k, v] of input) output[k] = v;
    return output;
  };
  const prefix = "custom-css-";
  const keyFor = (domain: string) => prefix + domain;
  const isDomainKey = (key: string) => key.startsWith(prefix);
  const domainFromKey = (key: string) => key.substr(prefix.length);
  const settingsFromValue = (value: Partial<Settings>) => ({
    css: value.css || "",
    textAttributesSelector: value.textAttributesSelector || "",
  });
  const writeCache = new globalThis.Map<
    string,
    Settings & { updated: number }
  >();
  let writeQueued = false;

  const get = async function (domain: string) {
    const key = keyFor(domain);
    if (writeCache.has(key)) return settingsFromValue(writeCache.get(key)!);
    const storage = await chrome.storage.sync.get(key);
    return settingsFromValue(storage[key] || {});
  };

  return {
    get: get,
    getAll: async function () {
      const storage = await chrome.storage.sync.get(null);
      const result = Object.keys(storage)
        .filter(isDomainKey)
        .map((key) => ({
          domain: domainFromKey(key),
          settings: settingsFromValue(storage[key] as Partial<Settings>),
        }));
      for (let [k, v] of writeCache)
        result.push({
          domain: domainFromKey(k),
          settings: settingsFromValue(v),
        });
      return result;
    },
    remove: async function (domains: string[]) {
      const keys = domains.map(keyFor);
      keys.forEach((key) => writeCache.delete(key));
      await chrome.storage.sync.remove(keys);
    },
    set: async function (
      domain: string,
      change: (settings: Settings) => Settings
    ) {
      writeCache.set(keyFor(domain), {
        ...change(await get(domain)),
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
    },
  };
})();
