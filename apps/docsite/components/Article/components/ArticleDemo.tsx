import React from "react";
import { View, Button, useToggle } from "@uicapsule/components";
import CodeExample from "components/CodeExample";
import {
  PropertiesControls,
  PropertiesControlsProps,
  useProperties,
  Property,
  Properties,
  ControlType,
  resolveSlotValue,
} from "components/Properties";
import IconControls from "icons/Controls";
import IconCode from "icons/Code";

const resolveDefaultValues = (properties: ReturnType<typeof useProperties>) => {
  let result: Record<string, Record<string, any>> = {};

  Object.keys(properties).forEach((key) => {
    const section = properties[key];
    if (!result[key]) result[key] = {};

    Object.entries(section).forEach(([name, property]) => {
      const value = property.control?.defaultValue || property.defaultValue;
      if (value === undefined) return;
      result[key][name] = value;
    }, {});
  });

  return result;
};

const getPropertyString = (args: {
  key?: string;
  value: unknown;
  property: Property;
  objectNotation?: boolean;
}) => {
  const { key, value, property, objectNotation } = args;
  const { type } = property;

  if (value === property?.defaultValue) return "";
  if (value === undefined) return "";
  if (key === "children" && !objectNotation) return "";

  const isStringValue =
    type === ControlType.string || type === ControlType.enum;
  let formattedValue = `${value}`;

  if (isStringValue) {
    formattedValue = `"${value}"`;
  }

  const isSlotBoolean = type === ControlType.slot && typeof value === "boolean";
  const isSlotString = type === ControlType.slot && typeof value === "string";
  if (isSlotBoolean || isSlotString) {
    const resolvedValue = resolveSlotValue({
      value,
      control: property.control,
    });

    if (isSlotBoolean) formattedValue = resolvedValue;
    if (isSlotString && key === "children") formattedValue = resolvedValue;
    if (isSlotString && key !== "children")
      formattedValue = `"${resolvedValue}"`;
  }

  if (type === ControlType.array) {
    const resolvedValue = (value as unknown[])
      ?.map((item) =>
        getPropertyString({
          value: item,
          property: property.item,
          objectNotation: true,
        })
      )
      .filter(Boolean)
      .join(", ");
    formattedValue = `[${resolvedValue}]`;
  }

  if (type === ControlType.object) {
    const resolvedValue = Object.entries(value as Record<string, unknown>)
      ?.map(([key, value]) => {
        const childProperty = property.properties?.[key] as Property;
        if (!childProperty) return;

        return getPropertyString({
          key,
          value,
          property: childProperty,
          objectNotation: true,
        });
      })
      .filter(Boolean)
      .join(", ");
    formattedValue = `{ ${resolvedValue} }`;
  }

  return [
    key,
    key && (objectNotation ? ": " : "="),
    objectNotation || isStringValue || isSlotString
      ? formattedValue
      : `{${formattedValue}}`,
  ]
    .filter(Boolean)
    .join("");
};

const getPropertiesString = (
  values: ReturnType<typeof resolveDefaultValues>,
  properties: Properties,
  options?: { objectNotation?: boolean }
) => {
  return Object.entries(values).reduce((acc, cur) => {
    const key = cur[0];
    const value = cur[1];
    const property = properties[key];

    if (!property) {
      console.warn(`Property not found: ${key}, ${value}`);
      return "";
    }

    const attribute = getPropertyString({
      key,
      value,
      property,
      objectNotation: options?.objectNotation,
    });

    if (key === "children" || !attribute) return acc;
    if (!acc) return attribute;
    return [acc, attribute].join(options?.objectNotation ? ", " : " ");
  }, "");
};

const ArticleDemo = (props: {
  propsObjectNotation?: boolean;
  children: (
    props: Record<string, { props: string; children: React.ReactNode }>
  ) => string;
}) => {
  const { children, propsObjectNotation } = props;
  const properties = useProperties();
  const codeVisibility = useToggle();
  const controlsToggle = useToggle();
  const [values, setValues] = React.useState(resolveDefaultValues(properties));
  const childrenProps = Object.keys(values).reduce((acc, sectionName) => {
    const sectionValues = values[sectionName];
    const child = properties[sectionName]["children"];

    return {
      ...acc,
      [sectionName]: {
        attributes: sectionValues
          ? getPropertiesString(sectionValues, properties[sectionName], {
              objectNotation: propsObjectNotation,
            })
          : "",
        children:
          resolveSlotValue({
            value: sectionValues["children"],
            control:
              child?.type === ControlType.slot && child.control
                ? child.control
                : undefined,
          }) || "",
      },
    };
  }, {});

  const handlePropertyChange: PropertiesControlsProps["onPropertyChange"] = (
    sectionName,
    { name, value }
  ) => {
    setValues({
      ...values,
      [sectionName]: {
        ...values[sectionName],
        [name]: value === "" ? undefined : value,
      },
    });
  };

  return (
    <View gap={3}>
      <CodeExample
        mode={codeVisibility.active ? "preview-code" : "preview"}
        className="language-tsx"
      >
        {children(childrenProps).replace(" >", ">")}
      </CodeExample>

      <View gap={1} direction="row" justify="end">
        <Button
          rounded
          variant="ghost"
          highlighted={controlsToggle.active}
          color={controlsToggle.active ? "primary" : "neutral"}
          startIcon={IconControls}
          onClick={() => {
            controlsToggle.toggle();
            if (!controlsToggle.active) codeVisibility.activate();
          }}
        />

        <Button.Aligner position="end">
          <Button
            rounded
            variant="ghost"
            highlighted={codeVisibility.active}
            color={codeVisibility.active ? "primary" : "neutral"}
            startIcon={IconCode}
            onClick={() => codeVisibility.toggle()}
          />
        </Button.Aligner>
      </View>

      <PropertiesControls
        values={values}
        active={controlsToggle.active}
        onClose={controlsToggle.deactivate}
        onPropertyChange={handlePropertyChange}
      />
    </View>
  );
};

export default ArticleDemo;
