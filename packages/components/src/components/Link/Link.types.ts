import type { ActionableProps } from "components/Actionable";
import type { IconProps } from "components/Icon";

export type Props = Partial<
  Pick<
    ActionableProps,
    | "attributes"
    | "className"
    | "disabled"
    | "children"
    | "href"
    | "onClick"
    | "type"
  >
> & {
  icon?: IconProps["svg"];
  color?: "inherit" | "critical" | "primary";
  variant?: "plain" | "underline";
};
