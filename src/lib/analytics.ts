// Visitor analytics via Umami Cloud (https://umami.is). Umami sets no cookies
// and does not store IP addresses or other personal data (the IP is only used
// to look up the location), so it generally needs no consent banner under
// GDPR. It records page views, referrers and UTM campaigns, browser, OS,
// device type, screen size, language, country, region and city, visits and
// their length, plus custom events. Nothing loads until websiteId is set; get
// it from cloud.umami.is under Settings → Websites → Edit.
export const umami = {
  src: 'https://cloud.umami.is/script.js',
  websiteId: 'b4291fff-dd37-4e32-806d-145334106042',
  // Only count visits on the live site, not on localhost or previews.
  domains: 'josian00.github.io',
};

export const analyticsEnabled = umami.websiteId !== '';
