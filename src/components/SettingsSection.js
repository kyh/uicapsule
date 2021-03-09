import React, { useState } from "react";
import styled, { css } from "styled-components";
import { useRouter } from "next/router";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Box from "@material-ui/core/Box";
import Alert from "@material-ui/lab/Alert";
import ReauthModal from "components/ReauthModal";
import SettingsGeneral from "components/SettingsGeneral";
import SettingsPassword from "components/SettingsPassword";
import SettingsBilling from "components/SettingsBilling";
import { useAuth } from "util/auth.js";

const StyledTabs = styled(Tabs)`
  ${({ theme }) => css`
    border-bottom: 1px solid ${theme.palette.divider};
  `}
`;

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
    <Box mx={-3}>
      <StyledTabs
        value={props.section}
        onChange={handleChange}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label="General" value="general" disableRipple />
        <Tab label="Password" value="password" disableRipple />
        <Tab label="Billing" value="billing" disableRipple />
      </StyledTabs>
      <Box mt={5} px={5} maxWidth="550px">
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
      </Box>
      {reauthState.show && (
        <ReauthModal
          callback={reauthState.callback}
          provider={auth.user.providers[0]}
          onDone={() => setReauthState({ show: false })}
        />
      )}
    </Box>
  );
};

export default SettingsSection;
