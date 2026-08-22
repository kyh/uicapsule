import { describe, expect, it } from "vitest";

import { privacyPage } from "./site-pages";
import {
  buildCollectionPage,
  buildComponentBreadcrumb,
  buildComponentGraph,
  buildHomeGraph,
  buildOrganization,
  buildProsePageGraph,
  buildSoftwareApplication,
  buildSoftwareSourceCode,
  buildWebPage,
  buildWebSite,
  serializeJsonLd,
} from "./structured-data";

import type { JsonLdValue } from "./structured-data";

import type { ContentComponentSummary } from "@/lib/content/content-schema";

const withDescription: ContentComponentSummary = {
  slug: "dynamic-island",
  type: "local",
  name: "Dynamic Island",
  description: "A springy Dynamic Island interaction.",
  tags: ["overlay"],
};

const bare: ContentComponentSummary = { slug: "feed", type: "local", name: "Feed" };

describe("buildOrganization", () => {
  const organization = buildOrganization();

  it("carries the identity fields an agent resolves an entity by", () => {
    expect(organization["@type"]).toBe("Organization");
    expect(organization.name).toBe("UICapsule");
    expect(organization.url).toBe("https://uicapsule.com");
    expect(organization.description.length).toBeGreaterThan(40);
    expect(organization.sameAs).toEqual([
      "https://github.com/kyh/uicapsule",
      "https://x.com/kaiyuhsu",
    ]);
  });

  it("exposes reachable contactPoints, each with an email and a contactType", () => {
    expect(organization.contactPoint.length).toBeGreaterThan(0);
    for (const point of organization.contactPoint) {
      expect(point["@type"]).toBe("ContactPoint");
      expect(point.email).toBe("uicapsule@kyh.io");
      expect(point.contactType.length).toBeGreaterThan(0);
    }
  });

  it("omits address rather than inventing one", () => {
    // UICapsule is a personal open-source project with no business premises.
    // A fabricated PostalAddress would be worse than none.
    expect(Object.keys(organization)).not.toContain("address");
  });
});

describe("buildHomeGraph", () => {
  const components = [withDescription, bare];
  const graph = buildHomeGraph(components);
  const organization = buildOrganization();
  const website = buildWebSite();
  const application = buildSoftwareApplication(components.length);
  const page = buildCollectionPage(components);

  it("declares the schema.org context once, at the root", () => {
    expect(graph["@context"]).toBe("https://schema.org");
    for (const node of graph["@graph"]) {
      expect(Object.keys(node)).not.toContain("@context");
    }
  });

  it("carries the four identity nodes an agent resolves the site by", () => {
    expect(graph["@graph"].map((node) => node["@type"])).toEqual([
      "Organization",
      "WebSite",
      "SoftwareApplication",
      "CollectionPage",
    ]);
  });

  it("describes the site as a free, MIT-licensed developer application", () => {
    expect(application["@type"]).toBe("SoftwareApplication");
    expect(application.applicationCategory).toBe("DeveloperApplication");
    expect(application.isAccessibleForFree).toBe(true);
    expect(application.license).toContain("MIT");
    expect(application.offers).toMatchObject({ price: "0", priceCurrency: "USD" });
    expect(application.featureList[0]).toContain("2 live");
  });

  it("lists every component in an ItemList", () => {
    expect(page["@type"]).toBe("CollectionPage");
    expect(page.mainEntity.numberOfItems).toBe(2);
    expect(page.mainEntity.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        url: "https://uicapsule.com/ui/dynamic-island",
        name: "Dynamic Island",
      },
      {
        "@type": "ListItem",
        position: 2,
        url: "https://uicapsule.com/ui/feed",
        name: "Feed",
      },
    ]);
  });

  it("points every node back at the one Organization node", () => {
    expect(website.publisher).toEqual({ "@id": organization["@id"] });
    expect(application.publisher).toEqual({ "@id": organization["@id"] });
    expect(page.isPartOf).toEqual({ "@id": website["@id"] });
  });
});

describe("buildComponentGraph", () => {
  const source = buildSoftwareSourceCode(withDescription);
  const breadcrumb = buildComponentBreadcrumb(withDescription);

  it("is an Organization, the source code, and a breadcrumb", () => {
    expect(buildComponentGraph(withDescription)["@graph"].map((node) => node["@type"])).toEqual([
      "Organization",
      "SoftwareSourceCode",
      "BreadcrumbList",
    ]);
  });

  it("describes the component as source code", () => {
    expect(source["@type"]).toBe("SoftwareSourceCode");
    expect(source.name).toBe("Dynamic Island");
    expect(source.url).toBe("https://uicapsule.com/ui/dynamic-island");
    expect(source.programmingLanguage).toBe("TypeScript");
    expect(source.keywords).toBe("overlay");
  });

  it("puts the component under the site in a breadcrumb", () => {
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    expect(breadcrumb.itemListElement.map((item) => item.name)).toEqual([
      "UICapsule",
      "Dynamic Island",
    ]);
  });

  it("falls back to the site author, and drops empty optional fields", () => {
    const bareSource = buildSoftwareSourceCode(bare);
    expect(bareSource.author).toEqual([
      { "@type": "Person", name: "Kaiyu Hsu", url: "https://kyh.io" },
    ]);
    expect(bareSource.description).toBeUndefined();
    expect(bareSource.keywords).toBeUndefined();
    // `undefined` is how an optional field is omitted — JSON.stringify drops it.
    expect(serializeJsonLd(bareSource)).not.toContain("keywords");
  });
});

describe("buildProsePageGraph", () => {
  it("describes the page and links it to the organization", () => {
    const page = buildWebPage(privacyPage);
    expect(page.url).toBe("https://uicapsule.com/privacy");
    expect(page.name).toBe("Privacy");
    expect(page.about).toEqual({ "@id": buildOrganization()["@id"] });
    expect(buildProsePageGraph(privacyPage)["@graph"].map((node) => node["@type"])).toEqual([
      "Organization",
      "WebPage",
    ]);
  });
});

describe("serializeJsonLd", () => {
  it("round-trips through JSON.parse", () => {
    const graph = buildHomeGraph([withDescription, bare]);
    const parsed: JsonLdValue = JSON.parse(serializeJsonLd(graph));
    expect(parsed).toEqual(JSON.parse(JSON.stringify(graph)));
  });

  it("escapes < so a value can never close the script tag", () => {
    const serialized = serializeJsonLd({ name: "</script><img src=x onerror=alert(1)>" });
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c");
    expect(JSON.parse(serialized)).toEqual({ name: "</script><img src=x onerror=alert(1)>" });
  });
});
