import React from "react";
import { LiveProvider, LiveEditor, LivePreview } from "react-live";
import prettier from "prettier/standalone";
import babelParser from "prettier/parser-babel";
import * as UIC from "@uicapsule/components";
import { Placeholder, useTheme, View, Accordion } from "@uicapsule/components";
import ComponentPreview from "components/ComponentPreview";
import IconZap from "icons/Zap";
import IconMic from "icons/Mic";
import IconLink from "icons/Link";
import IconHeart from "icons/Heart";
import IconPlay from "icons/Play";
import IconDown from "icons/ChevronDown";
import IconMenu from "icons/Menu";
import s from "./CodeExample.module.css";

type Props = {
  children: string;
  className?: string;
  mode?: "preview" | "code" | "preview-code";
  full?: boolean;
  elevated?: boolean;
};

const getTheme = (dark?: boolean) => ({
  plain: {
    color: "var(--uic-color-foreground-neutral)",
    backgroundColor: "transparent",
  },
  styles: [
    {
      types: ["string", "attr-value", "number", "function", "boolean"],
      style: {
        color: dark ? "#96d0ff" : "hsl(221, 87%, 60%)",
      },
    },
    {
      types: ["comment", "punctuation"],
      style: {
        color: "#777b83",
      },
    },
    {
      types: ["tag", "keyword"],
      style: {
        color: "var(--uic-color-foreground-primary)",
      },
    },
    {
      types: ["attr-name"],
      style: {
        color: dark ? "hsl(29, 54%, 61%)" : "hsl(35, 99%, 36%)",
      },
    },
  ],
});

const CodeExample = (props: Props) => {
  const { children, className, elevated, mode: passedMode } = props;
  const { colorMode } = useTheme();
  const [formattedCode, setFormattedCode] = React.useState(children);
  const parsedLanguage =
    className && (className.replace(/language-/, "") as any);
  const mode = passedMode || parsedLanguage;
  const isJSXCodeExample = mode === "code";
  const isPreview = mode?.startsWith("preview");
  const language = isPreview || isJSXCodeExample ? "jsx" : parsedLanguage;
  const isCodeOnly =
    isJSXCodeExample || (language !== "jsx" && language !== "tsx");
  const isCodeShown = mode !== "preview";
  const rootClassNames = [
    isCodeOnly && s["--variant-code"],
    isPreview && s["--variant-preview"],
    elevated && s["--elevated"],
  ];

  React.useEffect(() => {
    if (!isCodeShown || (language !== "jsx" && language !== "tsx")) return;

    let code: string = "";

    try {
      code = prettier
        .format(children, {
          parser: "babel",
          plugins: [babelParser],
        })
        .trim()
        .replace(/;$/, "");
    } catch (e) {}

    setFormattedCode(code || children);
  }, [children, isCodeShown, language]);

  return (
    <View
      borderColor="neutral-faded"
      borderRadius="medium"
      overflow="hidden"
      className={rootClassNames}
    >
      <LiveProvider
        code={formattedCode.trim()}
        language={language}
        scope={{
          ...UIC,
          Placeholder,
          IconZap,
          IconMic,
          IconLink,
          IconHeart,
          IconPlay,
          IconDown,
          IconMenu,
        }}
        theme={getTheme(colorMode === "dark")}
        disabled
      >
        {!isCodeOnly && (
          <ComponentPreview
            height={isPreview ? 300 : undefined}
            centered={isPreview}
          >
            <LivePreview />
          </ComponentPreview>
        )}

        <Accordion active={isCodeShown}>
          <Accordion.Content>
            <LiveEditor className={s.code} key={formattedCode} />
          </Accordion.Content>
        </Accordion>
      </LiveProvider>
    </View>
  );
};

export default CodeExample;
