import React from "react";
import Section from "components/Section";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Link from "next/link";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import useDarkMode from "use-dark-mode";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  sticky: {
    marginTop: "auto",
  },
  brand: {
    display: "block",
    height: 32,
  },
  listItem: {
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 12,
    paddingRight: 12,
  },
  listItemTextHeader: {
    fontWeight: "bold",
  },
  socialIcon: {
    minWidth: 30,
  },
}));

function Footer(props) {
  const classes = useStyles();

  const darkMode = useDarkMode();
  // Use inverted logo if specified
  // and we are in dark mode
  const logo =
    props.logoInverted && darkMode.value ? props.logoInverted : props.logo;

  return (
    <Section
      bgColor={props.bgColor}
      size={props.size}
      bgImage={props.bgImage}
      bgImageOpacity={props.bgImageOpacity}
      className={props.sticky && classes.sticky}
    >
      <Container>
        <Grid container justify="space-between" spacing={4}>
          <Grid item xs={12} md={4}>
            <Link href="/">
              <a>
                <img src={logo} alt="Logo" className={classes.brand} />
              </a>
            </Link>

            {props.description && (
              <Box mt={3}>
                <Typography component="p">{props.description}</Typography>
              </Box>
            )}

            {props.copyright && (
              <Box mt={3}>
                <Typography component="p">{props.copyright}</Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <List disablePadding>
                  <ListItem className={classes.listItem}>
                    <Typography
                      variant="overline"
                      className={classes.listItemTextHeader}
                    >
                      Product
                    </Typography>
                  </ListItem>

                  <Link href="/pricing" passHref>
                    <ListItem button component="a" className={classes.listItem}>
                      <ListItemText>Pricing</ListItemText>
                    </ListItem>
                  </Link>

                  <Link href="/faq" passHref>
                    <ListItem button component="a" className={classes.listItem}>
                      <ListItemText>FAQ</ListItemText>
                    </ListItem>
                  </Link>
                </List>
              </Grid>
              <Grid item xs={12} md={4}>
                <List disablePadding>
                  <ListItem className={classes.listItem}>
                    <Typography
                      variant="overline"
                      className={classes.listItemTextHeader}
                    >
                      Company
                    </Typography>
                  </ListItem>

                  <Link href="/about" passHref>
                    <ListItem button component="a" className={classes.listItem}>
                      <ListItemText>About</ListItemText>
                    </ListItem>
                  </Link>

                  <Link href="/contact" passHref>
                    <ListItem button component="a" className={classes.listItem}>
                      <ListItemText>Contact</ListItemText>
                    </ListItem>
                  </Link>

                  <ListItem
                    button
                    component="a"
                    target="_blank"
                    href="https://medium.com"
                    className={classes.listItem}
                  >
                    <ListItemText>Blog</ListItemText>
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={4}>
                <List disablePadding>
                  <ListItem className={classes.listItem}>
                    <Typography
                      variant="overline"
                      className={classes.listItemTextHeader}
                    >
                      Social
                    </Typography>
                  </ListItem>
                  <ListItem
                    button
                    component="a"
                    target="_blank"
                    href="https://twitter.com/divjoy"
                    className={classes.listItem}
                  >
                    <ListItemIcon className={classes.socialIcon}>
                      <img
                        src="https://uploads.divjoy.com/icon-twitter.svg"
                        alt="Facebook"
                      />
                    </ListItemIcon>
                    <ListItemText>Twitter</ListItemText>
                  </ListItem>
                  <ListItem
                    button
                    component="a"
                    target="_blank"
                    href="https://facebook.com/DivjoyOfficial"
                    className={classes.listItem}
                  >
                    <ListItemIcon className={classes.socialIcon}>
                      <img
                        src="https://uploads.divjoy.com/icon-facebook.svg"
                        alt="Facebook"
                      />
                    </ListItemIcon>
                    <ListItemText>Facebook</ListItemText>
                  </ListItem>
                  <ListItem
                    button
                    component="a"
                    target="_blank"
                    href="https://instagram.com"
                    className={classes.listItem}
                  >
                    <ListItemIcon className={classes.socialIcon}>
                      <img
                        src="https://uploads.divjoy.com/icon-instagram.svg"
                        alt="Facebook"
                      />
                    </ListItemIcon>
                    <ListItemText>Instagram</ListItemText>
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Section>
  );
}

export default Footer;
