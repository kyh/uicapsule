import React from "react";
import { useRouter } from "next/router";
import { View, Hidden, Container } from "@uicapsule/components";
import AnchorMenu from "components/AnchorMenu";
import SideMenu from "components/SideMenu";
import type * as T from "./DocsLayout.types";
import s from "./DocsLayout.module.css";

let scrollValue = 0;
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const DocsLayout = (props: T.Props) => {
  const { children, anchorMenu } = props;
  const router = useRouter();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const sideRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleStart = () => {
      if (!sideRef.current) return;
      scrollValue = sideRef.current.scrollTop;
    };

    router.events.on("routeChangeStart", handleStart);

    return () => {
      router.events.off("routeChangeStart", handleStart);
    };
  }, [router, sideRef]);

  useIsomorphicLayoutEffect(() => {
    if (!sideRef.current) return;
    sideRef.current.scrollTop = scrollValue;
  }, [router.pathname, sideRef]);

  return (
    <Container width="1440px" className={s.root} attributes={{ ref: rootRef }}>
      <Hidden hide={{ s: true, l: false }}>
        <div className={s.side} ref={sideRef}>
          <div className={s.sideMenu}>
            <SideMenu />
          </div>
        </div>
      </Hidden>

      <div className={s.content}>
        <View direction="row" gap={30}>
          <View.Item grow>{children}</View.Item>

          {anchorMenu && (
            <Hidden hide={{ s: true, xl: false }}>
              {(className) => (
                <div className={`${s.anchorMenu} ${className}`}>
                  {router.asPath.startsWith("/content/docs") && (
                    <AnchorMenu {...anchorMenu} rootRef={rootRef} />
                  )}
                </div>
              )}
            </Hidden>
          )}
        </View>
      </div>
    </Container>
  );
};

export default DocsLayout;
