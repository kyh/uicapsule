import React from "react";
import { Backdrop, Button, View, AspectRatio } from "@uicapsule/components";
import IconClose from "icons/Close";
import * as T from "./VideoDemo.types";
import s from "./VideoDemo.module.css";

const VideoDemo = (props: T.Props) => {
  const { active, onClose, src } = props;

  return (
    <Backdrop active={active} onClose={onClose}>
      <Button
        className={s.close}
        startIcon={IconClose}
        variant="ghost"
        color="white"
        size="large"
        onClick={onClose}
      />
      <View width="1000px" maxWidth="100vw" padding={[0, 4]}>
        <View borderRadius="large" overflow="hidden">
          <AspectRatio ratio={8 / 5}>
            <iframe
              src={src}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ width: "100%", height: "100%" }}
              title="Reshaped Demo"
            />
          </AspectRatio>
        </View>
      </View>
      <script src="https://player.vimeo.com/api/player.js" />
    </Backdrop>
  );
};

export default VideoDemo;
