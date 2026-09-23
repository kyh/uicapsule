import { NotFoundMessage } from "@/components/not-found-message";

import "./styles/globals.css";

// Unmatched URLs skip every root layout, so this page supplies its own <html>/<body> and stylesheet.
const GlobalNotFound = () => (
  <html lang="en" suppressHydrationWarning>
    <body className="bg-background text-foreground font-sans antialiased">
      <NotFoundMessage />
    </body>
  </html>
);

export default GlobalNotFound;
