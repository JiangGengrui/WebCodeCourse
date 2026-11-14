// ============================================================
// todo.ts —— 第 9 周：数据层「契约」
//
// 这里只放纯数据函数：不碰 document、不碰 localStorage。
// 只有这样才能在 Node 里直接 import 进来跑单测
// （否则文件一被 import，顶层的 querySelector 就报 document is not defined）。
// ============================================================

export interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

// 字面量联合类型：把值写死，拼错一个字母编译器就报 ts(2322)，
// 不会等到页面白屏才发现。注意第三个值是 'completed'（W8 里叫 'done'，这里统一改掉）。
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

// ---------------- 五个数据操作 ----------------
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
// ===== 实验2 Part3 · 功能点 1：关键字搜索与实时统计 =====
// ============================================================

// 关键字归一 —— 所有「脏输入」在这一处收口，过滤函数里不再写第二套判断。
// 三种输入都归成 ''（= 没有搜索）：
//   null      localStorage 里没有这个键时读出来就是 null
//   '   '     用户敲了几个空格，框里看着有东西，语义上等于没搜索
//   'AbC'     统一转小写，让大小写不敏感
export function normalizeKeyword(raw: string | null): string {
    if (raw === null) return '';
    return raw.trim().toLowerCase();
}

// 统计结果的形状写进接口，DOM 层直接拿去拼字符串，不用自己数
export interface ViewStat {
    shown: number;
    total: number;
}

// 参数写 readonly Todo[]：这个函数只读不写，调用方的数组不该被它动。
// 空关键字返回 slice() 而不是 todos 本身 —— 否则调用方拿到的是同一个引用，
// 后面谁 push 一条都会「隔空」改到原数组，这类 bug 极难查。
export function filterByKeyword(todos: readonly Todo[], keyword: string): Todo[] {
    const kw = normalizeKeyword(keyword);
    if (kw === '') return todos.slice();
    return todos.filter((t) => t.text.toLowerCase().includes(kw));
}

// 状态筛选单独抽一层：视图 = 状态筛选 ∩ 关键字筛选，两个条件互不干扰。
// 抽出来之后 render 里的三元嵌套也没了，顺带把 complex 降下来。
export function filterByStatus(todos: readonly Todo[], filter: Filter): Todo[] {
    if (filter === 'all') return todos.slice();
    if (filter === 'active') return todos.filter((t) => !t.completed);
    return todos.filter((t) => t.completed);
}

// 统计口径：total 永远是全部任务数（不是筛选后的），shown 是最终显示数。
// 「当前视图 X 条 / 总计 Y 条」里的 X、Y 就取这两个字段。
export function countView(total: readonly Todo[], shown: readonly Todo[]): ViewStat {
    return { shown: shown.length, total: total.length };
}

// ============================================================
// ===== 实验2 Part3 · 功能点 2：拖拽排序 =====
// ============================================================

// 不可变重排：先 slice 复制一份，再在副本上 splice，原数组一个元素都不动。
// 四道边界防线都必须有，因为调用方传进来的是「从 DOM 反查出来的下标」：
//   NaN / 1.5    → Number.isInteger 挡掉（NaN 拿去 splice 会静默什么都不做）
//   -1 / 999     → 范围检查挡掉（负数下标在 splice 里是「从末尾数」，最容易埋雷）
//   from === to  → 直接返回副本，省掉一次无意义的重画
export function moveTodo(todos: readonly Todo[], from: number, to: number): Todo[] {
    const n = todos.length;
    if (!Number.isInteger(from) || !Number.isInteger(to)) return todos.slice();
    if (from < 0 || from >= n || to < 0 || to >= n) return todos.slice();
    if (from === to) return todos.slice();

    const next = todos.slice();
    const [moved] = next.splice(from, 1); // 作用在副本上
    next.splice(to, 0, moved);
    return next;
}

// 从 DOM 反查下标：找不到返回 -1，调用方据此拒绝这次拖拽。
// 单独抽出来是因为「空态提示那条 li 没有 data-id」必须有地方兜住，
// 否则 findIndex 拿 -1 直接进 moveTodo，负下标会被当作「从末尾数」。
export function indexOfId(todos: readonly Todo[], id: number): number {
    return todos.findIndex((t) => t.id === id);
}
