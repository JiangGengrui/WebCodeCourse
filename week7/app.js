// ============================================================
// app.js —— 待办事项 V2.0（第 3 步：状态切换、筛选与 clearCompleted）
//
// 到此为止完整口诀：改数据 → save → render
// 三个操作全部「生成新数组」，不改原数组、也不改原对象。
// ============================================================

const KEY = 'todos';                                 // ① 存储的键名

const list    = document.querySelector('#todo-list'); // ② DOM
const input   = document.querySelector('#todo-input');
const addBtn  = document.querySelector('#add-btn');
const countEl = document.querySelector('#todo-count');

let todos  = load();                                 // ③ 单一数据源
let filter = 'all';                                  // ④ 视图状态（不落盘）

// ---------------- ⑤ 存 / 取 ----------------
function save() {
    localStorage.setItem(KEY, JSON.stringify(todos));
}

// 本实验用 Date.now() 作 id；但同一毫秒内连续添加会拿到相同的值，
// 一旦 id 重复，toggle/remove 里按 id 匹配就会一次改动多条。
// 加一个「单调递增」兜底：时间戳比上次大就用时间戳，否则在上次基础上 +1。
let lastId = 0;
function nextId() {
    const now = Date.now();
    lastId = now > lastId ? now : lastId + 1;
    return lastId;
}

function load() {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return [];                     // 没存过 → 空数组
    try {
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];      // 数据被改坏时不崩
    } catch (e) {
        return [];
    }
}

// ---------------- ⑥ render（过滤 → 建元素 → 挂载） ----------------
function render() {
    list.innerHTML = '';                             // 清空 → 整表重画

    // 先过滤：决定「显示哪些」，不改 todos 本身
    const shown = todos.filter(t =>
        filter === 'all'  ? true :
        filter === 'done' ? t.completed : !t.completed);

    shown.forEach(t => {
        const li = document.createElement('li');
        li.dataset.id = t.id;                        // li 记住自己的 id
        if (t.completed) li.classList.add('done');

        const span = document.createElement('span');
        span.textContent = t.text;                   // 用 textContent，杜绝 XSS
        li.appendChild(span);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'del-btn';
        delBtn.textContent = '×';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();                     // 防止顺带触发 li 的点击
            removeTodo(t.id);
        });
        li.appendChild(delBtn);

        // 箭头函数捕获 t.id，不用 var i 记下标
        li.addEventListener('click', () => toggleTodo(t.id));

        list.appendChild(li);                        // 每次 render 都新建 li，
    });                                              // 旧元素连同旧监听一起丢弃

    if (shown.length === 0) {
        const li = document.createElement('li');
        li.className = 'todo-empty';
        li.textContent = filter === 'all' ? '暂无任务' : '这个筛选下没有任务';
        list.appendChild(li);
    }

    // 计数：reduce 带初始值 0，空数组也安全
    const done = todos.reduce((n, t) => n + (t.completed ? 1 : 0), 0);
    if (countEl) countEl.textContent = `共 ${todos.length} 项，已完成 ${done} 项`;

    document.querySelectorAll('.filter-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.filter === filter));
}

// ---------------- ⑦ 三个操作：改数据 → save → render ----------------
function addTodo(text) {                             // 添加：展开
    const v = text.trim();
    if (v === '') { input.focus(); return; }         // 空输入（含纯空格）拦截
    todos = [...todos, { id: nextId(), text: v, completed: false }];
    save(); render();
}

function removeTodo(id) {                            // 删除：filter
    todos = todos.filter(t => t.id !== id);
    save(); render();
}

function toggleTodo(id) {                            // 切换：map + 展开
    todos = todos.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t);
    save(); render();
}

// ---------------- 记录 3：脱离 AI 手写 ----------------
function clearCompleted() {                          // 删除所有已完成任务
    todos = todos.filter(t => !t.completed);
    save(); render();
}

// ---------------- 环节④：筛选（视图状态，不 save） ----------------
function setFilter(f) {
    filter = f;
    render();                                        // 不需要 save()
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

document.querySelectorAll('.filter-btn').forEach(b =>
    b.addEventListener('click', () => setFilter(b.dataset.filter)));

// 首屏渲染
render();
