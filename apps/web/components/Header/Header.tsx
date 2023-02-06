import NextLink from "next/link";
import {
  Container,
  View,
  Icon,
  Actionable,
  Breadcrumbs,
  Badge,
  Modal,
  useToggle,
  Dismissible,
  MenuItem,
} from "@uicapsule/components";
import IconUIC from "icons/colored/UIC";
import IconTwitter from "icons/colored/Twitter";
import IconVercel from "icons/colored/Vercel";
import HeaderMenu from "./HeaderMenu";
import s from "./Header.module.css";

const Header = () => {
  const { active, activate, deactivate } = useToggle(false);

  return (
    <header className={`${s.root} ${s["root--bg"]}`}>
      <Container width="1440px">
        <View direction="row" align="center" gap={3}>
          <View.Item className={s.logo} grow>
            <NextLink href="/" passHref legacyBehavior>
              <Actionable attributes={{ "aria-label": "UIC" }}>
                <View direction="row" align="center" gap={2} height="36px">
                  <Icon svg={IconUIC} size={8} />
                </View>
              </Actionable>
            </NextLink>
          </View.Item>
          <View.Item>
            <View className={s.themeToggle} align="center">
              <Breadcrumbs>
                <Breadcrumbs.Item>Theme</Breadcrumbs.Item>
                <Breadcrumbs.Item onClick={activate}>
                  <Badge>UIC</Badge>
                </Breadcrumbs.Item>
              </Breadcrumbs>
            </View>
          </View.Item>
          <HeaderMenu />
        </View>
      </Container>
      <Modal active={active} onClose={deactivate}>
        <View gap={3}>
          <Dismissible onClose={deactivate} closeAriaLabel="Close modal">
            <Modal.Title>Choose your Theme</Modal.Title>
            <Modal.Subtitle>
              Styles from real-world design systems
            </Modal.Subtitle>
          </Dismissible>
          <View>
            <MenuItem startIcon={IconUIC} selected>
              UIC
            </MenuItem>
            <MenuItem startIcon={IconTwitter}>Twitter</MenuItem>
            <MenuItem startIcon={IconVercel}>Vercel</MenuItem>
          </View>
        </View>
      </Modal>
    </header>
  );
};

export default Header;
