// The ASCII art is a grid of single characters, each carrying an alpha.
// Every frame builder mutates a Grid in place through these pure primitives.

export const OUTER_COLS = 50;
export const OUTER_ROWS = 60;
export const INNER_COLS = 40;
export const INNER_ROWS = 54;
export const SCREEN_X = 5;
export const SCREEN_Y = 4;

export type Cell = { char: string; alpha: number };
export type Grid = Cell[][];

export function makeGrid(cols: number, rows: number): Grid {
  const g: Grid = [];

  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) row.push({ char: " ", alpha: 0 });
    g.push(row);
  }

  return g;
}

// Higher-alpha writes win on overlap; a space never erases an existing glyph.
export function setCell(g: Grid, r: number, c: number, char: string, alpha: number) {
  const row = g[r];
  if (!row) return;

  const cur = row[c];
  if (!cur) return;

  if (char === " " && cur.char !== " ") return;
  if (cur.alpha > alpha && cur.char !== " ") return;

  cur.char = char;
  cur.alpha = alpha;
}

export function drawText(g: Grid, r: number, c: number, text: string, alpha: number) {
  for (let i = 0; i < text.length; i++) {
    setCell(g, r, c + i, text.charAt(i), alpha);
  }
}

export function drawTextRight(g: Grid, r: number, cRight: number, text: string, alpha: number) {
  drawText(g, r, cRight - text.length + 1, text, alpha);
}

export function drawHRule(g: Grid, r: number, c: number, w: number, char = "─", alpha = 0.25) {
  for (let i = 0; i < w; i++) setCell(g, r, c + i, char, alpha);
}

export function drawBar(g: Grid, r: number, c: number, w: number, char = "▒", alpha = 0.55) {
  for (let i = 0; i < w; i++) setCell(g, r, c + i, char, alpha);
}

export function drawBox(g: Grid, r: number, c: number, w: number, h: number, alpha = 0.7) {
  setCell(g, r, c, "╭", alpha);
  setCell(g, r, c + w - 1, "╮", alpha);
  setCell(g, r + h - 1, c, "╰", alpha);
  setCell(g, r + h - 1, c + w - 1, "╯", alpha);

  for (let x = 1; x < w - 1; x++) {
    setCell(g, r, c + x, "─", alpha);
    setCell(g, r + h - 1, c + x, "─", alpha);
  }

  for (let y = 1; y < h - 1; y++) {
    setCell(g, r + y, c, "│", alpha);
    setCell(g, r + y, c + w - 1, "│", alpha);
  }
}

const VBARS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"] as const;

export function vbarChar(v01: number): string {
  const v = v01 < 0 ? 0 : v01 > 1 ? 1 : v01;
  return VBARS[Math.min(VBARS.length - 1, Math.floor(v * VBARS.length))] ?? "█";
}

export function pasteInto(outer: Grid, inner: Grid, rOff: number, cOff: number) {
  for (let r = 0; r < inner.length; r++) {
    const row = inner[r];
    if (!row) continue;

    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (!cell || cell.char === " " || cell.alpha <= 0) continue;
      setCell(outer, rOff + r, cOff + c, cell.char, cell.alpha);
    }
  }
}

// 5-row block-digit font for the Phase 3 hero stats.
type BigGlyph = readonly [string, string, string, string, string];

const BLANK_GLYPH: BigGlyph = ["   ", "   ", "   ", "   ", "   "];

const BIG_DIGITS: Record<string, BigGlyph> = {
  "0": ["╭─╮", "│ │", "│ │", "│ │", "╰─╯"],
  "1": ["╶┐ ", " │ ", " │ ", " │ ", "╶┴╴"],
  "2": ["╭─╮", "  │", "╭─╯", "│  ", "╰─╴"],
  "3": ["╭─╮", "  │", " ─┤", "  │", "╰─╯"],
  "4": ["╷ ╷", "│ │", "╰─┤", "  │", "  ╵"],
  "5": ["╭─╴", "│  ", "╰─╮", "  │", "╰─╯"],
  "6": ["╭─╴", "│  ", "├─╮", "│ │", "╰─╯"],
  "7": ["╶─╮", "  │", "  │", "  │", "  ╵"],
  "8": ["╭─╮", "│ │", "├─┤", "│ │", "╰─╯"],
  "9": ["╭─╮", "│ │", "╰─┤", "  │", "╶─╯"],
  ".": ["   ", "   ", "   ", "   ", " ▪ "],
  // Period and comma are drawn 2 columns wide (see `drawBigNumber`), so their
  // art has to live in the first two columns — a third column is never read.
  ",": ["   ", "   ", "   ", " ╷ ", "╶╯ "],
  "-": ["   ", "   ", "╶─╴", "   ", "   "],
  "%": ["▪ ╱", " ╱ ", " ╱ ", "╱  ", "╱ ▪"],
  $: [" ╭╴", "╶┼╮", " │ ", "╶┼╯", " ╰╴"],
  "+": ["   ", " │ ", "╶┼╴", " │ ", "   "],
  " ": BLANK_GLYPH,
};

// Walks a string, writing each block glyph. Period and comma consume 2 cols
// so the number reads as one tight typographic unit. `gap` is the inter-glyph
// spacing in cells.
export function drawBigNumber(g: Grid, r: number, c: number, text: string, alpha: number, gap = 1) {
  let col = c;

  for (const ch of text) {
    const glyph = BIG_DIGITS[ch] ?? BLANK_GLYPH;
    const w = ch === "." || ch === "," ? 2 : 3;

    for (let row = 0; row < 5; row++) {
      const line = glyph[row];
      if (line === undefined) continue;

      for (let x = 0; x < w; x++) {
        const gch = line.charAt(x);
        if (gch && gch !== " ") setCell(g, r + row, col + x, gch, alpha);
      }
    }

    col += w + gap;
  }
}
