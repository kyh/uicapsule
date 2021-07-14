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
    avatar: "https://uicapsule.com/testimonials/senedara.jpeg",
    name: "Tina Senedara",
    testimonial:
      "UX is a push-and-pull of predictability and innovation. UI Capsule has been vital with helping me identify the predictable patterns, and has helped me create familiar experiences that require as little effort as possible for the end user",
    company: "SoFi / Lyft",
  },
  {
    avatar: "https://uicapsule.com/testimonials/lee.jpeg",
    name: "Andrew Lee",
    testimonial:
      "I've found that mock inspiration websites are more about visual beauty than functionality. UI Capsule reverses this idea with its focus on productionized examples. It has become my go-to resource for real-life product inspiration",
    company: "Brex / Facebook",
  },
  {
    avatar: "https://uicapsule.com/testimonials/wu.jpeg",
    name: "Kevin Wu",
    testimonial:
      "This tool has helped me categorize what has before seemed like ad hoc approaches to developing application UIs",
    company: "SIG / Opendoor",
  },
  {
    avatar: "https://uicapsule.com/testimonials/boggs.jpeg",
    name: "John Boggs",
    testimonial:
      "UI Capsule has been an incredible help with passing ideas along amongst my team",
    company: "Segment / Twitter",
  },
  {
    avatar: "https://uicapsule.com/testimonials/vu.jpeg",
    name: "Mandy Vu",
    testimonial: "Collecting pieces of the web has never been so easy",
    company: "Google / Ernst & Young",
  },
  // {
  //   avatar: "https://uicapsule.com/testimonials/singh.jpeg",
  //   name: "Avesh Singh",
  //   testimonial:
  //     "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolorum consequatur numquam aliquam tenetur ad amet inventore hic beatae.",
  //   company: "Databricks / Google",
  // },
  // {
  //   avatar: "https://uicapsule.com/testimonials/yue.jpeg",
  //   name: "Xuan Yue",
  //   testimonial:
  //     "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolorum consequatur numquam aliquam tenetur ad amet inventore hic beatae.",
  //   company: "Docusign",
  // },
  // {
  //   avatar: "https://uicapsule.com/testimonials/peck.jpeg",
  //   name: "Alison Peck",
  //   testimonial:
  //     "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolorum consequatur numquam aliquam tenetur ad amet inventore hic beatae.",
  //   company: "Airbnb",
  // },
];

const TestimonialsSection = (props) => (
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
      <Grid container justifyContent="center" spacing={4}>
        {items.map((item) => (
          <Grid item xs={12} sm={4} key={item.name}>
            <Card elevation={0}>
              <CardContent>
                <TestimonialText variant="body1" component="p">
                  {item.testimonial}
                </TestimonialText>
              </CardContent>
              <TestimonialHeader
                avatar={<TestimonialAvatar src={item.avatar} alt={item.name} />}
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

export default TestimonialsSection;
