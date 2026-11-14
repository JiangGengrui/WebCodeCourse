// ============================================================
// main.ts —— V3.1：DOM 层
//
// 只做三件事：把页面上的动作翻译成数据操作、存盘、重画。
// 业务规则全在 todo.ts，这里不写第二套判断。
//
// 相比 V3.0 多了两条交互线，但分层不变：
//   搜索框 → keyword（第二份状态，只影响「显示什么」）
//   拖拽   → moveTodo（返回新数组，再整体换掉 todos）
// ============================================================
import {
    addTodo,
    toggleTodo,
    removeTodo,
    updateTodo,
    parseId,
    parseTodos,
    isFilter,
    normalizeKeyword,
    filterByKeyword,
    filterByStatus,
    countView,
    moveTodo,
    indexOfId,
    type Todo,
    type Filter,
} from './todo';

const KEY = 'todos';
const KEY_KEYWORD = 'todo-keyword';

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
const searchInput = requireEl<HTMLInputElement>('#search-input');
const searchClear = requireEl<HTMLButtonElement>('#search-clear');

// 唯一数据源：从 localStorage 读，读出来先过运行时守卫。
// V3.0 这里写的是 const（五个操作都是就地改，引用从不换）；
// V3.1 的拖拽重排为了守「不可变」，返回的是新数组，所以必须能整体换掉 → let。
// 两种写法混在一份文件里不是随便来的：旧的五个函数是 W9 定下的契约，
// 改它们等于把 9 条单测的前提推翻；新函数按新要求写不可变，互不干扰。
let todos: Todo[] = parseTodos(localStorage.getItem(KEY));

let filter: Filter = 'all'; // 视图状态，不落盘

// 搜索关键字：第二份状态。它不影响 todos，只影响「从 todos 里挑哪些画出来」。
// 落盘是为了满足「搜索条件需持久化」——刷新后搜索框里的词还在。
// 读盘时只 trim 不转小写：归一化留给 filterByKeyword 做，
// 否则用户存了 'ABC'，重启回来发现输入框变成了 'abc'。
let keyword: string = (localStorage.getItem(KEY_KEYWORD) ?? '').trim();

function save(): void {
    localStorage.setItem(KEY, JSON.stringify(todos));
}

function saveKeyword(): void {
    localStorage.setItem(KEY_KEYWORD, keyword);
}

// 空态文案：有关键字时说「没有匹配」，别说「暂无任务」，否则用户以为是数据丢了
function emptyHint(): string {
    if (keyword.trim() !== '') return '没有匹配的任务';
    return filter === 'all' ? '暂无任务' : '这个筛选下没有任务';
}

// ---------------- render：只负责「画」 ----------------
function render(): void {
    list.innerHTML = '';

    // 两道筛选串联：先按状态（全部/未完成/已完成），再按关键字。
    // 顺序不影响结果（两个条件互不依赖），但状态先筛，关键字只需扫更少的项。
    const shown = filterByKeyword(filterByStatus(todos, filter), keyword);

    shown.forEach((t) => {
        const li = document.createElement('li');
        li.dataset.id = String(t.id); // dataset 只能存字符串，这里显式转
        li.draggable = true; // 拖拽源由这里统一开，不靠 HTML 里写死
        if (t.completed) li.classList.add('done');

        const span = document.createElement('span');
        span.textContent = t.text; // 用 textContent，杜绝 XSS
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

        list.appendChild(li); // 这里不绑监听器，交给下面的委托
    });

    if (shown.length === 0) {
        const li = document.createElement('li');
        li.className = 'todo-empty';
        li.textContent = emptyHint();
        list.appendChild(li);
    }

    // 统计口径统一由 countView 给：total 是全部任务，不是筛选后的数量
    const stat = countView(todos, shown);
    countEl.textContent = `当前视图 ${stat.shown} 条 / 总计 ${stat.total} 条`;

    document.querySelectorAll<HTMLButtonElement>('.filter-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.filter === filter);
    });
}

// ---------------- 添加 ----------------
function submit(): void {
    addTodo(todos, input.value);
    input.value = '';
    input.focus(); // 这一步原来在 addTodo 里，属于 DOM 操作，搬到这里
    save();
    render();
}

addBtn.addEventListener('click', submit);

input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') submit();
});

// ---------------- 功能点 1：搜索 ----------------
// 用 input 事件（不是 keyup）：中文输入法上屏、粘贴、点清空都会触发，
// keyup 在输入法组合阶段拿不到最终文本。
searchInput.value = keyword; // 首屏把存下来的关键字回填进输入框

searchInput.addEventListener('input', () => {
    keyword = searchInput.value; // 原样存，不在这里 trim：否则用户打不出中间带空格的关键字
    saveKeyword();
    render();
});

searchClear.addEventListener('click', () => {
    keyword = '';
    searchInput.value = '';
    saveKeyword();
    searchInput.focus();
    render();
});

// ---------------- 筛选：只改视图状态，不 save ----------------
document.querySelectorAll<HTMLButtonElement>('.filter-btn').forEach((b) => {
    b.addEventListener('click', () => {
        const f = b.dataset.filter; // string | undefined
        if (!isFilter(f)) return; // 先过守卫，才敢把它当 Filter 用
        filter = f;
        render();
    });
});

// ---------------- 事件委托：整个列表只留这一个监听器 ----------------
// 原来这一个回调同时干三件事：认出点了什么、改数据、重画，分支数堆到 11，
// ESLint 的 complexity 上限是 10，于是把它拆成「认动作」和「做动作」两层。
type ListAction = 'delete' | 'edit' | 'toggle';

// 判断点击落点是不是 li 里某个带 data-action 的按钮上。
// 用 closest 而不是 e.target：删除按钮里还套了一个 span 图标，
// 直接读 e.target.dataset 会在点中图标时拿到 undefined。
function isAction(target: Element, item: Element, action: ListAction): boolean {
    const btn = target.closest(`[data-action="${action}"]`);
    return btn !== null && item.contains(btn);
}

// 把「点了哪个按钮」收成一个值，调用方就不用再写两层 if 嵌套
function resolveAction(target: Element, item: Element): ListAction {
    if (isAction(target, item, 'delete')) return 'delete';
    if (isAction(target, item, 'edit')) return 'edit';
    return 'toggle';
}

// 编辑一条任务；返回 false 表示用户取消或输入为空，数据没动
function startEdit(id: number): boolean {
    const cur = todos.find((t) => t.id === id); // 当前文本从数据里查，不读 DOM
    const text = prompt('修改任务', cur === undefined ? '' : cur.text);
    if (text === null) return false; // 点了取消：不写库、不重画
    updateTodo(todos, id, text); // 空输入由 updateTodo 拦
    return true;
}

list.addEventListener('click', (e: MouseEvent) => {
    if (!(e.target instanceof Element)) return; // e.target 是 EventTarget，先收窄

    const item = e.target.closest('li');
    if (item === null || !list.contains(item)) return;

    const id = parseId(item.dataset.id); // string | undefined → number | null
    if (id === null) return; // 空态提示那条 li 没有 id

    const action = resolveAction(e.target, item);
    if (action === 'delete') {
        removeTodo(todos, id);
    } else if (action === 'edit') {
        if (!startEdit(id)) return;
    } else {
        toggleTodo(todos, id);
    }

    save();
    render();
});

// ---------------- 功能点 2：拖拽排序（同样走事件委托） ----------------
// 四个拖拽事件全部挂在 ul 上，不往每个 li 上绑：
// 列表是每次 render 整表重画的，绑在 li 上的监听器会随节点一起销毁，
// 要么漏绑要么重复绑，而委托在容器上绑一次就能覆盖所有当前/未来的 li。

// 拖拽源在 todos 里的下标。null 表示「当前没有正在进行的拖拽」，
// 这是最容易被漏掉的一道防御：dragstart 没识别出目标时，后面的
// dragover / drop 不能凭一个过期的下标去动数据。
let dragFrom: number | null = null;

// 把事件落点收成一条 li；空态提示、null 目标、列表外的元素全部返回 null
function itemFromEvent(e: DragEvent): HTMLLIElement | null {
    if (!(e.target instanceof Element)) return null;
    const item = e.target.closest('li');
    if (item === null || !list.contains(item)) return null;
    return item;
}

// 两种高亮要分开清：dragging 属于「被拖起来的那条」，从 dragstart 一直挂到 dragend；
// drop-over 属于「当前悬停的那条」，每换一行都要换。
// 一开始写成同一个函数一起清，实测发现鼠标一移过去，被拖的那条半透明就没了——
// 因为 dragover 把 dragging 也顺手清掉了。
function clearDropMark(): void {
    list.querySelectorAll<HTMLElement>('li.drag-over').forEach((el) => el.classList.remove('drag-over'));
}

function clearDragMark(): void {
    list.querySelectorAll<HTMLElement>('li.dragging').forEach((el) => el.classList.remove('dragging'));
    clearDropMark();
}

list.addEventListener('dragstart', (e: DragEvent) => {
    const item = itemFromEvent(e);
    if (item === null) return; // 空态 li 或列表外的元素，直接不认

    const id = parseId(item.dataset.id);
    if (id === null) return; // 空态提示那条没有 data-id

    const idx = indexOfId(todos, id);
    if (idx === -1) return; // DOM 上有、数据里没有：说明两边已经不一致，拒绝这次拖拽

    dragFrom = idx;
    item.classList.add('dragging');

    if (e.dataTransfer !== null) {
        e.dataTransfer.effectAllowed = 'move';
        // Firefox 不调用 setData 就认为「没东西可拖」，dragstart 之后直接不进 dragover
        e.dataTransfer.setData('text/plain', String(id));
    }
});

list.addEventListener('dragover', (e: DragEvent) => {
    if (dragFrom === null) return; // 不是从列表里拖起来的（比如拖了一段文字进来）

    const item = itemFromEvent(e);
    if (item === null) return; // 悬停在空白处：不接管，让浏览器显示禁止手势

    e.preventDefault(); // 关键：不拦默认行为，浏览器不认这里是放置区，drop 永远不会触发
    if (e.dataTransfer !== null) e.dataTransfer.dropEffect = 'move';

    if (!item.classList.contains('drag-over')) {
        clearDropMark();
        item.classList.add('drag-over');
    }
});

list.addEventListener('drop', (e: DragEvent) => {
    if (dragFrom === null) return;

    const item = itemFromEvent(e);
    if (item === null) return;

    e.preventDefault();

    const from = dragFrom;
    dragFrom = null; // 先复位，后面无论走哪个 return 都不会留下脏状态
    clearDragMark();

    const targetId = parseId(item.dataset.id);
    if (targetId === null) return;

    const to = indexOfId(todos, targetId);
    if (to === -1) return;

    todos = moveTodo(todos, from, to); // 返回新数组，原数组不动
    save();
    render();
});

// dragend 一定会触发（包括按 Esc 取消），把状态收干净，
// 否则下一次拖拽会带着上一次的 dragFrom 进来
list.addEventListener('dragend', () => {
    dragFrom = null;
    clearDragMark();
});

// 首屏
render();
console.log(
    '[app] 待办事项 V3.1 已启动，共',
    todos.length,
    '项，关键字 =',
    normalizeKeyword(keyword) || '（空）',
);
