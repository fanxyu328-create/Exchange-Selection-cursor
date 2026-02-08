import React, { useState, useRef } from 'react';
import { db } from '../services/mockDb';
import { RefreshCw, CheckCircle, AlertTriangle, Download, Upload } from 'lucide-react';
import {
  downloadUsersCsvTemplate,
  downloadSchoolsCsvTemplate,
  parseUsersCsv,
  parseSchoolsCsv,
} from '../utils/csv';

const EXAMPLE_USERS = [
  { "id": 1, "name": "Alice Chen", "rank": 1, "needsDoubleSemester": true },
  { "id": 2, "name": "Bob Smith", "rank": 2, "needsDoubleSemester": true },
  { "id": 3, "name": "Charlie Kim", "rank": 3, "needsDoubleSemester": true },
  { "id": 4, "name": "David Lee", "rank": 4, "needsDoubleSemester": true }
];

const EXAMPLE_SCHOOLS = [
  { "id": 1, "name": "UC Berkeley", "country": "USA", "slotsFall": 1, "slotsSpring": 1, "slotsFlexible": 0 },
  { "id": 2, "name": "ETH Zurich", "country": "Switzerland", "slotsFall": 2, "slotsSpring": 0, "slotsFlexible": 1 },
  { "id": 3, "name": "Univ. of Tokyo", "country": "Japan", "slotsFall": 1, "slotsSpring": 1, "slotsFlexible": 1 }
];

export const AdminPanel: React.FC = () => {
  const [usersJson, setUsersJson] = useState(JSON.stringify(EXAMPLE_USERS, null, 2));
  const [schoolsJson, setSchoolsJson] = useState(JSON.stringify(EXAMPLE_SCHOOLS, null, 2));
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error' | null, text: string}>({ type: null, text: '' });
  const usersFileRef = useRef<HTMLInputElement>(null);
  const schoolsFileRef = useRef<HTMLInputElement>(null);

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

  const handleReset = () => {
    try {
      const users = JSON.parse(usersJson);
      const schools = JSON.parse(schoolsJson);

      if (!Array.isArray(users) || !Array.isArray(schools)) {
        throw new Error("Data must be arrays.");
      }

      // Basic validation of required fields
      if (users.length > 0 && (!users[0].name || !users[0].rank)) {
         throw new Error("Users JSON missing name or rank.");
      }

      db.resetData(users, schools);
      setStatusMsg({ type: 'success', text: 'Database reset successfully! System recalculated active rank.' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatusMsg({ type: null, text: '' }), 3000);

    } catch (e: any) {
      setStatusMsg({ type: 'error', text: `Invalid JSON: ${e.message}` });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <RefreshCw className="text-indigo-600" />
          Admin Data Import
        </h2>
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
            className="w-full h-64 p-3 font-mono text-xs border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
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
            className="w-full h-64 p-3 font-mono text-xs border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
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