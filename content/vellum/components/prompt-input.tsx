"use client";

import { ChevronDown, Paperclip } from "lucide-react";
import { useId, useRef, useState } from "react";

import { Button } from "./button";
import { ValueChip } from "./chip";
import { Menu } from "./menu";
import { SendButton } from "./send-button";
import type { SendStatus } from "./send-button";

const MODELS = ["Quill 4", "Quill 4 mini", "Ledger 2"] as const;

/** Takes the next message: text, ghost tools, the model, and one glass Send. */
export const PromptInput = ({
  label,
  placeholder,
  status,
  onSubmit,
  onStop,
  defaultValue = "",
}: {
  label: string;
  placeholder: string;
  status: SendStatus;
  onSubmit: (text: string) => void;
  onStop: () => void;
  defaultValue?: string;
}) => {
  const [text, setText] = useState(defaultValue);
  const [model, setModel] = useState<(typeof MODELS)[number]>("Quill 4");
  const [files, setFiles] = useState<readonly string[]>([]);
  const picker = useRef<HTMLInputElement>(null);
  const id = useId();
  const working = status === "submitted" || status === "streaming" || status === "stopping";

  const send = () => {
    if (text.trim() === "" || working) {
      return;
    }

    onSubmit(text.trim());
    setText("");
    setFiles([]);
  };

  return (
    <form
      className="v-composer"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <label className="v-sr" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        onChange={(event) => {
          setText(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
          } else if (event.key === "Escape" && working) {
            onStop();
          }
        }}
        placeholder={placeholder}
        rows={1}
        value={text}
      />
      {files.length > 0 ? (
        <div className="v-cluster v-gap-4">
          {files.map((name) => (
            <ValueChip
              key={name}
              onRemove={() => {
                setFiles((list) => list.filter((item) => item !== name));
              }}
            >
              {name}
            </ValueChip>
          ))}
        </div>
      ) : null}
      <div className="v-composer-bar">
        <input
          aria-hidden
          className="v-sr"
          multiple
          onChange={(event) => {
            const picked = [...(event.target.files ?? [])].map((file) => file.name);

            setFiles((list) => [...new Set([...list, ...picked])]);
            event.target.value = "";
          }}
          ref={picker}
          tabIndex={-1}
          type="file"
        />
        <Button
          aria-label="Attach a file"
          onClick={() => picker.current?.click()}
          size="icon-sm"
          variant="ghost"
        >
          <Paperclip aria-hidden />
        </Button>
        <Menu
          align="start"
          items={MODELS.map((name) => ({
            label: name,
            onSelect: () => {
              setModel(name);
            },
          }))}
          label="Model"
          renderTrigger={(props) => (
            <Button {...props} aria-label={`Model, ${model}`} size="sm" variant="ghost">
              {model}
              <ChevronDown aria-hidden />
            </Button>
          )}
        />
        <span className="v-grow" />
        <SendButton empty={text.trim() === ""} onSend={send} onStop={onStop} status={status} />
      </div>
    </form>
  );
};
