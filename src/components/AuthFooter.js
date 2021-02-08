import React from "react";
import styled, { css } from "styled-components";
import LinkMui from "@material-ui/core/Link";
import Link from "next/link";

const Conatainer = styled.div`
  ${({ theme }) => css`
    display: flex;
    font-size: 0.9rem;
    margin: ${theme.spacing(1.5)}px ${theme.spacing(8)}px 0;
    justify-content: space-between;
  `}
`;

const AuthFooter = props => <Conatainer>
  {props.type === "signup" && (
    <>
      <Link href="/auth/signin" passHref>
        <LinkMui color="inherit">{props.typeValues.linkTextSignin}</LinkMui>
      </Link>
    </>
  )}

  {props.type === "signin" && (
    <>
      <Link href="/auth/signup" passHref>
        <LinkMui color="inherit">{props.typeValues.linkTextSignup}</LinkMui>
      </Link>
      <Link href="/auth/forgotpass" passHref>
        <LinkMui color="inherit">
          {props.typeValues.linkTextForgotpass}
        </LinkMui>
      </Link>
    </>
  )}
</Conatainer>;

export default AuthFooter;
