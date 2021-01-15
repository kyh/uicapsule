import React from "react";
import Section from "components/Section";
import Container from "@material-ui/core/Container";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import SectionHeader from "components/SectionHeader";
import Button from "@material-ui/core/Button";
import Link from "next/link";

function CtaSection(props) {
  return (
    <Section
      bgColor={props.bgColor}
      size={props.size}
      bgImage={props.bgImage}
      bgImageOpacity={props.bgImageOpacity}
    >
      <Container>
        <Box textAlign="center">
          <Grid
            container={true}
            alignItems="center"
            justify="center"
            spacing={5}
          >
            <Grid item={true} xs={12} md="auto">
              <SectionHeader
                title={props.title}
                subtitle={props.subtitle}
                size={4}
              />
            </Grid>
            <Grid item={true} xs={12} md="auto">
              <Link href={props.buttonPath} passHref={true}>
                <Button
                  variant="contained"
                  size="large"
                  color={props.buttonColor}
                >
                  {props.buttonText}
                </Button>
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Section>
  );
}

export default CtaSection;
