import React from "react";
import Section from "components/Section";
import Container from "@material-ui/core/Container";
import Box from "@material-ui/core/Box";

const HeroSection = (
  {
    bgColor,
    size,
    bgImage,
    bgImageOpacity,
    bgPosY,
    children,
    ...rest
  }
) => <Section
  bgColor={bgColor}
  size={size}
  bgImage={bgImage}
  bgImageOpacity={bgImageOpacity}
  bgPosY={bgPosY}
  {...rest}
>
  <Container>
    <Box textAlign="center">{children}</Box>
  </Container>
</Section>;

export default HeroSection;
