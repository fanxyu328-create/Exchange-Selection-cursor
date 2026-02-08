export enum UserStatus {
  Waiting = 'Waiting',
  Selecting = 'Selecting',
  Completed = 'Completed',
  Skipped = 'Skipped' // For users who opt out or don't participate in a round
}

export enum Semester {
  Fall = 'Fall',
  Spring = 'Spring'
}

export interface Selection {
  schoolId: number;
  semester: Semester;
  isFlexibleSlot: boolean;
}

export interface User {
  id: number;
  name: string;
  rank: number;
  status: UserStatus;
  needsDoubleSemester: boolean; // Field to determine Round 2 eligibility
  selectedRound1: Selection | null;
  selectedRound2: Selection | null;
  isAdmin?: boolean;
}

export interface School {
  id: number;
  name: string;
  country: string;
  slotsFall: number;
  slotsSpring: number;
  slotsFlexible: number;
}

export interface AppState {
  users: User[];
  schools: School[];
  currentRound: 1 | 2;
  currentUser: User | null; // The logged-in user
}