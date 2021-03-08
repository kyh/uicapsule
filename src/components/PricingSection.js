import React from "react";
import styled, { css } from "styled-components";
import Section from "components/Section";
import Container from "@material-ui/core/Container";
import SectionHeader from "components/SectionHeader";
import Grid from "@material-ui/core/Grid";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import CheckIcon from "@material-ui/icons/Check";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";
import Link from "next/link";
import { useAuth } from "util/auth.js";

const PriceCard = styled(Card)`
  ${({ theme, highlight }) => css`
    display: flex;
    flex-direction: column;
    height: 100%;
    box-shadow: none;
    ${highlight &&
    css`
      box-shadow: ${theme.shadows[4]};
    `}
  `}
`;

const PriceContent = styled(CardContent)`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: ${theme.spacing(3)}px;
  `}
`;

const Price = styled(Typography)`
  font-weight: 500;
`;

const PerkItem = styled(ListItem)`
  padding-top: 2px;
  padding-bottom: 2px;
`;

const PerkIcon = styled(ListItemIcon)`
  ${({ theme }) => css`
    min-width: 34px;
    color: ${theme.palette.success.main};
  `}
`;

const items = [
  {
    id: "free",
    name: "Free",
    description: "Your default plan",
    price: "0",
    perks: [
      "UI Capsule apps and extensions",
      "Unlimited component bookmarks",
      "Unlimited collections",
      "Unlimited devices",
      "Collection public sharing",
      "UI Playground",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For less than a coffee a month",
    price: "5",
    highlight: 1,
    perks: [
      "Everything on the Free plan, plus",
      "No ads",
      "Access to premium collections",
      "Sell your collections",
      "Data Export",
      "UI Playground code export",
      "Hire me button",
    ],
  },
];

const PricingSection = () => {
  const auth = useAuth();
  return (
    <Section size="large">
      <Container>
        <SectionHeader
          title="Pricing"
          subtitle="As simple as they come"
          size={2}
          textAlign="center"
        />
        <Grid container justify="center" spacing={4}>
          {items.map((item) => (
            <Grid item xs={12} md={4} key={item.id}>
              <PriceCard highlight={item.highlight}>
                <PriceContent>
                  <Box display="flex" alignItems="baseline" mb={1}>
                    <Box mr={1}>
                      <Typography variant="h5" component="h2">
                        {item.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      {item.description}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="baseline">
                    <Price variant="h1">${item.price}</Price>
                    <Typography variant="h5" color="textSecondary">
                      /mo
                    </Typography>
                  </Box>
                  {item.perks && (
                    <Box mt={1}>
                      <List aria-label="perks">
                        {item.perks.map((perk) => (
                          <PerkItem disableGutters key={perk}>
                            <PerkIcon>
                              <CheckIcon />
                            </PerkIcon>
                            <ListItemText>{perk}</ListItemText>
                          </PerkItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {item.id !== "free" && (
                    <Box mt="auto" pt={3}>
                      <Link
                        href={
                          auth.user
                            ? `/purchase/${item.id}`
                            : `/auth/signup?next=/purchase/${item.id}`
                        }
                        passHref
                      >
                        <Button
                          component="a"
                          variant="contained"
                          color="primary"
                          size="large"
                          fullWidth
                        >
                          Upgrade
                        </Button>
                      </Link>
                    </Box>
                  )}
                </PriceContent>
              </PriceCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Section>
  );
};

export default PricingSection;
