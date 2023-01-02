import PropertyBaseDocs from "../PropertyBase/PropertyBaseDocs";
import * as T from "../Properties.types";

const PropertyFunctionDocs = (props: T.DocsProps<T.FunctionProperty>) => {
  const { property } = props;
  const { args, returnValue } = property;
  const argumentsString = args
    ? args.map((arg) => `${arg.name}: ${arg.type}`)
    : "";

  return (
    <PropertyBaseDocs
      {...props}
      type={`(${argumentsString}): ${returnValue || "void"}`}
    />
  );
};

export default PropertyFunctionDocs;
