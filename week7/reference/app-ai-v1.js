// ============================================================
// app-ai-v1.js —— AI 第一版输出（对照用，未修正）
//
// 缺陷清单（审查后确认）：
//   ① addTodo：用 push 就地修改，且忘了 save()      → 刷新后新增项丢失
//   ② removeTodo：用 splice 就地修改                → 违反「生成新数组」约束
//   ③ toggleTodo：直接改对象属性 t.completed = ...   → 同一对象被就地污染
//   ④ setFilter：把视图状态 filter 也 save() 进 localStorage → 刷新回不到 all
//   ⑤ render：增量更新（只 append 新项 + 改 class），不清空 → 切筛选残留旧节点
//   ⑥ addTodo：没有空输入拦截                        → 纯空格也能加一条空任务
// ============================================================

const KEY = 'todos';
const list = document.querySelector('#todo-list');
const input = document.querySelector('#todo-input');
const addBtn = document.querySelector('#add-btn');

let todos = load();
let filter = localStorage.getItem('filter') || 'all';    // ④ 启动时还把它恢复回来

function save() {
    localStorage.setItem(KEY, JSON.stringify(todos));
}

function load() {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return [];
    return JSON.parse(raw);
}

function addTodo(text) {
    todos.push({ id: Date.now(), text, completed: false });   // ① push
    render();                                                // ① 忘了 save()
}

function removeTodo(id) {
    const i = todos.findIndex(t => t.id === id);
    todos.splice(i, 1);                                      // ② splice
    save(); render();
}

function toggleTodo(id) {
    const t = todos.find(t => t.id === id);
    t.completed = !t.completed;                              // ③ 直接改属性
    save(); render();
}

function setFilter(f) {
    filter = f;
    localStorage.setItem('filter', f);                       // ④ 视图状态也持久化了
    save();
    render();
}

// ⑤ render：增量更新，只改变化的那一项，不清空 list
function render() {
    todos.forEach(t => {
        let li = list.querySelector('li[data-id="' + t.id + '"]');
        if (li) {
            li.className = t.completed ? 'done' : '';        // 只改 class
        } else {
            const keep = filter === 'all' ||
                filter === (t.completed ? 'done' : 'active');
            if (!keep) return;                                // 只跳过新建，不清旧节点
            li = document.createElement('li');
            li.dataset.id = t.id;
            li.textContent = t.text;
            list.appendChild(li);                            // 只追加，不重画
        }
    });
}
