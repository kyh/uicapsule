export const siteConfig = {
  name: "UICapsule",
  shortName: "UICapsule",
  description: "A curated collection of components that spark joy",
  url: process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://uicapsule.com",
  twitter: "@kaiyuhsu",
  /** Published contact address — the same one the shadcn registry ships as its `author`. */
  email: "uicapsule@kyh.io",
  author: {
    name: "Kaiyu Hsu",
    url: "https://kyh.io",
  },
  repository: "https://github.com/kyh/uicapsule",
  /** Profiles that resolve to the same entity, for `Organization.sameAs`. */
  sameAs: ["https://github.com/kyh/uicapsule", "https://x.com/kaiyuhsu"],
};
