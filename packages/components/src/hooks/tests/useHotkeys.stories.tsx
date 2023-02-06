import React from "react";
import useHotkeys from "hooks/useHotkeys";
import View from "components/View";

export default { title: "Hooks/useHotkeys" };

function Example() {
  const { checkHotkeyState } = useHotkeys({
    "shift + b + n": null,
  });
  const active = checkHotkeyState("shift + b + n");
  const shiftActive = checkHotkeyState("shift");
  const bActive = checkHotkeyState("b");
  const nActive = checkHotkeyState("n");

  return (
    <View
      animated
      gap={2}
      direction="row"
      backgroundColor={active ? "positive-faded" : undefined}
      padding={2}
      borderRadius="small"
    >
      <View
        padding={[2, 4]}
        borderRadius="small"
        borderColor="neutral-faded"
        animated
        backgroundColor={shiftActive ? "neutral-faded" : "base"}
        shadow={shiftActive ? undefined : "base"}
      >
        Shift
      </View>
      <View
        padding={[2, 4]}
        borderRadius="small"
        borderColor="neutral-faded"
        animated
        backgroundColor={bActive ? "neutral-faded" : "base"}
        shadow={bActive ? undefined : "base"}
      >
        b
      </View>
      <View
        padding={[2, 4]}
        borderRadius="small"
        borderColor="neutral-faded"
        animated
        backgroundColor={nActive ? "neutral-faded" : "base"}
        shadow={nActive ? undefined : "base"}
      >
        n
      </View>
    </View>
  );
}

export const state = () => <Example />;
