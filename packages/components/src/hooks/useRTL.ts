import React from "react";
import { RTLContext } from "../components/UIC/hooks/useRTLGlobal";

const useRTL = () => {
  return React.useContext(RTLContext);
};

export default useRTL;
