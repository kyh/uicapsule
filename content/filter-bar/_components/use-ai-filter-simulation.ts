import { useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { StaticChatTransport } from "@loremllm/transport";

import type { Column, DataTableFilterActions } from "../filter-package";
import type { UIMessage } from "@ai-sdk/react";

type FilterUIMessage = UIMessage<
  unknown,
  {
    setFilter: {
      columnId: string;
      values: string[];
    };
  }
>;

const transport = new StaticChatTransport<FilterUIMessage>({
  chunkDelayMs: [600, 1400],
  async *mockResponse() {
    yield {
      data: {
        columnId: "skills",
        values: ["javascript", "typescript", "react", "nodejs"],
      },
      type: "data-setFilter",
    };

    yield {
      data: {
        columnId: "department",
        values: ["design"],
      },
      type: "data-setFilter",
    };
  },
});

interface UseAiFilterSimulationParams {
  columns: Column[];
  actions: DataTableFilterActions;
}

export const useAiFilterSimulation = ({ columns, actions }: UseAiFilterSimulationParams) => {
  const { sendMessage, status } = useChat<FilterUIMessage>({
    onData: (dataPart) => {
      if (dataPart.type === "data-setFilter") {
        const { columnId, values } = dataPart.data;
        const column = columns.find((col) => col.id === columnId);
        if (column?.type === "option" || column?.type === "multiOption") {
          actions.setFilterValue({ columnId, type: column.type, values });
        }
      }
    },
    transport,
  });

  const handleAiFilterSubmit = useCallback(
    (prompt: string) => {
      actions.removeAllFilters();
      void sendMessage({ text: prompt });
    },
    [sendMessage, actions],
  );

  const aiGenerating = status === "streaming" || status === "submitted";

  return {
    aiGenerating,
    handleAiFilterSubmit,
  };
};
