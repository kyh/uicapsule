import NextLink from "next/link";
import {
  Container,
  View,
  Icon,
  Actionable,
  Breadcrumbs,
  Badge,
} from "@uicapsule/components";
import IconUICColored from "icons/colored/UIC";
import HeaderMenu from "./HeaderMenu";
import s from "./Header.module.css";

const Header = () => {
  return (
    <header className={`${s.root} ${s["root--bg"]}`}>
      <Container width="1440px">
        <View direction="row" align="center" gap={3}>
          <View.Item className={s.logo} grow>
            <NextLink href="/" passHref legacyBehavior>
              <Actionable attributes={{ "aria-label": "UIC" }}>
                <View direction="row" align="center" gap={2} height="36px">
                  <Icon svg={IconUICColored} size={8} />
                </View>
              </Actionable>
            </NextLink>
          </View.Item>
          <View.Item>
            <View className={s.themeToggle} align="center">
              <Breadcrumbs>
                <Breadcrumbs.Item>Theme</Breadcrumbs.Item>
                <Breadcrumbs.Item onClick={() => {}}>
                  <Badge>Default</Badge>
                </Breadcrumbs.Item>
              </Breadcrumbs>
            </View>
          </View.Item>
          <HeaderMenu />
        </View>
      </Container>
    </header>
  );
};

export default Header;
