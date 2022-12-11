import React from "react";
import { Link } from "@uicapsule/components";
import IconZap from "icons/Zap";
import Example from "./Example";

const ExampleLink = () => (
  <Example
    title="Link"
    text="Interactive text element used for navigation within the text paragraphs"
    href="/content/docs/components/link"
  >
    <Link attributes={{ target: "_blank" }} icon={IconZap}>
      Proceed to checkout
    </Link>
  </Example>
);

export default ExampleLink;
