// ============================================================
// app.js —— 待办事项 V2.0（第 2 步：加上 localStorage 持久化）
//
// 数据已经集中到 todos 里，持久化就变得很简单：
// 只要保证「任何一次数据变更之后都调用 save()」，刷新就能恢复。
// ============================================================

const KEY = 'todos';                  // 存储的键名

const list   = document.querySelector('#todo-list');
const input  = document.querySelector('#todo-input');
const addBtn = document.querySelector('#add-btn');

let todos = load();                   // 启动时从 localStorage 恢复

// ---------------- 存 / 取 ----------------
function save() {
    localStorage.setItem(KEY, JSON.stringify(todos));
}

function load() {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return [];      // 没存过 → 空数组
    try {
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];   // 数据被改坏时不崩
    } catch (e) {
        return [];
    }
}

// ---------------- render：清空 → 按 todos 重建 ----------------
function render() {
    list.innerHTML = '';              // 清空 → 整表重画，DOM 不再有「旧状态」

    todos.forEach(t => {
        const li = document.createElement('li');
        li.dataset.id = t.id;         // li 记住自己的 id

        const span = document.createElement('span');
        span.textContent = t.text;    // 用 textContent，杜绝 XSS
        li.appendChild(span);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'del-btn';
        delBtn.textContent = '×';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();      // 防止顺带触发 li 的点击
            removeTodo(t.id);
        });
        li.appendChild(delBtn);

        list.appendChild(li);
    });

    if (todos.length === 0) {
        const li = document.createElement('li');
        li.className = 'todo-empty';
        li.textContent = '暂无任务';
        list.appendChild(li);
    }
}

// ---------------- 操作：改数据 → save → render ----------------
function addTodo(text) {              // 添加：展开，生成新数组
    const v = text.trim();
    if (v === '') { input.focus(); return; }     // 空输入（含纯空格）拦截
    todos = [...todos, { id: Date.now(), text: v, completed: false }];
    save(); render();
}

function removeTodo(id) {             // 删除：filter，生成新数组
    todos = todos.filter(t => t.id !== id);
    save(); render();
}

// ---------------- 事件绑定 ----------------
addBtn.addEventListener('click', () => {
    addTodo(input.value);
    input.value = '';
});

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        addTodo(input.value);
        input.value = '';
    }
});

// 首屏渲染
render();
