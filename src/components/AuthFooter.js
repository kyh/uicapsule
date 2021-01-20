import React from "react";
import styled from "styled-components";
import LinkMui from "@material-ui/core/Link";
import Link from "next/link";

const Conatainer = styled.div`
  font-size: 0.9rem;
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing(3)}px;
  > a {
    margin: ${({ theme }) => `0 ${theme.spacing(1)}px`};
  }
`;

function AuthFooter(props) {
  return (
    <Conatainer>
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
    </Conatainer>
  );
}

export default AuthFooter;
