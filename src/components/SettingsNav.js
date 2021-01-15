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
      centered={true}
    >
      <Link href="/settings/general" passHref={true}>
        <Tab label="General" value="general" component="a"></Tab>
      </Link>

      <Link href="/settings/password" passHref={true}>
        <Tab label="Password" value="password" component="a"></Tab>
      </Link>

      <Link href="/settings/billing" passHref={true}>
        <Tab label="Billing" value="billing" component="a"></Tab>
      </Link>
    </Tabs>
  );
}

export default SettingsNav;
