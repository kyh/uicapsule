import React from "react";
import styled, { css } from "styled-components";
import Box from "@material-ui/core/Box";
import Drawer from "@material-ui/core/Drawer";
import Toolbar from "@material-ui/core/Toolbar";
import List from "@material-ui/core/List";
import Divider from "@material-ui/core/Divider";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import {
  GlobeOutline,
  FireOutline,
  LibraryOutline,
  CollectionOutline,
  CubeTransparentOutline,
  CogOutline,
} from "@graywolfai/react-heroicons";
import ActiveLink from "components/ActiveLink";
import DashboardNavbar from "components/DashboardNavbar";

const Sidebar = styled(Drawer)`
  width: 240px;
  flex-shrink: 0;
  > .MuiDrawer-paper {
    width: 240px;
  }
`;

const SidebarContainer = styled.div`
  overflow: auto;
`;

const SidebarList = styled(List)`
  ${({ theme }) => css`
    padding: ${theme.spacing(1)}px;

    .MuiListItem-root {
      border-radius: 8px;
      padding: ${theme.spacing(1)}px;
    }

    .MuiListItemIcon-root {
      min-width: ${theme.spacing(4)}px;
      margin-right: ${theme.spacing(1)}px;
      padding: ${theme.spacing(0.5)}px;
      border-radius: 10px;
    }

    .MuiListItemText-root > span {
      font-size: inherit;
      font-weight: 500;
    }

    .MuiListItem-root.active {
      color: ${theme.palette.primary.main};
      .MuiListItemIcon-root {
        color: ${theme.palette.primary.main};
        background: ${theme.palette.primary.main}20;
      }
    }
  `}
`;

const Content = styled.main`
  ${({ theme }) => css`
    flex-grow: 1;
    padding: ${theme.spacing(8)}px ${theme.spacing(3)}px ${theme.spacing(3)}px;
  `}
`;

const DashboardLayout = ({ children }) => {
  return (
    <Box display="flex">
      <DashboardNavbar />
      <Sidebar variant="permanent">
        <Toolbar />
        <SidebarContainer>
          <SidebarList>
            <ActiveLink href="/dashboard" passHref>
              <ListItem button component="a">
                <ListItemIcon>
                  <GlobeOutline />
                </ListItemIcon>
                <ListItemText primary="Discover" />
              </ListItem>
            </ActiveLink>
            <ActiveLink href="/dashboard/trending" passHref>
              <ListItem button component="a">
                <ListItemIcon>
                  <FireOutline />
                </ListItemIcon>
                <ListItemText primary="Trending" />
              </ListItem>
            </ActiveLink>
            <ActiveLink href="/dashboard/capsule" passHref>
              <ListItem button component="a">
                <ListItemIcon>
                  <LibraryOutline />
                </ListItemIcon>
                <ListItemText primary="My Capsule" />
              </ListItem>
            </ActiveLink>
          </SidebarList>
          <Divider />
          <SidebarList>
            <ActiveLink href="/dashboard/list" passHref>
              <ListItem button component="a">
                <ListItemIcon>
                  <CollectionOutline />
                </ListItemIcon>
                <ListItemText primary="Lists" />
              </ListItem>
            </ActiveLink>
            <ActiveLink href="/dashboard/playground" passHref>
              <ListItem button component="a">
                <ListItemIcon>
                  <CubeTransparentOutline />
                </ListItemIcon>
                <ListItemText primary="Playground" />
              </ListItem>
            </ActiveLink>
          </SidebarList>
          <Divider />
          <SidebarList>
            <ActiveLink href="/dashboard/settings/general" passHref>
              <ListItem button component="a">
                <ListItemIcon>
                  <CogOutline />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItem>
            </ActiveLink>
          </SidebarList>
        </SidebarContainer>
      </Sidebar>
      <Content>{children}</Content>
    </Box>
  );
};

export default DashboardLayout;
