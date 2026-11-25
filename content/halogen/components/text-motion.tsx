import { useScramble, useTypewriter } from "../lib/motion";

/** Types `text` out letter by letter; its caret disappears with the final letter. */
export const TypeText = ({
  text,
  replay = 0,
  perChar,
}: {
  text: string;
  replay?: number;
  perChar?: number;
}) => {
  const { shown, typing } = useTypewriter(text, replay, perChar);

  return (
    <>
      <span className="hx-sr">{text}</span>
      <span aria-hidden>
        {shown}
        {typing ? <span className="hx-caret" /> : null}
      </span>
    </>
  );
};

/** Cycles an identifier through random glyphs until it settles, whenever it changes. */
export const ScrambleText = ({ text, replay = 0 }: { text: string; replay?: number }) => {
  const shown = useScramble(text, replay);

  return (
    <>
      <span className="hx-sr">{text}</span>
      <span aria-hidden>{shown}</span>
    </>
  );
};
