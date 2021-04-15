import styled, { css } from "styled-components";

const TextList = styled.ol`
  ${({ theme }) => css`
    font-size: 1.1rem;
    line-height: 1.6;
    max-width: 600px;
    margin: auto auto ${theme.spacing(3)}px;
    padding-left: 20px;
    text-align: left;
  `}
`;

export default TextList;
