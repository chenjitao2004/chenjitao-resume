# 谌基涛 · 个人求职主页

一个**零依赖、纯静态**的个人求职展示网站。不需要 Node、不需要构建工具、不需要联网，
双击 `index.html` 就能打开，也能直接丢到任何静态托管上。

---

## 一、目录结构

```
个人主页/
├── index.html                    页面主体（所有文字内容都在这里）
├── README.md                     本说明文件
└── assets/
    ├── css/style.css             全部样式（含深色主题、响应式、打印样式）
    ├── js/main.js                全部交互逻辑
    ├── img/photo.jpg             证件照
    ├── img/favicon.svg           浏览器标签页图标
    └── files/resume.pdf          供下载的 PDF 简历
```

## 二、怎么打开

- **本地预览**：直接双击 `index.html`，用 Edge / Chrome 打开即可。
- 页面不依赖任何外部 CDN，断网也能正常显示。

## 三、怎么改内容

页面内容都是写死在 HTML 里的（这样对搜索引擎最友好，且没有 JS 也能看到完整内容）。

| 想改什么 | 改哪里 |
| --- | --- |
| 姓名、求职状态、首屏介绍 | `index.html` 里 `<!-- ========== 首屏 ========== -->` 一段 |
| 首屏轮播的求职方向（Java 后端 / Web 全栈 / 嵌入式） | `assets/js/main.js` 顶部的 `CONFIG.roles` |
| 个人信息、求职意向 | `index.html` 里 `id="about"` 一段（求职意向处有注释标记） |
| 技术栈分类与说明 | `index.html` 里 `id="skills"` 一段，每个 `<article class="skill-card" data-cat="...">` |
| 项目内容 | `index.html` 里 `id="projects"` 一段；**每个项目有两处**：卡片上的摘要 + `<div id="modal-xxx">` 弹窗里的详情 |
| 教育经历 | `index.html` 里 `id="education"` 一段 |
| 证书 | `index.html` 里 `id="certificates"` 一段 |
| 自我评价 | `index.html` 里 `id="evaluation"` 一段 |
| 邮箱、手机号 | `index.html` 里 `id="contact"` 一段的 `data-copy="..."`；同时改 `assets/js/main.js` 里的 `CONFIG.mailTo` |
| 配色 | `assets/css/style.css` 开头的 `:root` 变量（改 `--accent` 就能换主色调） |
| 换照片 | 用同比例（3:4）图片覆盖 `assets/img/photo.jpg` |
| 换简历 PDF | 用新文件覆盖 `assets/files/resume.pdf` |

## 四、已实现的功能够用在哪

**求职展示**
- 首屏：求职状态徽标、姓名、自动轮播的岗位方向（打字机效果）、核心技能标签、数据概览（项目数 / 证书数 / 毕业时间）
- 关于我：个人信息 + 求职意向 + 一句话概括
- 专业技能：6 个方向分类，**点击分类标签可筛选**
- 项目经历：卡片摘要，**点「查看项目详情」弹出完整说明**（项目周期 / 类型 / 技术栈 / 核心工作 / 涉及能力）
- 教育经历：时间线样式
- 职业证书、自我评价

**联系与转化**
- 邮箱 / 手机号**点击即复制**，并弹出提示
- 留言表单：填好后调用本机邮件客户端，直接把内容发到你的邮箱（静态站点无需后端）
- 顶栏和首屏都有**「下载简历」**按钮，直接下载 PDF

**体验细节**
- **深色 / 浅色主题切换**，选择会被记住
- 移动端**汉堡菜单**，全部区块自适应
- 顶部**阅读进度条**、**滚动高亮当前栏目**、**回到顶部**按钮
- 内容随滚动**淡入动画**（系统开启「减少动态效果」时自动关闭）
- **一键打印**：把整页导出成排版干净的 PDF
- 完整的 SEO 信息：描述、关键词、社交分享卡片、Person 结构化数据
- 无障碍：键盘可操作、跳转链接、弹窗焦点锁定、ESC 关闭

## 五、发布到网上（三选一）

### 1. GitHub Pages（免费，推荐）

```bash
# 在 个人主页 目录下
git init
git add .
git commit -m "个人求职主页"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

然后到仓库 **Settings → Pages**，Source 选 `Deploy from a branch`，分支选 `main` / 根目录，
几分钟后访问 `https://你的用户名.github.io/你的仓库名/`。

### 2. Vercel / Netlify（免费，拖拽即可）

把整个 `个人主页` 文件夹直接拖到 Vercel 或 Netlify 的部署页面，立刻得到一个网址。

### 3. 自己的服务器

把整个文件夹上传到网站根目录即可，无需任何运行环境。

> **发布后建议做一件事**：把 `index.html` 里 `<meta property="og:url" content="">` 填成你的真实网址，
> 这样别人在微信 / QQ 里分享你的主页时能正确显示缩略卡片。

## 六、打印 / 导出 PDF

点首屏的「打印本页」，在打印对话框里把目标选成「另存为 PDF」，即可得到一份单页、
排版干净的 PDF 版本（样式已针对 A4 做过优化，会自动隐藏按钮、导航等交互元素）。

## 七、关于隐私

页面上公开展示了**手机号 `185-8465-9595`** 和**邮箱 `1499938212@qq.com`**，与简历保持一致。
如果不想让手机号被爬虫抓取，可以：

- 删掉 `index.html` 里 `id="contact"` 段中手机号那张 `<button class="card contact-card" ...>`；
- 或者把 `data-copy="18584659595"` 留空、只保留邮箱。

---

最后更新：2026-09-27
