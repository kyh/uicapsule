import React from "react";
import { useRouter } from "next/router";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

function SettingsNav(props) {
  const router = useRouter();
  return (
    <Tabs
      value={props.activeKey}
      indicatorColor="primary"
      textColor="primary"
      centered
    >
      <Tab
        label="General"
        value="general"
        onClick={() => router.push("/settings/general")}
      />
      <Tab
        label="Password"
        value="password"
        onClick={() => router.push("/settings/password")}
      />
      <Tab
        label="Billing"
        value="billing"
        onClick={() => router.push("/settings/billing")}
      />
    </Tabs>
  );
}

export default SettingsNav;
