"use client";

import { Receipt } from "../receipt";
import { receiptArtVariants } from "../receipt-art";

export const ReceiptPreview = ({ art }: { art?: string }) => (
  <Receipt
    filed={{
      art: receiptArtVariants.find((variant) => variant === art) ?? "fan",
      attachments: 1,
      filedAt: "Sep 19, 2026",
      links: 2,
      name: "Shutter button",
      number: 284,
      url: "https://github.com/kyh/uicapsule/issues",
    }}
  />
);
