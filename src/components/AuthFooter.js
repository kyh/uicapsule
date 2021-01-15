import React from "react";
import LinkMui from "@material-ui/core/Link";
import Link from "next/link";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    fontSize: "0.9rem",
    textAlign: "center",
    marginTop: theme.spacing(3),
    "& > a": {
      margin: `0 ${theme.spacing(1)}px`,
    },
  },
}));

function AuthFooter(props) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      {props.type === "signup" && (
        <>
          Have an account already?
          <Link href="/auth/signin" passHref={true}>
            <LinkMui>{props.typeValues.linkTextSignin}</LinkMui>
          </Link>
        </>
      )}

      {props.type === "signin" && (
        <>
          <Link href="/auth/signup" passHref={true}>
            <LinkMui>{props.typeValues.linkTextSignup}</LinkMui>
          </Link>

          <Link href="/auth/forgotpass" passHref={true}>
            <LinkMui>{props.typeValues.linkTextForgotpass}</LinkMui>
          </Link>
        </>
      )}
    </div>
  );
}

export default AuthFooter;
