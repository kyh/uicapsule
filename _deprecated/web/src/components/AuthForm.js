import { useState } from "react";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Button from "components/Button";
import { useAuth } from "actions/auth";
import { useForm } from "util/form";

const AuthForm = (props) => {
  const auth = useAuth();
  const [pending, setPending] = useState(false);
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const submitHandlersByType = {
    signin: ({ email, pass }) => {
      return auth.signin(email, pass).then((user) => {
        // Call auth complete handler
        props.onAuth(user);
      });
    },
    signup: ({ email, pass }) => {
      return auth.signup(email, pass).then((user) => {
        // Call auth complete handler
        props.onAuth(user);
      });
    },
    forgotpass: ({ email }) => {
      return auth.sendPasswordResetEmail(email).then(() => {
        setPending(false);
        // Show success alert message
        props.onFormAlert({
          type: "success",
          message: "Password reset email sent",
        });
      });
    },
    changepass: ({ pass }) => {
      return auth.confirmPasswordReset(pass).then(() => {
        setPending(false);
        // Show success alert message
        props.onFormAlert({
          type: "success",
          message: "Your password has been changed",
        });
      });
    },
  };

  // Handle form submission
  const onSubmit = ({ email, pass }) => {
    // Show pending indicator
    setPending(true);

    // Call submit handler for auth type
    submitHandlersByType[props.type]({
      email,
      pass,
    }).catch((error) => {
      setPending(false);
      // Show error alert message
      props.onFormAlert({
        type: "error",
        message: error.message,
      });
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        {["signup", "signin", "forgotpass"].includes(props.type) && (
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              type="email"
              label="Email"
              placeholder="user@example.com"
              error={errors.email ? true : false}
              helperText={errors.email && errors.email.message}
              fullWidth
              {...register("email", {
                required: "Please enter your email",
              })}
            />
          </Grid>
        )}
        {["signup", "signin", "changepass"].includes(props.type) && (
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              type="password"
              label="Password"
              autoComplete="on"
              error={errors.pass ? true : false}
              helperText={errors.pass && errors.pass.message}
              fullWidth
              {...register("pass", {
                required: "Please enter a password",
              })}
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            type="submit"
            loading={pending}
            fullWidth
          >
            {props.typeValues.buttonText}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default AuthForm;
