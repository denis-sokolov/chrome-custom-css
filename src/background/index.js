import { Origins } from "../lib/origins.js";
import { Permissions } from "../lib/permissions.js";
import { Persist } from "../lib/persist.js";

const getTabsForDomain = async function (domain) {
  const tabMatchesDomain = function (tab, domain) {
    const url = tab.url;
    if (!url || !domain) return false;
    return Origins.urlMatchesDomain(url, domain);
  };

  const tabs = await chrome.tabs.query({});
  return tabs.filter((tab) => tabMatchesDomain(tab, domain));
};

const initTab = async function (tab) {
  const url = tab.url;
  if (!url) return;
  const domain = Origins.urlToDomain(url);
  const t = await Promise.all([Persist.get(domain), injectTabCode(tab)]);
  const settings = t[0];
  if (!settings.css) return;
  updateTab(tab, settings);
};

const initTabs = async function (tabs) {
  return Promise.all(tabs.map(initTab));
};

const injectTabCode = async function (tab) {
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["src/content/index.js"],
  });
};

const updateTab = function (tab, settings) {
  chrome.tabs.sendMessage(tab.id, {
    type: "your-settings-changed",
    settings: settings,
  });
};

setTimeout(async function () {
  const isWorthy = (settings) => Boolean(settings.css.trim());

  const items = await Persist.getAll();
  const domainsToKeep = items
    .filter((item) => isWorthy(item.settings))
    .map((item) => item.domain);

  Persist.remove(
    items.filter((item) => !isWorthy(item.settings)).map((item) => item.domain)
  );

  const origins = await Permissions.getAllOrigins();
  const originsToDrop = origins.filter(
    (origin) => domainsToKeep.indexOf(Origins.originToDomain(origin)) === -1
  );
  Permissions.remove(originsToDrop);
}, 100);

chrome.tabs.onUpdated.addListener((_id, _info, tab) => {
  initTab(tab);
});

Permissions.onAddedOrigins(function (origins) {
  origins
    .map((origin) => Origins.originToDomain(origin))
    .forEach(async function (domain) {
      const tabs = await getTabsForDomain(domain);
      initTabs(tabs);
    });
});

chrome.runtime.onMessage.addListener(async function (msg) {
  if (msg.type === "settings-changed") {
    const tabs = await getTabsForDomain(msg.domain);
    tabs.forEach((tab) => updateTab(tab, msg.settings));
    Persist.set(msg.domain, () => msg.settings);
  }
});
