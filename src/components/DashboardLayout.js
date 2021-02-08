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
import InboxIcon from "@material-ui/icons/MoveToInbox";
import MailIcon from "@material-ui/icons/Mail";
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

const Content = styled.main`
  ${({ theme }) => css`
    flex-grow: 1;
    padding: ${theme.spacing(3)}px;
  `}
`;

const DashboardLayout = ({ children }) => {
  return (
    <Box display="flex">
      <DashboardNavbar />
      <Sidebar variant="permanent">
        <Toolbar />
        <SidebarContainer>
          <List>
            {["Inbox", "Starred", "Send email", "Drafts"].map((text, index) => (
              <ListItem button key={text}>
                <ListItemIcon>
                  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            {["All mail", "Trash", "Spam"].map((text, index) => (
              <ListItem button key={text}>
                <ListItemIcon>
                  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItem>
            ))}
          </List>
        </SidebarContainer>
      </Sidebar>
      <Content>{children}</Content>
    </Box>
  );
};

export default DashboardLayout;
