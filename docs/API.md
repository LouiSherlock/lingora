# Lingora 接口文档

本文档整理 `src/app/api/` 下现有的全部接口，内容以当前代码为准。

- **Base URL**：与页面同源，例如 `http://localhost:3000`
- **数据格式**：请求 / 响应均为 `application/json`（`/api/explain` 的响应为 AI SDK 的 UI 消息流）
- **界面错误文案**：统一使用简体中文

---

## 1. 鉴权

### 1.1 流程

1. 浏览器调用 `POST /api/auth`，带上 6 位登录码换取 JWT。
2. token 存进 `localStorage` 的 `access_token`（**不写入 Cookie**）。
3. 之后所有受保护接口都在请求头带 `Authorization: Bearer <token>`；统一由 `src/lib/auth-client.ts` 的 `apiFetch` 自动附加。
4. token 有效期 **1 小时**（HS256，`sub = "login-user"`，`role = "user"`）。过期或无效时，`apiFetch` 会清除 token 并派发 `auth:expired`，前端弹出登录框。

### 1.2 受保护范围

- `src/proxy.ts` 对 `/api/:path*` 统一校验；
- 白名单 `PUBLIC_PATHS = { "/api/auth" }`，即**只有 `/api/auth` 免登录**，其余接口都需要有效 token；
- 每个受保护的 route handler 还会再调用 `authorizeApiRequest` 做二次校验（纵深防御）。

### 1.3 鉴权类错误格式

```json
{ "code": "MISSING_TOKEN", "message": "未登录" }
```

| HTTP | code | message | 说明 |
| --- | --- | --- | --- |
| 401 | `MISSING_TOKEN` | 未登录 | 缺少 `Authorization: Bearer` |
| 401 | `TOKEN_EXPIRED` | 登录已过期 | JWT 已过期 |
| 401 | `INVALID_TOKEN` | 无效的 token | 签名/载荷不合法 |
| 503 | `AUTH_NOT_CONFIGURED` | 登录服务尚未配置。 | 缺少或过短的 `AUTH_SECRET` |

> 401 响应会附带 `WWW-Authenticate: Bearer` 头。

---

## 2. 接口一览

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/auth` | 公开 | 用 6 位登录码换取 JWT |
| `GET` | `/api/presets` | 需要 | 知识点 / 主题预设数据 |
| `POST` | `/api/models` | 需要 | 可用模型列表 |
| `POST` | `/api/generate` | 需要 | 生成一组练习题 |
| `POST` | `/api/explain` | 需要 | AI 助教流式答疑 |

---

## 3. 接口详情

### 3.1 `POST /api/auth` — 登录

用 6 位数字登录码换取 token。**公开接口，无需鉴权。**

**请求体**

```json
{ "code": "123456" }
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `code` | `string` | 是 | 6 位数字登录码 |

**成功响应 `200`**

```json
{ "token": "<JWT>", "expiresIn": 3600 }
```

**错误响应**

| HTTP | code | message | 说明 |
| --- | --- | --- | --- |
| 429 | `RATE_LIMITED` | 尝试次数过多，请 15 分钟后重试。 | 同一 IP 15 分钟内失败超过 5 次；响应带 `Retry-After`（秒） |
| 503 | `AUTH_NOT_CONFIGURED` | 登录服务尚未配置。 | `AUTH_CODE` 未配置或格式不对、或签发失败 |
| 400 | `INVALID_CODE_FORMAT` | 请输入 6 位数字验证码。 | 请求体不是 6 位数字 |
| 401 | `INVALID_CODE` | 验证码错误。 | 登录码不匹配 |

> 限流按来源 IP 计数（优先取 `x-forwarded-for` 首段，其次 `x-real-ip`），状态保存在 Node.js 进程内；多实例部署需替换为共享存储，并确保反向代理覆盖 `x-forwarded-for`。

**示例**

```bash
curl -X POST http://localhost:3000/api/auth \
  -H 'Content-Type: application/json' \
  -d '{"code":"123456"}'
```

---

### 3.2 `GET /api/presets` — 知识点 / 主题预设

返回创建练习页用的知识点数据（服务端读取 `src/data/preset.json`，不进客户端包）。

**请求**：无参数、无请求体。

**成功响应 `200`**

```json
{
  "levels": [
    {
      "id": "A1",
      "name": "入门",
      "englishName": "Beginner",
      "description": "……",
      "grammar": [
        { "id": "a1-tenses", "name": "时态基础", "topics": [{ "id": "a1-present-simple", "name": "一般现在时" }] }
      ],
      "vocabulary": [
        { "id": "a1-daily", "name": "日常词汇", "topics": [{ "id": "a1-greetings", "name": "问候与介绍" }] }
      ]
    }
  ]
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `levels[].id` | `string` | 等级：`A1`/`A2`/`B1`/`B2`/`C1`/`C2` |
| `levels[].name` | `string` | 等级中文名 |
| `levels[].englishName` | `string` | 等级英文名 |
| `levels[].description` | `string` | 等级描述 |
| `levels[].grammar` | `PresetGroup[]` | 语法分组 |
| `levels[].vocabulary` | `PresetGroup[]` | 词汇分组 |

`PresetGroup`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 分组 id |
| `name` | `string` | 分组名 |
| `topics` | `{ id: string; name: string }[]` | 该分组下的知识点 / 主题 |

**错误响应**：`401`（见 1.3 鉴权类错误）。

---

### 3.3 `POST /api/models` — 可用模型列表

返回服务端支持的模型名称列表。

**请求**：无请求体（`POST` 仅为统一风格）。

**成功响应 `200`**

```json
{ "models": ["deepseek-v4.1-flash", "gpt-6-luna", "qwen3.7-plus"] }
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `models` | `string[]` | 可选模型名称 |

**错误响应**：`401`（鉴权）。

---

### 3.4 `POST /api/generate` — 生成练习

根据创建页的选择生成一组练习题。

**请求体**

```json
{
  "topic": "现在完成时",
  "level": "A2",
  "difficulty": "Medium",
  "kind": "Grammar",
  "custom": "重点考察容易混淆的时态用法",
  "count": 10,
  "ai": { "model": "deepseek-v4.1-flash" }
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `topic` | `string` | 否 | 知识点 / 主题，最长 120；默认 `英语练习` |
| `level` | `string` | 否 | 必须是 `A1`/`A2`/`B1`/`B2`/`C1`/`C2`；否则回退 `A2` |
| `difficulty` | `string` | 否 | `Easy` / `Medium` / `Hard`；默认 `Medium` |
| `kind` | `string` | 否 | `Grammar` / `Vocabulary`；默认 `Grammar` |
| `custom` | `string` | 否 | 自定义要求，最长 12000；默认空 |
| `count` | `number` | 否 | 题目数量，会被夹到 5–20；默认 5 |
| `ai.model` | `string` | 是 | 模型名称；服务端校验，空则报 `config` 错误 |

**成功响应 `200`**

```json
{
  "practice": {
    "id": "uuid",
    "title": "现在完成时 · A2",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "questions": [
      {
        "id": "q1",
        "type": "single_choice",
        "level": "A2",
        "knowledgePoints": ["现在完成时"],
        "stem": "We have ___ here since 2020.",
        "options": [
          { "key": "A", "text": "lived" },
          { "key": "B", "text": "live" }
        ],
        "answer": "A",
        "explanation": "since 表示从过去持续到现在，用现在完成时。"
      }
    ]
  }
}
```

**错误响应**（AI 类错误，见第 5 节）

| HTTP | code | 说明 |
| --- | --- | --- |
| 400 | `config` | 未配置 `PROVIDER_API_KEY` / 未选择模型 |
| 400 | `invalid-request` | 请求参数无效 |
| 502 | `upstream` | AI 服务不可用 |
| 504 | `timeout` | AI 服务超时 |
| 502 | `invalid-output` | AI 返回内容无法使用 |
| 500 | `unexpected` | 服务端未知错误 |

**示例**

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"topic":"现在完成时","level":"A2","count":5,"ai":{"model":"deepseek-v4.1-flash"}}'
```

---

### 3.5 `POST /api/explain` — AI 助教（流式）

结合当前题目、正确答案、选项与历史对话，流式返回助教回答。

**请求体**

```json
{
  "question": "We have ___ here since 2020.",
  "answer": "A",
  "options": [
    { "key": "A", "text": "lived" },
    { "key": "B", "text": "live" }
  ],
  "messages": [{ "id": "m1", "role": "user", "parts": [{ "type": "text", "text": "为什么选 A？" }] }],
  "ai": { "model": "deepseek-v4.1-flash" }
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `question` | `string` | 是 | 题干，长度 1–2000 |
| `answer` | `string` | 否 | 用户当前答案，最长 500 |
| `options` | `{ key: string; text: string }[]` | 否 | 选项，最多 4 个 |
| `messages` | `UIMessage[]` | 是 | 对话历史，1–40 条（由 `@ai-sdk/react` 的 `useChat` 产生） |
| `ai.model` | `string` | 是 | 模型名称 |

**成功响应 `200`**

返回 AI SDK 的 **UI 消息流**（`toUIMessageStreamResponse`），由前端 `TutorSheet` 用 `useChat` + `DefaultChatTransport` 消费。内容类型为流式（`text/event-stream` 类）。

**错误响应**

- 同步校验失败：`400 { "error": "...", "code": "invalid-request" }`（例如 `问题内容无效。`）；
- 鉴权失败：`401`（见 1.3）；
- 流内错误：通过 `onError` 序列化为错误字符串。

---

## 4. 数据类型

```ts
type Question = {
  id: string;
  type: "single_choice" | "fill_blank" | "true_false";
  level: string;
  knowledgePoints: string[];
  stem: string;
  options: { key: string; text: string }[];
  answer: string;
  explanation: string;
};

type Practice = {
  id: string;
  title: string;
  questions: Question[];
  createdAt: string;
};
```

- `single_choice`：3–4 个选项，`answer` 为选项 `key`；
- `true_false`：选项固定为 `A = 正确`、`B = 错误`，`answer` 为 `A` 或 `B`；
- `fill_blank`：`options` 为空数组，`answer` 为简短单词或短语；
- 题干（`stem`）为英文，解析（`explanation`）为简体中文。

---

## 5. AI 错误格式

`/api/generate`、`/api/explain` 的 AI 类错误统一由 `src/lib/ai/errors.ts` 输出：

```json
{ "error": "请先在设置中选择模型。", "code": "config", "needsConfiguration": true }
```

| HTTP | code | 默认 message |
| --- | --- | --- |
| 400 | `config` | 请先在设置中选择模型。 |
| 400 | `invalid-request` | 请求参数无效。 |
| 502 | `upstream` | AI 服务暂时不可用，请稍后重试。 |
| 504 | `timeout` | AI 服务响应超时，请稍后重试。 |
| 502 | `invalid-output` | AI 返回的内容无法使用，请更换模型或重新生成。 |
| 500 | `unexpected` | 服务端处理失败，请稍后重试。 |

`needsConfiguration: true` 仅随 `config` 错误出现，提示前端引导用户去设置里选模型。

---

## 6. 相关环境变量

| 变量 | 作用 |
| --- | --- |
| `PROVIDER_API_KEY` | 服务端调用 AI 的密钥（**不会下发浏览器**） |
| `PROVIDER_BASE_URL` | OpenAI 兼容接口地址 |
| `AUTH_SECRET` | JWT 签名密钥，至少 32 字符 |
| `AUTH_CODE` | 私有的 6 位登录码，用于 `/api/auth` |

> 浏览器只传 `ai.model`，接口地址与 API Key 始终留在服务端；因此所有 AI 请求体都不接受 `baseUrl` / `apiKey`。
