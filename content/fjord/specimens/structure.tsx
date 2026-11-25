import { useState } from "react";

import { Badge, CodeTag } from "../components/badge";
import { Button } from "../components/button";
import { Collapsible } from "../components/data";
import {
  Card,
  CardBody,
  CardHead,
  Item,
  Panel,
  PanelBody,
  PanelFoot,
  PanelHead,
} from "../components/frame";
import { Breadcrumb, Pagination, Tabs } from "../components/navigation";
import { Status } from "../components/status";
import { Category, Specimen } from "./specimen";

export const NAVIGATION_NAMES = ["Tabs", "Breadcrumb", "Pagination"] as const;
export const LAYOUT_NAMES = ["Panel", "Card", "Collapsible"] as const;

const TABS = [
  { count: 9, label: "Steps", value: "steps" },
  { count: 2, label: "Calls", value: "calls" },
  { label: "Output", value: "output" },
] as const;

const TAB_COPY = {
  calls: "read_file and run_tests, the second retried once.",
  output: "Await applyCoupon() before reading cart.total.",
  steps: "plan, two model calls, six tool calls and one gate.",
} as const;

export const Navigation = () => {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("steps");
  const [page, setPage] = useState(4);

  return (
    <Category
      id="navigation"
      lede="Where you are and what is next to it. The selected tab takes a 2px ink line, with a cut."
      title="Navigation"
    >
      <Specimen
        description="Arrow keys, Home and End move between tabs. Counts are tabular and quiet."
        name="Tabs"
        wide
      >
        <Tabs label="Run sections" onValueChange={setTab} tabs={TABS} value={tab}>
          <p className="fj-t-body">{TAB_COPY[tab]}</p>
        </Tabs>
      </Specimen>
      <Specimen
        description="Where you are, as places split by slashes. The last place is plain ink text, since you are already there."
        name="Breadcrumb"
      >
        <Breadcrumb items={["Kestrel", "Agents", "patchwright", "Settings"]} />
      </Specimen>
      <Specimen
        description="Pages by number, with the far ends always reachable."
        name="Pagination"
      >
        <Pagination onPageChange={setPage} page={page} pages={12} />
        <p className="fj-t-body-sm fj-c-2 fj-data">
          Runs {(page - 1) * 25 + 1} to {page * 25} of 297
        </p>
      </Specimen>
    </Category>
  );
};

export const Layout = () => (
  <Category
    id="layout"
    lede="The two frames everything else sits in. A panel asks for one decision and greys its head and foot; a card is a list you work through and stays paper throughout. Neither goes inside the other."
    title="Layout"
  >
    <Specimen
      bare
      description="Its title and count sit in a grey head, rows in the paper body, and the way out in a grey foot. The head carries one action at most."
      name="Panel"
    >
      <Panel label="Agents">
        <PanelHead meta="4" title="Agents" />
        <PanelBody>
          <div className="fj-rows">
            <Item
              end={<Status status="running" />}
              size="sm"
              title={
                <>
                  patchwright <Badge kind="agent" />
                </>
              }
            />
            <Item
              end={<Status status="idle" />}
              size="sm"
              title={
                <>
                  scribe <Badge kind="agent" />
                </>
              }
            />
          </div>
        </PanelBody>
        <PanelFoot>
          <Button size="sm" variant="ghost">
            View all agents
          </Button>
        </PanelFoot>
      </Panel>
    </Specimen>
    <Specimen
      bare
      description="Paper from the head down, one rule under the head, and nothing between it and its rows."
      name="Card"
    >
      <Card label="Branch">
        <CardHead meta="from patchwright" title="Branch" />
        <CardBody>
          <p className="fj-hstack fj-t-body" data-wrap="">
            <CodeTag>agent/coupon-race</CodeTag> is 3 commits ahead of main.
          </p>
        </CardBody>
      </Card>
    </Specimen>
    <Specimen
      bare
      description="A hidden group of rows behind one line. It opens at full height in one frame, so nothing below slides."
      name="Collapsible"
    >
      <div className="fj-card">
        <Collapsible label="2 burned keys">
          <div className="fj-rows fj-collapsible-body">
            <Item description="Burned by Maren Holt" size="sm" title="deploy-legacy" />
            <Item description="Burned by Idris Okafor" size="sm" title="soak-test-old" />
          </div>
        </Collapsible>
      </div>
    </Specimen>
  </Category>
);
