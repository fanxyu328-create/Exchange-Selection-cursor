import React, { useState, useRef, useEffect } from 'react';
import { db } from '../services/db';
import { RefreshCw, CheckCircle, AlertTriangle, Download, Upload } from 'lucide-react';
import {
  downloadUsersCsvTemplate,
  downloadSchoolsCsvTemplate,
  parseUsersCsv,
  parseSchoolsCsv,
} from '../utils/csv';

/** 从后端用户列表转为管理员可编辑的 JSON 字段（仅 id, name, rank, needsDoubleSemester） */
function toAdminUsers(users: { id: number; name: string; rank: number; needsDoubleSemester: boolean }[]) {
  return users.map((u) => ({ id: u.id, name: u.name, rank: u.rank, needsDoubleSemester: u.needsDoubleSemester }));
}

/** 从后端学校列表转为管理员可编辑的 JSON 字段 */
function toAdminSchools(schools: { id: number; name: string; country: string; slotsFall: number; slotsSpring: number; slotsFlexible: number }[]) {
  return schools.map((s) => ({ id: s.id, name: s.name, country: s.country, slotsFall: s.slotsFall, slotsSpring: s.slotsSpring, slotsFlexible: s.slotsFlexible }));
}

export const AdminPanel: React.FC = () => {
  const [usersJson, setUsersJson] = useState('[]');
  const [schoolsJson, setSchoolsJson] = useState('[]');
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error' | null, text: string}>({ type: null, text: '' });
  const [loading, setLoading] = useState(true);
  const usersFileRef = useRef<HTMLInputElement>(null);
  const schoolsFileRef = useRef<HTMLInputElement>(null);

  // 进入页面时从后端加载当前 users / schools，填充表单
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [users, schools] = await Promise.all([db.getUsers(), db.getSchools()]);
        if (cancelled) return;
        setUsersJson(JSON.stringify(toAdminUsers(users), null, 2));
        setSchoolsJson(JSON.stringify(toAdminSchools(schools), null, 2));
      } catch (e: any) {
        if (!cancelled) setStatusMsg({ type: 'error', text: e.message || '加载后端数据失败' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleDownloadUsersTemplate = () => downloadUsersCsvTemplate();
  const handleDownloadSchoolsTemplate = () => downloadSchoolsCsvTemplate();

  const handleUsersCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        const rows = parseUsersCsv(text);
        const arr = rows.map((r) => ({
          id: r.id,
          name: r.name,
          rank: r.rank,
          needsDoubleSemester: r.needsDoubleSemester,
        }));
        setUsersJson(JSON.stringify(arr, null, 2));
        setStatusMsg({ type: 'success', text: `已从 CSV 解析 ${arr.length} 条用户数据` });
        setTimeout(() => setStatusMsg({ type: null, text: '' }), 3000);
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: `用户 CSV 解析失败: ${err.message}` });
      }
      e.target.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleSchoolsCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        const rows = parseSchoolsCsv(text);
        const arr = rows.map((r) => ({
          id: r.id,
          name: r.name,
          country: r.country,
          slotsFall: r.slotsFall,
          slotsSpring: r.slotsSpring,
          slotsFlexible: r.slotsFlexible,
        }));
        setSchoolsJson(JSON.stringify(arr, null, 2));
        setStatusMsg({ type: 'success', text: `已从 CSV 解析 ${arr.length} 条学校数据` });
        setTimeout(() => setStatusMsg({ type: null, text: '' }), 3000);
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: `学校 CSV 解析失败: ${err.message}` });
      }
      e.target.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleReset = async () => {
    try {
      const users = JSON.parse(usersJson);
      const schools = JSON.parse(schoolsJson);

      if (!Array.isArray(users) || !Array.isArray(schools)) {
        throw new Error("Data must be arrays.");
      }

      if (users.length > 0 && (!users[0].name || !users[0].rank)) {
         throw new Error("Users JSON missing name or rank.");
      }

      await db.resetData(users, schools);
      setStatusMsg({ type: 'success', text: 'Database reset successfully! System recalculated active rank.' });
      setTimeout(() => setStatusMsg({ type: null, text: '' }), 3000);
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || '操作失败' });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <RefreshCw className="text-indigo-600" />
          Admin Data Import
        </h2>
        {loading && (
          <span className="text-sm text-gray-500">加载后端数据中…</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Users Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Users JSON
              <span className="block text-xs font-normal text-gray-500">Required: id, name, rank, needsDoubleSemester</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownloadUsersTemplate}
                className="text-xs px-3 py-1.5 rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1"
              >
                <Download size={14} />
                下载 CSV 模版
              </button>
              <button
                type="button"
                onClick={() => usersFileRef.current?.click()}
                className="text-xs px-3 py-1.5 rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1"
              >
                <Upload size={14} />
                上传 CSV
              </button>
              <input
                ref={usersFileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleUsersCsvUpload}
              />
            </div>
          </div>
          <textarea
            value={usersJson}
            onChange={(e) => setUsersJson(e.target.value)}
            disabled={loading}
            className="w-full h-64 p-3 font-mono text-xs border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* Schools Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Schools JSON
              <span className="block text-xs font-normal text-gray-500">Required: id, name, country, slotsFall, slotsSpring, slotsFlexible</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownloadSchoolsTemplate}
                className="text-xs px-3 py-1.5 rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1"
              >
                <Download size={14} />
                下载 CSV 模版
              </button>
              <button
                type="button"
                onClick={() => schoolsFileRef.current?.click()}
                className="text-xs px-3 py-1.5 rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1"
              >
                <Upload size={14} />
                上传 CSV
              </button>
              <input
                ref={schoolsFileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleSchoolsCsvUpload}
              />
            </div>
          </div>
          <textarea
            value={schoolsJson}
            onChange={(e) => setSchoolsJson(e.target.value)}
            disabled={loading}
            className="w-full h-64 p-3 font-mono text-xs border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {statusMsg.text && (
        <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {statusMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span className="text-sm font-medium">{statusMsg.text}</span>
        </div>
      )}

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleReset}
          className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Reset & Initialize System
        </button>
        <div className="text-xs text-gray-500 max-w-lg">
          <strong>Note:</strong> Resetting will clear all current selections, calculate the first active user based on Rank 1, and notify all connected clients immediately.
        </div>
      </div>
    </div>
  );
};