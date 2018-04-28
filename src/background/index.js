const ensureTab = function(tabOrTabId) {
  if (typeof tabOrTabId === "number")
    return new Promise(function(resolve) {
      chrome.tabs.get(tabOrTabId, tab => resolve(tab));
    });
  return Promise.resolve(tabOrTabId);
};

const getTabsForDomain = function(domain) {
  const tabMatchesDomain = function(tab, domain) {
    const url = tab.url;
    if (!url || !domain) return false;
    return Origins.urlMatchesDomain(url, domain);
  };

  return new Promise(function(resolve) {
    chrome.tabs.query({}, function(tabs) {
      resolve(tabs.filter(tab => tabMatchesDomain(tab, domain)));
    });
  });
};

const initTab = function(tabOrTabId) {
  return ensureTab(tabOrTabId).then(function(tab) {
    const url = tab.url;
    if (!url) return;
    const domain = Origins.urlToDomain(url);
    Promise.all([Persist.get(domain), injectTabCode(tab)]).then(function(t) {
      const css = t[0];
      if (!css) return;
      updateTabCss(tab, css);
    });
  });
};

const initTabs = function(tabs) {
  return Promise.all(tabs.map(initTab));
};

const injectTabCode = function(tab) {
  return new Promise(function(resolve) {
    chrome.tabs.executeScript(
      tab.id,
      {
        file: "src/content/index.js"
      },
      resolve
    );
  });
};

const updateTabCss = function(tab, css) {
  chrome.tabs.sendMessage(tab.id, {
    type: "your-css-changed",
    css: css
  });
};

setTimeout(function() {
  const isWorthyCss = css => Boolean(css.trim());

  Persist.getAll().then(function(items) {
    const domainsToKeep = items
      .filter(item => isWorthyCss(item.css))
      .map(item => item.domain);

    Persist.remove(
      items.filter(item => !isWorthyCss(item.css)).map(item => item.domain)
    );

    Permissions.getAllOrigins().then(function(origins) {
      const originsToDrop = origins.filter(
        origin => domainsToKeep.indexOf(Origins.originToDomain(origin)) === -1
      );
      Permissions.remove(originsToDrop);
    });
  });
}, 100);

chrome.tabs.onUpdated.addListener(id => {
  initTab(id);
});

Permissions.onAddedOrigins(function(origins) {
  origins
    .map(origin => Origins.originToDomain(origin))
    .forEach(function(domain) {
      getTabsForDomain(domain).then(initTabs);
    });
});

chrome.runtime.onMessage.addListener(function(msg) {
  if (msg.type === "css-changed") {
    getTabsForDomain(msg.domain).then(tabs =>
      tabs.forEach(tab => updateTabCss(tab, msg.css))
    );
    Persist.set(msg.domain, msg.css);
  }
});
