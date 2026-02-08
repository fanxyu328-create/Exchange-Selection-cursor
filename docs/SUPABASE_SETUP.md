# 在 Supabase 里要做的配置

按下面步骤在 Supabase 控制台完成配置后，前端配置好环境变量即可多人多设备同步。

## 1. 创建项目

1. 打开 [supabase.com](https://supabase.com)，用 GitHub 登录。
2. 点击 **New project**，选组织、填项目名（如 `exchange-select`）、设数据库密码，选区域后创建。
3. 等项目就绪（约 1 分钟）。

## 2. 执行建表 SQL

1. 左侧 **SQL Editor** → **New query**。
2. 打开本仓库里的 **`supabase/schema.sql`**，全选复制，粘贴到编辑器。
3. 点击 **Run**（或 Ctrl/Cmd+Enter），确认无报错。
4. 这样会创建表：`schools`、`users`、`app_state`，并设置 RLS 策略。

## 3. 开启 Realtime（可选，建议开）

用于多端实时看到别人选校、轮次变化，无需刷新。

1. 左侧 **Database** → **Replication**。
2. 在表列表里找到 **`schools`**、**`users`**、**`app_state`**。
3. 对每个表右侧开关打开 **Realtime**。

## 4. 拿到 API 地址和密钥

1. 左侧 **Project Settings**（齿轮）→ **API**。
2. 记下：
   - **Project URL**（例如 `https://xxxx.supabase.co`）
   - **anon public** 下面的 **key**（一长串，用于前端）

## 5. 在本项目里配置环境变量

在项目根目录新建 **`.env`**（或改 `.env.local`），内容：

```env
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的 anon public key
```

把上面两步的 URL 和 anon key 填进去，保存。

- **本地**：重启 `npm run dev` 后生效。
- **Vercel**：在 Vercel 项目 **Settings → Environment Variables** 里添加同名变量，再重新部署。

## 6. 验证

- 本地运行 `npm run dev`，打开应用，能正常登录、选校、管理员重置。
- 再开一个浏览器或无痕窗口，用同一 Supabase 项目，应能看到同一份数据和实时更新（若已开 Realtime）。

## 小结

| 在 Supabase 里要做的事 | 位置 |
|------------------------|------|
| 创建项目 | 首页 New project |
| 执行建表 + RLS | SQL Editor，运行 `supabase/schema.sql` |
| 开启 Realtime | Database → Replication，对三张表开启 |
| 复制 URL 和 anon key | Project Settings → API |

配置完成后，应用会使用 Supabase 作为后端，实现多人、多设备、数据同步。
