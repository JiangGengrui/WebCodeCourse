// ============================================================
// main.ts —— 第 9 周：DOM 层
//
// 只做三件事：把页面上的动作翻译成数据操作、存盘、重画。
// 业务规则全在 todo.ts，这里不写第二套判断。
// ============================================================
import {
    addTodo, toggleTodo, removeTodo, updateTodo,
    parseId, parseTodos, isFilter,
    type Todo, type Filter
} from './todo';

const KEY = 'todos';

// strict 下 querySelector 返回 T | null，每个都写 if 太啰嗦，
// 但也不能用 ! 或 as 把告警按下去：写个小函数做条件收窄，
// 找不到元素就直接抛错，后面的代码就都是非 null 了。
function requireEl<T extends Element>(selector: string): T {
    const el = document.querySelector<T>(selector);
    if (el === null) throw new Error(`页面缺少元素：${selector}`);
    return el;
}

const list = requireEl<HTMLUListElement>('#todo-list');
const input = requireEl<HTMLInputElement>('#todo-input');
const addBtn = requireEl<HTMLButtonElement>('#add-btn');
const countEl = requireEl<HTMLSpanElement>('#todo-count');

// 唯一数据源：从 localStorage 读，读出来先过运行时守卫
let todos: Todo[] = parseTodos(localStorage.getItem(KEY));
let filter: Filter = 'all';              // 视图状态，不落盘

function save(): void {
    localStorage.setItem(KEY, JSON.stringify(todos));
}

// ---------------- render：只负责「画」 ----------------
function render(): void {
    list.innerHTML = '';

    const shown = todos.filter(t =>
        filter === 'all' ? true :
        filter === 'active' ? !t.completed : t.completed);

    shown.forEach(t => {
        const li = document.createElement('li');
        li.dataset.id = String(t.id);    // dataset 只能存字符串，这里显式转
        if (t.completed) li.classList.add('done');

        const span = document.createElement('span');
        span.textContent = t.text;       // 用 textContent，杜绝 XSS
        li.appendChild(span);

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'edit-btn';
        editBtn.dataset.action = 'edit';
        editBtn.textContent = '✎';
        li.appendChild(editBtn);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'del-btn';
        delBtn.dataset.action = 'delete';
        const icon = document.createElement('span');
        icon.textContent = '×';
        delBtn.appendChild(icon);
        li.appendChild(delBtn);

        list.appendChild(li);            // 这里不绑监听器，交给下面的委托
    });

    if (shown.length === 0) {
        const li = document.createElement('li');
        li.className = 'todo-empty';
        li.textContent = filter === 'all' ? '暂无任务' : '这个筛选下没有任务';
        list.appendChild(li);
    }

    const done = todos.reduce((n, t) => n + (t.completed ? 1 : 0), 0);
    countEl.textContent = `共 ${todos.length} 项，已完成 ${done} 项`;

    document.querySelectorAll<HTMLButtonElement>('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === filter);
    });
}

// ---------------- 添加 ----------------
function submit(): void {
    addTodo(todos, input.value);
    input.value = '';
    input.focus();                       // 这一步原来在 addTodo 里，属于 DOM 操作，搬到这里
    save();
    render();
}

addBtn.addEventListener('click', submit);

input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') submit();
});

// ---------------- 筛选：只改视图状态，不 save ----------------
document.querySelectorAll<HTMLButtonElement>('.filter-btn').forEach(b => {
    b.addEventListener('click', () => {
        const f = b.dataset.filter;      // string | undefined
        if (!isFilter(f)) return;        // 先过守卫，才敢把它当 Filter 用
        filter = f;
        render();
    });
});

// ---------------- 事件委托：整个列表只留这一个监听器 ----------------
list.addEventListener('click', (e: MouseEvent) => {
    if (!(e.target instanceof Element)) return;      // e.target 是 EventTarget，先收窄

    const item = e.target.closest('li');
    if (item === null || !list.contains(item)) return;

    const id = parseId(item.dataset.id);             // string | undefined → number | null
    if (id === null) return;                         // 空态提示那条 li 没有 id

    const delBtn = e.target.closest('[data-action="delete"]');
    const editBtn = e.target.closest('[data-action="edit"]');

    if (delBtn !== null && item.contains(delBtn)) {
        removeTodo(todos, id);
    } else if (editBtn !== null && item.contains(editBtn)) {
        const cur = todos.find(t => t.id === id);    // 当前文本从数据里查，不读 DOM
        const text = prompt('修改任务', cur === undefined ? '' : cur.text);
        if (text === null) return;                   // 点了取消：不写库、不重画
        updateTodo(todos, id, text);                 // 空输入由 updateTodo 拦
    } else {
        toggleTodo(todos, id);
    }

    save();
    render();
});

// 首屏
render();
console.log('[app] 待办事项 W9 已启动，共', todos.length, '项');
