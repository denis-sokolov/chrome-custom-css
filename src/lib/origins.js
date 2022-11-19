globalThis.Origins = (function () {
  const api = {
    cosmeticDomain: (domain) => domain.replace(/^.+\/\/(www\.)?/, ""),
    originToDomain: (origin) => api.urlToDomain(origin),
    domainToOrigins: (domain) => [
      api.urlToOrigin("http://" + domain),
      api.urlToOrigin("https://" + domain),
    ],
    urlMatchesDomain: (url, domain) => api.urlToDomain(url) === domain,
    urlMatchesOrigin: (url, origin) =>
      api.urlMatchesDomain(api.toDomain(origin)),
    urlToDomain: (url) => new URL(url).hostname,
    urlToOrigin: (url) => {
      const t = new URL(url);
      return t.protocol + "//" + t.hostname + "/*";
    },
  };
  return api;
})();
