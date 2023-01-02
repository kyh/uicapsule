import PropertyBaseDocs from "../PropertyBase/PropertyBaseDocs";
import * as T from "../Properties.types";

const PropertyStringDocs = (props: T.DocsProps<T.StringProperty>) => {
  return <PropertyBaseDocs {...props} type="string" />;
};

export default PropertyStringDocs;
