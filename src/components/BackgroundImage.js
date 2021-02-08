import React from "react";
import styled from "styled-components";

const Conatainer = styled.div`
  content: "";
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  position: absolute;
  z-index: 0;
`;

const BackgroundImage = props => {
  const { image, posY, posX, opacity, ...otherProps } = props;
  return (
    <Conatainer
      style={{
        backgroundImage: `url("${image}")`,
        opacity: opacity,
        backgroundPositionY: posY,
        backgroundPositionX: posX,
      }}
      {...otherProps}
    />
  );
};

export default BackgroundImage;
