import React from "react";
import styled, { css } from "styled-components";
import Section from "components/Section";
import Container from "@material-ui/core/Container";
import SectionHeader from "components/SectionHeader";
import Grid from "@material-ui/core/Grid";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import CardHeader from "@material-ui/core/CardHeader";
import Avatar from "@material-ui/core/Avatar";

const TestimonialAvatar = styled(Avatar)`
  ${({ theme }) => css`
    width: ${theme.spacing(7)}px;
    height: ${theme.spacing(7)}px;
  `}
`;

const TestimonialHeader = styled(CardHeader)`
  padding-top: 0;
`;

const TestimonialText = styled(Typography)`
  position: relative;
  &::before {
    content: "";
    display: block;
    position: absolute;
    left: -15px;
    top: -6px;
    background-image: url(/quote.svg);
    background-repeat: no-repeat;
    width: 24px;
    height: 18px;
    opacity: 0.25;
  }
`;

const items = [
  {
    avatar: "https://uploads.divjoy.com/pravatar-150x-5.jpeg",
    name: "Sarah Kline",
    testimonial:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.",
    company: "Company",
  },
  {
    avatar: "https://uploads.divjoy.com/pravatar-150x-48.jpeg",
    name: "Shawna Murray",
    testimonial:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolorum consequatur numquam aliquam tenetur ad amet inventore hic beatae, quas accusantium perferendis sapiente explicabo, corporis totam!",
    company: "Company",
  },
  {
    avatar: "https://uploads.divjoy.com/pravatar-150x-12.jpeg",
    name: "Blake Elder",
    testimonial:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolorum consequatur numquam aliquam tenetur ad amet inventore hic beatae.",
    company: "Company",
  },
];

function TestimonialsSection(props) {
  return (
    <Section
      bgColor={props.bgColor}
      size={props.size}
      bgImage={props.bgImage}
      bgImageOpacity={props.bgImageOpacity}
    >
      <Container>
        <SectionHeader
          title={props.title}
          subtitle={props.subtitle}
          size={3}
          textAlign="center"
        />
        <Grid container justify="center" spacing={4}>
          {items.map((item) => (
            <Grid item xs={12} sm={4} key={item.name}>
              <Card elevation={0}>
                <CardContent>
                  <TestimonialText variant="body1" component="p">
                    {item.testimonial}
                  </TestimonialText>
                </CardContent>
                <TestimonialHeader
                  avatar={
                    <TestimonialAvatar src={item.avatar} alt={item.name} />
                  }
                  title={item.name}
                  subheader={item.company}
                />
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Section>
  );
}

export default TestimonialsSection;
