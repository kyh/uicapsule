import React, { useState } from "react";
import styled, { css } from "styled-components";
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
import useScrollTrigger from "@material-ui/core/useScrollTrigger";
import { useAuth } from "util/auth.js";
import useDarkMode from "use-dark-mode";
import Logo from "components/Logo";

const LogoContainer = styled.a`
  display: flex;
  align-items: center;
  svg {
    height: 40px;
  }
  &:focus {
    outline-offset: -3px;
  }
`;

const NavLink = styled(Button)`
  margin-right: ${({ theme }) => theme.spacing(1)}px;
  ${({ primary, theme }) =>
    primary &&
    css`
      margin-right: 0;
      border-color: ${theme.palette.divider};
      border-radius: ${theme.spacing(3)}px;
    `}
`;

const DrawerList = styled(List)`
  width: 250px;
`;

const LeftNav = styled.div`
  background-color: ${({ theme }) => theme.palette.background.default};
  box-shadow: ${({ theme }) =>
    `-${theme.spacing(2)}px 0 0 0 ${theme.palette.background.default}`};
  margin-left: ${({ theme }) => theme.spacing(2)}px;
  padding-left: ${({ theme }) => theme.spacing(2)}px;
  border-left: ${({ theme }) => `1px solid ${theme.palette.divider}`};
  transition: ${({ theme }) =>
    `transform ${theme.transitions.duration.shortest}ms ${theme.transitions.easing.easeInOut}`};
  flex-grow: 1;
  ${({ active }) =>
    active &&
    css`
      transform: translateX(-52px);
    `}

  @media (max-width: ${({ theme }) => theme.breakpoints.values.sm}px) {
    display: none;
  }
`;

const NavbarContainer = styled(AppBar)`
  ${({ active, theme }) =>
    active &&
    css`
      box-shadow: ${theme.shadows[4]};
    `}
`;

function Navbar() {
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
    <NavbarContainer color="inherit" elevation={0} active={trigger ? 1 : 0}>
      <Container disableGutters>
        <Toolbar>
          <Link href="/" passHref>
            <LogoContainer>
              <Logo />
            </LogoContainer>
          </Link>
          <LeftNav xsDown implementation="css" active={trigger ? 1 : 0}>
            <Link href="/#demo" passHref>
              <NavLink color="inherit" component="a">
                Demo
              </NavLink>
            </Link>
            <Link href="/#explore" passHref>
              <NavLink color="inherit" component="a">
                Explore
              </NavLink>
            </Link>
            <Link href="/#features" passHref>
              <NavLink color="inherit" component="a">
                Features
              </NavLink>
            </Link>
          </LeftNav>
          <Hidden xsDown implementation="css">
            {!auth.user && (
              <>
                <Link href="/auth/signin" passHref>
                  <NavLink color="inherit" component="a">
                    Sign in
                  </NavLink>
                </Link>
                <Link href="/auth/signup" passHref>
                  <NavLink
                    variant="outlined"
                    color="inherit"
                    component="a"
                    primary={1}
                  >
                    Sign up
                  </NavLink>
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
                  <ExpandMoreIcon />
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
              auth={auth}
              darkMode={darkMode}
            />
          </Hidden>
        </Toolbar>
      </Container>
    </NavbarContainer>
  );
}

function NavDrawer({ drawerOpen, setDrawerOpen, auth, darkMode }) {
  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
    >
      <DrawerList onClick={() => setDrawerOpen(false)}>
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
      </DrawerList>
    </Drawer>
  );
}

export default Navbar;
