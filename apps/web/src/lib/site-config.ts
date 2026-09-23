const url =
  process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://uicapsule.com";

export const siteConfig = {
  description: "A curated collection of components that spark joy",
  name: "UICapsule",
  shortName: "UICapsule",
  twitter: "@kaiyuhsu",
  url,
};

export const ogImage = {
  alt: `${siteConfig.name} — ${siteConfig.description}`,
  height: 630,
  url: `${url}/og.jpg`,
  width: 1200,
};
