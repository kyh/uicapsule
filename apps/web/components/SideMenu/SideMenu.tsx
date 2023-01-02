import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  MenuItem,
  Text,
  TextField,
  View,
  Icon,
  Badge,
} from "@uicapsule/components";
import IconSearch from "icons/Search";
import IconChevronDown from "icons/ChevronDown";
import { normalizeMenu, getMenuItemData } from "constants/menu";
import type * as T from "./SideMenu.types";
import s from "./SideMenu.module.css";

const SideMenuItem = (props: T.MenuItemProps) => {
  const { padded, fullWidth } = props;
  const router = useRouter();
  const data = getMenuItemData(props);

  if (!data.url && !data.onClick) return null;

  const currentUrl = router.asPath.split("#")[0];
  const selected = !!(
    data.url &&
    (currentUrl.startsWith(`${data.url}/`) || currentUrl === data.url)
  );

  const linkElement = (
    <MenuItem
      size="small"
      selected={selected}
      key={data.url}
      startIcon={data.icon}
      onClick={data.onClick}
      roundedCorners={!fullWidth}
      attributes={{ target: data.url?.startsWith("/") ? undefined : "_blank" }}
      endSlot={
        data.soon && (
          <Badge
            size="small"
            variant="outline"
            color={selected ? "primary" : undefined}
          >
            Soon
          </Badge>
        )
      }
    >
      <Text
        color={selected ? undefined : "neutral-faded"}
        variant="body-medium-2"
        className={padded && s["item--padded"]}
      >
        {data.title}
      </Text>
    </MenuItem>
  );

  if (data.onClick || !data.url) return linkElement;

  return (
    <Link href={data.url} key={data.url} passHref>
      {linkElement}
    </Link>
  );
};

const SideMenuGroup = (props: T.MenuGroupProps) => {
  const { query, fullWidth } = props;
  const data = getMenuItemData(props);
  const router = useRouter();
  let hasSelectedItem = false;

  if (props.normalizedItems) {
    props.normalizedItems.forEach((child) => {
      if (hasSelectedItem) return;
      const childData = getMenuItemData(child);

      if (!childData.url) return;
      hasSelectedItem = router.asPath.startsWith(childData.url);
    });
  }
  const [active, setActive] = React.useState(hasSelectedItem);
  const opened = active || !!query;

  if (!data.items || !props.normalizedItems) return null;

  const handleClick = () => {
    if (query) return;
    setActive((active) => !active);
  };

  const endSlot = (
    <motion.span
      animate={opened ? { rotate: "-180deg" } : { rotate: "0deg" }}
      transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
    >
      <Icon svg={IconChevronDown} size={4} color="neutral-faded" />
    </motion.span>
  );

  return (
    <>
      <MenuItem
        size="small"
        key={data.title}
        onClick={handleClick}
        endSlot={endSlot}
        roundedCorners={!fullWidth}
      >
        <Text color="neutral-faded" variant="body-medium-2">
          {data.title}
        </Text>
      </MenuItem>
      <motion.div
        initial={
          !opened ? { opacity: 0, height: 0 } : { opacity: 0, height: "auto" }
        }
        animate={
          opened
            ? {
                opacity: 1,
                height: "auto",
                overflow: "hidden",
                margin: "0 -16px",
                padding: "0 16px",
              }
            : {
                opacity: 0,
                height: 0,
                overflow: "hidden",
                margin: "0 -16px",
                padding: "0 16px",
              }
        }
        transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
      >
        <View gap={1}>
          {props.normalizedItems.map((item, index) => {
            if (item.normalizedItems) {
              return (
                <SideMenuGroup
                  {...item}
                  query={query}
                  key={item.title || index}
                  fullWidth={fullWidth}
                />
              );
            }

            return <SideMenuItem {...item} key={item.title || index} padded />;
          })}
        </View>
      </motion.div>
    </>
  );
};

const SideMenuSection = (props: T.MenuSectionProps) => {
  const { query, fullWidth } = props;
  const data = getMenuItemData(props);

  if (!data.items || !props.normalizedItems) return null;

  return (
    <View gap={2} key={data.title}>
      {data.title && <Text variant="body-strong-1">{data.title}</Text>}

      <MenuItem.Aligner>
        <View gap={1}>
          {props.normalizedItems.map((child, index) => {
            if (child.normalizedItems) {
              return (
                <SideMenuGroup
                  {...child}
                  query={query}
                  key={child.title || index}
                  fullWidth={fullWidth}
                />
              );
            }

            return (
              <SideMenuItem
                {...child}
                key={child.title || index}
                fullWidth={fullWidth}
              />
            );
          })}
        </View>
      </MenuItem.Aligner>
    </View>
  );
};

const SideMenu = (props: T.Props) => {
  const { extraSection, fullWidth } = props;
  const [query, setQuery] = React.useState("");
  const menu = normalizeMenu({ filter: query });
  const sections = extraSection ? [...extraSection, ...menu.list] : menu.list;
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.key !== "/" ||
        ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName!)
      )
        return;
      event.preventDefault();
      inputRef.current?.focus();
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <View gap={6} className={s.root}>
      <div className={s.search}>
        <TextField
          name="search"
          placeholder="Search docs"
          value={query}
          onChange={({ value }) => {
            setQuery(value);
          }}
          startIcon={IconSearch}
          endSlot={
            <View
              backgroundColor="neutral-faded"
              width="20px"
              height="20px"
              borderRadius="small"
              align="center"
              justify="center"
            >
              <Text variant="caption-2" color="neutral-faded">
                /
              </Text>
            </View>
          }
          inputAttributes={{ ref: inputRef }}
        />
      </div>

      {sections.map((item, index) => {
        if (item.url || item.onClick) {
          return (
            <View.Item
              gapBefore={index === 0 ? undefined : 0}
              key={item.title || index}
            >
              <MenuItem.Aligner>
                <SideMenuItem {...item} fullWidth={fullWidth} />
              </MenuItem.Aligner>
            </View.Item>
          );
        }

        return (
          <SideMenuSection
            {...item}
            query={query}
            key={item.id || item.title || index}
            fullWidth={fullWidth}
          />
        );
      })}
    </View>
  );
};

export default SideMenu;
