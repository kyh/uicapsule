import React from "react";
import Navbar from "components/Navbar";
import Footer from "components/Footer";
import "util/analytics.js";
import { AuthProvider } from "util/auth.js";
import { ThemeProvider } from "util/theme.js";

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <>
          <Navbar />
          <Component {...pageProps} />
          <Footer />
        </>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;
