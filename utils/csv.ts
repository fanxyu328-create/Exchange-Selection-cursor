/**
 * CSV 模版与解析工具：Users / Schools
 */

const UTF8_BOM = '\uFEFF';

/** 解析单行 CSV（支持引号内逗号） */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

/** 将布尔/数字等标准化 */
function parseBool(val: string): boolean {
  const v = String(val).toLowerCase().trim();
  return v === 'true' || v === '1' || v === 'yes' || v === '是';
}

/** CSV 单元格转义：含逗号、引号、换行时用双引号包裹并转义内部引号 */
function escapeCsvCell(val: unknown): string {
  const s = val === null || val === undefined ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// --- Users CSV ---

const USERS_CSV_HEADER = 'id,name,rank,needsDoubleSemester';

export const USERS_CSV_TEMPLATE = [
  USERS_CSV_HEADER,
  '1,Alice Chen,1,true',
  '2,Bob Smith,2,true',
  '3,Charlie Kim,3,true',
  '4,David Lee,4,true',
].join('\n');

export function downloadUsersCsvTemplate(): void {
  const blob = new Blob(['\uFEFF' + USERS_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'users_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/** 用当前数据生成 Users CSV 并下载（填充后端实时表数据） */
export function downloadUsersCsvFromData(rows: UserCsvRow[]): void {
  const lines = [USERS_CSV_HEADER];
  for (const r of rows) {
    lines.push([r.id, escapeCsvCell(r.name), r.rank, r.needsDoubleSemester].join(','));
  }
  const content = UTF8_BOM + lines.join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'users_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export interface UserCsvRow {
  id: number;
  name: string;
  rank: number;
  needsDoubleSemester: boolean;
}

export function parseUsersCsv(csvText: string): UserCsvRow[] {
  const text = csvText.replace(UTF8_BOM, '').trim();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    throw new Error('CSV 至少需要表头一行和数据一行');
  }
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idIdx = header.indexOf('id');
  const nameIdx = header.indexOf('name');
  const rankIdx = header.indexOf('rank');
  const needsIdx = header.indexOf('needsdoublesemester');
  if (idIdx === -1 || nameIdx === -1 || rankIdx === -1) {
    throw new Error('CSV 表头需包含: id, name, rank');
  }
  const rows: UserCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const id = parseInt(cells[idIdx] ?? '0', 10);
    const name = (cells[nameIdx] ?? '').trim();
    const rank = parseInt(cells[rankIdx] ?? '0', 10);
    const needsDoubleSemester =
      needsIdx >= 0 ? parseBool(cells[needsIdx] ?? 'true') : true;
    if (!name || isNaN(rank)) continue;
    rows.push({ id: isNaN(id) ? i : id, name, rank, needsDoubleSemester });
  }
  return rows;
}

// --- Schools CSV ---

const SCHOOLS_CSV_HEADER = 'id,name,country,slotsFall,slotsSpring,slotsFlexible';

export const SCHOOLS_CSV_TEMPLATE = [
  SCHOOLS_CSV_HEADER,
  '1,UC Berkeley,USA,1,1,0',
  '2,ETH Zurich,Switzerland,2,0,1',
  '3,Univ. of Tokyo,Japan,1,1,1',
].join('\n');

export function downloadSchoolsCsvTemplate(): void {
  const blob = new Blob(['\uFEFF' + SCHOOLS_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'schools_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/** 用当前数据生成 Schools CSV 并下载（填充后端实时表数据） */
export function downloadSchoolsCsvFromData(rows: SchoolCsvRow[]): void {
  const lines = [SCHOOLS_CSV_HEADER];
  for (const r of rows) {
    lines.push([
      r.id,
      escapeCsvCell(r.name),
      escapeCsvCell(r.country),
      r.slotsFall,
      r.slotsSpring,
      r.slotsFlexible,
    ].join(','));
  }
  const content = UTF8_BOM + lines.join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'schools_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export interface SchoolCsvRow {
  id: number;
  name: string;
  country: string;
  slotsFall: number;
  slotsSpring: number;
  slotsFlexible: number;
}

export function parseSchoolsCsv(csvText: string): SchoolCsvRow[] {
  const text = csvText.replace(UTF8_BOM, '').trim();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    throw new Error('CSV 至少需要表头一行和数据一行');
  }
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idIdx = header.indexOf('id');
  const nameIdx = header.indexOf('name');
  const countryIdx = header.indexOf('country');
  const fallIdx = header.indexOf('slotsfall');
  const springIdx = header.indexOf('slotsspring');
  const flexIdx = header.indexOf('slotsflexible');
  if (nameIdx === -1 || countryIdx === -1) {
    throw new Error('CSV 表头需包含: name, country');
  }
  const rows: SchoolCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const id = parseInt(cells[idIdx] ?? '0', 10);
    const name = (cells[nameIdx] ?? '').trim();
    const country = (cells[countryIdx] ?? '').trim();
    const slotsFall = parseInt(cells[fallIdx] ?? '0', 10) || 0;
    const slotsSpring = parseInt(cells[springIdx] ?? '0', 10) || 0;
    const slotsFlexible = parseInt(cells[flexIdx] ?? '0', 10) || 0;
    if (!name) continue;
    rows.push({
      id: isNaN(id) ? i : id,
      name,
      country,
      slotsFall,
      slotsSpring,
      slotsFlexible,
    });
  }
  return rows;
}
