import { useEffect } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import {
  Button,
  Dismissible,
  Modal,
  Hidden,
  View,
  useToggle,
} from "@uicapsule/components";
import IconMenu from "icons/Menu";
import SideMenu from "components/SideMenu";
import HeaderColorMode from "./HeaderColorMode";

type MenuItem = {
  title: string;
  url?: string;
  desktop?: boolean;
  onClick?: () => void;
};

const useMenu = (): MenuItem[] => {
  return [
    {
      title: "Components",
      url: "/content/docs/getting-started/overview",
    },
    {
      title: "Examples",
      url: "/examples",
    },
  ];
};

const HeaderMenuMobile = () => {
  const { asPath } = useRouter();
  const menu = useMenu();
  const {
    deactivate: closeMenu,
    toggle: toggleMenu,
    active: menuActive,
  } = useToggle();

  useEffect(() => {
    closeMenu();
  }, [asPath, closeMenu]);

  return (
    <Hidden hide={{ s: false, l: true }}>
      <Button.Aligner position="end">
        <Button startIcon={IconMenu} variant="ghost" onClick={toggleMenu} />
      </Button.Aligner>

      <Modal
        active={menuActive}
        onClose={closeMenu}
        position="end"
        size="280px"
        padding={3}
      >
        <View gap={3}>
          <Dismissible onClose={closeMenu} closeAriaLabel="Close menu" />
          <SideMenu extraSection={menu} fullWidth />
        </View>
      </Modal>
    </Hidden>
  );
};

const HeaderMenu = () => {
  const menu = useMenu();

  return (
    <View.Item>
      <View as="nav" direction="row" gap={2} justify="end" align="center">
        <Hidden hide={{ s: true, l: false }}>
          {(className) =>
            menu.map((item) => {
              if (!item.url) {
                return (
                  <Button
                    variant="ghost"
                    className={className}
                    onClick={item.onClick}
                    key={item.title}
                  >
                    {item.title}
                  </Button>
                );
              }

              return (
                <NextLink
                  href={item.url}
                  passHref
                  legacyBehavior
                  key={item.title}
                >
                  <Button
                    variant="ghost"
                    className={className}
                    onClick={item.onClick}
                  >
                    {item.title}
                  </Button>
                </NextLink>
              );
            })
          }
        </Hidden>
        <HeaderColorMode />
        <HeaderMenuMobile />
      </View>
    </View.Item>
  );
};

export default HeaderMenu;
