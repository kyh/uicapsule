import * as React from "react";

import { Sidebar } from "./sidebar";

export const ResizableSidebarDemo = () => {
  return (
    <div
      className="grid h-screen w-full overflow-hidden"
      style={{ gridTemplateColumns: "var(--sidebar-width, 280px) 1fr" }}
    >
      {/* Resizable Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="bg-gray-50 p-6">
        <div className="max-w-4xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Resizable Sidebar Demo
          </h1>
          <p className="mb-4 text-gray-600">
            This is a demonstration of the resizable sidebar. You can:
          </p>
          <ul className="mb-6 list-inside list-disc space-y-2 text-gray-600">
            <li>Drag the right edge of the sidebar to resize it</li>
            <li>
              The sidebar has a minimum width of 200px and maximum width of
              400px
            </li>
            <li>The resize handle will highlight when you hover over it</li>
            <li>
              All navigation items and icons are now organized in separate
              components
            </li>
          </ul>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Features Implemented
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-medium text-gray-800">
                  Sidebar Organization
                </h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Icon components in separate files</li>
                  <li>• Clean navigation data structure</li>
                  <li>• Reusable NavigationItem component</li>
                  <li>• Reusable NavigationSection component</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-gray-800">
                  Resizable Functionality
                </h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Custom useResizableSidebar hook</li>
                  <li>• Mouse drag to resize</li>
                  <li>• Min/max width constraints</li>
                  <li>• Visual resize handle</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
