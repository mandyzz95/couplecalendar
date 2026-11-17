# 我们的日历 · Couple Calendar

两个人共用的周历。左列是你，右列是 TA，一起做的事占满整天。底部有一个聊天框，像发微信一样说一句"周四下午 4:30–5:30 我去普拉提"，小助手就会把它加进日历。

A shared weekly calendar for two people, with a chat assistant that turns plain language into calendar events.

**功能**
- 双人分栏的周历，莫兰迪配色，手机和电脑都能用
- 小助手：用中文或英文说一句话，就能新建、修改、删除日程，也能问"上周我们干了啥"
- 每周重复的课，例如"每周二周四 9:30–10:45 上课，直到 12 月 8 号"
- 时间点（起床、出发这类事）显示成一条横线
- 拖动日程改时间、拉长缩短；左右无限滑动；缩放；语音输入
- 不用注册登录：每本日历有一个专属链接，发给 TA 就能一起用，两个人的修改几秒内同步

---

## 部署（大约 20–30 分钟，全程免费，只有小助手按用量付费）

你需要准备三个账号：**GitHub**、**Vercel**（用 GitHub 登录即可）、**Supabase**。如果要用小助手，还需要一个 **Anthropic Console** 账号。

### 1. 建数据库（Supabase）
1. 在 <https://supabase.com> 新建一个 Project。Region 选离你们近的，在美国就选 West US。
2. 左侧打开 **SQL Editor** → **New query**，把 `supabase/schema.sql` 的全部内容粘进去，点 **Run**。
3. 打开 **Project Settings → API**，记下两样东西：
   - **Project URL**，例如 `https://abcd.supabase.co`
   - **secret key**（旧项目里叫 `service_role` key）。⚠️ 这个 key 只能填在 Vercel 的设置里，不要发给任何人，也不要写进代码。

### 2. 拿 Claude 的 API key（可选，小助手要用）
1. 打开 <https://console.anthropic.com>，注册后进入 **Billing**，绑卡并充值（最低 5 美元）。
2. 建议在 **Limits** 里设一个每月花费上限，比如 5 美元。
3. 打开 **API Keys** → **Create Key**，复制以 `sk-ant-` 开头的 key。

> 注意：Claude 的 API 和 claude.ai 的订阅是分开计费的，订阅里的额度不能用在这里。

### 3. 部署到 Vercel
1. 把这份代码上传到你的 GitHub 仓库。
2. 打开 <https://vercel.com/new>，选择这个仓库，点 **Import**。
3. 在 **Environment Variables** 里添加：

| 名称 | 值 |
|---|---|
| `SUPABASE_URL` | 第 1 步的 Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 第 1 步的 secret key |
| `ANTHROPIC_API_KEY` | 第 2 步的 key（不用小助手可以不填） |
| `DAILY_AI_LIMIT` | 每本日历每天最多问小助手几次，例如 `60` |

4. 点 **Deploy**。完成后会得到一个网址，例如 `https://our-calendar.vercel.app`。
5. 打开这个网址，填上两个人的名字，点"创建"，再到右上角 ⚙ 里复制专属链接发给 TA。

### 以后怎么更新
改完代码推到 GitHub 的 main 分支，Vercel 会自动重新部署，网址不变。

### 用自己的域名（推荐）
在 Vercel 项目的 **Settings → Domains** 里添加你买的域名。比起 `.vercel.app`，自己的域名在一些网络环境下更容易打开。

---

## 关于中国大陆的用户

- **网络：** Vercel 在中国大陆没有服务器，`.vercel.app` 的网址可能打不开或很慢。换成自己的域名会好一些，但不能保证。要稳定访问，需要部署在国内的云服务上，并办理 ICP 备案。
- **小助手：** Claude 不支持中国大陆、香港、澳门等地区的用户。这份代码会根据访问者所在的地区自动处理：
  - 如果你另外配置了一个兼容 OpenAI 接口的国内模型（`LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL`，比如 DeepSeek、通义千问、Kimi），这些地区的用户会改用这个模型。
  - 如果没有配置，这些地区的用户看不到小助手，但仍然可以手动添加日程。
  - 只配置国内模型、不填 `ANTHROPIC_API_KEY` 也可以，所有人都会用国内模型。

---

## 本地开发

```bash
cp .env.example .env     # 不填 SUPABASE_URL 的话，数据会存在本地的 .data/dev-db.json
node dev-server.mjs      # 打开 http://localhost:3000
```
需要 Node 18 或更高版本，不用安装任何依赖。

## 代码结构
```
public/index.html      整个网页（界面、日历、聊天、拖动、语音）
api/calendar.js        创建日历、读取或修改两个人的名字
api/events.js          日程的增删改查
api/messages.js        聊天记录
api/assistant.js       小助手：在服务器上组织提示词并调用模型，带每日次数上限
api/_lib.js            数据库、模型调用、提示词等共用代码
supabase/schema.sql    数据库表结构
dev-server.mjs         本地开发服务器
```

## 隐私说明
- 知道链接的人都能查看和编辑这本日历，所以链接只发给 TA，不要公开发布。
- 你在社交平台上分享的应该是首页地址，别人打开后会创建他们自己的日历，互相看不到。
- API key 只保存在服务器上，网页里看不到。

## License
MIT
