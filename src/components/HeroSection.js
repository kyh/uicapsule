import React from "react";
import Section from "components/Section";
import Container from "@material-ui/core/Container";
import Box from "@material-ui/core/Box";

function HeroSection(props) {
  return (
    <Section
      bgColor={props.bgColor}
      size={props.size}
      bgImage={props.bgImage}
      bgImageOpacity={props.bgImageOpacity}
      bgPosY={props.bgPosY}
    >
      <Container>
        <Box textAlign="center">{props.children}</Box>
      </Container>
    </Section>
  );
}

export default HeroSection;
