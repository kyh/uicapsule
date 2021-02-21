import React, { useState } from "react";
import { useRouter } from "next/router";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Box from "@material-ui/core/Box";
import Container from "@material-ui/core/Container";
import Alert from "@material-ui/lab/Alert";
import Section from "components/Section";
import ReauthModal from "components/ReauthModal";
import SettingsGeneral from "components/SettingsGeneral";
import SettingsPassword from "components/SettingsPassword";
import SettingsBilling from "components/SettingsBilling";
import { useAuth } from "util/auth.js";

const SettingsSection = (props) => {
  const auth = useAuth();
  const router = useRouter();
  const [formAlert, setFormAlert] = useState(null);

  const handleChange = (event, value) => {
    router.push(`/settings/${value}`, undefined, { shallow: true });
  };

  // State to control whether we show a re-authentication flow
  // Required by some security sensitive actions, such as changing password.
  const [reauthState, setReauthState] = useState({
    show: false,
  });

  // Handle status of type "success", "error", or "requires-recent-login"
  // We don't treat "requires-recent-login" as an error as we handle it
  // gracefully by taking the user through a re-authentication flow.
  const handleStatus = ({ type, message, callback }) => {
    if (type === "requires-recent-login") {
      // First clear any existing message
      setFormAlert(null);
      // Then update state to show re-authentication modal
      setReauthState({
        show: true,
        // Failed action to try again after reauth
        callback: callback,
      });
    } else {
      // Display message to user (type is success or error)
      setFormAlert({
        type: type,
        message: message,
      });
    }
  };

  return (
    <Section>
      <Tabs
        value={props.section}
        onChange={handleChange}
        indicatorColor="primary"
        textColor="primary"
        centered
      >
        <Tab label="General" value="general" />
        <Tab label="Password" value="password" />
        <Tab label="Billing" value="billing" />
      </Tabs>
      <Box mt={5}>
        <Container maxWidth="xs">
          {formAlert && (
            <Box mb={4}>
              <Alert severity={formAlert.type}>{formAlert.message}</Alert>
            </Box>
          )}
          {props.section === "general" && (
            <SettingsGeneral onStatus={handleStatus} />
          )}
          {props.section === "password" && (
            <SettingsPassword onStatus={handleStatus} />
          )}
          {props.section === "billing" && (
            <SettingsBilling onStatus={handleStatus} />
          )}
        </Container>
      </Box>
      {reauthState.show && (
        <ReauthModal
          callback={reauthState.callback}
          provider={auth.user.providers[0]}
          onDone={() => setReauthState({ show: false })}
        />
      )}
    </Section>
  );
};

export default SettingsSection;
