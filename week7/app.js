// ============================================================
// app.js —— 待办事项 V2.1（第 8 周 · 事件委托重构 第 1 步）
//
// 这一步只改「画」的那一半：
//   render() 不再给 li 和按钮绑监听器，只把「我是谁」「点我要干什么」
//   两个身份写进 DOM —— dataset.id 与 data-action。
// 数据侧的三步没变：改数据 → save() → render()。
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
// 一旦 id 重复，按 id 匹配的操作就会一次改动多条。
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

// ---------------- ⑥ render：只负责「画」 ----------------
function render() {
    list.innerHTML = '';                             // 清空 → 整表重画

    // 先过滤：决定「显示哪些」，不改 todos 本身
    const shown = todos.filter(t =>
        filter === 'all'  ? true :
        filter === 'done' ? t.completed : !t.completed);

    shown.forEach(t => {
        const li = document.createElement('li');
        li.dataset.id = t.id;                        // ① 让节点记住「我是哪一条」
        if (t.completed) li.classList.add('done');

        const span = document.createElement('span');
        span.textContent = t.text;                   // 用 textContent，杜绝 XSS
        li.appendChild(span);

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'edit-btn';
        editBtn.dataset.action = 'edit';             // ② 和删除一样，先写清「点我要干什么」
        editBtn.textContent = '✎';
        li.appendChild(editBtn);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'del-btn';
        delBtn.dataset.action = 'delete';            // ② 让节点记住「点我要干什么」
        const icon = document.createElement('span'); // 按钮里是一个图标 span，
        icon.textContent = '×';                      // 点到的可能是它而不是按钮
        delBtn.appendChild(icon);
        li.appendChild(delBtn);

        list.appendChild(li);                        // 这里不再 addEventListener
    });

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

// dataset 读出来永远是字符串，而 todos 里的 id 是数字（Date.now()）。
// 直接写 t.id !== id 会「永远不相等」—— 删除删不掉、切换没反应，
// 而且不报错，是最难查的一类静默失败。统一比较前先归一化成字符串。
function sameId(a, b) {
    return String(a) === String(b);
}

function removeTodo(id) {                            // 删除：filter
    todos = todos.filter(t => !sameId(t.id, id));
    save(); render();
}

function toggleTodo(id) {                            // 切换：map + 展开
    todos = todos.map(t =>
        sameId(t.id, id) ? { ...t, completed: !t.completed } : t);
    save(); render();
}

// 编辑：只换 text，其它字段（completed、id）靠 ...t 原样带过来。
// 一开始我写的是 { id: t.id, text }，结果一改已完成的任务，打勾就没了 —— completed 被丢了。
function updateTodo(id, text) {
    console.log('[edit]', id, text);                 // 留一行日志，截图当证据用
    todos = todos.map(t =>
        sameId(t.id, id) ? { ...t, text } : t);
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

// ---------------- ⑧ 事件委托：整个列表只留这一个监听器 ----------------
// 绑在 ul 上，而不是绑在每个 li 上：
//   · ul 不会被 render() 重画，监听器不会跟着丢
//   · 新增的 li 天然被覆盖，不需要补绑
// 靠冒泡收到事件后，用 e.target 判断「真正被点的是谁」。
list.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;      // ① 防：target 不是元素

    const item = e.target.closest('li');
    if (!item || !list.contains(item)) return;       // ② 防：点空白 → null；③ 防：越界

    const id = item.dataset.id;
    if (!id) return;                                 // ④ 防：li 上没有 data-id（如空态提示）

    // 分流：删除 → 编辑 → 切换，三者互斥。靠 else 互斥，
    // 不能写成两条独立的 if，否则删完还会接着执行下面的分支（任务 2 就是这么错的）。
    const delBtn  = e.target.closest('[data-action="delete"]');
    const editBtn = e.target.closest('[data-action="edit"]');

    if (delBtn && item.contains(delBtn)) {
        removeTodo(id);
    } else if (editBtn && item.contains(editBtn)) {
        // 当前文本从数据里查，不从 DOM 里读：列表被筛选时 DOM 是不全的
        const cur = todos.find(t => sameId(t.id, id));
        const text = prompt('修改任务', cur ? cur.text : '');
        if (text === null) return;                   // 点了取消 → 什么都不做
        const v = text.trim();                       // 先 trim 再判断，纯空格也算空
        if (v === '') return;                        // 空输入拦住，不写库
        updateTodo(id, v);
    } else {
        toggleTodo(id);
    }
});

// 首屏渲染
render();
