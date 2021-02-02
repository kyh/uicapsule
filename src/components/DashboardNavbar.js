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
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Box from "@material-ui/core/Box";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
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
  ${({ theme, primary }) => css`
    margin-right: ${({ theme }) => theme.spacing(1)}px;
    ${primary &&
    css`
      margin-right: 0;
      border-color: ${theme.palette.divider};
      border-radius: ${theme.spacing(3)}px;
    `}
  `}
`;

const LeftNav = styled.div`
  ${({ theme }) => css`
    margin-left: ${theme.spacing(2)}px;
    padding-left: ${theme.spacing(2)}px;
    border-left: ${`1px solid ${theme.palette.divider}`};
    flex-grow: 1;

    @media (max-width: ${theme.breakpoints.values.sm}px) {
      display: none;
    }
  `}
`;

const RightNav = styled(Hidden)`
  margin-left: auto;
`;

function DashboardNavbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuState, setMenuState] = useState({
    id: "",
    anchor: "",
    open: false,
  });

  const handleOpenMenu = (event, id) => {
    setMenuState({ anchor: event.currentTarget, id, open: true });
  };

  const handleCloseMenu = () => {
    setMenuState({ ...menuState, open: false });
  };

  return (
    <AppBar color="inherit" elevation={0}>
      <Container disableGutters>
        <Toolbar>
          <Link href="/dashboard" passHref>
            <LogoContainer>
              <Logo />
            </LogoContainer>
          </Link>
          <LeftNav>
            <Link href="/dashboard" passHref>
              <NavLink color="inherit" component="a">
                My Capsule
              </NavLink>
            </Link>
            <Link href="/dashboard/discover" passHref>
              <NavLink color="inherit" component="a">
                Discover
              </NavLink>
            </Link>
          </LeftNav>
          <Hidden xsDown implementation="css">
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
              open={menuState.open}
              anchorEl={menuState.anchor}
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
              elevation={4}
            >
              <div>
                <Link href="/dashboard" passHref>
                  <MenuItem component="a">Dashboard</MenuItem>
                </Link>
                <Link href="/dashboard/settings/general" passHref>
                  <MenuItem component="a">Settings</MenuItem>
                </Link>
                <Divider />
                <MenuItem onClick={() => auth.signout()}>Signout</MenuItem>
              </div>
            </Menu>
          </Hidden>
          <RightNav smUp implementation="css">
            <IconButton onClick={() => setDrawerOpen(true)} color="inherit">
              <MenuIcon />
            </IconButton>
            <NavDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
          </RightNav>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

function NavDrawer({ drawerOpen, setDrawerOpen }) {
  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      elevation={2}
    >
      <List style={{ width: 200 }} onClick={() => setDrawerOpen(false)}>
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
      </List>
    </Drawer>
  );
}

export default DashboardNavbar;
