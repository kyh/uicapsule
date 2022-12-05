import styled, { css } from "styled-components";
import Section from "components/Section";
import Container from "@material-ui/core/Container";
import SectionHeader from "components/SectionHeader";
import Auth from "components/Auth";
import AuthFooter from "components/AuthFooter";

const AuthFormContainer = styled.div`
  ${({ theme }) => css`
    @media (min-width: ${theme.breakpoints.values.sm}px) {
      border: 1px solid ${theme.palette.divider};
      border-radius: 8px;
      padding: ${theme.spacing(5)}px ${theme.spacing(6)}px;
      margin: ${theme.spacing(3)}px ${theme.spacing(8)}px 0;
    }
  `}
`;

const AuthSection = (props) => {
  // Values for each auth type
  const allTypeValues = {
    signin: {
      // Top title
      title: "Welcome back",
      // Submit button text
      buttonText: "Sign in",
      // Link text to other auth types
      linkTextSignup: "Create an account",
      linkTextForgotpass: "Forgot Password?",
    },
    signup: {
      title: "Sign up for free",
      buttonText: "Sign up",
      linkTextSignin: "Have an account already?",
    },
    forgotpass: {
      title: "Forgot your password?",
      buttonText: "Reset password",
    },
    changepass: {
      title: "Choose a new password",
      buttonText: "Change password",
    },
  };

  // Ensure we have a valid auth type
  const currentType = allTypeValues[props.type] ? props.type : "signup";

  // Get values for current auth type
  const typeValues = allTypeValues[currentType];

  return (
    <Section
      bgColor={props.bgColor}
      size={props.size}
      bgImage={props.bgImage}
      bgImageOpacity={props.bgImageOpacity}
    >
      <Container maxWidth="sm">
        <AuthFormContainer>
          <SectionHeader
            title={allTypeValues[currentType].title}
            size={3}
            textAlign="center"
          />
          <Auth
            type={currentType}
            typeValues={typeValues}
            providers={props.providers}
            afterAuthPath={props.afterAuthPath}
            key={currentType}
          />
        </AuthFormContainer>
        <AuthFooter type={currentType} typeValues={typeValues} />
      </Container>
    </Section>
  );
};

export default AuthSection;
