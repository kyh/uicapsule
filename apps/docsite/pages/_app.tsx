import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import ReactGA from "react-ga4";
import { Reshaped, ReshapedProps } from "@uicapsule/components";
import useStoredColorMode from "hooks/useStoredColorMode";
import Meta from "components/Meta";
import Header from "components/Header";
import { AuthProvider } from "hooks/useAuth";
import "@uicapsule/components/themes/@uicapsule/components/theme.css";
import "@uicapsule/components/themes/fragments/twitter/theme.css";
import "themes/funky/theme.css";
import "themes/classic/theme.css";
import "themes/figma/theme.css";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const AppWrapper = ({ Component, pageProps }: any) => {
  const { setColorMode } = useStoredColorMode();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [isBrowserDark, setIsBrowserDark] = React.useState(false);

  useIsomorphicLayoutEffect(() => {
    const nextMode = localStorage.getItem(
      "__@uicapsule/components-mode"
    ) as ReshapedProps["defaultColorMode"];
    setColorMode(nextMode || "light");
  }, [setColorMode]);

  useIsomorphicLayoutEffect(() => {
    const matcher = window.matchMedia("(prefers-color-scheme: dark)");
    setIsBrowserDark(matcher.matches);

    const handleUpdate = () => {
      setIsBrowserDark(matcher.matches);
    };

    matcher.addEventListener("change", handleUpdate);
    return () => matcher.removeEventListener("change", handleUpdate);
  }, []);

  React.useEffect(() => {
    ReactGA.initialize("G-PPPDLZ83VN");
    setMounted(true);
  }, []);

  const title = "Design system built for your scale with React and Figma";
  const description =
    "Reshaped provides professionally crafted component libraries in React and Figma to make your product design and development faster.";

  return (
    <>
      <Head>
        <link
          rel="canonical"
          href={`https://@uicapsule/components.so${router.asPath}`}
        />
        <meta name="viewport" content="width=device-width" />
        <meta name="theme-color" content="#fff" />
        <meta
          name="image"
          content="https://@uicapsule/components.so/img/share-rs.png"
        />
        <meta
          name="twitter:image"
          content="https://@uicapsule/components.so/img/share-rs.png"
        />
        <meta
          property="og:image"
          content="https://@uicapsule/components.so/img/share-rs.png"
        />
        <meta name="twitter:card" content="summary_large_image" />

        <link
          rel="icon"
          type="image/svg+xml"
          href={isBrowserDark ? "/favicon.svg" : "/favicon-light.svg"}
        />

        <meta property="og:site_name" content="Reshaped" />
        <meta property="og:url" content="https://@uicapsule/components.so" />
        <meta name="twitter:url" content="https://@uicapsule/components.so" />
        <meta property="og:type" content="website" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
      </Head>
      <Meta titleEnding={title} description={description} />
      <div style={{ visibility: mounted ? "visible" : "hidden" }}>
        <Header />
        <Component {...pageProps} />
      </div>
    </>
  );
};

const App = (props: any) => {
  return (
    <AuthProvider>
      <Reshaped
        theme="@uicapsule/components"
        toastOptions={{ "bottom-start": { width: "460px" } }}
      >
        <AppWrapper {...props} />
      </Reshaped>
    </AuthProvider>
  );
};

export default App;
