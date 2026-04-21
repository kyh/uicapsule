import { useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { StaticChatTransport } from "@loremllm/transport";

import type { UIMessage } from "@ai-sdk/react";
import { useSpreadsheetStore } from "./spreadsheet-store";

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

const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)] as T;

const generateFakeValue = (columnId: string): string => {
  const fakeData: Record<string, () => string> = {
    firstName: () => pick(["John", "Jane", "Michael", "Sarah", "David", "Emily", "James", "Emma"]),
    lastName: () =>
      pick(["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"]),
    email: () => {
      const domain = pick(["example.com", "demo.org", "test.io"]);
      return `${Math.random().toString(36).substring(2, 15)}@${domain}`;
    },
    company: () =>
      pick([
        "Acme Corp",
        "Tech Solutions",
        "Global Industries",
        "Digital Ventures",
        "Innovation Labs",
        "Future Systems",
      ]),
    role: () =>
      pick([
        "Software Engineer",
        "Product Manager",
        "Data Scientist",
        "Designer",
        "Marketing Director",
        "Sales Executive",
      ]),
  };

  const generator = fakeData[columnId];
  return generator ? generator() : "";
};

const createTransport = () => {
  return new StaticChatTransport<CustomUIMessage>({
    async *mockResponse() {
      const store = useSpreadsheetStore.getState();
      const { selectedCells } = store;
      const cells = Array.from(selectedCells).toSorted(() => Math.random() - 0.5);

      for (const cellKey of cells) {
        const [rowId, columnId] = cellKey.split(":");
        if (!rowId || !columnId) continue;
        const value = generateFakeValue(columnId);

        yield {
          type: "data-updateCell",
          data: { rowId, columnId, value },
        };
      }
    },
    chunkDelayMs: [400, 1400],
  });
};

export const useAiEnrichment = () => {
  const transport = useMemo(() => createTransport(), []);

  const { sendMessage, status } = useChat<CustomUIMessage>({
    transport,
    onData: (dataPart) => {
      if (dataPart.type === "data-updateCell") {
        const { rowId, columnId, value } = dataPart.data;
        const store = useSpreadsheetStore.getState();
        store.updateData(rowId, columnId, value);
      }
    },
  });

  const handleEnrich = useCallback(() => {
    const store = useSpreadsheetStore.getState();
    store.updateSelectedCellsData("Generating...");
    void sendMessage({ text: "enrich" });
  }, [sendMessage]);

  const aiGenerating = status === "streaming" || status === "submitted";

  return {
    aiGenerating,
    handleEnrich,
  };
};
