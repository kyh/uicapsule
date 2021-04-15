import styled, { css } from "styled-components";
import Typography from "@material-ui/core/Typography";

const TextHeader = styled(Typography)`
  ${({ theme }) => css`
    text-align: left;
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.6;
    max-width: 600px;
    margin: auto auto ${theme.spacing(2)}px;
  `}
`;

export default TextHeader;
