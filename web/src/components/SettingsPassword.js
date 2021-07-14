import { useState } from "react";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import { useAuth } from "actions/auth";
import { useForm } from "util/form";

const SettingsPassword = (props) => {
  const auth = useAuth();
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    // Show pending indicator
    setPending(true);

    auth
      .updatePassword(data.pass)
      .then(() => {
        // Clear form
        reset();
        // Set success status
        props.onStatus({
          type: "success",
          message: "Your password has been updated",
        });
      })
      .catch((error) => {
        if (error.code === "auth/requires-recent-login") {
          // Update state to show re-authentication modal
          props.onStatus({
            type: "requires-recent-login",
            // Resubmit after reauth flow
            callback: () => onSubmit({ pass: data.pass }),
          });
        } else {
          // Set error status
          props.onStatus({
            type: "error",
            message: error.message,
          });
        }
      })
      .finally(() => {
        // Hide pending indicator
        setPending(false);
      });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            variant="outlined"
            type="password"
            label="Password"
            placeholder="Password"
            error={errors.pass ? true : false}
            helperText={errors.pass && errors.pass.message}
            fullWidth
            {...register("pass", {
              required: "Please enter a password",
            })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            variant="outlined"
            type="password"
            label="Confirm New Password"
            placeholder="Confirm Password"
            error={errors.confirmPass ? true : false}
            helperText={errors.confirmPass && errors.confirmPass.message}
            fullWidth
            {...register("confirmPass", {
              required: "Please enter your new password again",
              validate: (value) => {
                if (value === getValues().pass) {
                  return true;
                } else {
                  return "This doesn't match your password";
                }
              },
            })}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            type="submit"
            disabled={pending}
            fullWidth
          >
            {!pending && <span>Save</span>}

            {pending && <CircularProgress size={28} />}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default SettingsPassword;
