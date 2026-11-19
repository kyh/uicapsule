import { NotFoundMessage } from "@/components/not-found-message";

import "./styles/globals.css";

const GlobalNotFound = () => (
  <html lang="en" suppressHydrationWarning>
    <body className="bg-background text-foreground font-sans antialiased">
      <NotFoundMessage />
    </body>
  </html>
);

export default GlobalNotFound;
