import React from "react";
import { UICapsuleIdContext } from "components/UICapsule";
import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";

const createId = (counter: number) => {
  return `__uicapsule-${counter}`;
};

const useElementId = (id?: string): string => {
  const idRef = React.useContext(UICapsuleIdContext);
  const [generatedId, setGeneratedId] = React.useState(createId(0));

  // SSR - set all ids to 0
  // First React render - keep as 0 to avoid id mismatch between client and server
  // First DOM render - update to real id
  // Should be replaced by React opaque id hook once stable
  useIsomorphicLayoutEffect(() => {
    idRef.current += 1;
    setGeneratedId(createId(idRef.current));
  }, [idRef]);

  if (id) return id;
  return generatedId.toString();
};

export default useElementId;
