import React from "react";
import Box from "@material-ui/core/Box";
import BackgroundImage from "components/BackgroundImage";
import { makeStyles } from "@material-ui/core/styles";
import { emphasize } from "@material-ui/core/styles/colorManipulator";
import capitalize from "@material-ui/core/utils/capitalize";

const useStyles = makeStyles((theme) => ({
  root: {
    position: "relative",
    // Ensure child <Container> is above background
    // image (if one is set with the bgImage prop).
    "& > .MuiContainer-root": {
      position: "relative",
    },
  },

  // Create color classes that set background color and determine
  // text color and dividing border automatically based on background color.
  // Adds the keys colorDefault, colorLight, etc
  ...[
    ["default", theme.palette.background.default],
    ["light", emphasize(theme.palette.background.default, 0.03)],
    ["primary", theme.palette.primary.main],
    ["secondary", theme.palette.secondary.main],
  ].reduce((acc, [name, value]) => {
    acc[`color${capitalize(name)}`] = {
      backgroundColor: value,
      // Ensure text is legible on background
      color: theme.palette.getContrastText(value),
    };
    return acc;
  }, {}),

  colorInherit: {
    color: "inherit",
  },

  colorTransparent: {
    backgroundColor: "transparent",
    color: "inherit",
  },
}));

function Section({
  bgColor = "default",
  bgImage,
  bgImageOpacity,
  bgPosY,
  bgPosX,
  size = "normal",
  className,
  children,
  ...rest
}) {
  const classes = useStyles();
  // Get MUI responsize size object based
  // on size prop (normal, medium, large, auto)
  const verticalPadding = {
    normal: { xs: 6 },
    medium: { xs: 6, sm: 10 },
    large: { xs: 6, sm: 20 },
    auto: 0,
  }[size];

  return (
    <Box
      component="section"
      pt={verticalPadding}
      pb={verticalPadding}
      className={
        classes.root +
        ` ${classes[`color${capitalize(bgColor)}`]}` +
        (className ? ` ${className}` : "")
      }
      {...rest}
    >
      {bgImage && (
        <BackgroundImage
          image={bgImage}
          opacity={bgImageOpacity}
          posY={bgPosY}
          posX={bgPosX}
        />
      )}
      {children}
    </Box>
  );
}

export default Section;
