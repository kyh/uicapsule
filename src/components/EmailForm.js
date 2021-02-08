import React, { useState } from "react";
import styled, { css } from "styled-components";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import Snackbar from "@material-ui/core/Snackbar";
import CircularProgress from "@material-ui/core/CircularProgress";
import contact from "util/contact";
import { useForm } from "react-hook-form";

const SubscribeForm = styled.form`
  ${({ theme }) => css`
    display: flex;
    border: 1px solid ${theme.palette.divider};
    border-radius: 4px;
    .MuiInputBase-input {
      font-size: 0.8rem;
      padding: ${theme.spacing(1)}px ${theme.spacing(1)}px;
    }
    .MuiIconButton-root {
      border-radius: 0;
    }
  `}
`;

const Spinner = styled(CircularProgress)`
  animation-duration: 750ms;
`;

const EmailForm = ({ message = "", onComplete = () => {}, ...rest }) => {
  const [pending, setPending] = useState(false);
  const [alert, setAlert] = useState({
    type: "",
    message: "",
    open: false,
  });
  const { handleSubmit, register, errors, reset } = useForm();

  const onSubmit = (data) => {
    // Show pending indicator
    setPending(true);

    contact
      .submit({ email: data.email, message })
      .then(() => {
        // Clear form
        reset();
        // Show success alert message
        setAlert({
          type: "success",
          message: "Thanks for signing up!",
          open: true,
        });
      })
      .catch((error) => {
        // Show error alert message
        setAlert({
          type: "error",
          message: error.message,
          open: true,
        });
      })
      .finally(() => {
        // Hide pending indicator
        setPending(false);
        onComplete();
      });
  };

  return (
    <>
      <SubscribeForm onSubmit={handleSubmit(onSubmit)}>
        <InputBase
          type="email"
          label="Email"
          name="email"
          error={errors.email ? true : false}
          inputRef={register({
            required: "Please enter your email",
          })}
          placeholder="Your email"
          fullWidth
          {...rest}
        />
        <IconButton type="submit" aria-label="subscribe" disabled={pending}>
          {pending ? (
            <Spinner
              variant="indeterminate"
              disableShrink
              size={12}
              thickness={4}
            />
          ) : (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.707 5.293L7 .586 5.586 2l3 3H0v2h8.586l-3 3L7 11.414l4.707-4.707a1 1 0 000-1.414z"
                fillRule="nonzero"
              ></path>
            </svg>
          )}
        </IconButton>
      </SubscribeForm>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={alert.open}
        onClose={() => setAlert({ ...alert, open: false })}
        message={alert.message}
      />
    </>
  );
};

export default EmailForm;
