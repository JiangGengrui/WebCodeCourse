// ============================================================
// storage.ts —— localStorage 的安全边界（W12 V4.0）
//
// 这个文件是「不可信数据」进入应用的第一道门：
// localStorage 里的东西可能是上一版程序写的、可能被用户手改过、
// 也可能压根读不出来（隐私模式）。所有脏活都收在这里做，
// 组件里只允许写 useState<Todo[]>(loadTodos)，不出现裸的 JSON.parse。
// ============================================================

import { isTodo, type Todo } from './todo';

export const TODOS_KEY = 'todos';

/**
 * 安全读取。四道关，任何一道没过都退回空列表，绝不抛给调用方：
 *   ① getItem 本身可能抛（Safari 隐私模式、存储被策略禁用）
 *   ② JSON.parse 可能抛（存进去的半截字符串）
 *   ③ 解析出来可能不是数组（对象 / 字符串 / null）
 *   ④ 是数组，但里面的元素缺字段、类型不对（旧版本遗留的脏数据）
 */
export function loadTodos(): Todo[] {
    let raw: string | null;
    try {
        raw = localStorage.getItem(TODOS_KEY);
    } catch {
        return []; // ① 读不出来
    }
    if (raw === null) return []; // 第一次打开，key 还不存在

    let data: unknown;
    try {
        data = JSON.parse(raw);
    } catch {
        return []; // ② 非法 JSON
    }
    if (!Array.isArray(data)) return []; // ③ 合法 JSON 但不是数组

    const list: unknown[] = data;
    return list.filter(isTodo); // ④ 逐条过守卫，坏条目直接丢
}

/** 安全写入：配额满 / 隐私模式下 setItem 会抛，持久化失败不该让页面崩 */
export function saveTodos(todos: Todo[]): void {
    try {
        localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
    } catch {
        // 忽略：本次会话的数据仍在内存里，只是刷新后不再保留
    }
}
