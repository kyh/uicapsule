import React from "react";

import { Dashboard } from "./dashboard";
import { Sidebar } from "./sidebar";

const Preview = () => {
  return (
    <div
      className="relative grid h-full w-full overflow-hidden"
      style={{ gridTemplateColumns: "var(--sidebar-width, 280px) 1fr" }}
    >
      <Sidebar />
      <Dashboard />
    </div>
  );
};

export default Preview;
