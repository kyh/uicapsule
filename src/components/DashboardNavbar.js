import React, { useState } from "react";
import styled, { css } from "styled-components";
import AppBar from "@material-ui/core/AppBar";
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
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import Logo from "components/Logo";
import { useAuth } from "util/auth.js";

const AppHeader = styled(AppBar)`
  ${({ theme }) => css`
    z-index: ${theme.zIndex.drawer + 1};
  `}
`;

const AppToolbar = styled(Toolbar)`
  ${({ theme }) => css`
    padding: 0;
    align-items: stretch;
  `}
`;

const LogoContainer = styled.a`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    width: 240px;
    border-right: 1px solid ${theme.palette.divider};
    padding-left: ${theme.spacing(2)}px;
    svg {
      height: 40px;
    }
    &:focus {
      outline-offset: -3px;
    }
  `}
`;

const LeftNav = styled.div`
  ${({ theme }) => css`
    padding-left: ${theme.spacing(2)}px;
    flex-grow: 1;
    align-self: center;
    @media (max-width: ${theme.breakpoints.values.sm}px) {
      display: none;
    }
  `}
`;

const RightNav = styled(Hidden)`
  ${({ theme }) => css`
    padding-right: ${theme.spacing(2)}px;
    align-self: center;
  `}
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

const DashboardNavbar = () => {
  const auth = useAuth();
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
    <AppHeader color="inherit" elevation={0}>
      <AppToolbar>
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
        <RightNav xsDown implementation="css">
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
        </RightNav>
        <RightNav smUp implementation="css">
          <IconButton onClick={() => setDrawerOpen(true)} color="inherit">
            <MenuIcon />
          </IconButton>
          <NavDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
        </RightNav>
      </AppToolbar>
    </AppHeader>
  );
};

const NavDrawer = ({ drawerOpen, setDrawerOpen }) => (
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

export default DashboardNavbar;
