import styled from "styled-components";

const StyledIFrame = styled.iframe`
  display: block;
  width: 100%;
  height: 100%;
  border: none;
`;

const IFrame = (props) => {
  return <StyledIFrame sandbox="allow-scripts" {...props} />;
};

export default IFrame;
