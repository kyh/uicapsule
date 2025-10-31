import type { UIMessage } from "@ai-sdk/react";

// Generate fake enriched data for a cell based on its column
const generateFakeValue = (
  columnId: string,
  linkedinUrl?: string,
  existingData?: Record<string, unknown>,
): string => {
  const fakeData: Record<string, () => string> = {
    firstName: () => {
      const names = [
        "John",
        "Jane",
        "Michael",
        "Sarah",
        "David",
        "Emily",
        "James",
        "Emma",
      ];
      return names[Math.floor(Math.random() * names.length)];
    },
    lastName: () => {
      const names = [
        "Smith",
        "Johnson",
        "Williams",
        "Brown",
        "Jones",
        "Garcia",
        "Miller",
        "Davis",
      ];
      return names[Math.floor(Math.random() * names.length)];
    },
    email: () => {
      const firstName = (existingData?.firstName as string) || "user";
      const lastName = (existingData?.lastName as string) || "example";
      const domains = ["example.com", "demo.org", "test.io"];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
    },
    company: () => {
      const companies = [
        "Acme Corp",
        "Tech Solutions",
        "Global Industries",
        "Digital Ventures",
        "Innovation Labs",
        "Future Systems",
      ];
      return companies[Math.floor(Math.random() * companies.length)];
    },
    role: () => {
      const roles = [
        "Software Engineer",
        "Product Manager",
        "Data Scientist",
        "Designer",
        "Marketing Director",
        "Sales Executive",
      ];
      return roles[Math.floor(Math.random() * roles.length)];
    },
  };

  const generator = fakeData[columnId];
  return generator ? generator() : "";
};

export const generateFakeToolCalls = (
  selectedCells: Set<string>,
  data?: Record<string, unknown>[],
): UIMessage => {
  if (selectedCells.size === 0) {
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      parts: [],
    };
  }

  // Group selected cells by row
  const updatesByRow = new Map<
    string,
    Array<{ columnId: string; value: string }>
  >();

  selectedCells.forEach((cellKey) => {
    const [rowId, columnId] = cellKey.split(":");
    if (!rowId || !columnId) {
      return;
    }

    // Find the row data if available
    const rowData = data?.find((row) => row.id === rowId);

    // Skip linkedinUrl column for enrichment (it's the source)
    if (columnId === "linkedinUrl") {
      return;
    }

    const existingData = rowData as Record<string, unknown> | undefined;
    const linkedinUrl = existingData?.linkedinUrl as string | undefined;

    const value = generateFakeValue(columnId, linkedinUrl, existingData);

    if (!value) {
      return;
    }

    if (!updatesByRow.has(rowId)) {
      updatesByRow.set(rowId, []);
    }
    updatesByRow.get(rowId)!.push({ columnId, value });
  });

  // Create tool parts for each cell update
  // We'll create them with input-available state first, then they'll transition to output-available
  const toolParts: Array<{
    type: `tool-updateCell`;
    toolCallId: string;
    state: "input-available" | "output-available";
    input: {
      rowId: string;
      columnId: string;
      value: string;
    };
    output?: {
      success: boolean;
      rowId: string;
      columnId: string;
      value: string;
    };
  }> = [];

  const timestamp = Date.now();
  updatesByRow.forEach((updates, rowId) => {
    updates.forEach((update, index) => {
      const toolCallId = `tool-call-${rowId}-${update.columnId}-${timestamp}-${index}`;

      // First add input-available state (tool call started)
      toolParts.push({
        type: `tool-updateCell` as const,
        toolCallId,
        state: "input-available" as const,
        input: {
          rowId,
          columnId: update.columnId,
          value: update.value,
        },
      });

      // Then add output-available state (tool call completed)
      toolParts.push({
        type: `tool-updateCell` as const,
        toolCallId,
        state: "output-available" as const,
        input: {
          rowId,
          columnId: update.columnId,
          value: update.value,
        },
        output: {
          success: true,
          rowId,
          columnId: update.columnId,
          value: update.value,
        },
      });
    });
  });

  // Create assistant message with tool parts
  const assistantMessage: UIMessage = {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    parts: toolParts as any, // Type assertion needed as tool parts structure matches ToolUIPart but types don't align perfectly
  };

  return assistantMessage;
};
