import React from "react";
import { SingletonRTLContext } from "hooks/_private/useSingletonRTL";

const useRTL = () => {
  return React.useContext(SingletonRTLContext);
};

export default useRTL;
