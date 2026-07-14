/**
 * The bars the card performs.
 *
 * These are original lines written for this component — the interaction needs a
 * verse whose every bar calls out a percentage, and this is ours. Swap in any
 * verse you like: the card only cares that `percent` is set on the number word
 * opening each "<n> percent" phrase, since that's what kicks the dial.
 */

export type LyricWord = {
  text: string;
  /** Set on the number word opening an "<n> percent" phrase. Drives the dial. */
  percent?: number;
};

export type LyricLine = { words: LyricWord[] };

const line = (text: string, percent: number): LyricLine => ({
  words: text
    .split(" ")
    .map((word, index) => (index === 0 ? { text: word, percent } : { text: word })),
});

export const LYRIC_LINES: LyricLine[] = [
  line("Forty percent coffee", 40),
  line("Ten percent sleep", 10),
  line("Thirty percent stubborn refusal to hit delete", 30),
  line("Five percent talent", 5),
  line("Sixty percent grind", 60),
  line("Ninety percent reason to overclock the mind", 90),
];

export type FlatWord = LyricWord & { lineIndex: number; wordIndex: number };

/** The verse as one flat stream — the performance is scheduled off this. */
export const FLAT_WORDS: FlatWord[] = LYRIC_LINES.flatMap((lyricLine, lineIndex) =>
  lyricLine.words.map((word, wordIndex) => ({ ...word, lineIndex, wordIndex })),
);

export const averagePercent = (percents: number[]) =>
  percents.length === 0
    ? 0
    : Math.round(percents.reduce((total, percent) => total + percent, 0) / percents.length);
