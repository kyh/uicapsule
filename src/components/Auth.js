import React, { useState } from "react";
import styled, { css } from "styled-components";
import Box from "@material-ui/core/Box";
import Alert from "@material-ui/lab/Alert";
import AuthForm from "components/AuthForm";
import AuthSocial from "components/AuthSocial";
import { useRouter } from "next/router";

const OrText = styled(Box)`
  ${({ theme }) => css`
    color: ${theme.palette.text.hint};
    position: relative;
    text-align: center;
    font-size: 12px;
    text-transform: lowercase;
    span {
      position: relative;
      background: ${theme.palette.background.paper};
      padding: 0 ${theme.spacing(1)}px;
    }
    &:before {
      content: "";
      position: absolute;
      height: 1px;
      left: 0;
      right: 0;
      background-color: ${theme.palette.divider};
      top: calc(50% - 1px);
    }
  `}
`;

function Auth(props) {
  const router = useRouter();
  const [formAlert, setFormAlert] = useState(null);

  const handleAuth = (user) => {
    router.push(props.afterAuthPath);
  };

  const handleFormAlert = (data) => {
    setFormAlert(data);
  };

  return (
    <>
      {formAlert && (
        <Box mb={3}>
          <Alert severity={formAlert.type}>{formAlert.message}</Alert>
        </Box>
      )}
      <AuthForm
        type={props.type}
        typeValues={props.typeValues}
        onAuth={handleAuth}
        onFormAlert={handleFormAlert}
      />
      {["signup", "signin"].includes(props.type) &&
        props.providers &&
        props.providers.length && (
          <>
            <OrText my={2}>
              <span>Or {props.typeValues.buttonText} with</span>
            </OrText>
            <AuthSocial
              type={props.type}
              buttonText={props.typeValues.buttonText}
              providers={props.providers}
              showLastUsed
              onAuth={handleAuth}
              onError={(message) => {
                handleFormAlert({
                  type: "error",
                  message: message,
                });
              }}
            />
          </>
        )}
    </>
  );
}

export default Auth;
