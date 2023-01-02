import React from "react";
import { DropdownMenu, MenuItem, Button } from "@uicapsule/components";
import Example from "./Example";

const ExampleDropdownMenu = () => (
  <Example
    title="Dropdown menu"
    text="List of contextual actions that users can trigger"
    href="/content/docs/components/dropdown-menu"
  >
    <div style={{ marginTop: -50 }}>
      <DropdownMenu active position="bottom" forcePosition>
        <DropdownMenu.Trigger>
          {(attributes) => (
            <Button attributes={attributes} size="small">
              Actions
            </Button>
          )}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <MenuItem endSlot="⌘X" roundedCorners size="small">
            Cut
          </MenuItem>
          <MenuItem endSlot="⌘C" roundedCorners size="small">
            Copy
          </MenuItem>
        </DropdownMenu.Content>
      </DropdownMenu>
    </div>
  </Example>
);

export default ExampleDropdownMenu;
