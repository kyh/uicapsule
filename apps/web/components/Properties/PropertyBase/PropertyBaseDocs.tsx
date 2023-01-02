import React from "react";
import {
  View,
  Tooltip,
  Actionable,
  Badge,
  Icon,
  Text,
} from "@uicapsule/components";
import IconInfo from "icons/Info";
import IconResponsive from "icons/Responsive";
import IconAlert from "icons/Alert";
import * as T from "../Properties.types";
import s from "../Properties.module.css";

const PropertyBaseDocs = (props: {
  property: T.Property;
  type: string | string[];
  name: string;
}) => {
  const { property, name } = props;
  const { description, required, responsive, docs, defaultValue } = property;
  const type = docs?.type || props.type;
  const normalisedType = Array.isArray(type) ? type : [type];

  return (
    <View direction="row" gap={2} className={s.property} key={name}>
      <View
        width={{ s: "120px", m: "140px" }}
        justify="start"
        gap={1}
        direction="row"
        align="center"
      >
        {description ? (
          <Tooltip text={description} position="end">
            {(attributes) => (
              <Actionable
                attributes={attributes}
                as="div"
                borderRadius="inherit"
              >
                <Badge variant="faded" color="primary">
                  <View direction="row" gap={1} align="center">
                    <View.Item>{name}</View.Item>
                    <Icon svg={IconInfo} color="neutral-faded" />
                  </View>
                </Badge>
              </Actionable>
            )}
          </Tooltip>
        ) : (
          <Badge variant="faded" color="primary">
            {name}
          </Badge>
        )}
      </View>

      <View.Item grow>
        <View direction="row" gap={1} align="center">
          {normalisedType.map((item) => (
            <Badge variant="faded" key={item}>
              {item}
            </Badge>
          ))}
          {defaultValue ? (
            <Tooltip text="Default value" position="bottom">
              {(attributes) => (
                <Actionable attributes={attributes}>
                  <Text variant="caption-1" color="neutral-faded" as="span">
                    <>=&nbsp;{defaultValue}</>
                  </Text>
                </Actionable>
              )}
            </Tooltip>
          ) : null}
        </View>
      </View.Item>
      {responsive && (
        <Tooltip text="Responsive property" position="bottom">
          {(attributes) => (
            <View padding={[1, 0]}>
              <Actionable attributes={attributes}>
                <Icon svg={IconResponsive} color="positive" />
              </Actionable>
            </View>
          )}
        </Tooltip>
      )}
      {required && (
        <Tooltip text="Required property" position="bottom">
          {(attributes) => (
            <View padding={[1, 0]}>
              <Actionable attributes={attributes}>
                <Icon svg={IconAlert} color="critical" />
              </Actionable>
            </View>
          )}
        </Tooltip>
      )}
    </View>
  );
};

export default PropertyBaseDocs;
