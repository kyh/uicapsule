window.trailer = {
  slug: "vellum",
  duration: 14,
  background: "#0d0c0a",
  fonts: [
    { family: "Trailer Serif", src: "file:///System/Library/Fonts/Supplemental/Georgia.ttf" },
    {
      family: "Trailer Serif",
      src: "file:///System/Library/Fonts/Supplemental/Georgia Bold.ttf",
      weight: 600,
    },
  ],
  type: {
    base: { family: "'Trailer Serif', Georgia, serif", color: "#f6f1e7" },
    caption: {
      family: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
      color: "#1c1a16",
      scrim: "bottom",
      scrimColor: "rgb(253 252 248 / 0.94)",
    },
  },
  shots: {
    hero: { props: { theme: "light" }, view: { scale: 1.12, dim: 0.62 } },
    screens: { anchor: "s-notes", props: { theme: "light" } },
    foundations: { anchor: "f-color", height: 2200, props: { theme: "light" } },
    radius: { anchor: "f-radius", props: { theme: "light", radiusScale: 1 } },
  },
  cues: [
    { at: 0, show: "hero" },
    { at: 0.3, text: "Vellum", kind: "title", until: 2.1, reveal: "mask" },
    { at: 0, camera: "hero", to: { scale: 1 }, dur: 2.8, ease: "camera" },
    { at: 1.2, camera: "hero", to: { dim: 0 }, dur: 1.4 },

    { at: 2.9, show: "screens", transition: "push", dur: 0.9 },
    { at: 3.2, camera: "screens", to: { rect: [450, 0, 1066, 600] }, dur: 2.2 },
    { at: 3.6, text: "Four working screens", until: 5.6 },

    { at: 5.8, show: "foundations", transition: "fade", dur: 0.6 },
    { at: 5.9, camera: "foundations", to: { y: 1500 }, dur: 3, ease: "house" },
    { at: 6.4, text: "Every value, shown how it's used", until: 8.6, reveal: "blur" },

    { at: 8.9, show: "radius", transition: "slide", dur: 0.9 },
    { at: 9.5, props: "radius", set: { theme: "dark" } },
    { at: 9.9, props: "radius", tween: { radiusScale: 2 }, dur: 0.8 },
    { at: 10.7, props: "radius", tween: { radiusScale: 1 }, dur: 0.7, ease: "camera" },
    {
      at: 9.8,
      text: "Every setting is a prop",
      until: 11.4,
      color: "#f6f1e7",
      scrimColor: "rgb(13 12 10 / 0.9)",
    },

    { at: 11.4, text: "Vellum", kind: "card", until: 13.6, out: 0.6 },
    {
      at: 11.7,
      text: "uicapsule.com",
      kind: "caption",
      until: 13.5,
      align: "center",
      valign: "top",
      x: 800,
      y: 540,
      color: "rgb(246 241 231 / 0.6)",
      scrim: false,
    },
    { at: 12.4, camera: "hero", to: { scale: 1.12, dim: 0.62 } },
    { at: 12.6, show: "hero" },
  ],
};
