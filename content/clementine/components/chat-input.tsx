import { ArrowUp } from "lucide-react";
import { useId } from "react";

import "./chat-input.css";

export const ChatInput = ({
  value,
  onValueChange,
  onSend,
  placeholder = "Ask about your money",
  label = "Message Clementine",
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  label?: string;
}) => {
  const id = useId();
  const empty = value.trim() === "";

  return (
    <form
      className="cl-chat-input"
      onSubmit={(event) => {
        event.preventDefault();

        if (!empty) {
          onSend();
        }
      }}
    >
      <label className="cl-sr" htmlFor={id}>
        {label}
      </label>
      <input
        autoComplete="off"
        id={id}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        placeholder={placeholder}
        value={value}
      />
      <button
        aria-label="Send"
        className="cl-btn"
        data-size="icon"
        data-variant="solid"
        disabled={empty}
        type="submit"
      >
        <span className="cl-btn__body">
          <ArrowUp aria-hidden size={20} strokeWidth={2} />
        </span>
      </button>
    </form>
  );
};
