import { CAPTURE_HTML_MAX, CAPTURE_SELECTOR_MAX } from "@repo/contract/request/request-schema";

const TRUNCATED = "\n<!-- truncated -->";

const isUnique = (selector: string) => {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
};

const segmentFor = (element: Element) => {
  const tag = element.localName;
  const { parentElement } = element;

  if (!parentElement) {
    return tag;
  }

  const sameTag = [...parentElement.children].filter((child) => child.localName === tag);

  return sameTag.length === 1 ? tag : `${tag}:nth-of-type(${sameTag.indexOf(element) + 1})`;
};

/** A CSS selector that matches only `element`, anchored on the nearest id when there is one. */
export const selectorFor = (element: Element) => {
  const segments: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.documentElement) {
    if (current.id && isUnique(`#${CSS.escape(current.id)}`)) {
      segments.unshift(`#${CSS.escape(current.id)}`);
      break;
    }

    segments.unshift(segmentFor(current));

    if (isUnique(segments.join(" > "))) {
      break;
    }

    current = current.parentElement;
  }

  return segments.join(" > ").slice(0, CAPTURE_SELECTOR_MAX);
};

/** The element's markup without scripts, whitespace runs collapsed, cut to the request's limit. */
export const htmlFor = (element: Element) => {
  const clone = element.cloneNode(true);

  if (!(clone instanceof Element)) {
    return "";
  }

  for (const node of clone.querySelectorAll("script, noscript, template")) {
    node.remove();
  }

  const html = clone.outerHTML.replaceAll(/\s{2,}/gu, " ").trim();

  return html.length > CAPTURE_HTML_MAX
    ? html.slice(0, CAPTURE_HTML_MAX - TRUNCATED.length) + TRUNCATED
    : html;
};

/** A short human label for the element, like `video.hero-clip`. */
export const labelFor = (element: Element) => {
  const classes = [...element.classList].slice(0, 2);

  return [element.localName, ...classes].join(".");
};

/** The video a pick means: the element itself, or the only video inside it. */
export const videoFor = (element: Element) => {
  if (element instanceof HTMLVideoElement) {
    return element;
  }

  const videos = element.querySelectorAll("video");

  return videos.length === 1 ? videos[0] : undefined;
};

export const videoSource = (video: HTMLVideoElement) => {
  const src = video.currentSrc || video.src || video.querySelector("source")?.src || "";

  return {
    kind: src.startsWith("http:") || src.startsWith("https:") ? "file" : "stream",
    src,
  } as const;
};
