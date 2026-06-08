# WeChat Reading Stats Dashboard | 微信读书数据仪表盘

A beautiful, minimalist, and responsive web dashboard for tracking and visualizing your WeChat Reading (WeRead) stats. This application includes an Express-based proxy server to securely handle authentication and bypass CORS restrictions when communicating with the WeChat Reading Gateway.

这是一个美观、极简且响应式的 Web 仪表盘，用于追踪和可视化您的微信读书（WeRead）数据。该应用包含一个基于 Express 的代理服务器，以安全地处理身份验证并绕过与微信读书网关通信时的 CORS 限制。

---

## English

### Features
* **Minimalist & Sleek UI**: Clean, premium UI designed with modern styling guidelines.
* **CORS Proxy Server**: A local Express proxy server that securely relays API requests to `https://i.weread.qq.com/api/agent/gateway` with Bearer Token auth.
* **Responsive Layout**: Works seamlessly on both desktop and mobile screens.
* **Interactive Dashboard**: Displays reading statistics, daily updates, progress, and historical logs.

### Project Structure
* `server.js`: The Express server acting as a backend proxy for WeChat Reading APIs.
* `public/`: The frontend static directory containing:
  * `index.html`: The main page structure.
  * `app.js`: Frontend application logic and data fetching.
  * `style.css`: Premium CSS styling.
* `.env`: Configuration file for environment variables (ignored by git).
* `.env-example`: Template for creating the `.env` file.

### Getting Started

#### Prerequisites
* [Node.js](https://nodejs.org/) (v16.0.0 or higher recommended)

#### Installation & Setup
1. Clone or download the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the template:
   ```bash
   cp .env-example .env
   ```
   *(On Windows PowerShell, use: `Copy-Item .env-example .env`)*
4. Open the newly created `.env` file and set your custom port and secret key:
   ```env
   PORT=5001
   WECHAT_READ_SECRET="your-wechat-read-secret-key-here"
   ```

#### Running the Application
Start the development server:
```bash
npm run dev
```
Open [http://localhost:5001](http://localhost:5001) in your browser to view the dashboard.

---

## 中文说明

### 项目特点
* **极简且现代化的界面**：遵循现代极简美学设计的优质 UI，无过度冗余元素。
* **CORS 代理服务器**：基于 Express 的本地代理服务，携带 Bearer Token 安全地将 API 请求转发到 `https://i.weread.qq.com/api/agent/gateway`。
* **响应式布局**：完美兼容 PC 端和移动端屏幕。
* **交互式数据展示**：清晰展现阅读统计、每日习惯、阅读进度以及历史记录。

### 项目结构
* `server.js`：Express 服务器，为微信读书 API 接口提供后端代理。
* `public/`：前端静态文件目录：
  * `index.html`：主页结构。
  * `app.js`：前端应用逻辑与数据请求。
  * `style.css`：精心定制的极简 CSS 样式。
* `.env`：环境变量配置文件（已被 git 忽略）。
* `.env-example`：环境变量模板文件。

### 快速开始

#### 准备工作
* [Node.js](https://nodejs.org/) (建议使用 v16.0.0 或更高版本)

#### 安装与配置
1. 克隆或下载本项目至本地。
2. 安装依赖：
   ```bash
   npm install
   ```
3. 基于模板创建 `.env` 文件：
   ```bash
   cp .env-example .env
   ```
   *（Windows PowerShell 用户请运行：`Copy-Item .env-example .env`）*
4. 打开新建的 `.env` 文件，配置端口与密钥：
   ```env
   PORT=5001
   WECHAT_READ_SECRET="您的微信读书密钥"
   ```

#### 运行项目
启动本地开发服务器：
```bash
npm run dev
```
在浏览器中打开 [http://localhost:5001](http://localhost:5001) 即可查看仪表盘。
