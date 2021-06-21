import React, { useState } from "react";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import SiteLayout from "components/SiteLayout";
import AuthSection from "components/AuthSection";
import HeroSection from "components/HeroSection";
import SectionHeader from "components/SectionHeader";
import EmailForm from "components/EmailForm";
import { useRouter } from "next/router";

const BetaPage = () => {
  const [complete, setComplete] = useState(false);
  return (
    <>
      <HeroSection
        bgColor="default"
        size="large"
        pt={{ xs: 15, sm: 20 }}
        pb={{ xs: 6, sm: 8 }}
      >
        <SectionHeader
          title="Welcome!"
          subtitle={
            <>
              <div>
                We're currently still in closed beta as we crank out new
                features.
              </div>
              <div>Sign up below for early access</div>
            </>
          }
          size={2}
        />
        <Container maxWidth="sm">
          {complete ? (
            <Typography variant="h4">
              Thanks for your interest! We'll be distributing new logins soon
            </Typography>
          ) : (
            <EmailForm
              message="BETA_SIGNUP"
              onComplete={() => setComplete(true)}
            />
          )}
        </Container>
      </HeroSection>
    </>
  );
};

const AuthPage = () => {
  const router = useRouter();
  if (router.query.type === "signup" && router.query.key !== "beta") {
    return <BetaPage />;
  }

  return (
    <AuthSection
      bgColor="default"
      size="medium"
      type={router.query.type}
      providers={["google"]}
      afterAuthPath={router.query.next || "/ui"}
    />
  );
};

AuthPage.Layout = SiteLayout;

// Tell Next.js to export static files for each auth page
// See https://nextjs.org/docs/basic-features/data-fetching#getstaticpaths-static-generation
export const getStaticPaths = () => ({
  paths: [
    { params: { type: "signin" } },
    { params: { type: "signup" } },
    { params: { type: "forgotpass" } },
    { params: { type: "changepass" } },
  ],
  fallback: true,
});

export const getStaticProps = ({ params }) => ({
  props: {},
});

export default AuthPage;
