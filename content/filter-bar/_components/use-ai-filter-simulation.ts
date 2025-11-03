import { useCallback, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { StaticChatTransport } from "@loremllm/transport";

import type { Column, DataTableFilterActions } from "../filter-package";
import type { UIMessage } from "@ai-sdk/react";

type FilterUIMessage = UIMessage<
  unknown,
  {
    setFilter: {
      columnId: string;
      values: unknown[];
    };
  }
>;

const transport = new StaticChatTransport<FilterUIMessage>({
  async *mockResponse() {
    yield {
      type: "data-setFilter",
      data: {
        columnId: "skills",
        values: ["javascript", "typescript", "react", "nodejs"],
      },
    };

    yield {
      type: "data-setFilter",
      data: {
        columnId: "department",
        values: ["design"],
      },
    };
  },
  chunkDelayMs: [600, 1400],
});

type UseAiFilterSimulationParams = {
  columns: Column<any>[];
  actions: DataTableFilterActions;
};

export const useAiFilterSimulation = ({
  columns,
  actions,
}: UseAiFilterSimulationParams) => {
  const batchResultsRef = useRef<
    {
      column: Column<any>;
      values: unknown[];
    }[]
  >([]);

  console.log("batchResultsRef", batchResultsRef.current);

  const { sendMessage, status } = useChat<FilterUIMessage>({
    transport,
    onData: (dataPart) => {
      if (dataPart.type === "data-setFilter") {
        const { columnId, values } = dataPart.data;
        const column = columns.find((col) => col.id === columnId);
        if (column) {
          batchResultsRef.current.push({ column, values });
          actions.batch((batchActions) => {
            batchResultsRef.current.forEach(({ column, values }) => {
              batchActions.setFilterValue(column, values);
            });
          });
        }
      }
    },
    onFinish: () => {
      batchResultsRef.current = [];
    },
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
