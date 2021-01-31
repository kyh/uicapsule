import React from "react";
import styled, { css } from "styled-components";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

const ButtonContent = styled.div`
  ${({ loading }) => css`
    opacity: ${loading ? 0 : 1};
    transition: opacity 0.3s ease;
  `}
`;

const Spinner = styled(CircularProgress)`
  position: absolute;
  top: 50%;
  left: 50%;
  margin-left: -10px;
  margin-top: -10px;
  animation-duration: 750ms;
`;

function UIButton({ loading = false, children = "", ...rest }) {
  return (
    <Button disabled={loading} {...rest}>
      <ButtonContent loading={loading === true ? 1 : 0}>
        {children}
      </ButtonContent>
      {loading && (
        <Spinner
          variant="indeterminate"
          disableShrink
          size={20}
          thickness={4}
        />
      )}
    </Button>
  );
}

export default UIButton;
