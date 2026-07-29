/**
 * Student Information System adapters — deliberately a different shape
 * from IntegrationAdapter (adapter.ts). A SIS like Infinite Campus isn't
 * an LMS: there's no "course" with "assignments" to push into. What it
 * actually does is own the official roster and the official gradebook —
 * so the two things worth integrating are pulling the roster and pushing
 * a final grade back, not creating coursework.
 *
 * SIS access is also provisioned differently: a district's IT department
 * issues API credentials directly (often per-building, per-vendor
 * agreement) rather than a self-serve "Connect with Google" OAuth flow.
 * `baseUrl` is per-connection (stored in IntegrationConnection.metadata)
 * because every district's instance lives at its own subdomain.
 */

import type { IntegrationProviderType } from "@prisma/client";

export interface SisCredentials {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
}

export interface SisRosterStudent {
  sisStudentId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  gradeLevel: string;
}

export interface SisRosterSection {
  sisSectionId: string;
  name: string;
  teacherSisId: string;
  students: SisRosterStudent[];
}

export interface SisGradePassback {
  sisStudentId: string;
  sisSectionId: string;
  assignmentName: string;
  pointsEarned: number;
  pointsPossible: number;
}

export interface SisAdapter {
  readonly provider: IntegrationProviderType;

  /** Pull the official roster for a school so ClassPeriod/Enrollment can be
   * reconciled against it, rather than hand-entered. */
  fetchRoster(credentials: SisCredentials, schoolSisId: string): Promise<SisRosterSection[]>;

  /** Push a final grade back to the district's official gradebook. */
  pushGrade(credentials: SisCredentials, grade: SisGradePassback): Promise<void>;
}

export class SisCapabilityError extends Error {
  constructor(provider: IntegrationProviderType, capability: string) {
    super(`${provider} adapter does not support "${capability}"`);
    this.name = "SisCapabilityError";
  }
}
