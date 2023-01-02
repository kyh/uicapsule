import React from "react";
import PropertyBaseDocs from "../PropertyBase/PropertyBaseDocs";
import * as T from "../Properties.types";

const PropertySlotDocs = (props: T.DocsProps<T.SlotProperty>) => {
  return <PropertyBaseDocs {...props} type="React.ReactNode" />;
};

export default PropertySlotDocs;
