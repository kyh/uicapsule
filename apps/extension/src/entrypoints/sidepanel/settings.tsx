import { useState } from "react";
import { Input } from "@repo/ui/components/input";

const parseServiceUrl = (value: string) => {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
};

export const Settings = (props: { onChange: (url: string) => void; serviceUrl: string }) => {
  const [draft, setDraft] = useState(props.serviceUrl);

  const save = () => {
    const parsed = parseServiceUrl(draft);

    if (parsed) {
      props.onChange(parsed);
    }

    setDraft(parsed ?? props.serviceUrl);
  };

  return (
    <details className="mt-auto text-xs text-muted-foreground">
      <summary className="cursor-pointer select-none">Settings</summary>
      <label className="mt-2 flex flex-col gap-1">
        Files requests with
        <Input value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={save} />
      </label>
    </details>
  );
};
