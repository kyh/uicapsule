import React, { useState } from "react";
import styled, { css, keyframes } from "styled-components";
import Image from "next/image";
import Section from "components/Section";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import ButtonBase from "@material-ui/core/ButtonBase";
import Button from "@material-ui/core/Button";

const FeaturesContainer = styled(Container)`
  ${({ theme }) => css`
    display: flex;
    max-width: 1100px;
    @media (max-width: ${theme.breakpoints.values.sm}px) {
      flex-direction: column;
    }
  `}
`;

const ItemsContainer = styled.div`
  ${({ theme }) => css`
    width: 100%;
    padding: ${theme.spacing(4)}px;
    @media (max-width: ${theme.breakpoints.values.sm}px) {
      padding: 0 ${theme.spacing(1)}px;
    }
  `}
`;

const Item = styled(ButtonBase)`
  ${({ active, theme }) => css`
    text-align: left;
    border-radius: 8px;
    border: 1px solid ${theme.palette.divider};
    box-shadow: ${theme.shadows[2]};
    padding: ${theme.spacing(3)}px;
    margin-bottom: ${theme.spacing(3)}px;
    transition: all 0.2s ease;
    ${active &&
    css`
      background-color: ${theme.palette.action.hover};
      box-shadow: none;
    `}
  `}
`;

const IconContainer = styled.div`
  ${({ theme }) => css`
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    padding: ${theme.spacing(1.2)}px;
    margin-left: ${theme.spacing(2)}px;
    box-shadow: ${theme.shadows[2]};
    background-color: ${theme.palette.background.default};
    > svg {
      width: 16px;
    }
  `}
`;

const animateFadeIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`;

const ImageContainer = styled.div`
  ${({ theme }) => css`
    position: relative;
    transform: translateY(-25px);
    height: 600px;
    max-width: 500px;
    width: 100%;
    overflow: hidden;
    padding: ${theme.spacing(4)}px;
    img {
      animation: ${animateFadeIn} 0.5s ease;
    }
    @media (max-width: ${theme.breakpoints.values.sm}px) {
      padding: 0;
      transform: translateY(20px);
    }
  `}
`;

const animateUp = keyframes`
	from { transform: translateY(0); }
	to { transform: translateY(-1175px); }
`;

const animateUp2 = keyframes`
	from { transform: translateY(1175px); }
	to { transform: translateY(0); }
`;

const AnimatedImageContainer = styled.div`
  ${({ theme }) => css`
    &:before,
    &:after {
      content: "";
      position: absolute;
      display: block;
      left: 0;
      right: 0;
      height: 60px;
      z-index: 1;
    }

    &:before {
      top: 0;
      background: linear-gradient(
        to bottom,
        ${theme.palette.background.default} 0%,
        transparent 100%
      );
    }

    &:after {
      bottom: 0;
      background: linear-gradient(
        to top,
        ${theme.palette.background.default} 0%,
        transparent 100%
      );
    }

    > div {
      position: absolute !important;
    }
    > div:nth-child(1) {
      animation: ${animateUp} 80s linear infinite;
    }
    > div:nth-child(2) {
      animation: ${animateUp2} 80s linear infinite;
    }
  `}
`;

const IFrameContainer = styled.div`
  ${({ theme }) => css`
    position: relative;
    width: 100%;
    height: 100%;
    padding: ${theme.spacing(4)}px;
    iframe {
      width: 100%;
      height: 100%;
      border-radius: 10px;
      box-shadow: ${theme.shadows[3]};
      animation: ${animateFadeIn} 0.5s ease;
    }
    button {
      position: absolute;
      left: 50%;
      bottom: 40px;
      transform: translateX(-50%);
    }
  `}
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
    render: () => {
      return (
        <AnimatedImageContainer>
          <Image
            src="/ui-list.webp"
            alt="dashboard"
            width={500}
            height={1175}
          />
          <Image
            src="/ui-list.webp"
            alt="dashboard"
            width={500}
            height={1175}
          />
        </AnimatedImageContainer>
      );
    },
  },
  {
    title: "Enjoy the little big details",
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
    render: ({ html, nextExample }) => {
      return (
        <IFrameContainer>
          <iframe srcDoc={html} frameBorder="0" />
          <Button type="button" onClick={nextExample}>
            Next Example
          </Button>
        </IFrameContainer>
      );
    },
  },
  {
    title: "Explore with others",
    description:
      "Share your inspirations with your peers, your team, or the UI Capsule community",
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
    render: () => {
      return (
        <Image
          src="/dashboard-discover.webp"
          alt="dashboard"
          width={500}
          height={600}
        />
      );
    },
  },
];

const FeaturesSection = (props) => (
  <Section size="small">
    <FeaturesContainer>
      <ItemsContainer>
        {items.map((item, index) => (
          <Item
            key={item.title}
            active={props.activeFeatureIndex === index ? 1 : 0}
            onClick={() => props.setActiveFeatureIndex(index)}
            disableRipple
          >
            <Box>
              <Typography variant="h4" gutterBottom>
                {item.title}
              </Typography>
              <Typography variant="subtitle1">{item.description}</Typography>
            </Box>
            <IconContainer>{item.icon}</IconContainer>
          </Item>
        ))}
      </ItemsContainer>
      <ImageContainer>
        {items[props.activeFeatureIndex].render(props)}
      </ImageContainer>
    </FeaturesContainer>
  </Section>
);

export default FeaturesSection;
