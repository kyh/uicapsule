import React from "react";
import styled, { css } from "styled-components";
import Section from "components/Section";
import Container from "@material-ui/core/Container";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Link from "next/link";

const CtaContainer = styled(Container)`
  ${({ theme }) => css`
    background-color: ${theme.palette.primary.main};
    padding: ${theme.spacing(8)}px;
    border-radius: 8px;
    box-shadow: ${theme.shadows[6]};
    max-width: 900px;
    margin: 0 auto;

    @media (max-width: 900px) {
      border-radius: 0;
    }

    .MuiButton-contained {
      background-color: #fff;
      color: ${theme.palette.primary.main};
    }
  `}
`;

const Title = styled(Typography)`
  font-size: 2rem;
  font-weight: 700;
`;

const Subtitle = styled(Typography)`
  font-size: 1.1rem;
  color: #fff;
  opacity: 0.8;
`;

function CtaSection(props) {
  return (
    <Section size={props.size}>
      <CtaContainer>
        <Grid container alignItems="center" justify="space-between" spacing={4}>
          <Grid item xs={12} md="auto">
            <Box component="header" textAlign="left" color="white">
              <Title variant="h3" gutterBottom>
                {props.title}
              </Title>
              <Subtitle variant="subtitle1">{props.subtitle}</Subtitle>
            </Box>
          </Grid>
          <Grid item xs={12} md="auto">
            <Link href={props.buttonPath} passHref>
              <Button
                component="a"
                variant="contained"
                size="large"
                color={props.buttonColor}
              >
                {props.buttonText}
              </Button>
            </Link>
          </Grid>
        </Grid>
      </CtaContainer>
    </Section>
  );
}

export default CtaSection;
