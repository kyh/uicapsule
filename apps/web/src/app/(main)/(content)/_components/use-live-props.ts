import { useCallback, useState } from "react";

import { defaultControlValues, mergeControlValues } from "@/lib/preview-controls";
import type { ControlValue, PreviewControls } from "@/lib/preview-controls";

type Values = Readonly<Record<string, ControlValue>>;

/**
 * What the props panel knows about the active preview: `loading` until its frame announces
 * itself, then `none` (it declares no controls) or `ready` with the controls and their values.
 */
export type LiveProps =
  | { readonly status: "loading" }
  | { readonly status: "none" }
  | { readonly status: "ready"; readonly controls: PreviewControls; readonly values: Values };

type Settled = Exclude<LiveProps, { status: "loading" }>;

type Ready = Extract<LiveProps, { status: "ready" }>;

interface Session {
  readonly slug: string;
  readonly props: Settled;
}

const LOADING = { status: "loading" } satisfies LiveProps;
const NONE = { status: "none" } satisfies LiveProps;

const withValues = (session: Session | null, values: (props: Ready) => Values) =>
  session?.props.status === "ready"
    ? { ...session, props: { ...session.props, values: values(session.props) } }
    : session;

const currentProps = (slug: string | null, session: Session | null) => {
  if (slug === null) {
    return NONE;
  }

  return session?.slug === slug ? session.props : LOADING;
};

/**
 * The live prop values for the preview frame of `slug`, or null when the active preview is not a
 * local frame (a remote one never announces controls, so it has none). Values survive a re-ready
 * of the same slug (a reload or HMR re-run) and start over at the defaults on another slug.
 */
export const useLiveProps = (slug: string | null) => {
  const [session, setSession] = useState<Session | null>(null);

  const onControlsChange = useCallback(
    (controls: PreviewControls | null) => {
      if (slug === null) {
        return;
      }

      setSession((current) => {
        if (!controls) {
          return { props: NONE, slug };
        }

        const previous =
          current?.slug === slug && current.props.status === "ready" ? current.props.values : {};

        return {
          props: {
            controls,
            status: "ready",
            values: mergeControlValues(controls, defaultControlValues(controls), previous),
          },
          slug,
        };
      });
    },
    [slug],
  );

  const setValue = useCallback((name: string, value: ControlValue) => {
    setSession((current) => withValues(current, (props) => ({ ...props.values, [name]: value })));
  }, []);

  const reset = useCallback(() => {
    setSession((current) => withValues(current, (props) => defaultControlValues(props.controls)));
  }, []);

  return { onControlsChange, props: currentProps(slug, session), reset, setValue };
};
