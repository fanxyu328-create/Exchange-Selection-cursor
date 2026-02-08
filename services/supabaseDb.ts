import { SupabaseClient } from '@supabase/supabase-js';
import { User, School, UserStatus, Semester, Selection, AppState } from '../types';

type DbUser = {
  id: number;
  name: string;
  rank: number;
  status: string;
  needs_double_semester: boolean;
  selected_round1: { schoolId: number; semester: string; isFlexibleSlot: boolean } | null;
  selected_round2: { schoolId: number; semester: string; isFlexibleSlot: boolean } | null;
};

type DbSchool = {
  id: number;
  name: string;
  country: string;
  slots_fall: number;
  slots_spring: number;
  slots_flexible: number;
};

function rowToUser(r: DbUser): User {
  return {
    id: r.id,
    name: r.name,
    rank: r.rank,
    status: r.status as UserStatus,
    needsDoubleSemester: r.needs_double_semester,
    selectedRound1: r.selected_round1 as Selection | null,
    selectedRound2: r.selected_round2 as Selection | null,
  };
}

function rowToSchool(r: DbSchool): School {
  return {
    id: r.id,
    name: r.name,
    country: r.country,
    slotsFall: r.slots_fall,
    slotsSpring: r.slots_spring,
    slotsFlexible: r.slots_flexible,
  };
}

function userToRow(u: User): DbUser {
  return {
    id: u.id,
    name: u.name,
    rank: u.rank,
    status: u.status,
    needs_double_semester: u.needsDoubleSemester,
    selected_round1: u.selectedRound1,
    selected_round2: u.selectedRound2,
  };
}

function schoolToRow(s: School): DbSchool {
  return {
    id: s.id,
    name: s.name,
    country: s.country,
    slots_fall: s.slotsFall,
    slots_spring: s.slotsSpring,
    slots_flexible: s.slotsFlexible,
  };
}

/** 根据当前用户列表和轮次计算“当前轮到谁”的 rank */
function computeActiveRank(users: User[], currentRound: 1 | 2): number | null {
  const sorted = [...users].sort((a, b) => a.rank - b.rank);
  const active = sorted.find((u) => {
    if (currentRound === 2) {
      const eligible = u.needsDoubleSemester && u.selectedRound1 !== null;
      if (!eligible) return false;
    }
    return u.status !== UserStatus.Completed && u.status !== UserStatus.Skipped;
  });
  return active ? active.rank : null;
}

/** 根据当前状态计算下一状态（谁 Selecting / 是否进入 Round 2） */
function computeRefreshStatus(users: User[], currentRound: 1 | 2): { users: User[]; currentRound: 1 | 2 } {
  let round = currentRound;
  let list = users.map((u) => ({ ...u }));

  const getActiveRank = () => computeActiveRank(list, round);
  let activeRank = getActiveRank();

  if (activeRank === null) {
    if (round === 1) {
      round = 2;
      list = list.map((u) => {
        if (u.needsDoubleSemester && u.selectedRound1) {
          return { ...u, status: UserStatus.Waiting };
        }
        return { ...u, status: UserStatus.Skipped };
      });
      activeRank = getActiveRank();
      if (activeRank !== null) {
        list = list.map((u) => {
          if (u.rank === activeRank) return { ...u, status: UserStatus.Selecting };
          if (u.status === UserStatus.Selecting) return { ...u, status: UserStatus.Waiting };
          return u;
        });
      }
    }
  } else {
    list = list.map((u) => {
      if (u.status === UserStatus.Completed || u.status === UserStatus.Skipped) return u;
      if (u.rank === activeRank) return { ...u, status: UserStatus.Selecting };
      return { ...u, status: UserStatus.Waiting };
    });
  }

  return { users: list, currentRound: round };
}

export class SupabaseDb {
  constructor(private client: SupabaseClient) {}

  async sync() {
    // No-op for Supabase; data is always from server.
  }

  private async fetchUsers(): Promise<User[]> {
    const { data, error } = await this.client.from('users').select('*').order('rank');
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => rowToUser(r as DbUser));
  }

  private async fetchSchools(): Promise<School[]> {
    const { data, error } = await this.client.from('schools').select('*');
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => rowToSchool(r as DbSchool));
  }

  private async fetchCurrentRound(): Promise<1 | 2> {
    const { data, error } = await this.client.from('app_state').select('value').eq('key', 'current_round').single();
    if (error || !data?.value) return 1;
    const v = data.value as number;
    return v === 2 ? 2 : 1;
  }

  private async setCurrentRound(round: 1 | 2) {
    const { error } = await this.client.from('app_state').upsert({ key: 'current_round', value: round }, { onConflict: 'key' });
    if (error) throw new Error(error.message);
  }

  private async saveUsers(users: User[]) {
    const rows = users.map(userToRow);
    const { error } = await this.client.from('users').upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }

  private async saveSchools(schools: School[]) {
    const rows = schools.map(schoolToRow);
    const { error } = await this.client.from('schools').upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }

  // --- 统一异步 API（供 App 使用）

  async getUsers(): Promise<User[]> {
    return this.fetchUsers();
  }

  async getSchools(): Promise<School[]> {
    return this.fetchSchools();
  }

  async getCurrentRound(): Promise<1 | 2> {
    return this.fetchCurrentRound();
  }

  async getActiveRank(): Promise<number | null> {
    const [users, round] = await Promise.all([this.fetchUsers(), this.fetchCurrentRound()]);
    return computeActiveRank(users, round);
  }

  async login(nameOrId: string): Promise<User | null> {
    if (nameOrId.toLowerCase() === 'admin') {
      return {
        id: 0,
        name: 'Administrator',
        rank: 0,
        status: UserStatus.Skipped,
        needsDoubleSemester: false,
        selectedRound1: null,
        selectedRound2: null,
        isAdmin: true,
      };
    }
    const users = await this.fetchUsers();
    const user = users.find(
      (u) => u.name.toLowerCase() === nameOrId.toLowerCase() || u.id.toString() === nameOrId
    );
    return user ?? null;
  }

  async resetData(usersInput: any[], schoolsInput: any[]): Promise<void> {
    const newUsers: User[] = usersInput.map((u) => ({
      id: u.id,
      name: u.name,
      rank: u.rank,
      status: UserStatus.Waiting,
      needsDoubleSemester: u.needsDoubleSemester !== undefined ? !!u.needsDoubleSemester : true,
      selectedRound1: null,
      selectedRound2: null,
    })).sort((a, b) => a.rank - b.rank);

    const newSchools: School[] = schoolsInput.map((s) => ({
      id: s.id,
      name: s.name,
      country: s.country,
      slotsFall: Number(s.slotsFall),
      slotsSpring: Number(s.slotsSpring),
      slotsFlexible: Number(s.slotsFlexible),
    }));

    const { users: afterRefresh } = computeRefreshStatus(newUsers, 1);

    // 先清空再写入，确保后端与前端完全一致（避免旧数据残留）
    const { error: errUsers } = await this.client.from('users').delete().gte('id', 0);
    if (errUsers) throw new Error(`清空 users 失败: ${errUsers.message}`);
    const { error: errSchools } = await this.client.from('schools').delete().gte('id', 0);
    if (errSchools) throw new Error(`清空 schools 失败: ${errSchools.message}`);

    await this.saveUsers(afterRefresh);
    await this.saveSchools(newSchools);
    await this.setCurrentRound(1);
  }

  async refreshStatus(): Promise<void> {
    const [users, round] = await Promise.all([this.fetchUsers(), this.fetchCurrentRound()]);
    const { users: nextUsers, currentRound: nextRound } = computeRefreshStatus(users, round);
    await this.saveUsers(nextUsers);
    await this.setCurrentRound(nextRound);
  }

  async submitSelection(userId: number, schoolId: number, semester: Semester): Promise<{ success: boolean; message?: string }> {
    const [users, schools, round] = await Promise.all([
      this.fetchUsers(),
      this.fetchSchools(),
      this.fetchCurrentRound(),
    ]);

    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) return { success: false, message: 'User not found' };
    const user = { ...users[userIndex] };

    const activeRank = computeActiveRank(users, round);
    if (user.rank !== activeRank) {
      return { success: false, message: `It is currently Rank ${activeRank}'s turn.` };
    }

    const schoolIndex = schools.findIndex((s) => s.id === schoolId);
    if (schoolIndex === -1) return { success: false, message: 'School not found' };
    const school = { ...schools[schoolIndex] };

    let isFlexibleUsed = false;
    if (semester === Semester.Fall) {
      if (school.slotsFall > 0) school.slotsFall--;
      else if (school.slotsFlexible > 0) {
        school.slotsFlexible--;
        isFlexibleUsed = true;
      } else return { success: false, message: 'No slots available for Fall.' };
    } else {
      if (school.slotsSpring > 0) school.slotsSpring--;
      else if (school.slotsFlexible > 0) {
        school.slotsFlexible--;
        isFlexibleUsed = true;
      } else return { success: false, message: 'No slots available for Spring.' };
    }

    const selection: Selection = { schoolId, semester, isFlexibleSlot: isFlexibleUsed };
    if (round === 1) user.selectedRound1 = selection;
    else user.selectedRound2 = selection;
    user.status = UserStatus.Completed;

    const updatedUsers = users.map((u) => (u.id === userId ? user : u));
    const updatedSchools = schools.map((s) => (s.id === schoolId ? school : s));
    const { users: afterRefresh, currentRound: nextRound } = computeRefreshStatus(updatedUsers, round);

    await this.saveUsers(afterRefresh);
    await this.saveSchools(updatedSchools);
    await this.setCurrentRound(nextRound);
    return { success: true };
  }

  async skipTurn(userId: number): Promise<{ success: boolean; message?: string }> {
    const [users, round] = await Promise.all([this.fetchUsers(), this.fetchCurrentRound()]);
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) return { success: false, message: 'User not found' };
    const user = { ...users[userIndex] };

    const activeRank = computeActiveRank(users, round);
    if (user.rank !== activeRank) {
      return { success: false, message: `It is currently Rank ${activeRank}'s turn.` };
    }

    user.status = UserStatus.Skipped;
    if (round === 1) user.needsDoubleSemester = false;

    const updatedUsers = users.map((u) => (u.id === userId ? user : u));
    const { users: afterRefresh, currentRound: nextRound } = computeRefreshStatus(updatedUsers, round);

    await this.saveUsers(afterRefresh);
    await this.setCurrentRound(nextRound);
    return { success: true };
  }

  logout(): void {
    // 前端只清 React state；无服务端 session
  }

  /** 订阅数据变化（Realtime），用于多端同步 */
  subscribe(callback: () => void): () => void {
    const channel = this.client
      .channel('exchange-app')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schools' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, callback)
      .subscribe();

    return () => {
      this.client.removeChannel(channel);
    };
  }
}
