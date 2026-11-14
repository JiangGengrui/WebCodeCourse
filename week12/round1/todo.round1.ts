// ============================================================
// todo.round1.ts —— 第一轮 AI 生成版（只给功能要求，无工程约束）
//
// 这份文件不是应用的一部分，只作「审查取证」保留：
// 它代表「把功能要求原样丢给 AI，拿到什么就用什么」的那个版本，
// 用来和 round2（src/todo.ts 里的最终实现）做对比。
//
// 已知缺陷（都是跑 round1.test.ts 实测出来的，不是猜的）：
//   1. 过滤只写 includes(keyword)：不 trim、不折叠大小写
//      → 输入两个空格，列表被清空；输入 'milk' 找不到 'MILK'
//   2. 重排用 splice 直接改原数组，还把它原样 return
//      → 违反不可变原则；调用方即使想保留旧数组也做不到
//   3. 没有任何下标边界检查
//      → from = -1 在 splice 语义里是「从末尾数」，会悄悄挪错一条
// ============================================================

import type { Todo } from '../src/todo';

// 第一轮的过滤：只有一行，看起来"简洁优雅"
export function filterByKeywordR1(todos: Todo[], keyword: string): Todo[] {
    return todos.filter((t) => t.text.includes(keyword));
}

// 第一轮的统计：直接拼字符串，顺便把"总数"算成了过滤后的数量
export function statTextR1(shown: number, total: number): string {
    return `当前视图 ${shown} 条 / 总计 ${total} 条`;
}

// 第一轮的重排：splice 原地改，再把同一个数组 return 回去
export function moveTodoR1(todos: Todo[], from: number, to: number): Todo[] {
    const [moved] = todos.splice(from, 1);
    todos.splice(to, 0, moved);
    return todos;
}
