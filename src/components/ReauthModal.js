import React, { useState } from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import Box from "@material-ui/core/Box";
import Alert from "@material-ui/lab/Alert";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import AuthSocial from "components/AuthSocial";
import { useAuth } from "util/auth.js";
import { useForm } from "react-hook-form";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  content: {
    paddingBottom: 24,
  },
}));

function ReauthModal(props) {
  const classes = useStyles();

  const auth = useAuth();
  const [pending, setPending] = useState(false);
  const [formAlert, setFormAlert] = useState(null);

  const { register, handleSubmit, errors } = useForm();

  const onSubmit = (data) => {
    const { pass } = data;
    setPending(true);

    auth
      .signin(auth.user.email, pass)
      .then(() => {
        // Call failed action that originally required reauth
        props.callback();
        // Let parent know we're done so they can hide modal
        props.onDone();
      })
      .catch((error) => {
        // Hide pending indicator
        setPending(false);
        // Show error alert message
        setFormAlert({
          type: "error",
          message: error.message,
        });
      });
  };

  return (
    <Dialog open={true} onClose={props.onDone}>
      <DialogTitle>Please sign in again to complete this action</DialogTitle>
      <DialogContent className={classes.content}>
        {formAlert && (
          <Box mb={4}>
            <Alert severity={formAlert.type}>{formAlert.message}</Alert>
          </Box>
        )}

        {props.provider === "password" && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container={true} spacing={2}>
              <Grid item={true} xs={12}>
                <TextField
                  variant="outlined"
                  type="password"
                  label="Password"
                  name="pass"
                  error={errors.pass ? true : false}
                  helperText={errors.pass && errors.pass.message}
                  fullWidth={true}
                  inputRef={register({
                    required: "Please enter your password",
                  })}
                />
              </Grid>
              <Grid item={true} xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  type="submit"
                  disabled={pending}
                  fullWidth={true}
                >
                  {!pending && <span>Submit</span>}

                  {pending && <CircularProgress size={28} />}
                </Button>
              </Grid>
            </Grid>
          </form>
        )}

        {props.provider !== "password" && (
          <AuthSocial
            type="signin"
            buttonText="Sign in"
            providers={[props.provider]}
            showLastUsed={false}
            onAuth={() => {
              props.callback();
              props.onDone();
            }}
            onError={(message) => {
              setFormAlert({
                type: "error",
                message: message,
              });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ReauthModal;
