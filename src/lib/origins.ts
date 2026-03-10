export const Origins = (function () {
  const api = {
    cosmeticDomain: (domain: string) => domain.replace(/^.+\/\/(www\.)?/, ""),
    originToDomain: (origin: string) => api.urlToDomain(origin),
    domainToOrigins: (domain: string) => [
      api.urlToOrigin("http://" + domain),
      api.urlToOrigin("https://" + domain),
    ],
    urlMatchesDomain: (url: string, domain: string) =>
      api.urlToDomain(url) === domain,
    urlToDomain: (url: string) => new URL(url).hostname,
    urlToOrigin: (url: string) => {
      const t = new URL(url);
      return t.protocol + "//" + t.hostname + "/*";
    },
  };
  return api;
})();
