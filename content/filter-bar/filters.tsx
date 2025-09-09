import {
  BuildingIcon,
  CalendarArrowUpIcon,
  DollarSignIcon,
  TargetIcon,
  UserCheckIcon,
  UserIcon,
} from "lucide-react";

import type { Person, PersonDepartment, PersonSkill } from "./types";
import { createColumnConfigHelper } from "./filter-package";

export const PERSON_DEPARTMENTS: PersonDepartment[] = [
  { id: "engineering", name: "Engineering", color: "blue" },
  { id: "design", name: "Design", color: "purple" },
  { id: "product", name: "Product", color: "green" },
  { id: "marketing", name: "Marketing", color: "orange" },
  { id: "sales", name: "Sales", color: "red" },
  { id: "hr", name: "Human Resources", color: "pink" },
  { id: "finance", name: "Finance", color: "teal" },
  { id: "operations", name: "Operations", color: "indigo" },
  { id: "customer-success", name: "Customer Success", color: "emerald" },
  { id: "data", name: "Data & Analytics", color: "cyan" },
  { id: "security", name: "Security", color: "rose" },
  { id: "legal", name: "Legal", color: "violet" },
] as const;

export const PERSON_SKILLS: PersonSkill[] = [
  { id: "javascript", name: "JavaScript", level: "expert", color: "yellow" },
  { id: "typescript", name: "TypeScript", level: "advanced", color: "blue" },
  { id: "react", name: "React", level: "expert", color: "cyan" },
  { id: "nodejs", name: "Node.js", level: "advanced", color: "green" },
];

const dtf = createColumnConfigHelper<Person>();

export const columnsConfig = [
  // Text column - Name (most important identifier)
  dtf
    .text()
    .id("name")
    .accessor((row) => `${row.firstName} ${row.lastName}`)
    .displayName("Name")
    .icon(UserIcon)
    .build(),

  // Option column - Department (categorical data)
  dtf
    .option()
    .accessor((row) => row.department.id)
    .id("department")
    .displayName("Department")
    .icon(BuildingIcon)
    .options(
      PERSON_DEPARTMENTS.map((d) => ({
        value: d.id,
        label: d.name,
        icon: BuildingIcon,
      })),
    )
    .build(),

  // Number column - Salary (quantitative data)
  dtf
    .number()
    .accessor((row) => row.salary)
    .id("salary")
    .displayName("Salary")
    .icon(DollarSignIcon)
    .min(20000)
    .max(300000)
    .build(),

  // Multi-option column - Skills (tags/categories)
  dtf
    .multiOption()
    .accessor((row) => row.skills)
    .id("skills")
    .displayName("Skills")
    .icon(TargetIcon)
    .options(
      PERSON_SKILLS.map((s) => ({
        value: s.id,
        label: s.name,
        icon: TargetIcon,
      })),
    )
    .build(),

  // Date column - Start Date (temporal data)
  dtf
    .date()
    .accessor((row) => row.startDate)
    .id("startDate")
    .displayName("Start Date")
    .icon(CalendarArrowUpIcon)
    .build(),

  // Boolean column - Active Status (yes/no data)
  dtf
    .boolean()
    .id("isActive")
    .accessor((row) => row.isActive)
    .displayName("Active employees")
    .toggledStateName("active")
    .icon(UserCheckIcon)
    .build(),
] as const;
