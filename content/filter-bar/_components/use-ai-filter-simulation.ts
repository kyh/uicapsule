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

      // Find the skills and department columns
      const skillsColumn = visibleOptionColumns.find(
        (col) => col.id === "skills",
      );
      const departmentColumn = visibleOptionColumns.find(
        (col) => col.id === "department",
      );

      if (!skillsColumn || !departmentColumn) {
        setAiGenerating(false);
        return;
      }

      actions.removeAllFilters();
      setAiGenerating(true);

      // Generate random delays for more natural feel
      const firstDelay = 800 + Math.floor(Math.random() * 600); // 800-1400ms
      const secondDelay = firstDelay + 600 + Math.floor(Math.random() * 600); // 1400-2600ms

      // Apply first filter (skills) after random delay
      const timeout1 = setTimeout(() => {
        actions.setFilterValue(
          skillsColumn as Column<TData, any>,
          [
            "javascript",
            "typescript",
            "react",
            "nodejs",
            "python",
            "java",
            "go",
            "rust",
          ] as any,
        );
      }, firstDelay);

      // Apply both filters together after second random delay
      const timeout2 = setTimeout(() => {
        actions.batch((batchActions) => {
          // Set skills filter (multiOption)
          batchActions.setFilterValue(
            skillsColumn as Column<TData, any>,
            [
              "javascript",
              "typescript",
              "react",
              "nodejs",
              "python",
              "java",
              "go",
              "rust",
            ] as any,
          );

          // Set department filter (option)
          batchActions.setFilterValue(
            departmentColumn as Column<TData, any>,
            ["design"] as any,
          );

          setAiGenerating(false);
        });
      }, secondDelay);

      aiTimeoutsRef.current.push(timeout1, timeout2);
    },
    [actions, clearAiTimeouts, visibleOptionColumns],
  );

  return {
    aiGenerating,
    handleAiFilterSubmit,
  };
}
