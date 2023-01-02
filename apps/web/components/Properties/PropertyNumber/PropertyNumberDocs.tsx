import React from "react";
import PropertyBaseDocs from "../PropertyBase/PropertyBaseDocs";
import * as T from "../Properties.types";

const PropertyNumberDocs = (props: T.DocsProps<T.NumberProperty>) => {
  return <PropertyBaseDocs {...props} type="number" />;
};

export default PropertyNumberDocs;
