import { forwardRef } from "react";
import styled, { css } from "styled-components";
import Button from "@material-ui/core/Button";
import Spinner from "./Spinner";

const ButtonContent = styled.div`
  ${({ loading }) => css`
    opacity: ${loading ? 0 : 1};
    transition: opacity 0.3s ease;
  `}
`;

const AbsoluteSpinner = styled(Spinner)`
  position: absolute;
  top: 50%;
  left: 50%;
  margin-left: -10px;
  margin-top: -10px;
`;

const UIButton = forwardRef(
  ({ loading = false, children = "", ...rest }, ref) => (
    <Button disabled={loading} {...rest} ref={ref}>
      <ButtonContent loading={loading === true ? 1 : 0}>
        {children}
      </ButtonContent>
      {loading && <AbsoluteSpinner size={20} />}
    </Button>
  )
);

export default UIButton;
