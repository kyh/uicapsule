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

const pick = <T>(list: readonly [T, ...T[]]) =>
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

export interface AiEnrichmentOptions {
  /** Random delay range, in ms, before each cell resolves. */
  delayMs?: readonly [min: number, max: number];
  /** Text a cell shows while its value is generating. */
  placeholder?: string;
}

const createTransport = (
  storeApi: StoreApi<SpreadsheetStore>,
  [minDelay, maxDelay]: readonly [number, number],
  placeholder: string,
) =>
  new StaticChatTransport<CustomUIMessage>({
    chunkDelayMs: [minDelay, maxDelay],
    async *mockResponse() {
      const store = storeApi.getState();
      const { selectedCells } = store;
      const cells = [...selectedCells];

      for (const cellKey of cells) {
        const [rowId, columnId] = cellKey.split(":");

        if (rowId === undefined || rowId === "" || columnId === undefined || columnId === "") {
          continue;
        }

        const generateValue = fakeData.get(columnId);

        if (!generateValue) {
          continue;
        }

        const value = generateValue();
        store.updateData(rowId, columnId, placeholder);

        yield {
          data: { columnId, rowId, value },
          type: "data-updateCell",
        };
      }
    },
  });

const DEFAULT_DELAY_MS = [400, 1400] as const;

export const useAiEnrichment = ({
  delayMs = DEFAULT_DELAY_MS,
  placeholder = "Generating...",
}: AiEnrichmentOptions = {}) => {
  const storeApi = useSpreadsheetApi();
  const [minDelay, maxDelay] = delayMs;

  const transport = useMemo(
    () => createTransport(storeApi, [minDelay, maxDelay], placeholder),
    [storeApi, minDelay, maxDelay, placeholder],
  );

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
