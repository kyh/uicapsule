import React from "react";
import { RTLContext } from "components/Reshaped/hooks/useRTLGlobal";

const useRTL = () => {
	return React.useContext(RTLContext);
};

export default useRTL;
