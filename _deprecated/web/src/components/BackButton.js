import { forwardRef } from "react";
import { useRouter } from "next/router";
import Button from "@material-ui/core/Button";

const BackButton = forwardRef(
  ({ loading = false, children = "", onClick = () => {}, ...rest }, ref) => {
    const router = useRouter();
    return (
      <Button
        disabled={loading}
        {...rest}
        onClick={() => {
          onClick();
          router.back();
        }}
        ref={ref}
      >
        {children}
      </Button>
    );
  }
);

export default BackButton;
