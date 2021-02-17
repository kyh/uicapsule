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

export default Spinner;
