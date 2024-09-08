import "../lib/origins.js";
import "../lib/permissions.js";
import "../lib/persist.js";

const { Origins, Permissions, Persist } = globalThis;

const ensureTab = async function (tabOrTabId) {
  if (typeof tabOrTabId === "number") {
    return await chrome.tabs.get(tabOrTabId);
  }
  return tabOrTabId;
};

const getTabsForDomain = async function (domain) {
  const tabMatchesDomain = function (tab, domain) {
    const url = tab.url;
    if (!url || !domain) return false;
    return Origins.urlMatchesDomain(url, domain);
  };

  const tabs = await chrome.tabs.query({});
  return tabs.filter((tab) => tabMatchesDomain(tab, domain));
};

const initTab = async function (tabOrTabId) {
  const tab = await ensureTab(tabOrTabId);
  const url = tab.url;
  if (!url) return;
  const domain = Origins.urlToDomain(url);
  const css = await Persist.get(domain);
  if (!css) return;
  updateTabCss(tab, css);
};

const initTabs = async function (tabs) {
  return Promise.all(tabs.map(initTab));
};

const cssPerTab = new Map();
chrome.tabs.onRemoved.addListener(tabId => cssPerTab.delete(tabId));
const updateTabCss = function (tab, css) {
  const previousCss = cssPerTab.get(tab.id);
  if (previousCss) chrome.scripting.removeCSS(previousCss);

  const newCss = {
    target: { tabId: tab.id },
    css,
    origin: 'AUTHOR'
  };
  cssPerTab.set(tab.id, newCss);
  chrome.scripting.insertCSS(newCss);
};

setTimeout(async function () {
  const isWorthyCss = (css) => Boolean(css.trim());

  const items = await Persist.getAll();
  const domainsToKeep = items
    .filter((item) => isWorthyCss(item.css))
    .map((item) => item.domain);

  Persist.remove(
    items.filter((item) => !isWorthyCss(item.css)).map((item) => item.domain)
  );

  const origins = await Permissions.getAllOrigins();
  const originsToDrop = origins.filter(
    (origin) => domainsToKeep.indexOf(Origins.originToDomain(origin)) === -1
  );
  Permissions.remove(originsToDrop);
}, 100);

chrome.tabs.onUpdated.addListener((id) => {
  initTab(id);
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
  if (msg.type === "css-changed") {
    const tabs = await getTabsForDomain(msg.domain);
    tabs.forEach((tab) => updateTabCss(tab, msg.css));
    Persist.set(msg.domain, msg.css);
  }
});
