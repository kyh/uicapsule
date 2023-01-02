import PropertyBaseDocs from "../PropertyBase/PropertyBaseDocs";
import * as T from "../Properties.types";

const PropertyStringDocs = (props: T.DocsProps<T.ObjectProperty>) => {
  return <PropertyBaseDocs {...props} type="object" />;
};

export default PropertyStringDocs;
