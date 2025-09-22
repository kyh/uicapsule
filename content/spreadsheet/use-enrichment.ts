"use client";

import { useCallback, useState } from "react";

import type { EnrichmentHandlerParams } from "./spreadsheet-provider";

export type Person = {
  id: string;
  linkedinUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
};

const LINKEDIN_URLS = [
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

export const generateSamplePeople = (count: number): Person[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    linkedinUrl: LINKEDIN_URLS[i] || `https://linkedin.com/in/user-${i + 1}`,
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    role: "",
  }));
};

const ENRICHABLE_COLUMNS = [
  "firstName",
  "lastName",
  "email",
  "company",
  "role",
];

const SAMPLE_DATA = {
  firstName: [
    "John",
    "Sarah",
    "Michael",
    "Emily",
    "David",
    "Jessica",
    "Robert",
    "Amanda",
    "Christopher",
    "Michelle",
    "James",
    "Lisa",
    "Daniel",
    "Jennifer",
    "Matthew",
    "Ashley",
    "Andrew",
    "Stephanie",
    "Joshua",
    "Nicole",
    "Ryan",
    "Rachel",
    "Brandon",
    "Samantha",
    "Kevin",
    "Lauren",
    "Tyler",
    "Megan",
    "Jonathan",
    "Brittany",
  ],
  lastName: [
    "Smith",
    "Johnson",
    "Brown",
    "Davis",
    "Wilson",
    "Garcia",
    "Miller",
    "Taylor",
    "Anderson",
    "Thomas",
    "Jackson",
    "White",
    "Harris",
    "Martin",
    "Thompson",
    "Clark",
    "Rodriguez",
    "Lewis",
    "Lee",
    "Walker",
    "Hall",
    "Allen",
    "Young",
    "King",
    "Wright",
    "Lopez",
    "Hill",
    "Green",
    "Adams",
    "Baker",
  ],
  email: ["@gmail.com", "@outlook.com", "@company.com", "@yahoo.com", "@hotmail.com"],
  company: [
    "TechCorp",
    "InnovateLabs",
    "DataSystems",
    "CloudWorks",
    "NextGen Solutions",
    "Digital Dynamics",
    "FutureTech",
    "SmartSystems",
    "ProActive Inc",
    "Velocity Corp",
    "Synergy Group",
    "Quantum Labs",
    "Apex Technologies",
    "Prime Innovations",
    "Elite Systems",
  ],
  role: [
    "Software Engineer",
    "Product Manager",
    "Sales Director",
    "Marketing Manager",
    "Data Analyst",
    "UX Designer",
    "DevOps Engineer",
    "Business Analyst",
    "Operations Manager",
    "Customer Success",
    "Growth Manager",
    "Content Strategist",
    "Security Engineer",
    "Research Scientist",
    "Project Manager",
  ],
};

export const sampleEnrichmentHandler = ({
  data,
  updateData,
  selectedCells,
}: EnrichmentHandlerParams<Person>) => {
  const queue: Array<{ rowIndex: number; columnId: string }> = [];

  if (selectedCells.size > 0) {
    selectedCells.forEach((cellKey) => {
      const [rowIndexStr, columnId] = cellKey.split("-");
      const rowIndex = Number.parseInt(rowIndexStr, 10);

      if (
        ENRICHABLE_COLUMNS.includes(columnId) &&
        !data[rowIndex]?.[columnId as keyof Person]
      ) {
        queue.push({ rowIndex, columnId });
        updateData(rowIndex, columnId, "Queued");
      }
    });
  } else {
    data.forEach((row, rowIndex) => {
      ENRICHABLE_COLUMNS.forEach((columnId) => {
        if (!row[columnId as keyof Person]) {
          queue.push({ rowIndex, columnId });
          updateData(rowIndex, columnId, "Queued");
        }
      });
    });
  }

  if (queue.length === 0) {
    return Promise.resolve();
  }

  const shuffledQueue = [...queue].sort(() => Math.random() - 0.5);

  return new Promise<void>((resolve) => {
    shuffledQueue.forEach((cell, index) => {
      setTimeout(() => {
        updateData(cell.rowIndex, cell.columnId, "Researching...");

        const researchDelay = 1000 + Math.random() * 2000;
        setTimeout(() => {
          let value = "";

          switch (cell.columnId) {
            case "firstName":
              value =
                SAMPLE_DATA.firstName[
                  Math.floor(Math.random() * SAMPLE_DATA.firstName.length)
                ];
              break;
            case "lastName":
              value =
                SAMPLE_DATA.lastName[
                  Math.floor(Math.random() * SAMPLE_DATA.lastName.length)
                ];
              break;
            case "email": {
              const firstName = data[cell.rowIndex].firstName || "user";
              const lastName =
                data[cell.rowIndex].lastName ||
                Math.random().toString(36).substring(7);
              const domain =
                SAMPLE_DATA.email[
                  Math.floor(Math.random() * SAMPLE_DATA.email.length)
                ];
              value = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${domain}`;
              break;
            }
            case "company":
              value =
                SAMPLE_DATA.company[
                  Math.floor(Math.random() * SAMPLE_DATA.company.length)
                ];
              break;
            case "role":
              value =
                SAMPLE_DATA.role[
                  Math.floor(Math.random() * SAMPLE_DATA.role.length)
                ];
              break;
          }

          updateData(cell.rowIndex, cell.columnId, value);

          if (index === shuffledQueue.length - 1) {
            setTimeout(() => resolve(), 500);
          }
        }, researchDelay);
      }, index * 200);
    });

    if (shuffledQueue.length === 0) {
      resolve();
    }
  });
};

export function useEnrichment(
  data: Person[],
  updateData: (rowIndex: number, columnId: string, value: any) => void,
  selectedCells?: Set<string>,
) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentQueue, setEnrichmentQueue] = useState<
    Array<{ rowIndex: number; columnId: string }>
  >([]);

  const processEnrichmentQueue = useCallback(
    (queue: Array<{ rowIndex: number; columnId: string }>) => {
      if (queue.length === 0) {
        setIsEnriching(false);
        return;
      }

      // Shuffle the queue to make it look more realistic
      const shuffledQueue = [...queue].sort(() => Math.random() - 0.5);

      shuffledQueue.forEach((cell, index) => {
        // Stagger the start times
          setTimeout(() => {
            // Set to "Researching..."
            updateData(cell.rowIndex, cell.columnId, "Researching...");

            // After research delay, set the actual value
            setTimeout(
              () => {
                let value = "";
                const { rowIndex, columnId } = cell;

                switch (columnId) {
                  case "firstName":
                    value =
                      SAMPLE_DATA.firstName[
                        Math.floor(Math.random() * SAMPLE_DATA.firstName.length)
                      ];
                    break;
                  case "lastName":
                    value =
                      SAMPLE_DATA.lastName[
                        Math.floor(Math.random() * SAMPLE_DATA.lastName.length)
                      ];
                    break;
                  case "email":
                    const firstName = data[rowIndex].firstName || "user";
                    const lastName =
                      data[rowIndex].lastName ||
                      Math.random().toString(36).substring(7);
                    const domain =
                      SAMPLE_DATA.email[
                        Math.floor(Math.random() * SAMPLE_DATA.email.length)
                      ];
                    value = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${domain}`;
                    break;
                  case "company":
                    value =
                      SAMPLE_DATA.company[
                        Math.floor(Math.random() * SAMPLE_DATA.company.length)
                      ];
                    break;
                  case "role":
                    value =
                      SAMPLE_DATA.role[
                        Math.floor(Math.random() * SAMPLE_DATA.role.length)
                      ];
                    break;
                }

              updateData(cell.rowIndex, cell.columnId, value);

              // Check if this was the last item
              if (index === shuffledQueue.length - 1) {
                setTimeout(() => setIsEnriching(false), 500);
              }
            },
            1000 + Math.random() * 2000,
          ); // 1-3 seconds research time
        }, index * 200); // Stagger start times by 200ms
      });
    },
    [data, updateData],
  );

  const startEnrichment = useCallback(() => {
    if (isEnriching) return;

    setIsEnriching(true);

    // First, set all empty cells to "Queued"
    const emptyCells: Array<{ rowIndex: number; columnId: string }> = [];

    if (selectedCells && selectedCells.size > 0) {
      // Only enrich selected cells
      selectedCells.forEach((cellKey) => {
        const [rowIndexStr, columnId] = cellKey.split("-");
        const rowIndex = Number.parseInt(rowIndexStr);

        // Only enrich if it's an enrichable column and the cell is empty
        if (
          ENRICHABLE_COLUMNS.includes(columnId) &&
          !data[rowIndex]?.[columnId as keyof Person]
        ) {
          emptyCells.push({ rowIndex, columnId });
          updateData(rowIndex, columnId, "Queued");
        }
      });
    } else {
      // No selection, enrich all empty cells
      data.forEach((row, rowIndex) => {
        ENRICHABLE_COLUMNS.forEach((columnId) => {
          if (!row[columnId as keyof Person]) {
            emptyCells.push({ rowIndex, columnId });
            updateData(rowIndex, columnId, "Queued");
          }
        });
      });
    }

    setEnrichmentQueue(emptyCells);

    // Start processing queue after a short delay
    setTimeout(() => {
      processEnrichmentQueue(emptyCells);
    }, 500);
  }, [data, isEnriching, processEnrichmentQueue, updateData, selectedCells]);

  return {
    isEnriching,
    enrichmentQueue,
    startEnrichment,
  };
}
