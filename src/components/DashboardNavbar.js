import React, { useState } from "react";
import styled, { css } from "styled-components";
import Link from "next/link";
import Avatar from "@material-ui/core/Avatar";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Hidden from "@material-ui/core/Hidden";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import InputBase from "@material-ui/core/InputBase";
import { SearchOutline } from "@graywolfai/react-heroicons";
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
    padding-left: ${theme.spacing(3)}px;
    flex-grow: 1;
    align-self: center;
    @media (max-width: ${theme.breakpoints.values.sm}px) {
      display: none;
    }
  `}
`;

const SearchForm = styled.form`
  ${({ theme }) => css`
    position: relative;
    .MuiInputBase-input {
      font-size: 0.8rem;
      padding-left: ${theme.spacing(4)}px;
    }
    svg {
      position: absolute;
      width: 16px;
      top: 6px;
      left: 8px;
    }
  `}
`;

const RightNav = styled(Hidden)`
  ${({ theme }) => css`
    padding-right: ${theme.spacing(3)}px;
    align-self: center;

    .MuiAvatar-root {
      width: ${theme.spacing(4)}px;
      height: ${theme.spacing(4)}px;
    }
  `}
`;

const MenuItemsContainer = styled.div`
  .MuiMenuItem-root {
    font-size: 0.875rem;
  }
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

  if (!auth.user) {
    return null;
  }

  return (
    <AppHeader color="inherit" elevation={0}>
      <AppToolbar>
        <Link href="/ui" passHref>
          <LogoContainer>
            <Logo />
          </LogoContainer>
        </Link>
        <LeftNav>
          <SearchForm>
            <SearchOutline width="16" />
            <InputBase type="text" placeholder="Search" name="search" />
          </SearchForm>
        </LeftNav>
        <RightNav xsDown implementation="css">
          <IconButton
            size="small"
            aria-label="Account"
            aria-controls="account-menu"
            aria-haspopup="true"
            onClick={(event) => handleOpenMenu(event, "account-menu")}
          >
            <Avatar alt={auth.user.name} src={auth.user.picture} />
          </IconButton>
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
            <MenuItemsContainer>
              <MenuItem
                component="a"
                href="https://chrome.google.com/webstore/detail/pinterest-save-button/gpdjojdkbbmdfjfahjcgigfpmkopogic"
                target="_blank"
              >
                Download browser button
              </MenuItem>
              <Link href="/settings/billing" passHref>
                <MenuItem component="a">Upgrade to Pro</MenuItem>
              </Link>
              <Link href="/settings/general" passHref>
                <MenuItem component="a">Settings</MenuItem>
              </Link>
              <Divider />
              <MenuItem onClick={() => auth.signout()}>Signout</MenuItem>
            </MenuItemsContainer>
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
      <Link href="/ui" passHref>
        <ListItem button component="a">
          <ListItemText>Home</ListItemText>
        </ListItem>
      </Link>
      <Link href="/settings/billing" passHref>
        <ListItem button component="a">
          <ListItemText>Upgrade to Pro</ListItemText>
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
