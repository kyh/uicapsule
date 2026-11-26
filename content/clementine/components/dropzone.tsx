import { Upload } from "lucide-react";
import { useId, useRef, useState } from "react";

import "./dropzone.css";

export const Dropzone = ({
  label,
  hint,
  onFiles,
}: {
  label: string;
  hint: string;
  onFiles: (names: string[]) => void;
}) => {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div className="cl-drop-wrap">
      <button
        aria-describedby={`${id}-hint`}
        className="cl-drop"
        data-over={over || undefined}
        onClick={() => input.current?.click()}
        onDragLeave={() => {
          setOver(false);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          onFiles([...event.dataTransfer.files].map((file) => file.name));
        }}
        type="button"
      >
        <Upload aria-hidden size={20} strokeWidth={1.75} />
        <span className="cl-drop__label">{label}</span>
        <span className="cl-drop__hint" id={`${id}-hint`}>
          {hint}
        </span>
      </button>
      <input
        accept="image/jpeg,image/png,application/pdf"
        aria-label={label}
        className="cl-sr-input"
        multiple
        onChange={(event) => {
          onFiles([...(event.target.files ?? [])].map((file) => file.name));
        }}
        ref={input}
        tabIndex={-1}
        type="file"
      />
    </div>
  );
};
