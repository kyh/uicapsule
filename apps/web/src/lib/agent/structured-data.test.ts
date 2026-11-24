import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { privacyPage, termsPage } from "./site-pages";
import {
  buildComponentGraph,
  buildHomeGraph,
  buildProsePageGraph,
  serializeJsonLd,
} from "./structured-data";

import type { JsonLdNode, JsonLdValue } from "./structured-data";

import type { ContentComponentSummary } from "@/lib/content/content-schema";
import type { SocialVideo } from "@/lib/content/social-video";

const asNode = (value: JsonLdValue | undefined) => {
  assert.ok(value instanceof Object && !Array.isArray(value), "expected a JSON-LD node");

  return value;
};

const asList = (value: JsonLdValue | undefined) => {
  assert.ok(Array.isArray(value), "expected a list");

  return value;
};

const nodeOf = (graph: { "@graph": JsonLdNode[] }, type: string) =>
  asNode(graph["@graph"].find((node) => node["@type"] === type));

const typesOf = (graph: { "@graph": JsonLdNode[] }) => graph["@graph"].map((node) => node["@type"]);

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

describe("the Organization node", () => {
  const organization = nodeOf(buildHomeGraph([]), "Organization");

  test("carries the identity fields an agent resolves an entity by", () => {
    assert.equal(organization.name, "UICapsule");
    assert.equal(organization.url, "https://www.uicapsule.com");
    assert.ok(String(organization.description).length > 40, "expected > 40");
    assert.deepEqual(organization.sameAs, [
      "https://github.com/kyh/uicapsule",
      "https://x.com/kaiyuhsu",
    ]);
  });

  test("exposes reachable contactPoints, each with an email and a contactType", () => {
    const points = asList(organization.contactPoint);
    assert.ok(points.length > 0, "expected > 0");

    for (const point of points.map(asNode)) {
      assert.equal(point["@type"], "ContactPoint");
      assert.equal(point.email, "uicapsule@kyh.io");
      assert.ok(String(point.contactType).length > 0, "expected > 0");
    }
  });

  test("omits address rather than inventing one", () => {
    assert.ok(!Object.keys(organization).includes("address"), 'should not contain "address"');
  });

  test("is the same node in every graph", () => {
    assert.deepEqual(nodeOf(buildComponentGraph(bare), "Organization"), organization);
    assert.deepEqual(nodeOf(buildProsePageGraph(privacyPage), "Organization"), organization);
  });
});

describe("buildHomeGraph", () => {
  const graph = buildHomeGraph([withDescription, bare]);
  const organization = nodeOf(graph, "Organization");
  const website = nodeOf(graph, "WebSite");
  const application = nodeOf(graph, "SoftwareApplication");
  const page = nodeOf(graph, "CollectionPage");

  test("declares the schema.org context once, at the root", () => {
    assert.equal(graph["@context"], "https://schema.org");

    for (const node of graph["@graph"]) {
      assert.ok(!Object.keys(node).includes("@context"), 'should not contain "@context"');
    }
  });

  test("carries the four identity nodes an agent resolves the site by", () => {
    assert.deepEqual(typesOf(graph), [
      "Organization",
      "WebSite",
      "SoftwareApplication",
      "CollectionPage",
    ]);
  });

  test("describes the site as a free, MIT-licensed developer application", () => {
    assert.equal(application.applicationCategory, "DeveloperApplication");
    assert.equal(application.isAccessibleForFree, true);
    assert.ok(String(application.license).includes("MIT"), 'should contain "MIT"');
    assert.deepEqual(application.offers, {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: "0",
      priceCurrency: "USD",
    });
    const features = asList(application.featureList);
    assert.ok(
      features.some((feature) => String(feature).includes("2 live")),
      `featureList does not report the component count: ${features.join(" | ")}`,
    );
  });

  test("lists every component in an ItemList", () => {
    const list = asNode(page.mainEntity);
    assert.equal(list.numberOfItems, 2);
    assert.deepEqual(list.itemListElement, [
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
  const graph = buildComponentGraph(withDescription);
  const source = nodeOf(graph, "SoftwareSourceCode");
  const breadcrumb = nodeOf(graph, "BreadcrumbList");

  test("is an Organization, the source code, and a breadcrumb", () => {
    assert.deepEqual(typesOf(graph), ["Organization", "SoftwareSourceCode", "BreadcrumbList"]);
  });

  test("describes the component as source code", () => {
    assert.equal(source.name, "Dynamic Island");
    assert.equal(source.url, "https://www.uicapsule.com/ui/dynamic-island");
    assert.equal(source.programmingLanguage, "TypeScript");
    assert.equal(source.keywords, "effects");
    assert.equal(source.dateCreated, "2026-01-02");
  });

  test("puts the component under the site in a breadcrumb", () => {
    assert.deepEqual(
      asList(breadcrumb.itemListElement).map((item) => asNode(item).name),
      ["UICapsule", "Dynamic Island"],
    );
  });

  test("falls back to the site author", () => {
    const bareSource = nodeOf(buildComponentGraph(bare), "SoftwareSourceCode");
    assert.deepEqual(bareSource.author, [
      { "@type": "Person", name: "Kaiyu Hsu", url: "https://kyh.io" },
    ]);
    assert.equal(bareSource.keywords, "cards-grids");
  });
});

const videoOf = (seconds: number) =>
  nodeOf(buildComponentGraph(withDescription, { ...video, duration: seconds }), "VideoObject");

describe("graphs with a video", () => {
  test("states every field a VideoObject rich result needs", () => {
    const node = videoOf(video.duration);
    assert.equal(node["@id"], "https://www.uicapsule.com/ui/dynamic-island#video");
    assert.equal(node.contentUrl, video.contentUrl);
    assert.equal(node.thumbnailUrl, video.thumbnailUrl);
    assert.equal(node.uploadDate, "2026-09-08");
    assert.equal(node.duration, "PT13S");
    assert.equal(node.encodingFormat, "video/mp4");
    assert.deepEqual([node.width, node.height], [1600, 900]);
  });

  test("rounds the duration to whole seconds and never says zero", () => {
    assert.equal(videoOf(9.6).duration, "PT10S");
    assert.equal(videoOf(0.2).duration, "PT1S");
  });

  test("a component's graph adds its cover and points the source code at it", () => {
    const graph = buildComponentGraph(withDescription, video);
    assert.deepEqual(typesOf(graph), [
      "Organization",
      "SoftwareSourceCode",
      "BreadcrumbList",
      "VideoObject",
    ]);
    const source = nodeOf(graph, "SoftwareSourceCode");
    assert.deepEqual(source.video, {
      "@id": "https://www.uicapsule.com/ui/dynamic-island#video",
    });
    assert.equal(source.image, video.thumbnailUrl);
  });

  test("the home graph adds the home video and links it from the collection page", () => {
    const graph = buildHomeGraph([withDescription, bare], video);
    assert.deepEqual(typesOf(graph), [
      "Organization",
      "WebSite",
      "SoftwareApplication",
      "CollectionPage",
      "VideoObject",
    ]);
    assert.deepEqual(nodeOf(graph, "CollectionPage").video, {
      "@id": "https://www.uicapsule.com/#video",
    });
  });

  test("without a video the graphs carry no video reference", () => {
    const serialized = serializeJsonLd(buildComponentGraph(withDescription));
    assert.ok(!serialized.includes('"video"'), 'should not contain "video"');
  });
});

describe("buildProsePageGraph", () => {
  const organizationId = nodeOf(buildHomeGraph([]), "Organization")["@id"];
  const websiteId = nodeOf(buildHomeGraph([]), "WebSite")["@id"];

  test("describes the page and links it to the organization", () => {
    const graph = buildProsePageGraph(privacyPage);
    const page = nodeOf(graph, "WebPage");
    assert.equal(page.url, "https://www.uicapsule.com/privacy");
    assert.equal(page.name, "Privacy Policy");
    assert.deepEqual(page.about, { "@id": organizationId });
    assert.deepEqual(typesOf(graph), ["Organization", "WebPage"]);
  });

  test("describes the terms page the same way", () => {
    const page = nodeOf(buildProsePageGraph(termsPage), "WebPage");
    assert.equal(page.url, "https://www.uicapsule.com/terms");
    assert.equal(page.name, "Terms of Use");
    assert.equal(page.headline, "Terms of Use");
    assert.deepEqual(page.isPartOf, { "@id": websiteId });
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
