import React from "react";

export const Dashboard = () => {
  return (
    <div>
      {/* Header Section */}
      <div className="border-b border-[#EEEFF1]">
        <div className="flex items-center justify-between pt-3 pr-[19px] pb-[11px] pl-4">
          <div className="flex items-center gap-x-[7px]">
            <div className="h-5 w-20 rounded bg-gray-200"></div>
            <div className="size-4 rounded-full bg-gray-200"></div>
          </div>
          <div className="flex items-center gap-x-[26px]">
            <div className="flex">
              <div className="w-4">
                <div className="size-6 rounded-full bg-gray-200"></div>
              </div>
              <div className="w-4">
                <div className="size-6 rounded-full bg-gray-200"></div>
              </div>
              <div className="w-4">
                <div className="size-6 rounded-full bg-gray-200"></div>
              </div>
              <div className="w-4">
                <div className="size-6 rounded-full bg-gray-200"></div>
              </div>
            </div>
            <div className="size-4 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="border-b border-[#EEEFF1]">
        <div className="flex items-center justify-between px-3 pt-2.5 pb-[9px]">
          <div className="h-5 w-24 rounded bg-gray-200"></div>
          <div className="flex items-center gap-x-2">
            <div className="bg-primary-background flex items-center gap-1.5 rounded-sm py-1 pr-2 pl-1.5 shadow-[0px_0px_1px_0px_#E0E0E0,0px_1px_2px_-1px_rgba(24,39,75,0.02),0px_2px_2px_-1px_rgba(24,39,75,0.06)]">
              <div className="h-5 w-16 rounded bg-gray-200"></div>
            </div>
            <div className="bg-primary-background flex items-center rounded-sm py-1 pr-1.5 pl-2 shadow-[0px_0px_1px_0px_#E0E0E0,0px_1px_2px_-1px_rgba(24,39,75,0.02),0px_2px_2px_-1px_rgba(24,39,75,0.06)]">
              <div className="h-5 w-20 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full w-full overflow-hidden">
        <div className="flex h-full w-full flex-col">
          {/* Table Controls */}
          <div className="flex h-[49px] shrink-0 items-center gap-x-[7px] border-b border-[#EEEFF1] px-3">
            <div className="flex h-7 items-center gap-x-1.5 rounded-lg border border-[#E6E7EA] bg-[#FBFBFB] pr-[4.5px] pl-[2.5px]">
              <div className="h-5 w-32 rounded bg-gray-200"></div>
            </div>
            <div className="h-[21px] w-px rounded-full bg-[#EEEFF1]"></div>
            <div className="flex h-7 items-center rounded-lg border border-[#E6E7EA] bg-[#FBFBFB] pr-[2.5px] pl-1.5">
              <div className="flex items-center gap-x-[7px]">
                <div className="h-5 w-24 rounded bg-gray-200"></div>
              </div>
              <div className="mr-1 ml-1.5 h-full w-px bg-[#E6E7EA]"></div>
              <div className="size-4 rounded bg-gray-200"></div>
            </div>
          </div>

          {/* Data Table */}
          <div className="relative h-full w-full flex-1">
            <div className="home-ui-data-table grid auto-rows-[40px] grid-cols-[204px_minmax(136px,1fr)_minmax(204px,1.5fr)_minmax(136px,1fr)_204px_204px]">
              {/* Header Row */}
              <div className="bg-white-100 overflow-hidden border-r border-b border-[#EEEFF1]">
                <div className="flex h-full w-full items-center justify-between gap-x-1.5 pr-[4.5px] pl-2">
                  <div className="bg-white-100 flex items-center gap-x-2.5 overflow-hidden">
                    <div className="h-5 w-16 rounded bg-gray-200"></div>
                  </div>
                  <div className="h-5 w-5 rounded bg-gray-200"></div>
                </div>
              </div>
              <div className="bg-white-100 overflow-hidden border-r border-b border-[#EEEFF1]">
                <div className="flex h-full w-full items-center gap-x-1.5 pr-[3.5px] pl-1">
                  <div className="h-5 w-16 rounded bg-gray-200"></div>
                </div>
              </div>
              <div className="bg-white-100 overflow-hidden border-r border-b border-[#EEEFF1]">
                <div className="flex h-full w-full items-center gap-x-1.5 pr-[3.5px] pl-1">
                  <div className="h-5 w-20 rounded bg-gray-200"></div>
                </div>
              </div>
              <div className="bg-white-100 overflow-hidden border-r border-b border-[#EEEFF1]">
                <div className="flex h-full w-full items-center gap-x-1.5 pr-[3.5px] pl-1">
                  <div className="h-5 w-18 rounded bg-gray-200"></div>
                </div>
              </div>
              <div className="bg-white-100 overflow-hidden border-r border-b border-[#EEEFF1]">
                <div className="flex h-full w-full items-center gap-x-1.5 pr-[3.5px] pl-1">
                  <div className="h-5 w-20 rounded bg-gray-200"></div>
                </div>
              </div>
              <div className="bg-white-100 overflow-hidden border-b border-[#EEEFF1]">
                <div className="flex h-full w-full items-center gap-x-1.5 pr-[3.5px] pl-1">
                  <div className="h-5 w-16 rounded bg-gray-200"></div>
                </div>
              </div>

              {/* Data Rows - Generate multiple skeleton rows */}
              {Array.from({ length: 20 }).map((_, index) => (
                <React.Fragment key={index}>
                  <div className="bg-white-100 overflow-hidden border-r border-b border-[#EEEFF1]">
                    <div className="flex h-full w-full items-center justify-between gap-x-1.5 pr-[4.5px] pl-2">
                      <div className="bg-white-100 flex items-center gap-x-2.5 overflow-hidden">
                        <div className="size-4 rounded bg-gray-200"></div>
                        <div className="h-5 w-24 rounded bg-gray-200"></div>
                      </div>
                      <div className="h-5 w-5 rounded bg-gray-200"></div>
                    </div>
                  </div>
                  <div className="bg-white-100 overflow-hidden border-r border-b border-[#EEEFF1]">
                    <div className="flex h-full w-full items-center gap-x-1.5 pr-[3.5px] pl-1">
                      <div className="h-5 w-20 rounded bg-gray-200"></div>
                    </div>
                  </div>
                  <div className="bg-white-100 overflow-hidden border-r border-b border-[#EEEFF1]">
                    <div className="flex h-full w-full items-center gap-x-1.5 pr-[3.5px] pl-1">
                      <div className="h-5 w-28 rounded bg-gray-200"></div>
                    </div>
                  </div>
                  <div className="bg-white-100 overflow-hidden border-r border-b border-[#EEEFF1]">
                    <div className="flex h-full w-full items-center gap-x-1.5 pr-[3.5px] pl-1">
                      <div className="h-5 w-16 rounded bg-gray-200"></div>
                    </div>
                  </div>
                  <div className="bg-white-100 overflow-hidden border-r border-b border-[#EEEFF1]">
                    <div className="flex h-full w-full items-center gap-x-1.5 pr-[3.5px] pl-1">
                      <div className="h-5 w-20 rounded bg-gray-200"></div>
                    </div>
                  </div>
                  <div className="bg-white-100 overflow-hidden border-b border-[#EEEFF1]">
                    <div className="flex h-full w-full items-center gap-x-1.5 pr-[3.5px] pl-1">
                      <div className="h-5 w-18 rounded bg-gray-200"></div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
