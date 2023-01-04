import { View, Text } from "@uicapsule/components";
import Example from "./components/Example";
import ExampleActionBar from "./components/ExampleActionBar";
import ExampleAlert from "./components/ExampleAlert";
import ExampleAvatar from "./components/ExampleAvatar";
import ExampleBadge from "./components/ExampleBadge";
import ExampleBreadcrumbs from "./components/ExampleBreadcrumbs";
import ExampleButton from "./components/ExampleButton";
import ExampleCard from "./components/ExampleCard";
import ExampleCarousel from "./components/ExampleCarousel";
import ExampleCheckbox from "./components/ExampleCheckbox";
import ExampleDivider from "./components/ExampleDivider";
import ExampleDropdownMenu from "./components/ExampleDropdownMenu";
import ExampleLink from "./components/ExampleLink";
import ExampleLoader from "./components/ExampleLoader";
import ExampleMenuItem from "./components/ExampleMenuItem";
import ExampleModal from "./components/ExampleModal";
import ExampleOverlay from "./components/ExampleOverlay";
import ExamplePopover from "./components/ExamplePopover";
import ExampleProgress from "./components/ExampleProgress";
import ExampleRadio from "./components/ExampleRadio";
import ExampleSelect from "./components/ExampleSelect";
import ExampleSwitch from "./components/ExampleSwitch";
import ExampleTabs from "./components/ExampleTabs";
import ExampleTextArea from "./components/ExampleTextArea";
import ExampleTextField from "./components/ExampleTextField";
import ExampleToast from "./components/ExampleToast";
import ExampleTooltip from "./components/ExampleTooltip";

import ExampleAccordion from "./components/ExampleAccordion";
import ExampleActionable from "./components/ExampleActionable";
import ExampleAspectRatio from "./components/ExampleAspectRatio";
import ExampleBackdrop from "./components/ExampleBackdrop";
import ExampleContainer from "./components/ExampleContainer";
import ExampleDismissible from "./components/ExampleDismissible";
import ExampleFormControl from "./components/ExampleFormControl";
import ExampleHidden from "./components/ExampleHidden";
import ExampleHiddenVisually from "./components/ExampleHiddenVisually";
import ExampleIcon from "./components/ExampleIcon";
import ExampleImage from "./components/ExampleImage";
import ExampleText from "./components/ExampleText";
import ExampleThemeProvider from "./components/ExampleThemeProvider";
import ExampleView from "./components/ExampleView";
import s from "./DocsOverview.module.css";

const examples = [
  ExampleAccordion,
  ExampleAlert,
  ExampleAvatar,
  ExampleBadge,
  ExampleButton,
  ExampleBreadcrumbs,
  ExampleCard,
  ExampleCarousel,
  ExampleCheckbox,
  ExampleDivider,
  ExampleDropdownMenu,
  ExampleLink,
  ExampleLoader,
  ExampleMenuItem,
  ExampleModal,
  ExampleOverlay,
  ExamplePopover,
  ExampleProgress,
  ExampleRadio,
  ExampleSelect,
  ExampleSwitch,
  ExampleTabs,
  ExampleTextArea,
  ExampleTextField,
  ExampleToast,
  ExampleTooltip,
];

const utilities = [
  ExampleActionBar,
  ExampleActionable,
  ExampleAspectRatio,
  ExampleBackdrop,
  ExampleContainer,
  ExampleDismissible,
  ExampleFormControl,
  ExampleHidden,
  ExampleHiddenVisually,
  ExampleIcon,
  ExampleImage,
  ExampleText,
  ExampleThemeProvider,
  ExampleView,
];

const hooks = [
  {
    title: "useElementId",
    text: "Custom hook to generate ids for DOM elements",
    href: "/content/docs/hooks/use-element-id",
  },
  {
    title: "useFormControl",
    text: "Custom hook to inherit values from the FormControl utility in your custom-built form fields",
    href: "/content/docs/hooks/use-form-control",
  },
  {
    title: "useRTL",
    text: "Custom hook to control the direction of the content flow",
    href: "/content/docs/hooks/use-rtl",
  },
  {
    title: "useScrollLock",
    text: "Custom hook to lock and unlock page scrolling",
    href: "/content/docs/hooks/use-scroll-lock",
  },
  {
    title: "useTheme",
    text: "Custom hook to switch between the light and dark mode of the used theme",
    href: "/content/docs/hooks/use-theme",
  },
  {
    title: "useToggle",
    text: "Custom hook for toggling states on and off",
    href: "/content/docs/hooks/use-toggle",
  },
];

const DocsOverview = () => {
  return (
    <View gap={5}>
      <Text variant="display-3" as="h1">
        Overview
      </Text>

      <Text variant="featured-3" className={s.intro}>
        UICapsule implements components from real-world design systems under a
        single interface.
      </Text>

      <Text variant="body-1" className={s.intro}>
        It is a reference implementation for anyone building their own component
        library - showcasing common functionality, best practices, accessibility
        requirements, and alternative examples.
      </Text>

      <View.Item gapBefore={12}>
        <Text variant="title-1">Components</Text>
      </View.Item>

      <View.Item gapBefore={6}>
        <View gap={{ s: 3, m: 5 }} direction="row" align="stretch">
          {examples.map((ExampleComponent, index) => (
            <View.Item columns={{ s: 12, m: 6, xl: 4 }} key={index}>
              <ExampleComponent />
            </View.Item>
          ))}
        </View>
      </View.Item>

      <View.Item gapBefore={12}>
        <Text variant="title-1">Utilities</Text>
      </View.Item>

      <View.Item gapBefore={6}>
        <View gap={{ s: 3, m: 5 }} direction="row" align="stretch">
          {utilities.map((Utility, index) => {
            return (
              <View.Item columns={{ s: 12, m: 6, xl: 4 }} key={index}>
                <Utility />
              </View.Item>
            );
          })}
        </View>
      </View.Item>

      <View.Item gapBefore={12}>
        <Text variant="title-1">Hooks</Text>
      </View.Item>

      <View.Item gapBefore={6}>
        <View gap={{ s: 3, m: 5 }} direction="row" align="stretch">
          {hooks.map((hook) => (
            <View.Item columns={{ s: 12, m: 6, xl: 4 }} key={hook.title}>
              <Example {...hook} />
            </View.Item>
          ))}
        </View>
      </View.Item>
    </View>
  );
};

export default DocsOverview;
