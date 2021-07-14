import styled, { css } from "styled-components";
import Box from "@material-ui/core/Box";
import DashboardNavbar from "components/DashboardNavbar";

const Content = styled.main`
  ${({ theme }) => css`
    flex-grow: 1;
    padding: ${theme.spacing(8)}px ${theme.spacing(3)}px ${theme.spacing(3)}px;
  `}
`;

const DashboardFullLayout = ({ children }) => {
  return (
    <Box display="flex">
      <DashboardNavbar border="true" />
      <Content>{children}</Content>
    </Box>
  );
};

export default DashboardFullLayout;
