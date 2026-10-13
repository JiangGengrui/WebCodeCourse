// ============================================================
// app.js —— 待办事项 V2.0（第 1 步：引入单一数据源）
//
// 把「DOM 即数据源」改成「todos 是唯一数据源，DOM 只是它的投影」：
// 任何操作都先改数据、再整表重画，不再直接增删 DOM 节点。
// ============================================================

const list   = document.querySelector('#todo-list');
const input  = document.querySelector('#todo-input');
const addBtn = document.querySelector('#add-btn');

let todos = [];                       // 单一数据源

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

// ---------------- 操作：改数据 → render ----------------
function addTodo(text) {              // 添加：展开，生成新数组
    const v = text.trim();
    if (v === '') { input.focus(); return; }     // 空输入（含纯空格）拦截
    todos = [...todos, { id: Date.now(), text: v, completed: false }];
    render();
}

function removeTodo(id) {             // 删除：filter，生成新数组
    todos = todos.filter(t => t.id !== id);
    render();
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
