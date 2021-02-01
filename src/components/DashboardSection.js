import React from "react";
import Section from "components/Section";
import Container from "@material-ui/core/Container";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import DashboardItems from "components/DashboardItems";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import LinkMui from "@material-ui/core/Link";
import Link from "next/link";
import { useAuth } from "util/auth.js";

function DashboardSection(props) {
  const auth = useAuth();
  return (
    <Section>
      <Container>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <DashboardItems />
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box>
                  <Typography variant="h6" paragraph>
                    <strong>What is this?</strong>
                  </Typography>
                  <Typography paragraph>
                    The component on your left is an example UI that shows you
                    how to fetch, display, and update a list of items that
                    belong to the current authenticated user. Try it now by
                    adding a couple items.
                  </Typography>
                  <Typography paragraph>
                    It also shows how you can limit features based on plan. If
                    you're subscribed to the "pro" or "business" plan then
                    you'll be able to use the star button to highlight items,
                    otherwise you'll be asked to upgrade your plan.
                  </Typography>
                  <Typography paragraph>
                    After exporting your code, you'll want to modify this
                    component to your needs. You may also find it easier to just
                    use this component as a reference as you build out your
                    custom UI.
                  </Typography>
                  <Box mt={3}>
                    <Typography variant="h6" paragraph>
                      <strong>Extra debug info</strong>
                    </Typography>
                    <div>
                      <div>
                        You are signed in as <strong>{auth.user.email}</strong>.
                      </div>
                      {auth.user.stripeSubscriptionId && (
                        <>
                          <div>
                            You are subscribed to the{" "}
                            <strong>{auth.user.planId} plan</strong>.
                          </div>
                          <div>
                            Your plan status is{" "}
                            <strong>
                              {auth.user.stripeSubscriptionStatus}
                            </strong>
                            .
                          </div>
                        </>
                      )}
                      <div>
                        You can change your account info{` `}
                        {auth.user.stripeSubscriptionId && <>and plan{` `}</>}
                        in{` `}
                        <Link href="/settings/general" passHref>
                          <LinkMui>
                            <strong>settings</strong>
                          </LinkMui>
                        </Link>
                        .
                      </div>
                      {!auth.user.stripeSubscriptionId && (
                        <div>
                          You can signup for a plan in{" "}
                          <Link href="/pricing" passHref>
                            <LinkMui>
                              <strong>pricing</strong>
                            </LinkMui>
                          </Link>
                          .
                        </div>
                      )}
                    </div>
                  </Box>
                </Box>
                <Box />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Section>
  );
}

export default DashboardSection;
