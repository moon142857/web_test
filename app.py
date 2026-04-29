from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import os
from datetime import datetime

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if os.path.exists(DB_PATH):
        return
    conn = get_db()
    c = conn.cursor()
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            grade TEXT,
            category TEXT,
            subjects TEXT,
            image_path TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            grade TEXT,
            semester TEXT,
            project_type TEXT,
            main_subject TEXT,
            sub_subjects TEXT,
            topic TEXT,
            ai_content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS project_stages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            stage_name TEXT,
            order_index INTEGER,
            driving_question TEXT,
            content TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            stage_id INTEGER,
            title TEXT,
            content TEXT,
            order_index INTEGER,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (stage_id) REFERENCES project_stages(id) ON DELETE CASCADE
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT,
            title TEXT,
            content TEXT,
            tags TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            school TEXT,
            avatar TEXT
        )
    ''')
    
    # Seed data
    templates = [
        ('我的小书包', '一年级', '生活类', '劳动教育、美术', '', '整理与归纳能力培养项目'),
        ('校园天气站', '二年级', '自然类', '科学、数学', '', '观测记录校园天气变化'),
        ('游戏设计师', '三年级', '生活类', '数学、美术、信息技术', '', '设计数学益智游戏'),
        ('社区噪音调查', '四年级', '环保类', '科学、数学、语文', '', '调查社区噪音来源与影响'),
        ('校园节水行动', '五年级', '环保类', '科学、数学、道德与法治', '', '设计校园节水方案'),
        ('家乡文化地图', '六年级', '人文类', '语文、美术、信息技术', '', '绘制家乡文化特色地图'),
        ('小小营养师', '三年级', '生活类', '科学、数学、劳动教育', '', '设计一周营养午餐'),
        ('桥梁工程师', '四年级', '自然类', '科学、数学、美术', '', '设计并测试桥梁模型'),
        ('古诗新唱', '五年级', '人文类', '语文、音乐、美术', '', '为古诗谱曲并创作MV'),
        ('昆虫记', '二年级', '自然类', '科学、语文、美术', '', '观察记录校园昆虫'),
    ]
    c.executemany('INSERT INTO templates (title, grade, category, subjects, image_path, description) VALUES (?,?,?,?,?,?)', templates)
    
    posts = [
        ('张老师', '跨学科项目实施中遇到的困难', '学生探究阶段容易跑偏，求聚焦方法。各位老师有什么好的策略吗？', '教学困惑'),
        ('李老师', '关于驱动性问题设计的一点思考', '好的驱动性问题能保持学生探究热情。分享我设计的三个原则：真实情境、有挑战性、可探究。', '经验分享'),
        ('王老师', '第一次尝试PBL项目设计的感受', '从一开始的不知所措到慢慢找到节奏，AI工具帮了大忙。', '心得体会'),
        ('赵老师', '五年级学生的小组合作如何分工', '求教各位，五年级做跨学科项目时，小组分工有什么好的做法？', '教学困惑'),
        ('陈老师', '项目评价量规设计经验', '分享一个我设计的评价量规，包含过程性评价和成果评价两部分。', '经验分享'),
    ]
    c.executemany('INSERT INTO posts (author, title, content, tags) VALUES (?,?,?,?)', posts)
    
    c.execute('INSERT INTO users (name, school, avatar) VALUES (?, ?, ?)', ('刘翠微', '翠微小学', ''))
    
    conn.commit()
    conn.close()
    print('Database initialized.')

init_db()

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

# ========== TEMPLATES ==========
@app.route('/api/templates', methods=['GET'])
def get_templates():
    grade = request.args.get('grade', '')
    conn = get_db()
    c = conn.cursor()
    if grade:
        c.execute('SELECT * FROM templates WHERE grade=? ORDER BY id', (grade,))
    else:
        c.execute('SELECT * FROM templates ORDER BY id')
    rows = c.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

# ========== PROJECTS ==========
@app.route('/api/projects', methods=['GET'])
def get_projects():
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM projects ORDER BY created_at DESC')
    rows = c.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.get_json()
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        INSERT INTO projects (title, grade, semester, project_type, main_subject, sub_subjects, topic, ai_content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('title'), data.get('grade'), data.get('semester'),
        data.get('project_type'), data.get('main_subject'), data.get('sub_subjects'),
        data.get('topic'), data.get('ai_content')
    ))
    pid = c.lastrowid
    conn.commit()
    conn.close()
    return jsonify({'id': pid, 'success': True})

@app.route('/api/projects/<int:pid>', methods=['GET'])
def get_project(pid):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM projects WHERE id=?', (pid,))
    row = c.fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Not found'}), 404
    project = dict(row)
    c.execute('SELECT * FROM project_stages WHERE project_id=? ORDER BY order_index', (pid,))
    stages = [dict(r) for r in c.fetchall()]
    for s in stages:
        c.execute('SELECT * FROM tasks WHERE stage_id=? ORDER BY order_index', (s['id'],))
        s['tasks'] = [dict(r) for r in c.fetchall()]
    project['stages'] = stages
    conn.close()
    return jsonify(project)

@app.route('/api/projects/<int:pid>', methods=['PUT'])
def update_project(pid):
    data = request.get_json()
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        UPDATE projects SET title=?, grade=?, semester=?, project_type=?,
        main_subject=?, sub_subjects=?, topic=?, ai_content=?
        WHERE id=?
    ''', (
        data.get('title'), data.get('grade'), data.get('semester'),
        data.get('project_type'), data.get('main_subject'), data.get('sub_subjects'),
        data.get('topic'), data.get('ai_content'), pid
    ))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/projects/<int:pid>', methods=['DELETE'])
def delete_project(pid):
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM projects WHERE id=?', (pid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ========== STAGES ==========
@app.route('/api/projects/<int:pid>/stages', methods=['POST'])
def create_stage(pid):
    data = request.get_json()
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        INSERT INTO project_stages (project_id, stage_name, order_index, driving_question, content)
        VALUES (?, ?, ?, ?, ?)
    ''', (pid, data.get('stage_name'), data.get('order_index'), data.get('driving_question'), data.get('content')))
    sid = c.lastrowid
    conn.commit()
    conn.close()
    return jsonify({'id': sid})

# ========== POSTS ==========
@app.route('/api/posts', methods=['GET'])
def get_posts():
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM posts ORDER BY created_at DESC')
    rows = c.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/posts', methods=['POST'])
def create_post():
    data = request.get_json()
    conn = get_db()
    c = conn.cursor()
    c.execute('INSERT INTO posts (author, title, content, tags) VALUES (?, ?, ?, ?)',
              (data.get('author'), data.get('title'), data.get('content'), data.get('tags')))
    pid = c.lastrowid
    conn.commit()
    conn.close()
    return jsonify({'id': pid})

@app.route('/api/posts/<int:pid>', methods=['DELETE'])
def delete_post(pid):
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM posts WHERE id=?', (pid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ========== USER ==========
@app.route('/api/user', methods=['GET'])
def get_user():
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM users LIMIT 1')
    row = c.fetchone()
    conn.close()
    return jsonify(dict(row) if row else {})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
