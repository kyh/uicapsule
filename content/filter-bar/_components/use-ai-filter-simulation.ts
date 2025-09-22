import { useCallback, useEffect, useRef, useState } from "react";

import type { Column, DataTableFilterActions } from "../filter-package";
import { isAnyOf } from "../filter-package";

interface UseAiFilterSimulationParams<TData> {
  visibleOptionColumns: Column<TData>[];
  actions: DataTableFilterActions;
}

interface UseAiFilterSimulationResult {
  aiGenerating: boolean;
  handleAiFilterSubmit: (prompt: string) => void;
}

export function useAiFilterSimulation<TData>(
  params: UseAiFilterSimulationParams<TData>,
): UseAiFilterSimulationResult {
  const { visibleOptionColumns, actions } = params;
  const [aiGenerating, setAiGenerating] = useState(false);
  const aiTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearAiTimeouts = useCallback(() => {
    aiTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    aiTimeoutsRef.current = [];
  }, []);

  useEffect(() => clearAiTimeouts, [clearAiTimeouts]);

  const optionColumns = visibleOptionColumns.filter((column) =>
    isAnyOf(column.type, ["option", "multiOption"]),
  );

  const handleAiFilterSubmit = useCallback(
    (prompt: string) => {
      if (!prompt.trim()) return;
      clearAiTimeouts();
      const [column1, column2] = optionColumns.slice(0, 2);

      if (!column1) {
        setAiGenerating(false);
        return;
      }

      actions.removeAllFilters();
      setAiGenerating(true);

      // Generate random delays for more natural feel
      const firstDelay = 800 + Math.floor(Math.random() * 600); // 800-1400ms
      const secondDelay = firstDelay + 600 + Math.floor(Math.random() * 600); // 1400-2600ms

      // Apply first filter after random delay
      const timeout1 = setTimeout(() => {
        if (column1) {
          const options1 = column1.getOptions();
          if (options1 && options1.length > 0) {
            const option1 = options1[0];
            actions.setFilterValue(
              column1 as Column<TData, any>,
              [option1.value] as any,
            );
          }
        }
      }, firstDelay);

      // Apply both filters together after second random delay
      const timeout2 = setTimeout(() => {
        actions.batch((batchActions) => {
          // Set first filter
          if (column1) {
            const options1 = column1.getOptions();
            if (options1 && options1.length > 0) {
              const option1 = options1[0];
              batchActions.setFilterValue(
                column1 as Column<TData, any>,
                [option1.value] as any,
              );
            }
          }

          // Set second filter
          if (column2) {
            const options2 = column2.getOptions();
            if (options2 && options2.length > 0) {
              const option2 = options2[0];
              batchActions.setFilterValue(
                column2 as Column<TData, any>,
                [option2.value] as any,
              );
            }
          }

          setAiGenerating(false);
        });
      }, secondDelay);

      aiTimeoutsRef.current.push(timeout1, timeout2);
    },
    [actions, clearAiTimeouts, optionColumns],
  );

  return {
    aiGenerating,
    handleAiFilterSubmit,
  };
}
