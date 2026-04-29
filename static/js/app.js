const API_BASE = '';
let currentProjectId = null;
let projectsCache = [];
let currentGradeFilter = '';

/* ========== MOCK DATA ========== */
const MOCK_TEMPLATES = [
  { id: 1, title: '我的小书包', grade: '一年级', category: '生活类', categoryKey: 'life', subjects: ['语文·儿童生活', '数学·认识立体图形', '劳动·物品整理'], description: '如何整理书包才能既整洁又方便快速找到学习用品?' },
  { id: 2, title: '校园天气站', grade: '二年级', category: '自然类', categoryKey: 'nature', subjects: ['科学·地球家园·土壤天气季节', '数学·数据收集和整理', '语文·大自然的秘密'], description: '如何记录和预测天气变化，为同学们的户外活动提供参考?' },
  { id: 3, title: '游戏设计师', grade: '三年级', category: '生活类', categoryKey: 'life', subjects: ['数学·长方形和正方形', '道德与法治·公共规则与文明行为', '体育·游戏规则与安全'], description: '如何设计一个既安全又有趣的校园游戏区域?' },
  { id: 4, title: '社区噪音调查', grade: '四年级', category: '环保类', categoryKey: 'eco', subjects: ['科学·声音的产生与传播', '数学·条形统计图', '道德与法治·公共秩序与公民责任'], description: '如何测量并分析社区不同时段的噪音水平，提出降噪建议?' },
  { id: 5, title: '校园节水行动', grade: '五年级', category: '环保类', categoryKey: 'eco', subjects: ['数学·小数乘除法', '科学·环境问题与资源保护', '道德与法治·环境保护与低碳生活'], description: '如何调查校园用水情况，设计并推广有效的节水方案?' },
  { id: 6, title: '家乡文化地图', grade: '六年级', category: '人文类', categoryKey: 'culture', subjects: ['语文·民风民俗·传统文化', '数学·比例与比例尺', '美术·地图绘制与视觉表达'], description: '如何绘制一幅展现家乡民风民俗与历史变迁的文化地图?' },
];

const MOCK_POSTS = [
  { id: 1, author: '张老师', title: '跨学科项目实施中遇到的困难', content: '学生探究阶段容易跑偏，求聚焦方法。各位老师有什么好的策略吗？', tags: '教学困惑', created_at: '2026-04-28T10:00:00' },
  { id: 2, author: '李老师', title: '关于驱动性问题设计的一点思考', content: '好的驱动性问题能保持学生探究热情。分享我设计的三个原则：真实情境、有挑战性、可探究。', tags: '经验分享', created_at: '2026-04-27T09:30:00' },
  { id: 3, author: '王老师', title: '第一次尝试PBL项目设计的感受', content: '从一开始的不知所措到慢慢找到节奏，AI工具帮了大忙。', tags: '心得体会', created_at: '2026-04-26T14:00:00' },
  { id: 4, author: '赵老师', title: '五年级学生的小组合作如何分工', content: '求教各位，五年级做跨学科项目时，小组分工有什么好的做法？', tags: '教学困惑', created_at: '2026-04-25T11:00:00' },
  { id: 5, author: '陈老师', title: '项目评价量规设计经验', content: '分享一个我设计的评价量规，包含过程性评价和成果评价两部分。', tags: '经验分享', created_at: '2026-04-24T16:00:00' },
];

const MOCK_PROJECTS = [
  { id: 1, title: '名著智慧传承人——困境解决锦囊创作行动', grade: '五年级', semester: '下学期', project_type: '学科项目', main_subject: '语文·统编版·五年级下册第二单元', sub_subjects: '美术、信息技术', topic: '名著智慧传承人', ai_content: '一、项目背景\n\n本项目面向五年级学生，以语文统编版五年级下册第二单元为主导学科，融合美术与信息技术，通过真实情境驱动学生开展深度探究。\n\n二、核心问题\n\n1. 驱动性问题：如何在真实情境中运用多学科知识解决实际问题？\n2. 子问题 1：需要哪些学科知识作为支撑？\n3. 子问题 2：如何设计方案并进行实践验证？\n4. 子问题 3：如何评价项目成果与过程表现？\n\n三、学习目标\n\n1. 掌握语文核心概念与技能\n2. 发展跨学科思维与问题解决能力\n3. 提升团队协作与表达能力\n\n四、实施建议\n\n建议分四个阶段推进：入境阶段（2课时）→ 探究阶段（6课时）→ 建构阶段（4课时）→ 展示阶段（2课时）。每阶段设置明确的任务单与评价量规。', created_at: '2026-04-29 08:00:00' }
];

/* ========== ROUTING ========== */
function init() {
  document.querySelectorAll('.nav-link').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate(el.dataset.page);
    });
  });
  navigate('dashboard');
}

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const target = document.getElementById('page-' + page);
  if (target) target.style.display = 'block';
  document.querySelectorAll('.nav-link').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  if (page === 'inspiration') loadInspiration();
  if (page === 'design') { /* design page static */ }
  if (page === 'library') loadLibrary();
  if (page === 'community') loadCommunity();
  if (page === 'implement') loadImplementProjects();
}

async function api(path, opts = {}) {
  try {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(res.status);
    return res.json();
  } catch (e) {
    console.warn('API failed, using mock data:', e.message);
    return null;
  }
}

/* ========== INSPIRATION ====== */
function loadInspiration() {
  let data = currentGradeFilter
    ? MOCK_TEMPLATES.filter(t => t.grade === currentGradeFilter)
    : MOCK_TEMPLATES;
  const grid = document.getElementById('inspirationGrid');
  if (!grid) return;
  grid.innerHTML = data.map(t => `
    <div class="inspiration-card">
      <div class="grade-label">${t.grade}</div>
      <span class="category-tag ${t.categoryKey}">${t.category}</span>
      <h4>${t.title}</h4>
      <div class="card-desc">${t.description}</div>
      <div class="subject-tags">
        ${t.subjects.map(s => `<span class="subject-tag">${s}</span>`).join('')}
      </div>
      <button class="btn-start" onclick="useTemplate('${t.title}', '${t.grade}', '${t.subjects.join('、')}')">用这个开始设计</button>
    </div>
  `).join('');
}

function useTemplate(title, grade, subjects) {
  document.getElementById('dGrade').value = grade;
  document.getElementById('dTopic').value = title;
  navigate('design');
}

/* ========== DESIGN ========== */
document.getElementById('btnGenerate').addEventListener('click', generateProject);
document.getElementById('btnSaveDesign').addEventListener('click', saveDesign);
document.getElementById('aiSend').addEventListener('click', sendAiMessage);
document.getElementById('aiInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendAiMessage(); });

function generateProject() {
  const topic = document.getElementById('dTopic').value || '跨学科项目';
  const grade = document.getElementById('dGrade').value;
  const main = document.getElementById('dMain').value;
  const html = `
    <div class="result-content">
      <h3>${topic} — 跨学科项目设计方案</h3>
      <h4>一、项目背景</h4>
      <p>本项目面向${grade}学生，以${main}为主导学科，融合多学科知识，通过真实情境驱动学生开展深度探究。</p>
      <h4>二、核心问题</h4>
      <ul>
        <li>驱动性问题：如何在真实情境中运用多学科知识解决实际问题？</li>
        <li>子问题 1：需要哪些学科知识作为支撑？</li>
        <li>子问题 2：如何设计方案并进行实践验证？</li>
        <li>子问题 3：如何评价项目成果与过程表现？</li>
      </ul>
      <h4>三、学习目标</h4>
      <ul>
        <li>掌握${main}核心概念与技能</li>
        <li>发展跨学科思维与问题解决能力</li>
        <li>提升团队协作与表达能力</li>
      </ul>
      <h4>四、实施建议</h4>
      <p>建议分四个阶段推进：入境阶段（2课时）→ 探究阶段（6课时）→ 建构阶段（4课时）→ 展示阶段（2课时）。每阶段设置明确的任务单与评价量规。</p>
    </div>
  `;
  document.getElementById('designResult').innerHTML = html;
}

async function saveDesign() {
  const payload = {
    title: document.getElementById('dTopic').value || '未命名项目',
    grade: document.getElementById('dGrade').value,
    semester: document.getElementById('dSemester').value,
    project_type: document.querySelector('input[name="ptype"]:checked')?.value || '学科项目',
    main_subject: document.getElementById('dMain').value,
    sub_subjects: '美术、信息技术',
    topic: document.getElementById('dTopic').value,
    ai_content: document.getElementById('designResult').innerText
  };
  const newId = Math.max(...MOCK_PROJECTS.map(p => p.id), 0) + 1;
  MOCK_PROJECTS.unshift({ ...payload, id: newId, created_at: new Date().toISOString() });
  alert('已保存到项目库');
  loadLibrary();
}

function sendAiMessage() {
  const input = document.getElementById('aiInput');
  const chat = document.getElementById('aiChat');
  const text = input.value.trim();
  if (!text) return;
  chat.innerHTML += `<div class="ai-msg ai-user">${text}</div>`;
  input.value = '';
  chat.scrollTop = chat.scrollHeight;
  setTimeout(() => {
    const replies = [
      '好的，我会在方案中补充这部分内容。',
      '建议增加一个评价量规，让项目更完整。',
      '可以尝试将美术学科融入成果展示环节。',
      '已为你调整项目时间轴，增加了小组讨论环节。'
    ];
    const r = replies[Math.floor(Math.random() * replies.length)];
    chat.innerHTML += `<div class="ai-msg ai-reply">${r}</div>`;
    chat.scrollTop = chat.scrollHeight;
  }, 600);
}

/* ========== IMPLEMENT ========== */
function loadImplementProjects() {
  const data = MOCK_PROJECTS;
  projectsCache = data;
  const nav = document.getElementById('implNav');
  if (!nav) return;
  if (!data || data.length === 0) {
    nav.innerHTML = '<div style="padding:20px;color:#94a3b8;font-size:13px;text-align:center">暂无项目</div>';
    document.getElementById('implContent').innerHTML = '<div class="impl-empty"><div class="empty-icon">📋</div><p>请先在「项目设计」中创建项目，或从「我的项目库」选择一个项目进入实施。</p></div>';
    return;
  }
  nav.innerHTML = data.map(p => `
    <div class="impl-task ${p.id === currentProjectId ? 'active' : ''}" onclick="openImplement(${p.id})">
      <div class="impl-task-title">${p.title}</div>
      <div class="impl-task-meta">${p.grade} · ${p.main_subject}</div>
    </div>
  `).join('');
  if (currentProjectId) openImplement(currentProjectId);
  else if (data[0]) openImplement(data[0].id);
}

function openImplement(pid) {
  currentProjectId = pid;
  document.querySelectorAll('.impl-task').forEach(t => t.classList.remove('active'));
  const p = MOCK_PROJECTS.find(x => x.id === pid) || projectsCache.find(x => x.id === pid);
  if (!p) return;
  const activeTask = Array.from(document.querySelectorAll('.impl-task')).find(t => t.textContent.includes(p.title));
  if (activeTask) activeTask.classList.add('active');

  const content = document.getElementById('implContent');
  const stages = [
    { stage_name: '入境阶段', order_index: 1, driving_question: '你了解项目背景吗？', content: '情境导入，发布项目任务，组建学习小组。\n\n1. 我们的约定：尽全力做好自己负责的工作。\n2. 我们的约定：按时提交我们的工作成果。\n3. 我们的约定：在需要时及时寻求帮助。\n4. 我们的约定：________________\n5. 我们的约定：________________\n\n如果团队中有人违反约定，要及时召开团队会议协商解决。\n\n团队成员签名：________________\n日期：________________' },
    { stage_name: '探究阶段', order_index: 2, driving_question: '如何收集有效信息？', content: '资料搜集、实地调研、访谈记录。\n\n子问题1：（哪些名著人物和故事情节，蕴藏着解决实际问题的智慧？我们需要先读懂它们。）\n\n子问题2：（我们遇到的现实困境，都和名著里的哪些智慧相呼应？怎么把古人的智慧翻译成今天的方法？）\n\n子问题3：（怎样设计我们的《指南》，才能让它既清楚又有用，真正帮到其他同学？）' },
    { stage_name: '建构阶段', order_index: 3, driving_question: '怎样形成解决方案？', content: '分析数据、设计方案、制作模型/作品。' },
    { stage_name: '展示阶段', order_index: 4, driving_question: '如何展示学习成果？', content: '成果汇报、评价反思、修订完善。' }
  ];
  content.innerHTML = `
    <h3 style="margin-bottom:4px">${p.title}</h3>
    <div style="font-size:12px;color:#94a3b8;margin-bottom:16px">${p.grade} · ${p.main_subject} · ${p.project_type}</div>
    <div class="timeline">
      ${stages.map((s, i) => `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-title">${s.stage_name}</div>
          <div class="timeline-sub">驱动性问题：${s.driving_question || '暂无'}</div>
          <div class="timeline-body">${s.content.replace(/\n/g, '<br>') || '请补充阶段任务内容...'}</div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
      <button class="btn-primary" onclick="alert('导出功能开发中')">下载 Word</button>
    </div>
  `;
}

/* ========== LIBRARY ========== */
function loadLibrary() {
  const data = MOCK_PROJECTS;
  projectsCache = data;
  const list = document.getElementById('libList');
  if (!list) return;
  if (!data || data.length === 0) {
    list.innerHTML = '<div style="padding:20px;color:#94a3b8;font-size:13px;text-align:center">暂无项目</div>';
    document.getElementById('libDetail').innerHTML = `
      <div class="lib-empty">
        <div class="empty-icon">📄</div>
        <p>点击左侧项目查看全文</p>
        <p class="empty-sub">选择一个项目，完整内容将显示在这里</p>
      </div>`;
    return;
  }
  list.innerHTML = data.map(p => `
    <div class="lib-item" onclick="showProjectDetail(${p.id})" id="lib-item-${p.id}">
      <div class="lib-item-title">${p.title}</div>
      <div class="lib-item-meta">${p.grade} · ${p.semester} · ${p.main_subject}</div>
      <span class="item-delete" onclick="event.stopPropagation();deleteProject(${p.id})">删除</span>
    </div>
  `).join('');
}

function showProjectDetail(pid) {
  document.querySelectorAll('.lib-item').forEach(i => i.classList.remove('active'));
  const el = document.getElementById('lib-item-' + pid);
  if (el) el.classList.add('active');
  const p = MOCK_PROJECTS.find(x => x.id === pid) || projectsCache.find(x => x.id === pid);
  if (!p) return;
  document.getElementById('libDetail').innerHTML = `
    <h3>${p.title}</h3>
    <div class="meta">${p.grade} · ${p.semester} · ${p.project_type} · ${p.main_subject}</div>
    <div class="lib-detail-actions">
      <button class="btn-primary btn-sm" onclick="alert('Word 导出功能开发中')">下载 Word</button>
      <button class="btn-secondary btn-sm" onclick="navigate('design')">重新生成</button>
      <button class="btn-secondary btn-sm" onclick="enterImplement(${p.id})">进入实施</button>
      <button class="btn-secondary btn-sm" style="color:#dc2626;border-color:#fecaca" onclick="deleteProject(${p.id})">删除</button>
    </div>
    <div class="lib-content">${p.ai_content || '暂无 AI 生成内容'}</div>
  `;
}

function enterImplement(pid) {
  currentProjectId = pid;
  navigate('implement');
}

function deleteProject(pid) {
  if (!confirm('确定删除该项目？')) return;
  const idx = MOCK_PROJECTS.findIndex(p => p.id === pid);
  if (idx >= 0) MOCK_PROJECTS.splice(idx, 1);
  loadLibrary();
  document.getElementById('libDetail').innerHTML = `
    <div class="lib-empty">
      <div class="empty-icon">📄</div>
      <p>点击左侧项目查看全文</p>
      <p class="empty-sub">选择一个项目，完整内容将显示在这里</p>
    </div>`;
}

/* ========== COMMUNITY ========== */
function loadCommunity() {
  const data = MOCK_POSTS;
  const list = document.getElementById('postList');
  if (!list) return;
  if (!data || data.length === 0) { list.innerHTML = '<div style="color:#94a3b8;text-align:center;padding:40px">暂无话题</div>'; return; }
  list.innerHTML = data.map(post => `
    <div class="post-card">
      <div class="post-header">
        <div class="post-author">
          <div class="post-avatar">${post.author ? post.author[0] : '?'}</div>
          <div>
            <div class="post-name">${post.author || '匿名'}</div>
            <div class="post-time">${post.created_at ? post.created_at.split('T')[0] : ''}</div>
          </div>
        </div>
      </div>
      <div class="post-title">${post.title}</div>
      <div class="post-body">${post.content}</div>
      <div class="post-footer">
        <span class="post-tag">${post.tags || '讨论'}</span>
        <span class="post-del" onclick="deletePost(${post.id})">删除</span>
      </div>
    </div>
  `).join('');
}

function deletePost(id) {
  if (!confirm('删除这条话题？')) return;
  const idx = MOCK_POSTS.findIndex(p => p.id === id);
  if (idx >= 0) MOCK_POSTS.splice(idx, 1);
  loadCommunity();
}

/* Modal */
const modal = document.getElementById('postModal');
document.getElementById('btnNewPost').addEventListener('click', () => modal.style.display = 'flex');
document.getElementById('btnCancelPost').addEventListener('click', () => modal.style.display = 'none');
document.getElementById('btnSubmitPost').addEventListener('click', () => {
  const payload = {
    author: document.getElementById('postAuthor').value,
    title: document.getElementById('postTitle').value,
    content: document.getElementById('postContent').value,
    tags: document.getElementById('postTags').value
  };
  if (!payload.title || !payload.content) { alert('请填写标题和内容'); return; }
  const newId = Math.max(...MOCK_POSTS.map(p => p.id), 0) + 1;
  MOCK_POSTS.unshift({ ...payload, id: newId, created_at: new Date().toISOString() });
  modal.style.display = 'none';
  document.getElementById('postTitle').value = '';
  document.getElementById('postContent').value = '';
  document.getElementById('postTags').value = '';
  loadCommunity();
});

/* Init */
document.addEventListener('DOMContentLoaded', init);
