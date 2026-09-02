import assert from "node:assert/strict";
import { describe, test } from "node:test";

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

  test("carries the identity fields an agent resolves an entity by", () => {
    assert.equal(organization["@type"], "Organization");
    assert.equal(organization.name, "UICapsule");
    assert.equal(organization.url, "https://uicapsule.com");
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
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
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
    assert.equal(source.url, "https://uicapsule.com/ui/dynamic-island");
    assert.equal(source.programmingLanguage, "TypeScript");
    assert.equal(source.keywords, "overlay");
  });

  test("puts the component under the site in a breadcrumb", () => {
    assert.equal(breadcrumb["@type"], "BreadcrumbList");
    assert.deepEqual(
      breadcrumb.itemListElement.map((item) => item.name),
      ["UICapsule", "Dynamic Island"],
    );
  });

  test("falls back to the site author, and drops empty optional fields", () => {
    const bareSource = buildSoftwareSourceCode(bare);
    assert.deepEqual(bareSource.author, [
      { "@type": "Person", name: "Kaiyu Hsu", url: "https://kyh.io" },
    ]);
    assert.equal(bareSource.description, undefined);
    assert.equal(bareSource.keywords, undefined);
    // `undefined` is how an optional field is omitted — JSON.stringify drops it.
    assert.ok(!serializeJsonLd(bareSource).includes("keywords"), 'should not contain "keywords"');
  });
});

describe("buildProsePageGraph", () => {
  test("describes the page and links it to the organization", () => {
    const page = buildWebPage(privacyPage);
    assert.equal(page.url, "https://uicapsule.com/privacy");
    assert.equal(page.name, "Privacy");
    assert.deepEqual(page.about, { "@id": buildOrganization()["@id"] });
    assert.deepEqual(
      buildProsePageGraph(privacyPage)["@graph"].map((node) => node["@type"]),
      ["Organization", "WebPage"],
    );
  });
});

describe("serializeJsonLd", () => {
  test("round-trips through JSON.parse", () => {
    const graph = buildHomeGraph([withDescription, bare]);
    const parsed: JsonLdValue = JSON.parse(serializeJsonLd(graph));
    assert.deepEqual(parsed, JSON.parse(JSON.stringify(graph)));
  });

  test("escapes < so a value can never close the script tag", () => {
    const serialized = serializeJsonLd({ name: "</script><img src=x onerror=alert(1)>" });
    assert.ok(!serialized.includes("</script>"), 'should not contain "</script>"');
    assert.ok(serialized.includes("\\u003c"), 'should contain "\\\\u003c"');
    assert.deepEqual(JSON.parse(serialized), { name: "</script><img src=x onerror=alert(1)>" });
  });
});
