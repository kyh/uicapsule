import React, { useState } from "react";
import styled, { css } from "styled-components";
import Image from "next/image";
import Section from "components/Section";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import ButtonBase from "@material-ui/core/ButtonBase";

const ImageContainer = styled.figure`
  margin: 0 auto;
  transform: translateY(-25px);
`;

const FeaturesContainer = styled(Container)`
  max-width: 1100px;
`;

const Item = styled(ButtonBase)`
  text-align: left;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  box-shadow: ${({ theme }) => theme.shadows[2]};
  padding: ${({ theme }) => theme.spacing(3)}px;
  margin-bottom: ${({ theme }) => theme.spacing(3)}px;
  transition: all 0.2s ease;
  ${({ active, theme }) =>
    active &&
    css`
      background-color: ${theme.palette.action.hover};
      box-shadow: none;
    `}
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  padding: ${({ theme }) => theme.spacing(1.2)}px;
  margin-left: ${({ theme }) => theme.spacing(2)}px;
  box-shadow: ${({ theme }) => theme.shadows[2]};
  background-color: ${({ theme }) => theme.palette.background.default};
  > svg {
    width: 16px;
  }
`;

const items = [
  {
    title: "Build a home for your inspirations",
    description:
      "All your saved elements in one simple dashboard accessible from anywhere",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
    image: "/features-collection.png",
  },
  {
    title: "Enjoy the finer UI details",
    description:
      "You can view and even interact with your saved elements. Yes, that's right, we save the entire code block which include interactive states",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
          clipRule="evenodd"
        />
      </svg>
    ),
    image: "/features-collection.png",
  },
  {
    title: "Explore with others",
    description:
      "Share your inspirations with your friends, your team, or even the UI Capsule community",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    image: "/features-collection.png",
  },
];

function FeaturesSection(props) {
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  return (
    <Section size={props.size}>
      <FeaturesContainer>
        <Grid container alignItems="center" spacing={8}>
          <Grid item xs={12} md={6}>
            {items.map((item, index) => (
              <Item
                key={item.title}
                active={activeItemIndex === index ? 1 : 0}
                onClick={() => setActiveItemIndex(index)}
                disableRipple
              >
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="subtitle1">
                    {item.description}
                  </Typography>
                </Box>
                <IconContainer>{item.icon}</IconContainer>
              </Item>
            ))}
          </Grid>
          <Grid container item direction="column" xs={12} md={6}>
            <ImageContainer>
              <Image
                src={items[activeItemIndex].image}
                alt=""
                height={600}
                width={500}
              />
            </ImageContainer>
          </Grid>
        </Grid>
      </FeaturesContainer>
    </Section>
  );
}

export default FeaturesSection;
