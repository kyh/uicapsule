import type { LucideIcon } from "lucide-react";

export interface Person {
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
}

export interface PersonGender {
  id: "male" | "female" | "non-binary" | "other";
  name: string;
  order: number;
  icon: LucideIcon;
}

export interface PersonDepartment {
  id: string;
  name: string;
  color: string;
}

export interface PersonSkill {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  color: string;
}

export interface PersonLocation {
  city: string;
  state: string;
  country: string;
  timezone: string;
}

export interface PersonEducation {
  degree: string;
  field: string;
  institution: string;
  graduationYear: number;
}

export interface PersonPerformance {
  // 1-5
  rating: number;
  lastReview: Date;
  goals: string[];
}
