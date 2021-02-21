import React from "react";
import Box from "@material-ui/core/Box";
import DashboardItems from "components/DashboardItems";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import LinkMui from "@material-ui/core/Link";
import Link from "next/link";
import { useAuth } from "util/auth.js";

const DashboardSection = () => {
  const auth = useAuth();
  return (
    <>
      <DashboardItems />
      <Card>
        <CardContent>
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
                  <strong>{auth.user.stripeSubscriptionStatus}</strong>.
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
        </CardContent>
      </Card>
    </>
  );
};

export default DashboardSection;
