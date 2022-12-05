import React from "react";
import { RTLContext } from "components/UICapsule/hooks/useRTLGlobal";

const useRTL = () => {
  return React.useContext(RTLContext);
};

export default useRTL;
