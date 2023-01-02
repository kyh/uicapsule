import PropertyBaseDocs from "../PropertyBase/PropertyBaseDocs";
import * as T from "../Properties.types";

const PropertyBooleanDocs = (props: T.DocsProps<T.BooleanProperty>) => {
  return <PropertyBaseDocs {...props} type="boolean" />;
};

export default PropertyBooleanDocs;
