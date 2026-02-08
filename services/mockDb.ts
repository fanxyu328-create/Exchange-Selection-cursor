import { AppState, School, User, UserStatus, Semester, Selection } from '../types';

const STORAGE_KEY = 'exchange_app_db_v1';

// Initial Seed Data
const INITIAL_SCHOOLS: School[] = [
  { id: 1, name: 'University of California, Berkeley', country: 'USA', slotsFall: 1, slotsSpring: 1, slotsFlexible: 0 },
  { id: 2, name: 'ETH Zurich', country: 'Switzerland', slotsFall: 2, slotsSpring: 0, slotsFlexible: 1 },
  { id: 3, name: 'University of Tokyo', country: 'Japan', slotsFall: 1, slotsSpring: 1, slotsFlexible: 1 },
  { id: 4, name: 'National University of Singapore', country: 'Singapore', slotsFall: 2, slotsSpring: 2, slotsFlexible: 0 },
  { id: 5, name: 'University of Melbourne', country: 'Australia', slotsFall: 0, slotsSpring: 2, slotsFlexible: 2 },
  { id: 6, name: 'Seoul National University', country: 'South Korea', slotsFall: 1, slotsSpring: 1, slotsFlexible: 0 },
  { id: 7, name: 'Technical University of Munich', country: 'Germany', slotsFall: 2, slotsSpring: 0, slotsFlexible: 0 },
];

const INITIAL_USERS: User[] = [
  { id: 1, name: 'Alice Chen', rank: 1, status: UserStatus.Selecting, needsDoubleSemester: true, selectedRound1: null, selectedRound2: null },
  { id: 2, name: 'Bob Smith', rank: 2, status: UserStatus.Waiting, needsDoubleSemester: true, selectedRound1: null, selectedRound2: null },
  { id: 3, name: 'Charlie Kim', rank: 3, status: UserStatus.Waiting, needsDoubleSemester: true, selectedRound1: null, selectedRound2: null },
  { id: 4, name: 'David Lee', rank: 4, status: UserStatus.Waiting, needsDoubleSemester: true, selectedRound1: null, selectedRound2: null },
  { id: 5, name: 'Eve Patel', rank: 5, status: UserStatus.Waiting, needsDoubleSemester: true, selectedRound1: null, selectedRound2: null },
  { id: 6, name: 'Frank Wright', rank: 6, status: UserStatus.Waiting, needsDoubleSemester: true, selectedRound1: null, selectedRound2: null },
];

export class MockService {
  private state: AppState;
  private lastReadTime: number;

  constructor() {
    this.lastReadTime = 0;
    this.load();
    
    // If empty or invalid, init defaults
    if (!this.state || !this.state.users) {
       this.state = {
        users: INITIAL_USERS,
        schools: INITIAL_SCHOOLS,
        currentRound: 1,
        currentUser: null,
      };
      this.save();
    }
  }

  private load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      this.state = JSON.parse(saved);
    }
    this.lastReadTime = Date.now();
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    this.lastReadTime = Date.now();
  }

  // Called by UI polling to check if Admin updated data in another tab/context
  sync() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    
    const newState = JSON.parse(saved) as AppState;
    
    this.state.users = newState.users;
    this.state.schools = newState.schools;
    this.state.currentRound = newState.currentRound;
    
    // Re-validate current user session
    if (this.state.currentUser) {
      // If user is admin (fake ID 0), keep session if it's just a refresh, 
      // but usually we don't persist admin user in the users list array, so no check needed against users array.
      if (this.state.currentUser.isAdmin) {
         return;
      }

      const exists = this.state.users.find(u => u.id === this.state.currentUser!.id);
      if (!exists) {
        this.state.currentUser = null;
      } else {
        // Update current user object details in case rank/status changed
        this.state.currentUser = exists; 
      }
    }
  }

  // --- Admin Operations ---

  resetData(usersInput: any[], schoolsInput: any[]) {
    // 1. Sanitize and Map Users
    const newUsers: User[] = usersInput.map(u => ({
      id: u.id,
      name: u.name,
      rank: u.rank,
      status: UserStatus.Waiting, // Default to waiting, will be calculated next
      needsDoubleSemester: u.needsDoubleSemester !== undefined ? !!u.needsDoubleSemester : true, // Default to true if missing
      selectedRound1: null,
      selectedRound2: null
    })).sort((a, b) => a.rank - b.rank);

    // 2. Sanitize Schools
    const newSchools: School[] = schoolsInput.map(s => ({
      id: s.id,
      name: s.name,
      country: s.country,
      slotsFall: Number(s.slotsFall),
      slotsSpring: Number(s.slotsSpring),
      slotsFlexible: Number(s.slotsFlexible)
    }));

    // 3. Update State
    this.state.users = newUsers;
    this.state.schools = newSchools;
    this.state.currentRound = 1;
    
    // 4. Calculate Logic (Determine who is Active)
    this.refreshStatus(); 
    
    // 5. Save
    this.save();
  }

  // --- Read Operations ---

  getUsers(): User[] {
    return [...this.state.users].sort((a, b) => a.rank - b.rank);
  }

  getSchools(): School[] {
    return [...this.state.schools];
  }

  getCurrentRound(): 1 | 2 {
    return this.state.currentRound;
  }

  // Identify who is currently supposed to pick
  getActiveRank(): number | null {
    // Create a copy to sort, avoiding mutation of state in place
    const sortedUsers = [...this.state.users].sort((a, b) => a.rank - b.rank);
    
    // Find the first user who is not completed or skipped
    // In Round 2, only consider users eligible for Round 2
    const activeUser = sortedUsers.find(u => {
      if (this.state.currentRound === 2) {
         // In round 2, we only care about users who need double semester AND successfully picked in round 1
         // If they skipped Round 1, selectedRound1 will be null, so they are skipped here.
         const eligible = u.needsDoubleSemester && u.selectedRound1 !== null;
         if (!eligible) return false;
      }
      return u.status !== UserStatus.Completed && u.status !== UserStatus.Skipped;
    });

    return activeUser ? activeUser.rank : null;
  }

  // --- Auth ---

  login(nameOrId: string): User | null {
    // Sync before login to get latest data
    this.sync(); 
    
    // Admin Login Check
    if (nameOrId.toLowerCase() === 'admin') {
      const adminUser: User = {
        id: 0,
        name: 'Administrator',
        rank: 0,
        status: UserStatus.Skipped,
        needsDoubleSemester: false,
        selectedRound1: null,
        selectedRound2: null,
        isAdmin: true
      };
      this.state.currentUser = adminUser;
      this.save();
      return adminUser;
    }

    // Student Login Check
    const user = this.state.users.find(
      u => u.name.toLowerCase() === nameOrId.toLowerCase() || u.id.toString() === nameOrId
    );
    if (user) {
      this.state.currentUser = user;
      this.save();
      return user;
    }
    return null;
  }

  logout() {
    this.state.currentUser = null;
    this.save();
  }

  // --- Write Operations ---

  // Check if round should advance or status update is needed
  refreshStatus() {
    const activeRank = this.getActiveRank();
    
    if (activeRank === null) {
      // Current round finished?
      if (this.state.currentRound === 1) {
        // Transition to Round 2
        this.state.currentRound = 2;
        // Reset status for eligible users for Round 2
        this.state.users = this.state.users.map(u => {
          // Rule: Must need double semester AND must have picked something in Round 1
          if (u.needsDoubleSemester && u.selectedRound1) {
            return { ...u, status: UserStatus.Waiting }; // Reset to waiting for R2
          } else {
             return { ...u, status: UserStatus.Skipped }; // Skip others (including those who skipped R1)
          }
        });
        
        // Recalculate active rank for Round 2 immediately
        const round2ActiveRank = this.getActiveRank();
         if (round2ActiveRank !== null) {
            this.state.users = this.state.users.map(u => {
              if (u.rank === round2ActiveRank) return { ...u, status: UserStatus.Selecting };
              if (u.status === UserStatus.Selecting) return { ...u, status: UserStatus.Waiting };
              return u;
            });
         }
      } else {
        // Round 2 finished
      }
    } else {
      // Ensure the active rank user is set to "Selecting" and others "Waiting"
      this.state.users = this.state.users.map(u => {
        // Don't touch Completed/Skipped
        if (u.status === UserStatus.Completed || u.status === UserStatus.Skipped) return u;
        
        if (u.rank === activeRank) {
          return { ...u, status: UserStatus.Selecting };
        }
        return { ...u, status: UserStatus.Waiting }; // Reset others who might have been selecting
      });
    }
    this.save();
  }

  // Make a selection
  submitSelection(userId: number, schoolId: number, semester: Semester): { success: boolean, message?: string } {
    // Sync first to avoid race conditions
    this.sync();

    // 1. Validate User
    const userIndex = this.state.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return { success: false, message: 'User not found' };
    const user = this.state.users[userIndex];

    // 2. Validate Turn
    const activeRank = this.getActiveRank();
    if (user.rank !== activeRank) {
      return { success: false, message: `It is currently Rank ${activeRank}'s turn.` };
    }

    // 2.5. Round 2: 两轮不能选择同一学期
    if (this.state.currentRound === 2 && user.selectedRound1 && user.selectedRound1.semester === semester) {
      return { success: false, message: '两轮不能选择同一学期，请选择另一学期。' };
    }
    // 2.6. Round 2: 两轮不能选择同一学校
    if (this.state.currentRound === 2 && user.selectedRound1 && user.selectedRound1.schoolId === schoolId) {
      return { success: false, message: '两轮不能选择同一学校，请选择其他学校。' };
    }

    // 3. Validate School Capacity
    const schoolIndex = this.state.schools.findIndex(s => s.id === schoolId);
    if (schoolIndex === -1) return { success: false, message: 'School not found' };
    const school = this.state.schools[schoolIndex];

    let isFlexibleUsed = false;

    if (semester === Semester.Fall) {
      if (school.slotsFall > 0) {
        school.slotsFall--;
      } else if (school.slotsFlexible > 0) {
        school.slotsFlexible--;
        isFlexibleUsed = true;
      } else {
        return { success: false, message: 'No slots available for Fall.' };
      }
    } else {
      // Spring
      if (school.slotsSpring > 0) {
        school.slotsSpring--;
      } else if (school.slotsFlexible > 0) {
        school.slotsFlexible--;
        isFlexibleUsed = true;
      } else {
        return { success: false, message: 'No slots available for Spring.' };
      }
    }

    // 4. Update User Record
    const selection: Selection = {
      schoolId,
      semester,
      isFlexibleSlot: isFlexibleUsed
    };

    if (this.state.currentRound === 1) {
      user.selectedRound1 = selection;
    } else {
      user.selectedRound2 = selection;
    }
    user.status = UserStatus.Completed;

    // 5. Save and Refresh State for next user
    this.refreshStatus(); // This calls save() internally
    
    return { success: true };
  }

  // User chooses to skip (select 0 slots)
  skipTurn(userId: number): { success: boolean, message?: string } {
     this.sync();
     
     const userIndex = this.state.users.findIndex(u => u.id === userId);
     if (userIndex === -1) return { success: false, message: 'User not found' };
     const user = this.state.users[userIndex];
 
     const activeRank = this.getActiveRank();
     if (user.rank !== activeRank) {
       return { success: false, message: `It is currently Rank ${activeRank}'s turn.` };
     }

     // Mark status as Skipped
     user.status = UserStatus.Skipped;
     
     // IMPORTANT: If user skips Round 1, they forfeit Round 2 eligibility
     if (this.state.currentRound === 1) {
       user.needsDoubleSemester = false;
     }

     this.refreshStatus();
     return { success: true };
  }
}

export const db = new MockService();