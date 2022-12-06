import React from "react";
import PropertyBaseDocs from "../PropertyBase/PropertyBaseDocs";
import * as T from "../Properties.types";

const PropertyCustomDocs = (props: T.DocsProps<T.CustomProperty>) => {
	const { property } = props;

	return <PropertyBaseDocs {...props} type={property.docs?.type || ""} />;
};

export default PropertyCustomDocs;
