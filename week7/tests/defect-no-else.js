// ============================================================
// defect-no-else.js —— 任务 2 的缺陷代码（复现用）
//
// 与 week7/app.js 只差一处：点击分流少了 else。
//   if (delBtn && item.contains(delBtn)) {
//       deleteTodo(id);
//   }
//   toggleTodo(id);              ← 删除之后又执行了一次
//
// deleteTodo / toggleTodo 各加了一行 console.log（插桩），
// 这就是「观察现象、提取证据」那一步要抄下来的内容。
// ============================================================

const KEY = 'todos';

const list    = document.querySelector('#todo-list');
const input   = document.querySelector('#todo-input');
const addBtn  = document.querySelector('#add-btn');
const countEl = document.querySelector('#todo-count');

let todos  = load();
let filter = 'all';

function save() {
    localStorage.setItem(KEY, JSON.stringify(todos));
}

let lastId = 0;
function nextId() {
    const now = Date.now();
    lastId = now > lastId ? now : lastId + 1;
    return lastId;
}

function load() {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return [];
    try {
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

function sameId(a, b) {
    return String(a) === String(b);
}

function render() {
    list.innerHTML = '';

    const shown = todos.filter(t =>
        filter === 'all'  ? true :
        filter === 'done' ? t.completed : !t.completed);

    shown.forEach(t => {
        const li = document.createElement('li');
        li.dataset.id = t.id;
        if (t.completed) li.classList.add('done');

        const span = document.createElement('span');
        span.textContent = t.text;
        li.appendChild(span);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'del-btn';
        delBtn.dataset.action = 'delete';
        const icon = document.createElement('span');
        icon.textContent = '×';
        delBtn.appendChild(icon);
        li.appendChild(delBtn);

        list.appendChild(li);
    });

    if (shown.length === 0) {
        const li = document.createElement('li');
        li.className = 'todo-empty';
        li.textContent = filter === 'all' ? '暂无任务' : '这个筛选下没有任务';
        list.appendChild(li);
    }

    const done = todos.reduce((n, t) => n + (t.completed ? 1 : 0), 0);
    if (countEl) countEl.textContent = `共 ${todos.length} 项，已完成 ${done} 项`;

    document.querySelectorAll('.filter-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.filter === filter));
}

function addTodo(text) {
    const v = text.trim();
    if (v === '') { input.focus(); return; }
    todos = [...todos, { id: nextId(), text: v, completed: false }];
    save(); render();
}

// ---- 插桩①：删除 ----
function deleteTodo(id) {
    console.log('[delete]', id);
    todos = todos.filter(t => !sameId(t.id, id));
    save(); render();
}

// ---- 插桩②：切换 ----
function toggleTodo(id) {
    console.log('[toggle]', id);
    todos = todos.map(t =>
        sameId(t.id, id) ? { ...t, completed: !t.completed } : t);
    save(); render();
}

function setFilter(f) {
    filter = f;
    render();
}

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

document.querySelectorAll('.filter-btn').forEach(b =>
    b.addEventListener('click', () => setFilter(b.dataset.filter)));

// ---------------- 缺陷所在：缺 else ----------------
list.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    const item = e.target.closest('li');
    if (!item || !list.contains(item)) return;
    const id = item.dataset.id;
    if (!id) return;

    const delBtn = e.target.closest('[data-action="delete"]');
    if (delBtn && item.contains(delBtn)) {
        deleteTodo(id);              // ← 删除
    }
    toggleTodo(id);                  // ← 删除之后，还会执行（缺陷）
});

render();
