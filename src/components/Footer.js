import React from "react";
import styled from "styled-components";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Link from "next/link";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import Logo from "components/Logo";

const FooterContainer = styled(Container)`
  color: ${({ theme }) => theme.palette.text.secondary};
  margin-top: auto;
`;

const FooterSection = styled(Grid)`
  margin-top: 1rem;
  padding: 1rem 0;
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
`;

const BottomFooterSection = styled(Grid)`
  margin-top: -2rem;
  padding-bottom: 0.5rem;
`;

const LogoContainer = styled.div`
  svg {
    height: 40px;
  }
`;

const CategoryHeader = styled(Typography)`
  color: ${({ theme }) => theme.palette.text.primary};
  font-size: 16px;
  font-weight: 500;
  margin-bottom: ${({ theme }) => theme.spacing(1)}px;
`;

const FooterLinksContainer = styled(Grid)`
  padding-right: ${({ theme }) => theme.spacing(3)}px;
  &:last-child {
    padding-right: 0;
  }
`;

const FooterLink = styled(Button)`
  display: block;
  color: ${({ theme }) => theme.palette.text.secondary};
  margin-left: ${({ theme }) => theme.spacing(-1)}px;
`;

const SubscribeForm = styled.form`
  display: flex;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 4px;
  .MuiInputBase-input {
    font-size: 0.8rem;
    padding: ${({ theme }) => `${theme.spacing(1)}px ${theme.spacing(1)}px`};
  }
  .MuiIconButton-root {
    border-radius: 0;
  }
`;

const SocialIcon = styled(Button)`
  box-shadow: ${({ theme }) => theme.shadows[2]};
  margin-left: ${({ theme }) => theme.spacing(2)}px;
  border-radius: 100%;
  padding: 0;
  min-width: 0;
  svg {
    fill: ${({ theme }) => theme.palette.grey[600]};
    transition: fill 0.1s ease;
  }
  &:hover {
    background-color: initial;
    box-shadow: ${({ theme }) => theme.shadows[2]};
    svg {
      fill: #000;
    }
  }
`;

function Footer() {
  return (
    <FooterContainer>
      <FooterSection container justify="space-between" spacing={4}>
        <Grid item xs={12} md={4} container direction="column">
          <LogoContainer>
            <Logo />
          </LogoContainer>
        </Grid>

        <Grid item xs={12} md={6} container>
          <FooterLinksContainer item xs={12} md={4}>
            <CategoryHeader variant="caption" component="h4">
              Product
            </CategoryHeader>
            <Link href="/#demo" passHref>
              <FooterLink component="a">Demo</FooterLink>
            </Link>
            <Link href="/#explore" passHref>
              <FooterLink component="a">Explore</FooterLink>
            </Link>
            <Link href="/pricing" passHref>
              <FooterLink component="a">Pricing</FooterLink>
            </Link>
          </FooterLinksContainer>
          <FooterLinksContainer item xs={12} md={4}>
            <CategoryHeader variant="caption" component="h4">
              UI Capsule
            </CategoryHeader>
            <Link href="/about" passHref>
              <FooterLink component="a">About</FooterLink>
            </Link>
            <Link href="/contact" passHref>
              <FooterLink component="a">Contact</FooterLink>
            </Link>
          </FooterLinksContainer>
          <FooterLinksContainer item xs={12} md={4}>
            <CategoryHeader variant="caption" component="h4">
              Subscribe
            </CategoryHeader>
            <Box mb={2}>Stay up to date with catered monthly inspirations</Box>
            <SubscribeForm>
              <InputBase
                type="email"
                placeholder="Your email"
                inputProps={{ "aria-label": "Your email" }}
              />
              <IconButton type="submit" aria-label="subscribe">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.707 5.293L7 .586 5.586 2l3 3H0v2h8.586l-3 3L7 11.414l4.707-4.707a1 1 0 000-1.414z"
                    fillRule="nonzero"
                  ></path>
                </svg>
              </IconButton>
            </SubscribeForm>
          </FooterLinksContainer>
        </Grid>
      </FooterSection>

      <BottomFooterSection container justify="space-between" spacing={4}>
        <Grid item xs={12} md={4} container alignItems="center">
          ©2021 Built by Kaiyu Hsu
        </Grid>
        <Grid
          item
          xs={12}
          md={4}
          container
          justify="flex-end"
          alignItems="center"
        >
          <SocialIcon
            component="a"
            target="_blank"
            href="https://twitter.com/uglyandcuddly"
          >
            <svg
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
            >
              <path d="M24 11.5c-.6.3-1.2.4-1.9.5.7-.4 1.2-1 1.4-1.8-.6.4-1.3.6-2.1.8-.6-.6-1.5-1-2.4-1-1.7 0-3.2 1.5-3.2 3.3 0 .3 0 .5.1.7-2.7-.1-5.2-1.4-6.8-3.4-.3.5-.4 1-.4 1.7 0 1.1.6 2.1 1.5 2.7-.5 0-1-.2-1.5-.4 0 1.6 1.1 2.9 2.6 3.2-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.3 1.6 2.3 3.1 2.3-1.1.9-2.5 1.4-4.1 1.4H8c1.5.9 3.2 1.5 5 1.5 6 0 9.3-5 9.3-9.3v-.4c.7-.5 1.3-1.1 1.7-1.8z"></path>
            </svg>
          </SocialIcon>
          <SocialIcon
            component="a"
            target="_blank"
            href="https://github.com/kyh"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M16 8.2c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4V22c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.7 3.9.3.4.6.9.6 1.6v2.2c0 .2.1.5.6.4 3.2-1.1 5.5-4.1 5.5-7.6-.1-4.4-3.7-8-8.1-8z"></path>
            </svg>
          </SocialIcon>
        </Grid>
      </BottomFooterSection>
    </FooterContainer>
  );
}

export default Footer;
