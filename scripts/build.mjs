import { readFile, mkdir, rm, cp, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { sculptureSvg } from '../public/sculpture.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const p = JSON.parse(await readFile(path.join(root, 'src/profile.json'), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const e = escape;
const arrow = '<span aria-hidden="true">↗</span>';
const external = (url, label, cls = '') => `<a class="${cls}" href="${e(url)}" target="_blank" rel="noopener noreferrer">${label}${arrow}</a>`;
const tags = items => `<ul class="tags" aria-label="技术栈">${items.map(t => `<li>${e(t)}</li>`).join('')}</ul>`;

function illustration(theme) {
  if (theme === 'paper') return `<div class="project-art paper-art" role="img" aria-label="论文经过检索，形成附带引用的回答的概念示意">
    <span class="art-label">01 / DOCUMENT → KNOWLEDGE</span>
    <div class="paper-sheet sheet-back"></div><div class="paper-sheet sheet-front"><span class="sheet-index">P / 01</span><strong>From papers<br>to perspective.</strong><i></i><i></i><i class="short"></i><div class="sheet-chart"><b></b><b></b><b></b><b></b><b></b><b></b></div><span class="sheet-foot">DOCUMENT → KNOWLEDGE</span></div>
    <div class="citation"><span class="citation-dot"></span> Evidence connected <b>[1]</b></div><span class="art-bottom">PAPERPARTNER <span>↗</span></span></div>`;
  return `<div class="project-art lumina-art" role="img" aria-label="取景框中的山丘与日落，象征摄影地点发现">
    <span class="art-label">02 / PLACES & PERSPECTIVES</span><div class="viewfinder"><span class="view-top">LUMINA WALK <b>35 mm</b></span><div class="sun"></div><div class="hill hill-back"></div><div class="hill hill-front"></div><span class="view-cross">+</span><span class="view-bottom">寻光 · 漫游 <b>FIND YOUR NEXT FRAME</b></span></div><span class="art-bottom">PLACES WORTH FINDING <span>↗</span></span></div>`;
}
function projectCard(project) {
 return `<article class="project reveal" id="${e(project.id)}">${illustration(project.theme)}<div class="project-body"><div class="project-meta"><span>PROJECT ${e(project.number)} / ${e(project.category)}</span><span>${e(project.date)}</span></div><h3>${e(project.name)}</h3><p class="project-subtitle">${e(project.subtitle)}</p><p class="project-description">${e(project.description)}</p>${tags(project.tags)}<p class="project-focus">${e(project.focus)}</p><details><summary>核心亮点 <span class="expand" aria-hidden="true">+</span></summary><div class="project-notes">${project.notes.map((n,i)=>`<section><span class="note-number">0${i+1}</span><div><h4>${e(n.title)}</h4><p>${e(n.body)}</p></div></section>`).join('')}<p class="origin">${e(project.origin)}</p></div></details>${external(project.url,e(project.linkLabel),'text-link')}</div></article>`;
}
function head(title, description) {
 return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="theme-color" content="#efefed"><title>${e(title)}</title><meta name="description" content="${e(description)}"><meta property="og:type" content="website"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><link rel="icon" type="image/svg+xml" href="./favicon.svg"><link rel="stylesheet" href="./style.css"></head>`;
}
const html = `${head(`${p.name} · ${p.role}`,p.intro)}
<body class="portfolio-page">
  <a class="skip-link" href="#intro">跳过开场，查看个人介绍</a>
  <header class="site-header">
    <a class="wordmark" href="#home" aria-label="郭蕙宁，返回开场">n<span>.</span><span class="brand-name">NICOLE KWOK</span></a>
    <nav aria-label="主导航"><a href="#work">项目 <span>01</span></a><a href="#experience">经历 <span>02</span></a><a href="#about">关于 <span>03</span></a><a href="#contact">联系 ↗</a></nav>
  </header>
  <main id="main">
    <section class="welcome" id="home" aria-labelledby="welcome-title">
      <div class="sculpture-stage">
        <div class="sculpture-shadow" aria-hidden="true"></div>
        <img class="sculpture-fallback" src="./sculpture.svg" alt="" width="800" height="800" fetchpriority="high">
        <canvas id="sculpture" width="800" height="800" tabindex="-1" role="img" aria-label="可旋转的银色无穷环。鼠标拖动旋转和翻转，方向键调整角度，Home 键复位。"></canvas>
        <div class="sculpture-controls" hidden><span class="drag-hint"><span class="drag-mouse">拖动旋转 · 双击复位</span><span class="drag-touch">横向滑动旋转</span></span><button class="sculpture-reset" type="button" aria-label="复位无穷环视角">复位 ↺</button></div>
        <span class="crosshair crosshair-a" aria-hidden="true">+</span><span class="crosshair crosshair-b" aria-hidden="true">+</span>
      </div>
      <div class="welcome-copy"><h1 id="welcome-title">Hello,<br>I'm Nicole.</h1><div class="welcome-identity"><span>${e(p.name)}</span><span>后端开发 / AI 应用开发</span></div></div>
      <div class="welcome-bottom"><div class="welcome-note"><span>PORTFOLIO INDEX.</span><span>PROJECTS / EXPERIENCE / ABOUT.</span></div><a class="enter-link" href="#intro"><span class="enter-circle" aria-hidden="true">↓</span><span>进入我的世界 <small>CLICK OR SCROLL TO EXPLORE</small></span></a><button class="motion-toggle" type="button" aria-pressed="false" hidden><span class="motion-symbol" aria-hidden="true">Ⅱ</span><span class="motion-label">暂停动效</span></button></div>
    </section>
    <section class="intro-section section" id="intro" aria-labelledby="intro-title" tabindex="-1">
      <div class="section-marker"><span>( A LITTLE INTRODUCTION )</span><span>01 — 04</span></div>
      <div class="intro-layout"><h2 id="intro-title">Backend &amp;<br>Applied AI.</h2><div class="intro-copy"><p class="intro-lead">我是郭蕙宁，<br>关注后端工程与 AI 应用。</p><p>${e(p.intro)}</p><div class="intro-links"><a class="text-link" href="./resume.html">查看简历 ${arrow}</a>${external(p.github,'GitHub','text-link')}</div></div></div>
      <div class="discipline-line"><span>JAVA / SPRING BOOT</span><span>DATA & SYSTEMS</span><span>RAG / AGENT</span><span>KEEP EXPLORING ↘</span></div>
    </section>
    <section class="section work-section" id="work" aria-labelledby="work-title">
      <div class="section-heading"><div><p class="eyebrow">01 / 精选项目</p><h2 id="work-title">Selected works.</h2></div></div>
      <div class="project-grid">${p.projects.map(projectCard).join('')}</div>
    </section>
    <section class="section experience-section" id="experience" aria-labelledby="experience-title">
      <div class="section-heading"><div><p class="eyebrow">02 / 实习经历</p><h2 id="experience-title">In practice.</h2></div><span class="section-side-note">MIDEA / 2024</span></div>
      <div class="experience-layout"><div class="experience-summary"><span class="small-label">${e(p.experience.date)}</span><h3>${e(p.experience.company)}</h3><p class="job-role">${e(p.experience.role)}</p><p class="muted">${e(p.experience.department)}</p><p class="experience-intro">${e(p.experience.intro)}</p><span class="experience-stamp">BUSINESS LOGIC → WORKING SOFTWARE</span></div><div class="experience-points">${p.experience.points.map((point,i)=>`<article><span class="point-index">0${i+1}</span><div><h4>${e(point.title)}</h4><p>${e(point.body)}</p></div></article>`).join('')}</div></div>
    </section>
    <section class="section about-section" id="about" aria-labelledby="about-title">
      <div class="section-heading"><div><p class="eyebrow">03 / 关于我</p><h2 id="about-title">Beyond the code.</h2></div><span class="section-side-note">LEARNING, BUILDING, REPEATING.</span></div>
      <div class="about-layout"><div class="about-statement"><span class="giant-asterisk" aria-hidden="true">✳</span><p>计算机科学，<br>与人工智能。</p><p class="about-body">本科阶段打下计算机与 Java 开发基础，硕士阶段进入人工智能与大数据领域。我希望将两段学习经历连接起来，构建有用、可靠、能够持续改进的软件。</p></div><div class="education-list">${p.education.map((edu,i)=>`<article><span class="small-label">${e(edu.date)} <span>/ 0${i+1}</span></span><h3>${e(edu.school)}</h3><p class="degree">${e(edu.degree)}</p><p class="muted">${e(edu.note)}</p></article>`).join('')}<p class="awards">蓝桥杯 Java A 组省级三等奖 <span>·</span> CET-6 <span>·</span> IELTS 6.5</p></div></div>
      <div class="skills-grid">${p.skills.map((skill,i)=>`<article><span class="small-label">0${i+1} / ${e(skill.english)}</span><h3>${e(skill.title)}</h3><p>${e(skill.description)}</p><p class="skill-items">${e(skill.items)}</p></article>`).join('')}</div>
    </section>
    <section class="contact-section" id="contact" aria-labelledby="contact-title"><div class="contact-top"><p class="eyebrow">04 / 保持联系</p><span>THANKS FOR STOPPING BY.</span></div><a class="contact-title-link" href="mailto:${e(p.email)}"><h2 id="contact-title">Say hello.</h2><span class="contact-arrow" aria-hidden="true">↗</span></a><div class="contact-bottom"><p>正在寻找后端开发与 AI 应用开发的机会。<br>欢迎交流项目、技术，或一个值得解决的问题。</p><div><a class="contact-email" href="mailto:${e(p.email)}">${e(p.email)}</a><div class="contact-actions">${external(p.github,'GitHub','text-link')}<a class="text-link" href="./resume.html">简历速览 ${arrow}</a><button class="text-link copy-email" type="button" data-email="${e(p.email)}">复制邮箱 <span aria-hidden="true">⧉</span></button></div><p id="copy-status" class="copy-status" role="status" aria-live="polite"></p></div></div></section>
  </main>
  <footer class="site-footer"><a class="wordmark" href="#home">n<span>.</span><span class="brand-name">${e(p.name)}</span></a><span>© 2026 ${e(p.englishName)}</span><a href="#home">BACK TO TOP ↑</a></footer>
  <script type="module" src="./site.js"></script>
</body></html>`;

const resume = `${head(`${p.name} · 简历速览`,p.role)}<body class="resume-page"><header class="resume-toolbar"><a href="./index.html">← 返回作品集</a><button class="button button-dark" id="print-resume" type="button">打印 / 保存为 PDF</button></header><main class="resume-sheet"><header class="resume-heading"><div><p class="eyebrow">${e(p.role)}</p><h1>${e(p.name)} <small>${e(p.englishName)}</small></h1></div><div><a href="mailto:${e(p.email)}">${e(p.email)}</a><br><a href="${e(p.github)}">github.com/Singularity4242</a></div></header><section><h2>教育背景</h2>${p.education.map(x=>`<p class="resume-row"><strong>${e(x.school)}</strong><span>${e(x.degree)}</span><span>${e(x.date)}</span></p>`).join('')}</section><section><h2>实习经历</h2><div class="resume-row"><h3>${e(p.experience.company)} · ${e(p.experience.role)}</h3><span>${e(p.experience.date)}</span></div><ul>${p.experience.points.map(x=>`<li><strong>${e(x.title)}：</strong>${e(x.body)}</li>`).join('')}</ul></section><section><h2>项目经历</h2>${p.projects.map(x=>`<article class="resume-project"><div class="resume-row"><h3>${e(x.name)}</h3><span>${e(x.date)}</span></div><p>${e(x.description)}</p><p class="resume-stack">${x.tags.map(e).join(' / ')}</p><ul>${x.notes.map(n=>`<li><strong>${e(n.title)} </strong>${e(n.body)}</li>`).join('')}</ul><p class="resume-origin">${e(x.origin)} <a href="${e(x.url)}">查看源码 ↗</a></p></article>`).join('')}</section><section><h2>技能与其他</h2>${p.skills.map(x=>`<p><strong>${e(x.title)}：</strong>${e(x.items)}</p>`).join('')}<p>蓝桥杯 Java A 组省级三等奖 · CET-6（523）· IELTS 6.5</p></section></main><script type="module" src="./site.js"></script></body></html>`;
await rm(path.join(root,'dist'),{recursive:true,force:true});
await mkdir(path.join(root,'dist'),{recursive:true});
await cp(path.join(root,'public'),path.join(root,'dist'),{recursive:true});
await writeFile(path.join(root,'dist/index.html'),html);
await writeFile(path.join(root,'dist/resume.html'),resume);
await writeFile(path.join(root,'dist/sculpture.svg'),sculptureSvg());
await writeFile(path.join(root,'dist/.nojekyll'),'');
console.log('Built portfolio and printable résumé → dist/');
