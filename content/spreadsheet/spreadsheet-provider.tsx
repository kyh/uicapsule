"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import { useEnrichment } from "./use-enrichment";

type Person = {
  id: string;
  linkedinUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
};

interface SpreadsheetContextType {
  // Data
  data: Person[];
  setData: (data: Person[]) => void;

  // UI State
  selectedCells: Set<string>;
  setSelectedCells: (cells: Set<string>) => void;
  editingCell: { rowIndex: number; columnId: string } | null;
  setEditingCell: (cell: { rowIndex: number; columnId: string } | null) => void;

  // Drag Selection
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  dragStartCell: { rowIndex: number; columnId: string } | null;
  setDragStartCell: (
    cell: { rowIndex: number; columnId: string } | null,
  ) => void;
  dragEndCell: { rowIndex: number; columnId: string } | null;
  setDragEndCell: (cell: { rowIndex: number; columnId: string } | null) => void;

  // Column Management
  columnWidths: Record<string, number>;
  setColumnWidths: React.Dispatch<React.SetStateAction<Record<string, number>>>;

  // Enrichment
  isEnriching: boolean;
  startEnrichment: () => void;

  // Actions
  addRow: () => void;
  deleteRow: (rowIndex: number) => void;
  updateData: (rowIndex: number, columnId: string, value: any) => void;

  // Refs
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  dragLineRef: React.RefObject<HTMLDivElement | null>;
  dragLineVisible: boolean;
  setDragLineVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const SpreadsheetContext = createContext<SpreadsheetContextType | undefined>(
  undefined,
);

const generateSampleData = (count: number): Person[] => {
  const linkedinUrls = [
    "https://linkedin.com/in/john-smith-tech",
    "https://linkedin.com/in/sarah-johnson-marketing",
    "https://linkedin.com/in/michael-brown-sales",
    "https://linkedin.com/in/emily-davis-hr",
    "https://linkedin.com/in/david-wilson-finance",
    "https://linkedin.com/in/jessica-garcia-product",
    "https://linkedin.com/in/robert-miller-engineering",
    "https://linkedin.com/in/amanda-taylor-design",
    "https://linkedin.com/in/christopher-anderson-ops",
    "https://linkedin.com/in/michelle-thomas-strategy",
    "https://linkedin.com/in/james-jackson-consulting",
    "https://linkedin.com/in/lisa-white-analytics",
    "https://linkedin.com/in/daniel-harris-growth",
    "https://linkedin.com/in/jennifer-martin-content",
    "https://linkedin.com/in/matthew-thompson-dev",
    "https://linkedin.com/in/ashley-clark-partnerships",
    "https://linkedin.com/in/andrew-rodriguez-security",
    "https://linkedin.com/in/stephanie-lewis-legal",
    "https://linkedin.com/in/joshua-lee-research",
    "https://linkedin.com/in/nicole-walker-customer",
    "https://linkedin.com/in/ryan-hall-innovation",
    "https://linkedin.com/in/rachel-allen-communications",
    "https://linkedin.com/in/brandon-young-infrastructure",
    "https://linkedin.com/in/samantha-king-quality",
    "https://linkedin.com/in/kevin-wright-business",
    "https://linkedin.com/in/lauren-lopez-training",
    "https://linkedin.com/in/tyler-hill-compliance",
    "https://linkedin.com/in/megan-green-procurement",
    "https://linkedin.com/in/jonathan-adams-logistics",
    "https://linkedin.com/in/brittany-baker-relations",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    linkedinUrl: linkedinUrls[i] || `https://linkedin.com/in/user-${i + 1}`,
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    role: "",
  }));
};

interface SpreadsheetProviderProps {
  children: React.ReactNode;
  initialData?: Person[];
}

export const SpreadsheetProvider: React.FC<SpreadsheetProviderProps> = ({
  children,
  initialData,
}) => {
  const [data, setData] = useState<Person[]>(
    () => initialData || generateSampleData(30),
  );
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null);
  const [dragEndCell, setDragEndCell] = useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    linkedinUrl: 250,
    firstName: 120,
    lastName: 120,
    email: 180,
    company: 150,
    role: 150,
  });
  const [dragLineVisible, setDragLineVisible] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const dragLineRef = useRef<HTMLDivElement>(null);

  const updateData = useCallback(
    (rowIndex: number, columnId: string, value: any) => {
      setData((old) =>
        old.map((row, index) => {
          if (index === rowIndex) {
            return {
              ...old[rowIndex],
              [columnId]: value,
            };
          }
          return row;
        }),
      );
    },
    [],
  );

  const { isEnriching, startEnrichment } = useEnrichment(data, updateData);

  const addRow = useCallback(() => {
    const newRow: Person = {
      id: `${data.length + 1}`,
      linkedinUrl: "",
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      role: "",
    };
    setData((old) => [...old, newRow]);
  }, [data.length]);

  const deleteRow = useCallback((rowIndex: number) => {
    setData((old) => old.filter((_, index) => index !== rowIndex));
  }, []);

  const value: SpreadsheetContextType = {
    data,
    setData,
    selectedCells,
    setSelectedCells,
    editingCell,
    setEditingCell,
    isDragging,
    setIsDragging,
    dragStartCell,
    setDragStartCell,
    dragEndCell,
    setDragEndCell,
    columnWidths,
    setColumnWidths,
    isEnriching,
    startEnrichment,
    addRow,
    deleteRow,
    updateData,
    tableContainerRef,
    dragLineRef,
    dragLineVisible,
    setDragLineVisible,
  };

  return (
    <SpreadsheetContext.Provider value={value}>
      {children}
    </SpreadsheetContext.Provider>
  );
};

export const useSpreadsheet = () => {
  const context = useContext(SpreadsheetContext);
  if (context === undefined) {
    throw new Error("useSpreadsheet must be used within a SpreadsheetProvider");
  }
  return context;
};

export type { Person };
