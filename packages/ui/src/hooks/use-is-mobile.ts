"use client";

import { useMediaQuery } from "./use-media-query";

export const useIsMobile = () => useMediaQuery("(max-width: 767px)");
