import { Button } from "@uicapsule/components";
import * as T from "./DownloadButton.types";

const typeMap = {
  react: {
    text: "Download React library",
  },
  figma: {
    text: "Download Figma library",
  },
  source: {
    text: "Download source code",
  },
};

const DownloadButton = (props: T.Props) => {
  const { type, version = "latest", ...buttonProps } = props;
  const typeProps = typeMap[props.type];

  return (
    <Button
      {...(buttonProps as any)}
      attributes={{
        download: true,
        href: `/api/download/${version}/${type}`,
      }}
    >
      {typeProps.text}
    </Button>
  );
};

export default DownloadButton;
