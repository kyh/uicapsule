import Box from "@material-ui/core/Box";

function ScrollToLink({ id, top, ...rest }) {
  return (
    <Box
      component="a"
      visibility="hidden"
      position="relative"
      id={id}
      top={top}
      {...rest}
    />
  );
}

export default ScrollToLink;
