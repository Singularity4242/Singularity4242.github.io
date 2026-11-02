# 郭蕙宁 · 个人作品集

面向后端开发与 AI 应用开发岗位的个人网站。包含精选项目、可展开核心亮点、实习、教育背景、联系方式及打印简历。灰白色艺术极客风格：全屏问候、交互几何雕塑、交错项目展示，适配手机和桌面。

## 本地运行

需要 Node.js 22 或更新版本，没有第三方依赖，无需 npm install。

```sh
npm run dev
```

打开终端输出的 http://127.0.0.1:4173 。修改源文件后运行 `npm run build`，刷新页面。可以使用 `PORT=4174 npm run dev` 选择端口。

```sh
npm run build
npm run check
node scripts/check-sculpture.mjs
```

## 修改内容

- `src/profile.json`：个人信息、项目、技术说明、经历和教育背景。首页与简历共用此数据。
- `scripts/build.mjs`：静态 HTML 模板，输出首页与简历速览。
- `public/style.css`：响应式样式和简历打印样式。
- `public/site.js`：雕塑动画、暂停与减少动态效果、渐显、复制邮箱和打印。
- `public/sculpture.js`：共享曲面参数，构建时生成静态 SVG。
- `public/sculpture-renderer.js`：WebGL 2 渲染，包含平滑法线、程序化环境反射与深度阴影贴图。
- `scripts/check-sculpture.mjs`：几何接缝和交互行为验证。
- `public/favicon.svg`：站点图标。
- `.github/workflows/pages.yml`：构建、验证及 GitHub Pages 发布。

内容在构建时写入 HTML，关闭 JavaScript 后仍可阅读、跳转、展开核心亮点和通过邮件联系。复制邮箱及打印按钮需要 JavaScript；也可以使用浏览器打印菜单。

## 发布

网站地址：[singularity4242.github.io](https://singularity4242.github.io/)。
源码仓库：[Singularity4242/Singularity4242.github.io](https://github.com/Singularity4242/Singularity4242.github.io)。

更新流程：

1. 修改源文件，运行上述构建与检查命令，并在本地预览。
2. 提交改动并推送到 `main`；GitHub Actions 自动构建、检查内容和雕塑交互，再部署到 Pages。
3. 在仓库 Actions 中确认 **Deploy portfolio to GitHub Pages** 成功，刷新网站检查结果。

Pages 的 Source 使用 **GitHub Actions**；也可在 Actions 中手动运行发布工作流。新增个人资料时，先确认公开范围。

参考：[GitHub Pages 文档](https://docs.github.com/en/pages/quickstart)。GitHub Pages 仅托管展示页面，项目中的 Java/Python 服务不会随网站部署。

## 内容来源与边界

首版内容来自用户提供的 2026-10-26 后端简历以及 2026-11-02 读取的 GitHub 仓库。日期沿用简历。本网站未重新执行项目评测；首页未采用简历中的性能收益、业务计数等量化数据。

- PaperPartner 基于 haiku.rag 扩展，链接直接指向个人 Java 业务服务。远程源码核对了 `JdbcIngestionTaskDAO` 的任务领取、租约和执行令牌约束；其他项目说明依据简历，不等同于完整代码审计。
- 寻光漫游基于黑马点评业务代码二次开发，描述依据简历与项目 README，保留上游来源说明。
- 实习说明不包含企业内部代码、数据或系统截图。
- 网站默认包含姓名、教育/实习时间、项目、GitHub 和简历邮箱，不包含电话号码。原始 PDF 未复制进仓库。简历入口是内容精简的 HTML 版本，可由浏览器保存为 PDF。
- `.local/` 为本机验证材料，`dist/` 为构建输出，均不提交。

## 视觉与动效

- 每个区块的最大标题统一使用衬线字体，正文、导航与辅助标签使用非衬线字体；主体正文为 15–16px。
- 开场以简洁问候与银灰色 ∞ 形扭转环构图，保留暂停和静态回退；自动旋转幅度受限，手动拖动可自由旋转和翻转。
- 开场使用 `100svh`，保留原生滚动，点击进入可定位到个人介绍；不劫持滚轮，也不强制播放过场。
- 雕塑采用本地参数曲面与 WebGL 2，无外部贴图或 3D 库请求；无脚本、WebGL 不可用或上下文丢失时显示静态 SVG。
- 自动动画上限 30 帧/秒，手动操作按需合并到帧回调，像素比不超过 1.75。首屏外、后台、手动暂停和系统减少动态效果均停止自动循环。
- 鼠标左右拖动旋转、上下拖动翻转；双击或点击复位恢复初始视角。方向键调整角度，Home 键复位。手机横向滑动旋转，纵向保留页面滚动。
- 暂停或减少动态效果后仍可手动拖动；暂停也关闭渐显和顺滑滚动。
- 阴影贴图桌面为 2048px、手机为 1024px，网格只在初始化时生成。
- 设计参考：[Immersive Garden](https://immersive-g.com/) 的沉浸式开场与灰阶材质，以及 [Josué Pichot](https://jozue.fr/) 的大字号个人介绍。图形与实现均在本项目内生成，未复制参考站素材。
