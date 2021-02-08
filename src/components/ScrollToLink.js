import Box from "@material-ui/core/Box";

const ScrollToLink = ({ id, top, ...rest }) => <Box
  component="a"
  visibility="hidden"
  position="relative"
  id={id}
  top={top}
  {...rest}
/>;

export default ScrollToLink;
