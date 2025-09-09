import React from "react";
import { cn } from "@repo/ui/utils";
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
  { id: "python", name: "Python", level: "intermediate", color: "yellow" },
  { id: "java", name: "Java", level: "advanced", color: "red" },
  { id: "go", name: "Go", level: "beginner", color: "blue" },
  { id: "rust", name: "Rust", level: "intermediate", color: "orange" },
  { id: "sql", name: "SQL", level: "advanced", color: "indigo" },
  { id: "aws", name: "AWS", level: "intermediate", color: "orange" },
  { id: "docker", name: "Docker", level: "advanced", color: "blue" },
  {
    id: "kubernetes",
    name: "Kubernetes",
    level: "intermediate",
    color: "blue",
  },
  { id: "figma", name: "Figma", level: "expert", color: "purple" },
  { id: "sketch", name: "Sketch", level: "advanced", color: "yellow" },
  { id: "photoshop", name: "Photoshop", level: "intermediate", color: "blue" },
  {
    id: "illustrator",
    name: "Illustrator",
    level: "beginner",
    color: "orange",
  },
  { id: "leadership", name: "Leadership", level: "expert", color: "green" },
  {
    id: "communication",
    name: "Communication",
    level: "advanced",
    color: "pink",
  },
  {
    id: "project-management",
    name: "Project Management",
    level: "intermediate",
    color: "teal",
  },
  {
    id: "data-analysis",
    name: "Data Analysis",
    level: "advanced",
    color: "cyan",
  },
  {
    id: "machine-learning",
    name: "Machine Learning",
    level: "beginner",
    color: "purple",
  },
  { id: "ui-design", name: "UI Design", level: "expert", color: "rose" },
  {
    id: "ux-research",
    name: "UX Research",
    level: "advanced",
    color: "indigo",
  },
  {
    id: "content-strategy",
    name: "Content Strategy",
    level: "intermediate",
    color: "emerald",
  },
  { id: "seo", name: "SEO", level: "beginner", color: "lime" },
  {
    id: "social-media",
    name: "Social Media",
    level: "advanced",
    color: "pink",
  },
  {
    id: "email-marketing",
    name: "Email Marketing",
    level: "intermediate",
    color: "blue",
  },
  { id: "salesforce", name: "Salesforce", level: "expert", color: "blue" },
  { id: "hubspot", name: "HubSpot", level: "advanced", color: "orange" },
  {
    id: "recruiting",
    name: "Recruiting",
    level: "intermediate",
    color: "green",
  },
  {
    id: "training",
    name: "Training & Development",
    level: "beginner",
    color: "purple",
  },
  { id: "accounting", name: "Accounting", level: "advanced", color: "teal" },
  {
    id: "budgeting",
    name: "Budgeting",
    level: "intermediate",
    color: "indigo",
  },
  { id: "compliance", name: "Compliance", level: "expert", color: "red" },
  {
    id: "risk-management",
    name: "Risk Management",
    level: "advanced",
    color: "orange",
  },
  {
    id: "customer-support",
    name: "Customer Support",
    level: "intermediate",
    color: "green",
  },
  {
    id: "technical-writing",
    name: "Technical Writing",
    level: "beginner",
    color: "blue",
  },
  {
    id: "public-speaking",
    name: "Public Speaking",
    level: "advanced",
    color: "purple",
  },
  {
    id: "negotiation",
    name: "Negotiation",
    level: "intermediate",
    color: "pink",
  },
  {
    id: "strategic-planning",
    name: "Strategic Planning",
    level: "expert",
    color: "emerald",
  },
  {
    id: "change-management",
    name: "Change Management",
    level: "advanced",
    color: "cyan",
  },
  {
    id: "team-building",
    name: "Team Building",
    level: "intermediate",
    color: "lime",
  },
  { id: "mentoring", name: "Mentoring", level: "beginner", color: "rose" },
  {
    id: "conflict-resolution",
    name: "Conflict Resolution",
    level: "advanced",
    color: "violet",
  },
  {
    id: "time-management",
    name: "Time Management",
    level: "expert",
    color: "amber",
  },
  {
    id: "problem-solving",
    name: "Problem Solving",
    level: "expert",
    color: "sky",
  },
  {
    id: "critical-thinking",
    name: "Critical Thinking",
    level: "advanced",
    color: "indigo",
  },
  {
    id: "creativity",
    name: "Creativity",
    level: "intermediate",
    color: "fuchsia",
  },
  { id: "adaptability", name: "Adaptability", level: "expert", color: "teal" },
  {
    id: "emotional-intelligence",
    name: "Emotional Intelligence",
    level: "advanced",
    color: "pink",
  },
  {
    id: "cross-cultural",
    name: "Cross-cultural Communication",
    level: "intermediate",
    color: "green",
  },
  {
    id: "multilingual",
    name: "Multilingual",
    level: "beginner",
    color: "blue",
  },
] as const;

export const LABEL_STYLES_BG = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  yellow: "bg-yellow-500",
  lime: "bg-lime-500",
  green: "bg-green-500",
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
  sky: "bg-sky-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  purple: "bg-purple-500",
  fuchsia: "bg-fuchsia-500",
  pink: "bg-pink-500",
  rose: "bg-rose-500",
  neutral: "bg-neutral-500",
} as const;

export type TW_COLOR = keyof typeof LABEL_STYLES_BG;

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
        icon: (
          <div
            className={cn(
              "size-2.5 rounded-full",
              LABEL_STYLES_BG[s.color as TW_COLOR],
            )}
          />
        ),
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
