import React from "react";
import { Link, View, Text } from "@uicapsule/components";
import { debounce } from "utilities/helpers";
import type * as T from "./AnchorMenu.types";
import s from "./AnchorMenu.module.css";

const AnchorMenu = (props: T.Props) => {
  const { items, rootRef } = props;
  const [selection, setSelection] = React.useState<[number, number]>();
  let from: number;
  let to: number;

  if (selection) [from, to] = selection;

  React.useEffect(() => {
    if (!rootRef.current) return;

    const handleScroll = () => {
      let lastScrolledByIndex = null;
      const activeIndices: number[] = [];
      const els = rootRef.current!.querySelectorAll("h2,h3");

      els.forEach((el, index) => {
        const elRect = el.getBoundingClientRect();

        if (
          elRect.top >= 0 &&
          elRect.bottom <= document.documentElement.clientHeight
        ) {
          activeIndices.push(index);
        }

        // Save index of the last heading user has scrolled through
        // In case of a long section without headings on the page, last one will still be active
        if (elRect.top < 0) lastScrolledByIndex = index;
      });

      if (
        lastScrolledByIndex !== null &&
        !activeIndices.includes(lastScrolledByIndex)
      ) {
        activeIndices.push(lastScrolledByIndex);
      }

      const sorted = activeIndices.sort((a, b) => a - b);
      const selection: [number, number] = [
        sorted[0],
        sorted[sorted.length - 1],
      ];

      setSelection(selection);
    };

    const debouncedHandler = debounce(handleScroll, 10);

    debouncedHandler();
    document.addEventListener("scroll", debouncedHandler);
    return () => document.removeEventListener("scroll", debouncedHandler);
  }, [rootRef]);

  if (items.length < 2) {
    return null;
  }

  return (
    <View gap={2} as="ul" align="start" className={s.root}>
      <Text variant="body-medium-2">Contents</Text>
      {items.map((item, index) => {
        const isActive =
          from !== undefined &&
          to !== undefined &&
          index >= from &&
          index <= to;

        return (
          <Text
            as="li"
            key={item.text}
            variant={isActive ? "body-medium-2" : "body-2"}
            color="neutral-faded"
            className={item.level === 3 && s.submenu}
          >
            <Link
              href={item.url}
              color={isActive ? "primary" : "inherit"}
              variant="plain"
            >
              {item.text}
            </Link>
          </Text>
        );
      })}
    </View>
  );
};

export default AnchorMenu;
