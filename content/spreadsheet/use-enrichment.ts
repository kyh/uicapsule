"use client";

import { useCallback, useState } from "react";

type Person = {
  id: string;
  linkedinUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
};

export function useEnrichment(
  data: Person[],
  updateData: (rowIndex: number, columnId: string, value: any) => void,
) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentQueue, setEnrichmentQueue] = useState<
    Array<{ rowIndex: number; columnId: string }>
  >([]);

  const sampleData = {
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
    email: [
      "@gmail.com",
      "@outlook.com",
      "@company.com",
      "@yahoo.com",
      "@hotmail.com",
    ],
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
                    sampleData.firstName[
                      Math.floor(Math.random() * sampleData.firstName.length)
                    ];
                  break;
                case "lastName":
                  value =
                    sampleData.lastName[
                      Math.floor(Math.random() * sampleData.lastName.length)
                    ];
                  break;
                case "email":
                  const firstName = data[rowIndex].firstName || "user";
                  const lastName =
                    data[rowIndex].lastName ||
                    Math.random().toString(36).substring(7);
                  const domain =
                    sampleData.email[
                      Math.floor(Math.random() * sampleData.email.length)
                    ];
                  value = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${domain}`;
                  break;
                case "company":
                  value =
                    sampleData.company[
                      Math.floor(Math.random() * sampleData.company.length)
                    ];
                  break;
                case "role":
                  value =
                    sampleData.role[
                      Math.floor(Math.random() * sampleData.role.length)
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
    data.forEach((row, rowIndex) => {
      ["firstName", "lastName", "email", "company", "role"].forEach(
        (columnId) => {
          if (!row[columnId as keyof Person]) {
            emptyCells.push({ rowIndex, columnId });
            updateData(rowIndex, columnId, "Queued");
          }
        },
      );
    });

    setEnrichmentQueue(emptyCells);

    // Start processing queue after a short delay
    setTimeout(() => {
      processEnrichmentQueue(emptyCells);
    }, 500);
  }, [data, isEnriching, processEnrichmentQueue, updateData]);

  return {
    isEnriching,
    enrichmentQueue,
    startEnrichment,
  };
}
