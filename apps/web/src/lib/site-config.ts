export const siteConfig = {
  author: {
    name: "Kaiyu Hsu",
    url: "https://kyh.io",
  },
  description: "A curated collection of components that spark joy",
  /** Published contact address — the same one the shadcn registry ships as its `author`. */
  email: "uicapsule@kyh.io",
  name: "UICapsule",
  repository: "https://github.com/kyh/uicapsule",
  /** Profiles that resolve to the same entity, for `Organization.sameAs`. */
  sameAs: ["https://github.com/kyh/uicapsule", "https://x.com/kaiyuhsu"],
  shortName: "UICapsule",
  twitter: "@kaiyuhsu",
  url: process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://uicapsule.com",
};
