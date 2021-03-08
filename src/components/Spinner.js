import styled from "styled-components";
import CircularProgress from "@material-ui/core/CircularProgress";

const StyledSpinner = styled(CircularProgress)`
  animation-duration: 750ms;
`;

const Spinner = (props) => {
  return (
    <StyledSpinner
      variant="indeterminate"
      disableShrink
      size={16}
      thickness={4}
      {...props}
    />
  );
};

const PageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
`;

export const PageSpinner = () => {
  return (
    <PageContainer>
      <Spinner size={32} />
    </PageContainer>
  );
};

export default Spinner;
