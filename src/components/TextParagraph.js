import styled, { css } from "styled-components";
import Typography from "@material-ui/core/Typography";

const TextParagraph = styled(Typography)`
  ${({ theme }) => css`
    text-align: left;
    font-size: 1.1rem;
    line-height: 1.6;
    max-width: 600px;
    margin: auto auto ${theme.spacing(3)}px;

    em {
      font-weight: 500;
    }
  `}
`;

export default TextParagraph;
