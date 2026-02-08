-- Exchange Select 应用：在 Supabase 中执行此脚本创建表与策略
-- 在 Supabase 控制台：SQL Editor -> New query -> 粘贴并运行

-- 1. 学校表
CREATE TABLE IF NOT EXISTS schools (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  slots_fall INT NOT NULL DEFAULT 0,
  slots_spring INT NOT NULL DEFAULT 0,
  slots_flexible INT NOT NULL DEFAULT 0
);

-- 2. 用户表（参与选校的学生及状态）
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  rank INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Waiting',
  needs_double_semester BOOLEAN NOT NULL DEFAULT true,
  selected_round1 JSONB,
  selected_round2 JSONB
);

-- 3. 全局状态（当前轮次 1 或 2）
CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- 插入默认当前轮次（若不存在）
INSERT INTO app_state (key, value)
VALUES ('current_round', '1')
ON CONFLICT (key) DO NOTHING;

-- 4. 启用 Realtime（可选，用于多端实时同步）
-- 在 Supabase 控制台：Database -> Replication -> 为 schools, users, app_state 开启 Realtime

-- 5. 行级安全策略（RLS）：允许匿名读写（适合内网/受控场景；生产可改为仅认证用户）
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all schools" ON schools;
CREATE POLICY "Allow anon all schools" ON schools FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all users" ON users;
CREATE POLICY "Allow anon all users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all app_state" ON app_state;
CREATE POLICY "Allow anon all app_state" ON app_state FOR ALL TO anon USING (true) WITH CHECK (true);
