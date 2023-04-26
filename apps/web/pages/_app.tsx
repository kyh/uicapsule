import { useEffect, useLayoutEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { UIC, UICProps } from "@uicapsule/components";
import useStoredColorMode, { colorModeKey } from "hooks/useStoredColorMode";
import Meta from "components/Meta";
import Header from "components/Header";

import "@uicapsule/components/styles.css";

import "themes/uicapsule/theme.css";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const AppWrapper = ({ Component, pageProps }: any) => {
  const { setColorMode } = useStoredColorMode();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const nextMode = localStorage.getItem(
      colorModeKey
    ) as UICProps["defaultColorMode"];
    setColorMode(nextMode || "dark");
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const description =
    "UICapsule is a museum of components from real-world design systems.";

  return (
    <>
      <Head>
        <link rel="canonical" href={`https://uicapsule.com${router.asPath}`} />
        <meta name="viewport" content="width=device-width" />
        <meta name="theme-color" content="#fff" />
        <meta name="image" content="https://uicapsule.com/img/share-uic.png" />
        <meta
          name="twitter:image"
          content="https://uicapsule.com/img/share-uic.png"
        />
        <meta
          property="og:image"
          content="https://uicapsule.com/img/share-uic.png"
        />
        <meta name="twitter:card" content="summary_large_image" />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicons/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicons/favicon-16x16.png"
        />
        <link rel="manifest" href="/favicons/site.webmanifest" />
        <link
          rel="mask-icon"
          href="/favicons/safari-pinned-tab.svg"
          color="#111827"
        />
        <link rel="shortcut icon" href="/favicons/favicon.ico" />
        <meta name="msapplication-TileColor" content="#111827" />
        <meta
          name="msapplication-config"
          content="/favicons/browserconfig.xml"
        />
        <meta name="theme-color" content="#ffffff" />

        <meta property="og:site_name" content="UICapsule" />
        <meta property="og:url" content="https://uicapsule.com" />
        <meta name="twitter:url" content="https://uicapsule.com" />
        <meta property="og:type" content="website" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
      </Head>
      <Meta description={description} />
      <div style={{ visibility: mounted ? "visible" : "hidden" }}>
        <Header />
        <Component {...pageProps} />
      </div>
    </>
  );
};

const App = (props: any) => {
  return (
    <UIC
      theme="uicapsule"
      defaultColorMode="dark"
      toastOptions={{ "bottom-start": { width: "460px" } }}
    >
      <AppWrapper {...props} />
    </UIC>
  );
};

export default App;
