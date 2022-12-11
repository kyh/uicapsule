import React from "react";
import Link from "next/link";
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
import * as ga from "utilities/ga";
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
      title: "Documentation",
      url: "/content/docs/getting-started/overview",
      desktop: true,
    },
    { title: "Releases", url: "/content/changelog" },
    {
      title: "Pricing",
      url: "/pricing",
      onClick: () => {
        ga.trackEvent({
          category: ga.EventCategory.Pricing,
          action: "pricing_navigate_header",
        });
      },
    },
    { title: "FAQ", url: "/faq" },
  ];
};

const HeaderMenuMobile = () => {
  const { asPath } = useRouter();
  const loggedIn = false;
  const signOut = () => {};
  const menu = useMenu();
  const {
    deactivate: closeMenu,
    toggle: toggleMenu,
    active: menuActive,
  } = useToggle();

  const extraItems: MenuItem[] = menu
    .filter((item) => !item.desktop)
    .map((item) => ({ title: item.title, url: item.url }));
  if (!loggedIn) {
    extraItems.push({ title: "Log in", url: "/login" });
  } else {
    extraItems.push(
      {
        title: "Submit a request",
        url: "https://github.com/@uicapsule/components/community/issues",
        onClick: () => {
          ga.trackEvent({
            category: ga.EventCategory.External,
            action: "external_submit_request",
          });
        },
      },
      {
        title: "Sign out",
        onClick: () => {
          signOut();
          closeMenu();
        },
      }
    );
  }

  React.useEffect(() => {
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
          <SideMenu extraSection={extraItems} fullWidth />
        </View>
      </Modal>
    </Hidden>
  );
};

const HeaderMenu = () => {
  const menu = useMenu();

  return (
    <View.Item order={{ s: 2, l: 0 }}>
      <View direction="row" gap={2} justify="end" align="center">
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
                <Link href={item.url} passHref key={item.title}>
                  <Button
                    variant="ghost"
                    className={className}
                    onClick={item.onClick}
                  >
                    {item.title}
                  </Button>
                </Link>
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
