import { describe, expect, it } from "vitest";

import { negotiateMediaType, notAcceptableBody, withVaryAccept } from "./accept";

describe("negotiateMediaType", () => {
  it("defaults to HTML when the client states no constraint", () => {
    expect(negotiateMediaType(null)).toBe("text/html");
    expect(negotiateMediaType("")).toBe("text/html");
    expect(negotiateMediaType("   ")).toBe("text/html");
    expect(negotiateMediaType("*/*")).toBe("text/html");
    expect(negotiateMediaType("garbage-without-a-slash")).toBe("text/html");
  });

  it("serves Markdown when the client asks for it", () => {
    expect(negotiateMediaType("text/markdown")).toBe("text/markdown");
    expect(negotiateMediaType("text/markdown, text/html")).toBe("text/markdown");
    expect(negotiateMediaType("TEXT/MARKDOWN")).toBe("text/markdown");
    expect(negotiateMediaType("text/markdown;charset=utf-8")).toBe("text/markdown");
  });

  it("serves HTML to a browser's Accept header", () => {
    const browser =
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";
    expect(negotiateMediaType(browser)).toBe("text/html");
  });

  it("ranks by q-value before client order", () => {
    expect(negotiateMediaType("text/html;q=0.5, text/markdown;q=0.9")).toBe("text/markdown");
    expect(negotiateMediaType("text/markdown;q=0.2, text/html;q=0.8")).toBe("text/html");
  });

  it("breaks equal-quality ties on the client's own ordering", () => {
    expect(negotiateMediaType("text/markdown, text/html")).toBe("text/markdown");
    expect(negotiateMediaType("text/html, text/markdown")).toBe("text/html");
  });

  it("honours q=0 as an explicit rejection", () => {
    expect(negotiateMediaType("text/html;q=0, text/markdown")).toBe("text/markdown");
    expect(negotiateMediaType("text/markdown;q=0, text/html")).toBe("text/html");
  });

  it("lets a specific range override a wildcard, per RFC 9110 §12.5.1", () => {
    // The wildcard must not resurrect a type the client explicitly rejected.
    expect(negotiateMediaType("text/html;q=0, */*")).toBe("text/markdown");
    expect(negotiateMediaType("text/markdown;q=0, */*;q=1")).toBe("text/html");
  });

  it("matches subtype wildcards", () => {
    expect(negotiateMediaType("text/*")).toBe("text/html");
    expect(negotiateMediaType("text/html;q=0, text/*")).toBe("text/markdown");
  });

  it("returns null only when nothing produced is acceptable", () => {
    expect(negotiateMediaType("application/pdf")).toBeNull();
    expect(negotiateMediaType("image/png, application/json")).toBeNull();
    expect(negotiateMediaType("text/html;q=0, text/markdown;q=0")).toBeNull();
    expect(negotiateMediaType("*/*;q=0")).toBeNull();
  });

  it("clamps out-of-range and unparseable q values", () => {
    expect(negotiateMediaType("text/markdown;q=5, text/html;q=1")).toBe("text/markdown");
    expect(negotiateMediaType("application/pdf;q=nonsense")).toBeNull();
  });
});

describe("withVaryAccept", () => {
  it("adds Accept to an empty Vary", () => {
    expect(withVaryAccept(null)).toBe("Accept");
    expect(withVaryAccept("")).toBe("Accept");
  });

  it("preserves the tokens already there", () => {
    expect(withVaryAccept("rsc, next-router-state-tree")).toBe(
      "rsc, next-router-state-tree, Accept",
    );
  });

  it("does not duplicate Accept, whatever its casing", () => {
    expect(withVaryAccept("Accept")).toBe("Accept");
    expect(withVaryAccept("accept, rsc")).toBe("accept, rsc");
  });
});

describe("notAcceptableBody", () => {
  it("lists the available representations and echoes the request", () => {
    const body = notAcceptableBody("application/pdf");
    expect(body).toContain("- text/html");
    expect(body).toContain("- text/markdown");
    expect(body).toContain("You requested: application/pdf");
  });

  it("survives a missing Accept header", () => {
    expect(notAcceptableBody(null)).toContain("(no Accept header)");
  });
});
