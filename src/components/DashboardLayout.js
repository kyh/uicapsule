import React from "react";
import styled from "styled-components";
import DashboardNavbar from "components/DashboardNavbar";
import Container from "@material-ui/core/Container";

const DashboardContent = styled(Container)``;

const DashboardLayout = ({ children }) => <>
  <DashboardNavbar />
  {children}
</>;

export default DashboardLayout;
