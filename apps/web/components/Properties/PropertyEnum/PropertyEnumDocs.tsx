import React from "react";
import PropertyBaseDocs from "../PropertyBase/PropertyBaseDocs";
import * as T from "../Properties.types";

const PropertyEnumDocs = (props: T.DocsProps<T.EnumProperty>) => {
  const { property } = props;
  return <PropertyBaseDocs {...props} type={property.options} />;
};

export default PropertyEnumDocs;
