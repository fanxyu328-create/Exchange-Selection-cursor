import { Semester } from '../types';
import { getSupabase } from './supabaseClient';
import { SupabaseDb } from './supabaseDb';
import { db as mockDbInstance } from './mockDb';

const supabase = getSupabase();

/** 本地 Mock 的异步包装，与 SupabaseDb 接口一致 */
class MockDbAdapter {
  getUsers = () => Promise.resolve(mockDbInstance.getUsers());
  getSchools = () => Promise.resolve(mockDbInstance.getSchools());
  getCurrentRound = () => Promise.resolve(mockDbInstance.getCurrentRound());
  getActiveRank = () => Promise.resolve(mockDbInstance.getActiveRank());
  login = (name: string) => Promise.resolve(mockDbInstance.login(name));
  logout = () => { mockDbInstance.logout(); };
  sync = () => Promise.resolve(mockDbInstance.sync());
  resetData = (users: any[], schools: any[]) =>
    Promise.resolve(mockDbInstance.resetData(users, schools));
  refreshStatus = () => Promise.resolve(mockDbInstance.refreshStatus());
  submitSelection = (userId: number, schoolId: number, semester: Semester) =>
    Promise.resolve(mockDbInstance.submitSelection(userId, schoolId, semester));
  skipTurn = (userId: number) => Promise.resolve(mockDbInstance.skipTurn(userId));
}

/** 统一数据层：有 Supabase 配置时用云端，否则用本地 localStorage */
export const db = supabase ? new SupabaseDb(supabase) : new MockDbAdapter();

/** 是否正在使用 Supabase（用于启用 Realtime 订阅等） */
export const isSupabase = !!supabase;
