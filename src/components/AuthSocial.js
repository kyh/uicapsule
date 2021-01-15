import React, { useEffect, useState } from "react";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import { useAuth } from "util/auth.js";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  button: {
    position: "relative",
    "&:not(:last-child)": {
      marginBottom: theme.spacing(1),
    },
  },
  icon: {
    position: "absolute",
    alignItems: "center",
    display: "inline-flex",
    justifyContent: "center",
    width: "1.5em",
    height: "1.5em",
    left: "0.5em",
    "& > img": {
      display: "block",
      width: "100%",
    },
  },
  lastUsedIndicator: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    fontSize: "13px",
    lineHeight: 1,
    textTransform: "initial",
    padding: "3px 5px",
    borderRadius: "7px",
    color: "white",
    backgroundColor: theme.palette.warning.main,
    opacity: 0.8,
  },
}));

function AuthSocial(props) {
  const classes = useStyles();

  const auth = useAuth();
  const [pending, setPending] = useState(null);
  const [lastUsed, setLastUsed] = useState(null);

  const providerDisplayNames = {
    google: "Google",
    facebook: "Facebook",
    twitter: "Twitter",
    github: "GitHub",
  };

  const onSigninWithProvider = (provider) => {
    setPending(provider);
    auth
      .signinWithProvider(provider)
      .then((user) => {
        localStorage.setItem("lastUsedAuthProvider", provider);
        props.onAuth(user);
      })
      .catch((error) => {
        setPending(null);
        props.onError(error.message);
      });
  };

  // Get value of last used auth provider
  useEffect(() => {
    if (props.showLastUsed) {
      const lastUsed = window.localStorage.getItem("lastUsedAuthProvider");
      if (lastUsed) {
        setLastUsed(lastUsed);
      }
    }
  }, [props.showLastUsed]);

  return (
    <div>
      {props.providers.map((provider) => (
        <Button
          className={classes.button}
          variant="outlined"
          size="large"
          type="submit"
          disabled={pending === provider}
          fullWidth={true}
          onClick={() => {
            onSigninWithProvider(provider);
          }}
          key={provider}
        >
          <div className={classes.icon}>
            <img
              src={`https://uploads.divjoy.com/icon-${provider}.svg`}
              alt={providerDisplayNames[provider]}
            />
          </div>

          {pending !== provider && (
            <span>
              {props.buttonText} with {providerDisplayNames[provider]}
            </span>
          )}

          {pending === provider && <CircularProgress size={28} />}

          {provider === lastUsed && (
            <div className={classes.lastUsedIndicator}>Last used</div>
          )}
        </Button>
      ))}
    </div>
  );
}

export default AuthSocial;
