/** The 36px rounded surface every prop control sits on. */
export const ROW_SURFACE = "h-9 rounded-md bg-foreground/5";

/** A control's name inside its row. */
export const ROW_LABEL = "text-[13px] font-medium text-foreground/70";

/**
 * A row holding a label and a field, highlighted and ringed while the field has keyboard focus.
 * A color swatch in the row carries its own ring, so it does not ring the row.
 */
export const FIELD_ROW = `${ROW_SURFACE} flex items-center justify-between gap-3 px-3 transition-[background-color,box-shadow] duration-150 has-[input:not([type=color]):focus-visible]:bg-foreground/10 has-[input:not([type=color]):focus-visible]:ring-2 has-[input:not([type=color]):focus-visible]:ring-ring/50 has-[input:not([type=color]):focus-visible]:ring-inset`;

/** The borderless text a row edits in place; the caret is the one orange mark at rest. */
export const ROW_INPUT =
  "min-w-0 flex-1 bg-transparent text-right text-[13px] font-medium text-foreground/70 caret-primary outline-none transition-colors duration-150 placeholder:text-foreground/40 focus:text-foreground";

/** Ease shared by everything in the panel that travels: pills, handles, fills. */
export const TRAVEL_EASE = "ease-[cubic-bezier(0.23,1,0.32,1)]";
