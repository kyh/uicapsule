import React from "react";
import type * as G from "types/global";
import type { TrapMode } from "utilities/a11y";
import useFlyout, { FlyoutPosition, FlyoutWidth } from "hooks/useFlyout";

type WithUncontrolled = { active?: never; defaultActive?: boolean };
type WithControlled = { active: boolean; defaultActive?: never };

export type TriggerAttributes = {
  ref: React.Ref<HTMLButtonElement>;
  onBlur: (e: React.FocusEvent) => void;
} & (
  | {
      onFocus: () => void;
      onMouseEnter: () => void;
      onMouseLeave: () => void;
      "aria-describedby": string;
    }
  | {
      onClick: () => void;
      "aria-haspopup": "dialog" | "menu";
      "aria-expanded": boolean;
      "aria-controls"?: string;
    }
);

type BaseProps = {
  id?: string;
  triggerType: "hover" | "click";
  position?: FlyoutPosition;
  forcePosition?: boolean;
  trapFocusMode?: TrapMode;
  children?: React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
  width?: FlyoutWidth;
  contentClassName?: string;
  contentAttributes?: G.Attributes<"div">;
};

export type DefaultProps = Required<{
  position: BaseProps["position"];
  trigger: BaseProps["triggerType"];
}>;

export type UncontrolledProps = BaseProps & WithUncontrolled;
export type ControlledProps = BaseProps & WithControlled;
export type Props = ControlledProps | UncontrolledProps;

export type TriggerProps = {
  children: (attributes: TriggerAttributes) => React.ReactNode;
};

export type ContentProps = {
  children?: React.ReactNode;
  className?: G.ClassName;
  attributes?: G.Attributes<"div", Props>;
};

export type ContextProps = {
  id: string;
  flyout: ReturnType<typeof useFlyout>;
  triggerElRef: React.Ref<HTMLButtonElement>;
  flyoutElRef: React.RefObject<HTMLDivElement>;
  handleClose: () => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleTransitionEnd: () => void;
  handleClick: () => void;
  handleBlur: (e: React.FocusEvent) => void;
  handleFocus: () => void;
} & Pick<
  Props,
  "triggerType" | "contentClassName" | "contentAttributes" | "trapFocusMode"
>;

export type RefProps = { open: () => void; close: () => void };
export type Ref = React.Ref<RefProps>;

export type Compound = React.ForwardRefExoticComponent<
  Props & { ref?: Ref }
> & {
  Trigger: React.ComponentType<TriggerProps>;
  Content: React.ComponentType<ContentProps>;
};
