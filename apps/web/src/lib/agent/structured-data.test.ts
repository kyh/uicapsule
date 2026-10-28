import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { privacyPage, termsPage } from "./site-pages";
import {
  buildCollectionPage,
  buildComponentBreadcrumb,
  buildComponentGraph,
  buildHomeGraph,
  buildOrganization,
  buildProsePageGraph,
  buildSoftwareApplication,
  buildSoftwareSourceCode,
  buildVideoObject,
  buildWebPage,
  buildWebSite,
  isoDuration,
  serializeJsonLd,
} from "./structured-data";

import type { JsonLdValue, SocialVideo } from "./structured-data";

import type { ContentComponentSummary } from "@/lib/content/content-schema";

const withDescription: ContentComponentSummary = {
  addedAt: "2026-01-02",
  description: "A springy Dynamic Island interaction.",
  name: "Dynamic Island",
  slug: "dynamic-island",
  tags: ["effects"],
  type: "local",
};

const bare: ContentComponentSummary = {
  addedAt: "2026-01-01",
  description: "A vertical feed of cards.",
  name: "Feed",
  slug: "feed",
  tags: ["cards-grids"],
  type: "local",
};

describe("buildOrganization", () => {
  const organization = buildOrganization();

  test("carries the identity fields an agent resolves an entity by", () => {
    assert.equal(organization["@type"], "Organization");
    assert.equal(organization.name, "UICapsule");
    assert.equal(organization.url, "https://www.uicapsule.com");
    assert.ok(organization.description.length > 40, "expected > 40");
    assert.deepEqual(organization.sameAs, [
      "https://github.com/kyh/uicapsule",
      "https://x.com/kaiyuhsu",
    ]);
  });

  test("exposes reachable contactPoints, each with an email and a contactType", () => {
    assert.ok(organization.contactPoint.length > 0, "expected > 0");
    for (const point of organization.contactPoint) {
      assert.equal(point["@type"], "ContactPoint");
      assert.equal(point.email, "uicapsule@kyh.io");
      assert.ok(point.contactType.length > 0, "expected > 0");
    }
  });

  test("omits address rather than inventing one", () => {
    // UICapsule is a personal open-source project with no business premises.
    // A fabricated PostalAddress would be worse than none.
    assert.ok(!Object.keys(organization).includes("address"), 'should not contain "address"');
  });
});

describe("buildHomeGraph", () => {
  const components = [withDescription, bare];
  const graph = buildHomeGraph(components);
  const organization = buildOrganization();
  const website = buildWebSite();
  const application = buildSoftwareApplication(components.length);
  const page = buildCollectionPage(components);

  test("declares the schema.org context once, at the root", () => {
    assert.equal(graph["@context"], "https://schema.org");
    for (const node of graph["@graph"]) {
      assert.ok(!Object.keys(node).includes("@context"), 'should not contain "@context"');
    }
  });

  test("carries the four identity nodes an agent resolves the site by", () => {
    assert.deepEqual(
      graph["@graph"].map((node) => node["@type"]),
      ["Organization", "WebSite", "SoftwareApplication", "CollectionPage"],
    );
  });

  test("describes the site as a free, MIT-licensed developer application", () => {
    assert.equal(application["@type"], "SoftwareApplication");
    assert.equal(application.applicationCategory, "DeveloperApplication");
    assert.equal(application.isAccessibleForFree, true);
    assert.ok(application.license.includes("MIT"), 'should contain "MIT"');
    assert.deepEqual(application.offers, {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: "0",
      priceCurrency: "USD",
    });
    assert.ok(
      application.featureList.some((feature) => feature.includes("2 live")),
      `featureList does not report the component count: ${application.featureList.join(" | ")}`,
    );
  });

  test("lists every component in an ItemList", () => {
    assert.equal(page["@type"], "CollectionPage");
    assert.equal(page.mainEntity.numberOfItems, 2);
    assert.deepEqual(page.mainEntity.itemListElement, [
      {
        "@type": "ListItem",
        name: "Dynamic Island",
        position: 1,
        url: "https://www.uicapsule.com/ui/dynamic-island",
      },
      {
        "@type": "ListItem",
        name: "Feed",
        position: 2,
        url: "https://www.uicapsule.com/ui/feed",
      },
    ]);
  });

  test("points every node back at the one Organization node", () => {
    assert.deepEqual(website.publisher, { "@id": organization["@id"] });
    assert.deepEqual(application.publisher, { "@id": organization["@id"] });
    assert.deepEqual(page.isPartOf, { "@id": website["@id"] });
  });
});

describe("buildComponentGraph", () => {
  const source = buildSoftwareSourceCode(withDescription);
  const breadcrumb = buildComponentBreadcrumb(withDescription);

  test("is an Organization, the source code, and a breadcrumb", () => {
    assert.deepEqual(
      buildComponentGraph(withDescription)["@graph"].map((node) => node["@type"]),
      ["Organization", "SoftwareSourceCode", "BreadcrumbList"],
    );
  });

  test("describes the component as source code", () => {
    assert.equal(source["@type"], "SoftwareSourceCode");
    assert.equal(source.name, "Dynamic Island");
    assert.equal(source.url, "https://www.uicapsule.com/ui/dynamic-island");
    assert.equal(source.programmingLanguage, "TypeScript");
    assert.equal(source.keywords, "effects");
  });

  test("puts the component under the site in a breadcrumb", () => {
    assert.equal(breadcrumb["@type"], "BreadcrumbList");
    assert.deepEqual(
      breadcrumb.itemListElement.map((item) => item.name),
      ["UICapsule", "Dynamic Island"],
    );
  });

  test("falls back to the site author", () => {
    const bareSource = buildSoftwareSourceCode(bare);
    assert.deepEqual(bareSource.author, [
      { "@type": "Person", name: "Kaiyu Hsu", url: "https://kyh.io" },
    ]);
    assert.equal(bareSource.keywords, "cards-grids");
  });
});

const video: SocialVideo = {
  contentUrl: "https://assets.example.com/dynamic-island/dynamic-island.mp4",
  description: "A springy Dynamic Island interaction.",
  duration: 13.18,
  height: 900,
  name: "Dynamic Island — UICapsule",
  thumbnailUrl: "https://www.uicapsule.com/og/covers/dynamic-island.jpg",
  uploadDate: "2026-09-08",
  width: 1600,
};

describe("isoDuration", () => {
  test("rounds to whole seconds and never says zero", () => {
    assert.equal(isoDuration(13.18), "PT13S");
    assert.equal(isoDuration(9.6), "PT10S");
    assert.equal(isoDuration(0.2), "PT1S");
  });
});

describe("buildVideoObject", () => {
  const node = buildVideoObject(video, "https://www.uicapsule.com/ui/dynamic-island");

  test("states every field a VideoObject rich result needs", () => {
    assert.equal(node["@type"], "VideoObject");
    assert.equal(node["@id"], "https://www.uicapsule.com/ui/dynamic-island#video");
    assert.equal(node.contentUrl, video.contentUrl);
    assert.equal(node.thumbnailUrl, video.thumbnailUrl);
    assert.equal(node.uploadDate, "2026-09-08");
    assert.equal(node.duration, "PT13S");
    assert.equal(node.encodingFormat, "video/mp4");
    assert.deepEqual([node.width, node.height], [1600, 900]);
  });
});

describe("graphs with a video", () => {
  test("a component's graph adds its cover and points the source code at it", () => {
    const graph = buildComponentGraph(withDescription, video)["@graph"];
    assert.deepEqual(
      graph.map((node) => node["@type"]),
      ["Organization", "SoftwareSourceCode", "BreadcrumbList", "VideoObject"],
    );
    const [, source] = graph;
    assert.deepEqual(source?.video, {
      "@id": "https://www.uicapsule.com/ui/dynamic-island#video",
    });
    assert.equal(source?.image, video.thumbnailUrl);
  });

  test("the home graph adds the home video and links it from the collection page", () => {
    const graph = buildHomeGraph([withDescription, bare], video)["@graph"];
    assert.deepEqual(
      graph.map((node) => node["@type"]),
      ["Organization", "WebSite", "SoftwareApplication", "CollectionPage", "VideoObject"],
    );
    assert.deepEqual(graph[3]?.video, { "@id": "https://www.uicapsule.com/#video" });
  });

  test("without a video the graphs carry no video reference", () => {
    const serialized = serializeJsonLd(buildComponentGraph(withDescription));
    assert.ok(!serialized.includes('"video"'), 'should not contain "video"');
  });
});

describe("buildProsePageGraph", () => {
  test("describes the page and links it to the organization", () => {
    const page = buildWebPage(privacyPage);
    assert.equal(page.url, "https://www.uicapsule.com/privacy");
    assert.equal(page.name, "Privacy Policy");
    assert.deepEqual(page.about, { "@id": buildOrganization()["@id"] });
    assert.deepEqual(
      buildProsePageGraph(privacyPage)["@graph"].map((node) => node["@type"]),
      ["Organization", "WebPage"],
    );
  });

  test("describes the terms page the same way", () => {
    const page = buildWebPage(termsPage);
    assert.equal(page.url, "https://www.uicapsule.com/terms");
    assert.equal(page.name, "Terms of Use");
    assert.equal(page.headline, "Terms of Use");
    assert.deepEqual(page.isPartOf, { "@id": buildWebSite()["@id"] });
  });
});

describe("serializeJsonLd", () => {
  test("round-trips through JSON.parse", () => {
    const graph = buildHomeGraph([withDescription, bare]);
    const parsed: JsonLdValue = JSON.parse(serializeJsonLd(graph));
    assert.deepEqual(parsed, structuredClone(graph));
  });

  test("escapes < so a value can never close the script tag", () => {
    const serialized = serializeJsonLd({ name: "</script><img src=x onerror=alert(1)>" });
    assert.ok(!serialized.includes("</script>"), 'should not contain "</script>"');
    assert.ok(serialized.includes("\\u003c"), 'should contain "\\\\u003c"');
    assert.deepEqual(JSON.parse(serialized), { name: "</script><img src=x onerror=alert(1)>" });
  });
});
