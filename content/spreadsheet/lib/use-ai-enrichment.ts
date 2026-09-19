import { useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { StaticChatTransport } from "@loremllm/transport";

import type { StoreApi } from "zustand";
import type { SpreadsheetStore } from "./spreadsheet-store";
import type { UIMessage } from "@ai-sdk/react";
import { useSpreadsheetApi } from "./spreadsheet-store";

type CustomUIMessage = UIMessage<
  unknown,
  {
    updateCell: {
      rowId: string;
      columnId: string;
      value: string;
    };
  }
>;

// The random index is always in range; the `?? list[0]` only satisfies
// `noUncheckedIndexedAccess`, which the non-empty tuple keeps well-typed.
const pick = <T>(list: readonly [T, ...T[]]): T =>
  list[Math.floor(Math.random() * list.length)] ?? list[0];

const fakeData = new Map<string, () => string>([
  [
    "firstName",
    () => pick(["John", "Jane", "Michael", "Sarah", "David", "Emily", "James", "Emma"]),
  ],
  [
    "lastName",
    () => pick(["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"]),
  ],
  [
    "email",
    () => {
      const domain = pick(["example.com", "demo.org", "test.io"]);
      return `${Math.random().toString(36).slice(2, 15)}@${domain}`;
    },
  ],
  [
    "company",
    () =>
      pick([
        "Acme Corp",
        "Tech Solutions",
        "Global Industries",
        "Digital Ventures",
        "Innovation Labs",
        "Future Systems",
      ]),
  ],
  [
    "role",
    () =>
      pick([
        "Software Engineer",
        "Product Manager",
        "Data Scientist",
        "Designer",
        "Marketing Director",
        "Sales Executive",
      ]),
  ],
]);

const createTransport = (storeApi: StoreApi<SpreadsheetStore>) =>
  new StaticChatTransport<CustomUIMessage>({
    chunkDelayMs: [400, 1400],
    async *mockResponse() {
      const store = storeApi.getState();
      const { selectedCells } = store;
      const cells = [...selectedCells];

      for (const cellKey of cells) {
        const [rowId, columnId] = cellKey.split(":");
        if (!rowId || !columnId) {
          continue;
        }
        const generateValue = fakeData.get(columnId);
        if (!generateValue) {
          continue;
        }
        const value = generateValue();
        store.updateData(rowId, columnId, "Generating...");

        yield {
          data: { columnId, rowId, value },
          type: "data-updateCell",
        };
      }
    },
  });

export const useAiEnrichment = () => {
  const storeApi = useSpreadsheetApi();
  const transport = useMemo(() => createTransport(storeApi), [storeApi]);

  const { sendMessage, status } = useChat<CustomUIMessage>({
    onData: (dataPart) => {
      if (dataPart.type === "data-updateCell") {
        const { rowId, columnId, value } = dataPart.data;
        const store = storeApi.getState();
        store.updateData(rowId, columnId, value);
      }
    },
    transport,
  });

  const handleEnrich = useCallback(() => {
    void sendMessage({ text: "enrich" });
  }, [sendMessage]);

  const aiGenerating = status === "streaming" || status === "submitted";

  return {
    aiGenerating,
    handleEnrich,
  };
};
