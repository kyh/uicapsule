import React from "react";
import styled from "styled-components";
import { LoadingIcon } from "./Icons";

const Spinner = ({ ...rest }) => (
  <SpinnerContainer {...rest}>
    <LoadingIcon />
  </SpinnerContainer>
);

const SpinnerContainer = styled.div`
  display: flex;
`;

export default Spinner;
