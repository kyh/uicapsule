import React from "react";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Link from "next/link";

function SettingsNav(props) {
  return (
    <Tabs
      value={props.activeKey}
      indicatorColor="primary"
      textColor="primary"
      centered
    >
      <Link href="/settings/general" passHref>
        <Tab label="General" value="general" component="a"></Tab>
      </Link>

      <Link href="/settings/password" passHref>
        <Tab label="Password" value="password" component="a"></Tab>
      </Link>

      <Link href="/settings/billing" passHref>
        <Tab label="Billing" value="billing" component="a"></Tab>
      </Link>
    </Tabs>
  );
}

export default SettingsNav;
