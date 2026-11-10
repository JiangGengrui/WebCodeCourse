// ============================================================
// todo.ts —— 数据层「契约」（V4.0：新增 React 用的不可变包装）
//
// 这里只放纯数据函数：不碰 document、不碰 localStorage、不引 React。
// 只有这样才能在 Node 里直接 import 进来跑单测，
// 也才能被 React 组件和命令式入口同时复用。
// ============================================================

export interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

// 字面量联合类型：把值写死，拼错一个字母编译器就报 ts(2322)，
// 不会等到页面白屏才发现。
export type Filter = 'all' | 'active' | 'completed';

// ---------------- id 生成 ----------------
// 用 Date.now() 作 id；同一毫秒内连续添加会拿到相同的值，
// 于是按 id 匹配的操作会一次改动多条，所以加一个单调递增兜底。
let lastId = 0;
function nextId(): number {
    const now = Date.now();
    lastId = now > lastId ? now : lastId + 1;
    return lastId;
}

// ---------------- 脏数据入口 1：dataset.id ----------------
// dataset 读出来永远是 string | undefined，而 Todo.id 是 number。
// 三种坏值：'123abc' → NaN、'1.5' → 不是整数、'' → 0。
// 注意第三种：Number('') 是 0，而 0 是安全整数，能通过 isSafeInteger，
// 所以必须先把空串单独挡掉，否则一个空字符串会冒充成合法的 id 0。
export function parseId(raw: string | undefined): number | null {
    if (raw === undefined) return null;
    const s = raw.trim();
    if (s === '') return null;
    const id = Number(s);
    if (!Number.isSafeInteger(id)) return null;
    return id;
}

// ---------------- 脏数据入口 2：localStorage ----------------
// JSON.parse 回来的是 unknown：可能是 null、对象、数组、缺字段的旧数据。
// 用运行时守卫而不是 as Todo —— as 只让编译器闭嘴，一个字段都不校验。
export function isTodo(value: unknown): value is Todo {
    if (typeof value !== 'object' || value === null) return false;
    if (!('id' in value && 'text' in value && 'completed' in value)) return false;
    return (
        typeof value.id === 'number' &&
        Number.isSafeInteger(value.id) &&
        typeof value.text === 'string' &&
        typeof value.completed === 'boolean'
    );
}

export function isFilter(value: unknown): value is Filter {
    return value === 'all' || value === 'active' || value === 'completed';
}

export function parseTodos(raw: string | null): Todo[] {
    if (raw === null) return [];
    let data: unknown;
    try {
        data = JSON.parse(raw);
    } catch {
        return []; // 存进去的东西坏了，当成空列表，不让页面崩
    }
    if (!Array.isArray(data)) return [];
    const list: unknown[] = data;
    return list.filter(isTodo); // 逐条过守卫，脏数据直接丢掉
}

// ---------------- 五个数据操作（就地改，W9 契约不动） ----------------
// 契约：合法文本 → 添加；null / 空串 / 纯空格 → 拒绝，长度不变。
// 参数写 string | null 而不是 string：契约要求拦 null，
// 签名只收 string 的话，测试想传 null 就只能 as any，反而踩了红线。
export function addTodo(todos: Todo[], text: string | null): void {
    if (text === null) return;
    const v = text.trim(); // 先 trim 再判断，纯空格也算空
    if (v === '') return;
    todos.push({ id: nextId(), text: v, completed: false });
}

export function toggleTodo(todos: Todo[], id: number): void {
    const target = todos.find((t) => t.id === id);
    if (target === undefined) return; // 不存在的 id：安静返回，不抛错
    target.completed = !target.completed;
}

export function removeTodo(todos: Todo[], id: number): void {
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) return;
    todos.splice(index, 1);
}

export function updateTodo(todos: Todo[], id: number, text: string | null): void {
    if (text === null) return; // prompt 点了取消
    const v = text.trim();
    if (v === '') return; // 空输入不写库
    const target = todos.find((t) => t.id === id);
    if (target === undefined) return;
    target.text = v; // 只改 text，completed 原样保留
}

export function clearCompleted(todos: Todo[]): void {
    for (let i = todos.length - 1; i >= 0; i--) {
        const t = todos[i];
        if (t.completed) todos.splice(i, 1); // 倒序遍历，删掉也不会跳项
    }
}

// ============================================================
// 以下为 V4.0 新增：给 React 的 useState 用的不可变入口
//
// 上面五个函数是「就地改」：push / splice / 直接改对象字段，数组引用始终不变。
// 那套写法配命令式渲染没问题（改完手动 render()），
// 但 React 的 setState 靠「引用是否变化」决定要不要重渲染：
// setTodos(todos) 传回同一个引用，Object.is 判定相等，React 直接 bailout，
// 数据明明变了、页面却纹丝不动 —— 这就是「假 React」最典型的症状。
//
// 所以这里加一层包装：先复制一份 draft，把就地修改作用在副本上，再返回新数组。
// 不重写业务逻辑的原因有两条：
//   1. 规则只留一份实现，改一处不会漏掉另一处；
//   2. tests/todo.test.ts 一行都不用改就能继续跑绿 —— 这是本周「轨道 A」的证据。
// ============================================================
function commit(todos: Todo[], mutate: (draft: Todo[]) => void): Todo[] {
    // 浅拷贝每个元素：toggleTodo / updateTodo 会改对象自身的字段，
    // 只复制数组（[...todos]）的话，被改的仍然是 State 里那个对象，
    // 引用比较在「项」这一层就失效了。
    const draft = todos.map((t) => ({ ...t }));
    mutate(draft);
    return draft;
}

export function withAdded(todos: Todo[], text: string | null): Todo[] {
    return commit(todos, (draft) => addTodo(draft, text));
}

export function withToggled(todos: Todo[], id: number): Todo[] {
    return commit(todos, (draft) => toggleTodo(draft, id));
}

export function withRemoved(todos: Todo[], id: number): Todo[] {
    return commit(todos, (draft) => removeTodo(draft, id));
}

export function withUpdated(todos: Todo[], id: number, text: string | null): Todo[] {
    return commit(todos, (draft) => updateTodo(draft, id, text));
}

export function withCleared(todos: Todo[]): Todo[] {
    return commit(todos, (draft) => clearCompleted(draft));
}

// 筛选也做成纯函数：视图该显示哪些项，由「数据 + 筛选值」唯一决定，
// 组件里不再留第二份 if 判断。
export function filterTodos(todos: Todo[], filter: Filter): Todo[] {
    if (filter === 'all') return todos;
    if (filter === 'active') return todos.filter((t) => !t.completed);
    return todos.filter((t) => t.completed);
}

export function countDone(todos: Todo[]): number {
    return todos.reduce((n, t) => n + (t.completed ? 1 : 0), 0);
}
