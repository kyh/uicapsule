import NextLink from "next/link";
import { Container, Link, Divider, View, Hidden } from "@uicapsule/components";

const Footer = () => {
  return (
    <Container width="1056px">
      <Divider />
      <View
        padding={[6, 0]}
        direction={{ s: "column-reverse", l: "row" }}
        align={{ s: "start", l: "center" }}
        gap={6}
      >
        <View.Item grow>
          © 2020-{new Date().getFullYear()}. All rights reserved.
          <Hidden hide={{ s: true, l: false }}>
            {(className) => <br className={className} />}
          </Hidden>
        </View.Item>

        <View gap={6} direction="row">
          <NextLink href="/figma-plugin" passHref>
            <Link variant="plain">Figma plugin</Link>
          </NextLink>
          <Link
            variant="plain"
            href="https://blvworkspace.notion.site/64cf1f5713344a7383330e0402f43949?v=b88a6dbbcb9a4faeb867d40d09ec0b12"
            attributes={{ target: "_blank" }}
          >
            Roadmap
          </Link>
          <NextLink href="/content/license" passHref>
            <Link variant="plain">License</Link>
          </NextLink>
          <NextLink href="/about" passHref>
            <Link variant="plain">About us</Link>
          </NextLink>
          <Link variant="plain" href="mailto:hello@@uicapsule/components.so">
            Contact us
          </Link>
        </View>
      </View>
    </Container>
  );
};

export default Footer;
