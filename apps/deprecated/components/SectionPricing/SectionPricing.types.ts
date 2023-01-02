import React from "react";

export type PricingCardProps = {
  primary?: boolean;
  badge: string;
  title: string;
  price?: number | string;
  priceSuffix?: string;
  items: Array<{ title: string; text: string }>;
  href: string;
  onActionClick?: () => void;
  action: string;
  caption: React.ReactNode;
};
