import type { LucideIcon } from "lucide-react";

export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  age: number;
  gender: PersonGender;
  department: PersonDepartment;
  position: string;
  salary: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  skills?: PersonSkill[];
  location: PersonLocation;
  manager?: Person;
  isRemote: boolean;
  experience: number;
  education: PersonEducation;
  performance: PersonPerformance;
};

export type PersonGender = {
  id: "male" | "female" | "non-binary" | "other";
  name: string;
  order: number;
  icon: LucideIcon;
};

export type PersonDepartment = {
  id: string;
  name: string;
  color: string;
};

export type PersonSkill = {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  color: string;
};

export type PersonLocation = {
  city: string;
  state: string;
  country: string;
  timezone: string;
};

export type PersonEducation = {
  degree: string;
  field: string;
  institution: string;
  graduationYear: number;
};

export type PersonPerformance = {
  rating: number; // 1-5
  lastReview: Date;
  goals: string[];
};
