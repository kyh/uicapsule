import React, { useState } from "react";
import styled, { css } from "styled-components";
import Link from "next/link";
import Box from "@material-ui/core/Box";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import LinkMui from "@material-ui/core/Link";
import InputBase from "@material-ui/core/InputBase";
import { SearchOutline } from "@graywolfai/react-heroicons";
import DashboardItems from "components/DashboardItems";
import EditItemModal from "components/EditItemModal";
import { useAuth } from "util/auth.js";

const SearchForm = styled.form`
  ${({ theme }) => css`
    position: absolute;
    top: 18px;
    z-index: ${theme.zIndex.drawer + 2};

    .MuiInputBase-input {
      font-size: 0.8rem;
      padding-left: ${theme.spacing(4)}px;
    }
    svg {
      position: absolute;
      width: 16px;
      top: 6px;
      left: 8px;
    }
  `}
`;

const DashboardSection = () => {
  const auth = useAuth();
  const [creatingItem, setCreatingItem] = useState(false);
  return (
    <>
      <SearchForm>
        <SearchOutline width="16" />
        <InputBase type="text" placeholder="Search" name="search" />
      </SearchForm>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        py={1}
      >
        <Box>
          <Button>#tag1</Button>
          <Button>#tag2</Button>
          <Button>#tag3</Button>
        </Box>
        <Button variant="outlined" onClick={() => setCreatingItem(true)}>
          Add Element
        </Button>
      </Box>
      <DashboardItems />
      {creatingItem && <EditItemModal onDone={() => setCreatingItem(false)} />}
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
