import React from "react";
import type { AnchorMenuProps } from "components/AnchorMenu";

export type Props = {
	children?: React.ReactNode;
	anchorMenu?: Pick<AnchorMenuProps, "items">;
};
