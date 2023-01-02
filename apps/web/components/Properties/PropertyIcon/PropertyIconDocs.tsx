import React from "react";
import PropertyBaseDocs from "../PropertyBase/PropertyBaseDocs";
import * as T from "../Properties.types";

const PropertyIconDocs = (props: T.DocsProps<T.IconProperty>) => {
  return <PropertyBaseDocs {...props} type="React.ComponentType" />;
};

export default PropertyIconDocs;
