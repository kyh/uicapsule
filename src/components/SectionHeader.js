import React from "react";
import styled, { css } from "styled-components";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

const Container = styled(Box)`
  &:not(:last-child) {
    margin-bottom: 2rem;
  }
`;

const Subtitle = styled(Typography)`
  ${({ theme }) => css`
    font-size: 1.1rem;
    color: ${theme.palette.text.secondary};
    display: inline-block;
    max-width: 700px;
  `}
`;

const SectionHeader = props => {
  const { subtitle, title, size, className, ...otherProps } = props;

  // Render nothing if no title or subtitle
  if (!title && !subtitle) {
    return null;
  }

  return (
    <Container component="header" {...otherProps}>
      {title && (
        <Typography
          variant={`h${size}`}
          gutterBottom={props.subtitle ? true : false}
        >
          {title}
        </Typography>
      )}

      {subtitle && <Subtitle variant="subtitle1">{subtitle}</Subtitle>}
    </Container>
  );
};

export default SectionHeader;
