import React from "react";
import { View, Button } from "@uicapsule/components";
import IconMinus from "icons/Minus";
import PropertyBaseControl from "../PropertyBase/PropertyBaseControl";
import PropertiesControl from "../PropertiesControl";
import * as T from "../Properties.types";
import s from "../Properties.module.css";
import IconPlus from "icons/Plus";

const PropertyObjectControl: React.FC<T.ObjectControlProps> = (props) => {
  const { name, value, properties, onChange, hideName } = props;

  const handleItemChange = (key: string, itemValue: unknown) => {
    if (!value) return;

    const nextValue = { ...value };
    nextValue[key] = itemValue;
    onChange({ value: nextValue, name });
  };

  const handleToggle = () => {
    onChange({ value: value ? undefined : {}, name });
  };

  return (
    <>
      <PropertyBaseControl name={name} hideName={hideName}>
        <View align="end">
          <Button
            icon={value ? IconMinus : IconPlus}
            variant="ghost"
            onClick={handleToggle}
          />
        </View>
      </PropertyBaseControl>

      {value && properties && (
        <View className={s.propertyList} paddingStart={4} gap={2}>
          {Object.entries(properties).map(([name, property]) => (
            <PropertiesControl
              key={name}
              name={name}
              property={property}
              value={value?.[name]}
              onChange={(value) => handleItemChange(name, value)}
            />
          ))}
        </View>
      )}
    </>
  );
};

export default PropertyObjectControl;
