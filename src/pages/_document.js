import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";
import { ServerStyleSheet } from "styled-components";
import { ServerStyleSheets } from "@material-ui/core/styles";

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    // Render app and page and get the context of the page with collected side effects.
    const styledComponentsSheet = new ServerStyleSheet();
    const materialSheets = new ServerStyleSheets();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            styledComponentsSheet.collectStyles(
              materialSheets.collect(<App {...props} />)
            ),
        });
      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <React.Fragment>
            {initialProps.styles}
            {materialSheets.getStyleElement()}
            {styledComponentsSheet.getStyleElement()}
          </React.Fragment>
        ),
      };
    } finally {
      styledComponentsSheet.seal();
    }
  }

  render() {
    return (
      <Html lang="en" dir="ltr">
        <Head>
          <meta charSet="utf-8" />
          <meta name="referrer" content="origin" />
          <meta name="application-name" content="UI Capsule" />
          <meta name="theme-color" content="#1F2937" />
          <meta
            name="title"
            content="UI Capsule | Bookmark your inspirations"
          />
          <meta
            name="keywords"
            content="UI, Design, Web Design, Inspirations"
          />
          <meta name="robots" content="index, follow" />
          <meta
            name="description"
            content="Quickly collect and explore web design ideas. View and  interact with your saved elements from one simple dashboard."
          />

          <meta property="fb:app_id" content="{FB_ID}" />
          <meta property="og:url" content="" />
          <meta property="og:type" content="website" />
          <meta
            property="og:title"
            content="UI Capsule | Bookmark your inspirations"
          />
          <meta property="og:image" content="/featured.png" />
          <meta
            property="og:description"
            content="Quickly collect and explore web design ideas. View and  interact with your saved elements from one simple dashboard."
          />
          <meta property="og:site_name" content="UI Capsule" />
          <meta property="og:locale" content="en_US" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@uglyandcuddly" />
          <meta name="twitter:creator" content="@uglyandcuddly" />
          <meta name="twitter:url" content="" />
          <meta
            name="twitter:title"
            content="UI Capsule | Bookmark your inspirations"
          />
          <meta
            name="twitter:description"
            content="Quickly collect and explore web design ideas. View and  interact with your saved elements from one simple dashboard."
          />
          <meta name="twitter:image" content="/featured.png" />
          <meta property="article:author" content="Kaiyu Hsu" />
          <link rel="manifest" href="/manifest.json" />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="favicons/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="favicons/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="favicons/favicon-16x16.png"
          />
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
