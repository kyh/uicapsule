import React, { useState } from "react";
import AppBar from "@material-ui/core/AppBar";
import Container from "@material-ui/core/Container";
import Toolbar from "@material-ui/core/Toolbar";
import Link from "next/link";
import Hidden from "@material-ui/core/Hidden";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import Button from "@material-ui/core/Button";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import { makeStyles } from "@material-ui/core/styles";
import useScrollTrigger from "@material-ui/core/useScrollTrigger";
import { useAuth } from "util/auth.js";
import useDarkMode from "use-dark-mode";
import Logo from "components/Logo";

const useStyles = makeStyles((theme) => ({
  logoContainer: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    height: 40,
  },
  link: {
    marginRight: theme.spacing(1),
  },
  drawerList: {
    width: 250,
  },
  leftNav: {
    backgroundColor: theme.palette.background.default,
    boxShadow: `-${theme.spacing(2)}px 0 0 0 ${
      theme.palette.background.default
    }`,
    marginLeft: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    borderLeft: `1px solid ${theme.palette.divider}`,
    transition: `transform ${theme.transitions.duration.shortest}ms ${theme.transitions.easing.easeInOut}`,
    flexGrow: 1,
  },
  leftNavActive: {
    transform: "translateX(-52px)",
  },
  navbarActive: {
    boxShadow: theme.shadows[4],
  },
  signup: {
    borderColor: theme.palette.divider,
    borderRadius: theme.spacing(3),
  },
}));

function Navbar() {
  const classes = useStyles();

  const auth = useAuth();
  const darkMode = useDarkMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuState, setMenuState] = useState(null);
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  const handleOpenMenu = (event, id) => {
    // Store clicked element (to anchor the menu to)
    // and the menu id so we can tell which menu is open.
    setMenuState({ anchor: event.currentTarget, id });
  };

  const handleCloseMenu = () => {
    setMenuState(null);
  };

  return (
    <AppBar
      color="inherit"
      className={trigger ? classes.navbarActive : ""}
      elevation={0}
    >
      <Container disableGutters>
        <Toolbar>
          <Link href="/">
            <a className={classes.logoContainer}>
              <Logo className={classes.logo} />
            </a>
          </Link>
          <Hidden
            xsDown
            implementation="css"
            className={`${classes.leftNav} ${
              trigger ? classes.leftNavActive : ""
            }`}
          >
            <Link href="/features" passHref>
              <Button className={classes.link} color="inherit" component="a">
                Features
              </Button>
            </Link>
            <Link href="/pricing" passHref>
              <Button className={classes.link} color="inherit" component="a">
                Pricing
              </Button>
            </Link>
            <Link href="/about" passHref>
              <Button className={classes.link} color="inherit" component="a">
                About
              </Button>
            </Link>
          </Hidden>
          <Hidden xsDown implementation="css">
            {!auth.user && (
              <>
                <Link href="/auth/signin" passHref>
                  <Button
                    className={classes.link}
                    color="inherit"
                    component="a"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/signup" passHref>
                  <Button
                    className={classes.signup}
                    variant="outlined"
                    color="inherit"
                    component="a"
                  >
                    Sign up
                  </Button>
                </Link>
              </>
            )}
            {auth.user && (
              <>
                <Button
                  color="inherit"
                  aria-label="Account"
                  aria-controls="account-menu"
                  aria-haspopup="true"
                  onClick={(event) => handleOpenMenu(event, "account-menu")}
                >
                  Account
                  <ExpandMoreIcon className={classes.buttonIcon} />
                </Button>
                <Menu
                  id="account-menu"
                  open={menuState && menuState.id === "account-menu"}
                  anchorEl={menuState && menuState.anchor}
                  getContentAnchorEl={undefined}
                  onClick={handleCloseMenu}
                  onClose={handleCloseMenu}
                  keepMounted
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "center",
                  }}
                >
                  <Link href="/dashboard" passHref>
                    <MenuItem component="a">Dashboard</MenuItem>
                  </Link>
                  <Link href="/settings/general" passHref>
                    <MenuItem component="a">Settings</MenuItem>
                  </Link>
                  <Divider />
                  <MenuItem onClick={() => auth.signout()}>Signout</MenuItem>
                </Menu>
              </>
            )}
            {/* <IconButton
                color="inherit"
                onClick={darkMode.toggle}
                style={{ opacity: 0.6 }}
              >
                {darkMode.value && <NightsStayIcon />}
                {!darkMode.value && <WbSunnyIcon />}
              </IconButton> */}
          </Hidden>
          <Hidden smUp implementation="css">
            <IconButton onClick={() => setDrawerOpen(true)} color="inherit">
              <MenuIcon />
            </IconButton>
            <NavDrawer
              drawerOpen={drawerOpen}
              setDrawerOpen={setDrawerOpen}
              classes={classes}
              auth={auth}
              darkMode={darkMode}
            />
          </Hidden>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

function NavDrawer({ drawerOpen, setDrawerOpen, classes, auth, darkMode }) {
  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
    >
      <List className={classes.drawerList} onClick={() => setDrawerOpen(false)}>
        {!auth.user && (
          <Link href="/auth/signin" passHref>
            <ListItem button component="a">
              <ListItemText>Sign in</ListItemText>
            </ListItem>
          </Link>
        )}
        {auth.user && (
          <>
            <Link href="/dashboard" passHref>
              <ListItem button component="a">
                <ListItemText>Dashboard</ListItemText>
              </ListItem>
            </Link>
            <Link href="/settings/general" passHref>
              <ListItem button component="a">
                <ListItemText>Settings</ListItemText>
              </ListItem>
            </Link>
            <Divider />
            <ListItem button onClick={() => auth.signout()}>
              <ListItemText>Sign out</ListItemText>
            </ListItem>
          </>
        )}
        {/* <ListItem>
          <IconButton
            color="inherit"
            onClick={darkMode.toggle}
            style={{ opacity: 0.6 }}
          >
            {darkMode.value && <NightsStayIcon />}
            {!darkMode.value && <WbSunnyIcon />}
          </IconButton>
        </ListItem> */}
      </List>
    </Drawer>
  );
}

export default Navbar;
