# 跨学科 AI Studio

基于视频中 **"跨学科 AI Studio"** 教育平台 1:1 还原开发的全栈 Web 应用。

## 功能特性

- 🏠 **首页仪表盘** — 平台介绍与三大核心卖点展示
- 💡 **项目灵感墙** — 按年级筛选跨学科项目模板，一键复用设计
- ✍️ **项目设计** — 填写项目信息，AI 自动生成完整方案（模拟 DeepSeek 驱动），带 AI 小助手对话
- 📅 **项目实施** — 时间轴分阶段管理（入境/探究/建构/展示），驱动性问题追踪
- 📚 **我的项目库** — 所有创建项目的增删改查管理
- 💬 **教研社区** — 教师论坛：发帖、浏览、删除话题

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + Vanilla JS（单页应用） |
| 后端 | Python Flask + Flask-CORS |
| 数据库 | SQLite3（本地文件） |

## 快速开始

### 1. 克隆仓库

```bash
git clone git@github.com:moon142857/web_test.git
cd web_test
```

### 2. 创建虚拟环境并安装依赖

```bash
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. 启动服务

```bash
python app.py
```

服务默认运行在 **http://localhost:5000**

Flask 会同时托管前端静态文件与后端 REST API，直接访问 http://localhost:5000 即可看到首页。

## 数据库说明

首次启动时，`app.py` 会自动在同级目录下创建 `database.db` 并初始化种子数据：

- 10 条项目灵感模板（覆盖 1-6 年级）
- 5 条教研社区帖子
- 1 个默认用户（翠微小学）

所有数据通过 SQLite 持久化，支持完整的增删改查操作。

## API 概览

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/templates` | GET | 获取灵感模板（支持 `?grade=` 筛选） |
| `/api/projects` | GET / POST | 项目列表 / 创建项目 |
| `/api/projects/:id` | GET / PUT / DELETE | 项目详情 / 更新 / 删除 |
| `/api/projects/:id/stages` | POST | 添加实施阶段 |
| `/api/posts` | GET / POST | 社区帖子列表 / 发帖 |
| `/api/posts/:id` | DELETE | 删除帖子 |
| `/api/user` | GET | 当前用户信息 |

## 界面截图对照

| 页面 | 视频时间点 | 还原度 |
|------|-----------|--------|
| 首页 | 00:00 | 🗾 Logo、三大卖点卡片 |
| 项目灵感墙 | 00:09 | 🗾 年级 Tabs + 项目卡片网格 |
| 项目设计 | 00:19 | 🗾 左表单 / 中结果 / 右 AI 助手 |
| 项目实施 | 00:29 | 🗾 左侧导航 + 时间轴阶段 |
| 我的项目库 | 00:39 | 🗾 左列表 / 右详情 + 操作按钮 |
| 教研社区 | 00:49 | 🗾 帖子列表 + 发帖弹窗 |

---

🚀 **入口文件**：`index.html`（由 Flask 在根路径 `/` 提供服务）
