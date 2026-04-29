const API_BASE = window.location.origin.includes('5000') ? '' : 'http://localhost:5000';
let currentProjectId = null;
let projectsCache = [];
let currentGradeFilter = '';

/* ========== ROUTING ========== */
function init() {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate(el.dataset.page);
    });
  });
  loadUser();
  navigate('dashboard');
}

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const target = document.getElementById('page-' + page);
  if (target) target.style.display = 'block';
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  const titles = { dashboard: '首页', inspiration: '项目灵感墙', design: '项目设计', implement: '项目实施', library: '我的项目库', community: '教研社区' };
  document.getElementById('breadcrumb').textContent = titles[page] || page;
  if (page === 'inspiration') loadInspiration();
  if (page === 'library') loadLibrary();
  if (page === 'community') loadCommunity();
  if (page === 'implement') loadImplementProjects();
}

async function api(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, opts);
  if (!res.ok) { console.error('API error', res.status); return null; }
  return res.json();
}

/* ========== USER ========== */
async function loadUser() {
  const user = await api('/api/user');
  if (user) {
    if (user.name) document.getElementById('userName').textContent = user.name;
    if (user.school) {
      document.getElementById('userSchool').textContent = user.school;
      document.getElementById('topSchool').textContent = user.school;
    }
  }
}

/* ========== INSPIRATION ========== */
async function loadInspiration() {
  const data = await api(`/api/templates${currentGradeFilter ? '?grade=' + encodeURIComponent(currentGradeFilter) : ''}`);
  const grid = document.getElementById('inspirationGrid');
  if (!data || !grid) return;
  grid.innerHTML = data.map(t => `
    <div class="card">
      <div class="card-img">${emojiFor(t.category)}</div>
      <div class="card-body">
        <div class="card-title">${t.title}</div>
        <div class="card-meta">
          <span class="tag">${t.grade}</span>
          <span class="tag orange">${t.category}</span>
          ${t.subjects.split('、').map(s => `<span class="tag green">${s}</span>`).join('')}
        </div>
        <div class="card-desc">${t.description}</div>
        <div class="card-actions">
          <button class="btn btn-primary btn-sm" onclick="useTemplate('${t.title}', '${t.grade}', '${t.subjects}')">用这个开始设计</button>
        </div>
      </div>
    </div>
  `).join('');
}

function emojiFor(cat) {
  const map = { '生活类': '🎒', '自然类': '🌿', '环保类': '♻️', '人文类': '🏛️' };
  return map[cat] || '📁';
}

function useTemplate(title, grade, subjects) {
  document.getElementById('dGrade').value = grade;
  document.getElementById('dTopic').value = title;
  document.getElementById('dSub').value = subjects;
  navigate('design');
}

document.getElementById('gradeTabs').addEventListener('click', e => {
  if (e.target.classList.contains('tab')) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    currentGradeFilter = e.target.dataset.grade;
    loadInspiration();
  }
});

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
    project_type: document.getElementById('dType').value,
    main_subject: document.getElementById('dMain').value,
    sub_subjects: document.getElementById('dSub').value,
    topic: document.getElementById('dTopic').value,
    ai_content: document.getElementById('designResult').innerText
  };
  const res = await api('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res && res.id) {
    alert('已保存到项目库');
    currentProjectId = res.id;
    loadLibrary();
  }
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
async function loadImplementProjects() {
  const data = await api('/api/projects');
  projectsCache = data || [];
  const nav = document.getElementById('implNav');
  if (!nav) return;
  if (!data || data.length === 0) {
    nav.innerHTML = '<div style="padding:20px;color:#9ca3af;font-size:13px;text-align:center">暂无项目</div>';
    document.getElementById('implContent').innerHTML = '<div class="impl-empty">请先在「项目设计」中创建项目，或从「我的项目库」选择一个项目进入实施。</div>';
    return;
  }
  nav.innerHTML = '<h4>我的项目</h4>' + data.map(p => `
    <div class="impl-task ${p.id === currentProjectId ? 'active' : ''}" onclick="openImplement(${p.id})">
      <span class="impl-task-icon">&#128193;</span>
      <span>${p.title}</span>
    </div>
  `).join('');
  if (currentProjectId) openImplement(currentProjectId);
  else if (data[0]) openImplement(data[0].id);
}

async function openImplement(pid) {
  currentProjectId = pid;
  document.querySelectorAll('.impl-task').forEach(t => t.classList.remove('active'));
  const activeTask = Array.from(document.querySelectorAll('.impl-task')).find(t => t.textContent.includes(projectsCache.find(p => p.id === pid)?.title || ''));
  if (activeTask) activeTask.classList.add('active');
  
  const p = await api(`/api/projects/${pid}`);
  if (!p) return;
  const content = document.getElementById('implContent');
  const stages = p.stages && p.stages.length ? p.stages : [
    { stage_name: '入境阶段', order_index: 1, driving_question: '你了解项目背景吗？', content: '情境导入，发布项目任务，组建学习小组。' },
    { stage_name: '探究阶段', order_index: 2, driving_question: '如何收集有效信息？', content: '资料搜集、实地调研、访谈记录。' },
    { stage_name: '建构阶段', order_index: 3, driving_question: '怎样形成解决方案？', content: '分析数据、设计方案、制作模型/作品。' },
    { stage_name: '展示阶段', order_index: 4, driving_question: '如何展示学习成果？', content: '成果汇报、评价反思、修订完善。' }
  ];
  content.innerHTML = `
    <h3 style="margin-bottom:4px">${p.title}</h3>
    <div style="font-size:12px;color:#9ca3af;margin-bottom:16px">${p.grade} · ${p.main_subject} · ${p.project_type}</div>
    <div class="timeline">
      ${stages.map((s, i) => `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-title">${s.stage_name}</div>
          <div class="timeline-sub">驱动性问题：${s.driving_question || '暂无'}</div>
          <div class="timeline-body">${s.content || '请补充阶段任务内容...'}</div>
          <div style="margin-top:8px">
            <button class="btn btn-sm btn-secondary" onclick="addTask(${p.id}, ${s.id || i})">添加任务</button>
          </div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
      <button class="btn btn-primary" onclick="alert('导出功能开发中')">导出实施计划</button>
    </div>
  `;
}

function addTask(pid, sid) {
  const name = prompt('任务名称：');
  if (!name) return;
  alert('任务已添加（演示模式：真实环境需保存到数据库）');
}

/* ========== LIBRARY ========== */
async function loadLibrary() {
  const data = await api('/api/projects');
  projectsCache = data || [];
  const list = document.getElementById('libList');
  if (!list) return;
  if (!data || data.length === 0) {
    list.innerHTML = '<div style="padding:20px;color:#9ca3af;font-size:13px;text-align:center">暂无项目</div>';
    document.getElementById('libDetail').innerHTML = `
      <div class="lib-empty">
        <div class="empty-icon">&#128218;</div>
        <p>点击左侧项目查看详情<br>或前往「项目设计」创建新项目</p>
      </div>`;
    return;
  }
  list.innerHTML = data.map(p => `
    <div class="lib-item" onclick="showProjectDetail(${p.id})" id="lib-item-${p.id}">
      <div class="lib-item-title">${p.title}</div>
      <div class="lib-item-meta">${p.grade} · ${p.semester} · ${p.main_subject}</div>
    </div>
  `).join('');
}

async function showProjectDetail(pid) {
  document.querySelectorAll('.lib-item').forEach(i => i.classList.remove('active'));
  const el = document.getElementById('lib-item-' + pid);
  if (el) el.classList.add('active');
  const p = await api(`/api/projects/${pid}`);
  if (!p) return;
  document.getElementById('libDetail').innerHTML = `
    <h3>${p.title}</h3>
    <div class="meta">${p.grade} · ${p.semester} · ${p.project_type} · ${p.main_subject}</div>
    <div class="lib-actions">
      <button class="btn btn-primary btn-sm" onclick="alert('Word 导出功能开发中')">下载 Word</button>
      <button class="btn btn-secondary btn-sm" onclick="navigate('design')">重新生成</button>
      <button class="btn btn-secondary btn-sm" onclick="enterImplement(${p.id})">进入实施</button>
      <button class="btn btn-danger btn-sm" onclick="deleteProject(${p.id})">删除</button>
    </div>
    <div style="background:#f9fafb;padding:14px;border-radius:6px;font-size:13px;line-height:1.7;color:#374151;white-space:pre-wrap">${p.ai_content || '暂无 AI 生成内容'}</div>
  `;
}

function enterImplement(pid) {
  currentProjectId = pid;
  navigate('implement');
}

async function deleteProject(pid) {
  if (!confirm('确定删除该项目？')) return;
  await api(`/api/projects/${pid}`, { method: 'DELETE' });
  loadLibrary();
}

/* ========== COMMUNITY ========== */
async function loadCommunity() {
  const data = await api('/api/posts');
  const list = document.getElementById('postList');
  if (!list) return;
  if (!data || data.length === 0) { list.innerHTML = '<div style="color:#9ca3af;text-align:center;padding:40px">暂无话题</div>'; return; }
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
  api(`/api/posts/${id}`, { method: 'DELETE' }).then(() => loadCommunity());
}

/* Modal */
const modal = document.getElementById('postModal');
document.getElementById('btnNewPost').addEventListener('click', () => modal.style.display = 'flex');
document.getElementById('btnCancelPost').addEventListener('click', () => modal.style.display = 'none');
document.getElementById('btnSubmitPost').addEventListener('click', async () => {
  const payload = {
    author: document.getElementById('postAuthor').value,
    title: document.getElementById('postTitle').value,
    content: document.getElementById('postContent').value,
    tags: document.getElementById('postTags').value
  };
  if (!payload.title || !payload.content) { alert('请填写标题和内容'); return; }
  await api('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  modal.style.display = 'none';
  document.getElementById('postTitle').value = '';
  document.getElementById('postContent').value = '';
  document.getElementById('postTags').value = '';
  loadCommunity();
});

/* Init */
document.addEventListener('DOMContentLoaded', init);
