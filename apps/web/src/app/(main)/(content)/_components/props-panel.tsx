import type { ReactNode } from "react";
import { SlidersHorizontalIcon } from "lucide-react";

import type { ControlValue } from "@/lib/preview-controls";
import { PropControls } from "./prop-controls";
import type { LiveProps } from "./use-live-props";

const NoProps = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
    <SlidersHorizontalIcon aria-hidden className="text-muted-foreground size-5" />
    <p className="text-muted-foreground max-w-56 text-sm text-pretty">
      This component doesn’t expose any props yet.
    </p>
  </div>
);

interface PropsBodyProps {
  live: LiveProps;
  onChange: (name: string, value: ControlValue) => void;
  onReset: () => void;
}

const PropsBody = ({ live, onChange, onReset }: PropsBodyProps) => {
  switch (live.status) {
    case "loading": {
      return null;
    }

    case "none": {
      return <NoProps />;
    }

    case "ready": {
      return (
        <PropControls
          controls={live.controls}
          values={live.values}
          onChange={onChange}
          onReset={onReset}
        />
      );
    }

    default: {
      return live satisfies never;
    }
  }
};

interface PropsPanelProps extends PropsBodyProps {
  action: ReactNode;
}

/** The props aside: its toolbar actions over the active preview's controls, nothing while its frame loads. */
export const PropsPanel = ({ action, ...body }: PropsPanelProps) => (
  <div className="flex h-full flex-col">
    <div className="flex shrink-0 items-center justify-end gap-1 p-4">{action}</div>
    <PropsBody {...body} />
  </div>
);
