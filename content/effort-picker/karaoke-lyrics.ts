/** The bars the card performs. Percentage words kick the dial. */

export type LyricWord = {
  readonly text: string;
  /** Set on the number word opening an "<n> percent" phrase. Drives the dial. */
  readonly percent?: number;
  /** Position inside the line, in beats. Keeps the fill on the song's cadence. */
  readonly beat: number;
};

export type LyricLine = {
  readonly words: readonly LyricWord[];
  readonly durationBeats: number;
};

type LineTiming = {
  percent: number;
  percentWordIndex: number;
  wordBeats: number[];
  durationBeats: number;
};

const line = (text: string, timing: LineTiming): LyricLine => {
  const words = text.split(" ");
  if (words.length !== timing.wordBeats.length) {
    throw new Error(`Expected one beat cue per word in "${text}".`);
  }
  if (
    !Number.isInteger(timing.percentWordIndex) ||
    timing.percentWordIndex < 0 ||
    timing.percentWordIndex >= words.length
  ) {
    throw new Error(`Percentage cue falls outside "${text}".`);
  }
  if (!Number.isFinite(timing.percent) || timing.percent < 0 || timing.percent > 100) {
    throw new Error(`Invalid percentage cue for "${text}".`);
  }
  if (!Number.isFinite(timing.durationBeats) || timing.durationBeats <= 0) {
    throw new Error(`Invalid line duration for "${text}".`);
  }

  let previousBeat = -1;
  for (const beat of timing.wordBeats) {
    if (
      !Number.isFinite(beat) ||
      beat < 0 ||
      beat >= timing.durationBeats ||
      beat <= previousBeat
    ) {
      throw new Error(`Invalid beat cue in "${text}".`);
    }
    previousBeat = beat;
  }

  return Object.freeze({
    durationBeats: timing.durationBeats,
    words: Object.freeze(
      words.map((word, index) => {
        const beat = timing.wordBeats[index];
        if (beat === undefined) throw new Error(`Missing beat cue for "${word}".`);
        return index === timing.percentWordIndex
          ? { text: word, percent: timing.percent, beat }
          : { text: word, beat };
      }),
    ),
  });
};

export const LYRIC_LINES: readonly LyricLine[] = Object.freeze([
  line("Ten percent luck", {
    percent: 10,
    percentWordIndex: 0,
    wordBeats: [0, 0.75, 1.35],
    durationBeats: 2,
  }),
  line("Twenty percent skill", {
    percent: 20,
    percentWordIndex: 0,
    wordBeats: [0, 0.75, 1.35],
    durationBeats: 2,
  }),
  line("Fifteen percent concentrated power of will", {
    percent: 15,
    percentWordIndex: 0,
    wordBeats: [0, 0.55, 1.15, 2.05, 2.7, 3.25],
    durationBeats: 4,
  }),
  line("Five percent pleasure", {
    percent: 5,
    percentWordIndex: 0,
    wordBeats: [0, 0.7, 1.35],
    durationBeats: 2,
  }),
  line("Fifty percent pain", {
    percent: 50,
    percentWordIndex: 0,
    wordBeats: [0, 0.7, 1.35],
    durationBeats: 2,
  }),
  line("And a hundred percent reason to remember the name", {
    percent: 100,
    percentWordIndex: 2,
    wordBeats: [0, 0.4, 0.85, 1.3, 1.75, 2.15, 2.55, 3, 3.45],
    durationBeats: 4,
  }),
]);

export type FlatWord = LyricWord & {
  readonly lineIndex: number;
  readonly wordIndex: number;
  readonly cueBeat: number;
};

const buildSchedule = (lines: readonly LyricLine[]) => {
  const words: FlatWord[] = [];
  let elapsedBeats = 0;

  for (const [lineIndex, lyricLine] of lines.entries()) {
    for (const [wordIndex, word] of lyricLine.words.entries()) {
      words.push({ ...word, lineIndex, wordIndex, cueBeat: elapsedBeats + word.beat });
    }
    elapsedBeats += lyricLine.durationBeats;
  }

  return { words: Object.freeze(words), totalBeats: elapsedBeats };
};

const schedule = buildSchedule(LYRIC_LINES);

/** The verse as one immutable stream — the performance is scheduled off this. */
export const FLAT_WORDS = schedule.words;
export const VERSE_BEATS = schedule.totalBeats;

export const averagePercent = (percents: number[]) =>
  percents.length === 0
    ? 0
    : Math.round(percents.reduce((total, percent) => total + percent, 0) / percents.length);
