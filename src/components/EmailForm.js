import React, { useState } from "react";
import styled, { css } from "styled-components";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import Snackbar from "@material-ui/core/Snackbar";
import { ArrowRightOutline } from "@graywolfai/react-heroicons";
import Spinner from "components/Spinner";
import contact from "util/contact";
import { useForm } from "util/form";

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

const EmailForm = ({ message = "", onComplete = () => {}, ...rest }) => {
  const [pending, setPending] = useState(false);
  const [alert, setAlert] = useState({
    type: "",
    message: "",
    open: false,
  });
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm();

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
          error={errors.email ? true : false}
          placeholder="Your email"
          fullWidth
          {...register("email", {
            required: "Please enter your email",
          })}
          {...rest}
        />
        <IconButton type="submit" aria-label="subscribe" disabled={pending}>
          {pending ? <Spinner /> : <ArrowRightOutline width="16" />}
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
