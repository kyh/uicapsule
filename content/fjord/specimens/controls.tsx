import { useState } from "react";
import { Copy, Plus } from "lucide-react";

import { CodeTag } from "../components/badge";
import { Button, ButtonGroup } from "../components/button";
import { CopyButton } from "../components/copy-button";
import { SearchInput, TextArea, TextField } from "../components/field";
import { Icon } from "../components/icon";
import { Select } from "../components/overlays";
import { Checkbox, ChoiceList, Segmented, Slider, Switch } from "../components/selection";
import { Category, Specimen } from "./specimen";

export const ACTION_NAMES = ["Button", "Button group", "Copy button"] as const;
export const INPUT_NAMES = ["Text field", "Textarea", "Search", "Select"] as const;

export const SELECTION_NAMES = [
  "Checkbox",
  "Choice list",
  "Switch",
  "Slider",
  "Segmented control",
] as const;

const VIEWS = ["Steps", "Waterfall", "Raw"] as const;

export const Actions = () => {
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<(typeof VIEWS)[number]>("Waterfall");

  const save = () => {
    setSaving(true);
    window.setTimeout(() => setSaving(false), 1600);
  };

  return (
    <Category
      id="actions"
      lede="Buttons and their kin. A view gets one ink primary for the step it exists for; everything else is paper or bare text."
      title="Actions"
    >
      <Specimen
        description="Secondary is what you get unless you ask. The primary is ink with a lit top edge, and a destructive button keeps paper with red text and a red edge."
        name="Button"
        wide
      >
        <div className="fj-hstack" data-wrap="">
          <Button variant="primary">Merge #2817</Button>
          <Button>Request changes</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="destructive">Burn key</Button>
          <Button disabled>Merged</Button>
        </div>
        <div className="fj-hstack" data-wrap="">
          <Button size="sm">
            <Icon icon={Plus} />
            Add a check
          </Button>
          <Button size="xs">Rerun lint</Button>
          <Button aria-label="Copy" size="icon-sm" variant="ghost">
            <Icon icon={Copy} />
          </Button>
          <Button onClick={save} pending={saving} pendingLabel="Queuing" variant="primary">
            Queue the issue
          </Button>
        </div>
      </Specimen>
      <Specimen
        description="Joined buttons with square seams and round outer corners. The pressed one takes the cold wash."
        name="Button group"
      >
        <ButtonGroup label="Trace view">
          {VIEWS.map((option) => (
            <Button
              aria-pressed={view === option}
              key={option}
              onClick={() => setView(option)}
              size="sm"
            >
              {option}
            </Button>
          ))}
        </ButtonGroup>
        <p className="fj-t-body-sm fj-c-2">Showing the {view.toLowerCase()} view.</p>
      </Specimen>
      <Specimen
        description="Puts the value on the clipboard and reads Copied for 1.6 seconds, to screen readers as well. The glyph changes without a fade."
        name="Copy button"
      >
        <div className="fj-hstack">
          <CodeTag>kr-2830-1</CodeTag>
          <CopyButton label="Copy run id" value="kr-2830-1" />
        </div>
        <CopyButton label="Copy install line" showLabel value="kestrel agents attach storefront" />
      </Specimen>
    </Category>
  );
};

const MODELS = [
  { label: "tern-3", value: "tern-3" },
  { label: "tern-3-mini", value: "tern-3-mini" },
  { label: "skua-1", value: "skua-1" },
] as const;

export const Inputs = () => {
  const [branch, setBranch] = useState("fix/cart coupon");
  const [model, setModel] = useState<(typeof MODELS)[number]["value"]>("tern-3");

  const branchError = /\s/u.test(branch)
    ? "Branch names cannot hold spaces. Try fix/cart-coupon."
    : undefined;

  return (
    <Category
      id="inputs"
      lede="A field shows its edge at rest, turns ink with a soft halo when it has the cursor, and puts one line under itself."
      title="Inputs"
    >
      <Specimen
        description="Label, field, then a hint that an error replaces. Invalid fields take the fail wash."
        name="Text field"
      >
        <TextField
          hint="Agents open pull requests from this branch."
          label="Base branch"
          onChange={(event) => setBranch(event.target.value)}
          value={branch}
          error={branchError}
          mono
        />
        <TextField label="Display name" optional placeholder="Checkout fixer" />
      </Specimen>
      <Specimen description="For instructions and prompts. Resizes downward only." name="Textarea">
        <TextArea
          defaultValue="Fix the failing test, keep the patch under 40 lines, and ask before you merge."
          hint="patchwright reads this before every run."
          label="Instructions"
        />
      </Specimen>
      <Specimen
        description="The magnifier is the one icon in a field; the shortcut sits at the far edge."
        name="Search"
      >
        <SearchInput label="Search runs" placeholder="Search runs" shortcut="/" />
      </Specimen>
      <Specimen
        description="The platform select, so it works with every keyboard and screen reader. Where styling the picker is possible, it opens on paper."
        name="Select"
      >
        <Select
          hint="Changing the model starts a new eval."
          label="Model"
          onValueChange={setModel}
          options={MODELS}
          value={model}
        />
      </Specimen>
    </Category>
  );
};

const POLICIES = [
  { description: "The agent stops before every write.", label: "Ask every time", value: "ask" },
  {
    description: "Writes inside the repo run, anything outside asks.",
    label: "Ask outside the repo",
    value: "outside",
  },
  { description: "Only merges and deploys ask.", label: "Ask before it ships", value: "ship" },
] as const;

const RANGES = ["1h", "24h", "7d", "30d"] as const;

export const Selection = () => {
  const [notify, setNotify] = useState(true);
  const [redact, setRedact] = useState(false);
  const [policy, setPolicy] = useState<(typeof POLICIES)[number]["value"]>("outside");
  const [paused, setPaused] = useState(false);
  const [budget, setBudget] = useState(12);
  const [range, setRange] = useState<(typeof RANGES)[number]>("24h");

  return (
    <Category
      id="selection"
      lede="Checked is ink. Nothing here is round: a person is round, a control is not."
      title="Selection"
    >
      <Specimen
        description="A 4px box with a 50% ink edge at rest, so it clears 3:1 before you hover."
        name="Checkbox"
      >
        <Checkbox
          checked={notify}
          description="Post to #kestrel-oncall when a run fails twice."
          label="Notify on repeat failures"
          onCheckedChange={setNotify}
        />
        <Checkbox checked={redact} label="Redact secrets in traces" onCheckedChange={setRedact} />
        <Checkbox
          checked={false}
          disabled
          label="Share traces publicly"
          onCheckedChange={() => null}
        />
      </Specimen>
      <Specimen
        description="Fjord's radio. Options are ruled rows, and the picked one takes the wash, an ink ring and a check at its end. Arrow keys move."
        name="Choice list"
      >
        <ChoiceList
          label="Approval policy"
          onValueChange={setPolicy}
          options={POLICIES}
          value={policy}
        />
      </Specimen>
      <Specimen
        description="On or off at once. The track keeps the control corner and the thumb the inner one."
        name="Switch"
      >
        <Switch checked={paused} label="Pause all agents" onCheckedChange={setPaused} />
        <p className="fj-t-body-sm fj-c-2">
          {paused ? "4 agents paused. Queued runs wait." : "4 agents taking work."}
        </p>
      </Specimen>
      <Specimen description="A thin ink track and a flat 12px key, not a ball." name="Slider">
        <Slider
          format={(value) => `${value} calls`}
          label="Tool call budget"
          max={40}
          min={4}
          onValueChange={setBudget}
          step={2}
          ticks={["4", "22", "40"]}
          value={budget}
        />
      </Specimen>
      <Specimen
        description="Two to five views. Paper segment on the grey track, lifted by the one small shadow."
        name="Segmented control"
      >
        <Segmented label="Range" onValueChange={setRange} options={RANGES} value={range} />
        <Segmented
          label="Range, compact"
          onValueChange={setRange}
          options={RANGES}
          size="xs"
          value={range}
        />
      </Specimen>
    </Category>
  );
};
