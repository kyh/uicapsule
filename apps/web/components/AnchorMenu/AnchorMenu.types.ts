export type Props = {
  items: Array<{ text: string; url: string; level: 2 | 3 }>;
  rootRef: React.RefObject<HTMLElement | null>;
};
