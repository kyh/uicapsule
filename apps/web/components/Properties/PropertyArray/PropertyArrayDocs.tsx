import React from "react";
import PropertyBaseDocs from "../PropertyBase/PropertyBaseDocs";
import * as T from "../Properties.types";

const PropertyArrayDocs: React.FC<T.DocsProps<T.ArrayProperty>> = (props) => {
  const { property, name } = props;

  const result = [];

  const itemType =
    property.item.type === T.ControlType.enum
      ? `(${property.item.options.join(" | ")})`
      : property.item.type;

  result.push(<PropertyBaseDocs {...props} type={`${itemType}[]`} />);

  if (property.item.type === T.ControlType.object && property.item.properties) {
    Object.entries(property.item.properties).forEach(
      ([propertyName, property]) => {
        result.push(
          <PropertyBaseDocs
            property={property}
            type={property.type}
            name={`${name}.${propertyName}`}
          />
        );
      }
    );
  }

  return <>{result}</>;
};

export default PropertyArrayDocs;
