// ============================================================
// round1.test.ts —— 第一轮 AI 生成版的「审查取证」
//
// 这份测试的断言写的是「正确行为应该是什么」，而不是「代码实际做了什么」。
// 所以它跑出来必然是几条绿、几条红：绿的是正常路径，红的就是第一轮的窟窿。
//
// 用法：npm run test:round1
// 它故意不在 npm run test 的范围里（test 脚本只扫 tests/），
// 免得一个"已知会红"的取证用例污染正常验收。
// ============================================================

import { test, expect } from 'vitest';
import { filterByKeywordR1, moveTodoR1, statTextR1 } from './todo.round1';
import type { Todo } from '../src/todo';

function make(): Todo[] {
    return [
        { id: 1, text: '买牛奶', completed: false },
        { id: 2, text: '写 React 作业', completed: true },
        { id: 3, text: 'Buy MILK for cat', completed: false },
    ];
}

// ---------- 会通过的两条：这就是第一轮的危险之处 ----------

test('R1-① 正常关键字能筛出结果 —— 通过', () => {
    expect(filterByKeywordR1(make(), '牛奶').length).toBe(1);
});

test('R1-② 正常拖拽顺序确实变了 —— 通过', () => {
    const out = moveTodoR1(make(), 0, 2);
    expect(out.map((t) => t.id)).toEqual([2, 3, 1]);
});

test('R1-③ 统计文案格式正确 —— 通过', () => {
    expect(statTextR1(1, 3)).toBe('当前视图 1 条 / 总计 3 条');
});

// ---------- 会失败的四条：边界与不可变全线失守 ----------

test('R1-④ 纯空格应等价于无关键字 —— 实际会把列表清空', () => {
    expect(filterByKeywordR1(make(), '   ').length).toBe(3);
});

test('R1-⑤ 大小写不敏感 —— 实际 milk 找不到 MILK', () => {
    expect(filterByKeywordR1(make(), 'milk').length).toBe(1);
});

test('R1-⑥ 重排后原数组应保持不变 —— 实际被原地改掉了', () => {
    const list = make();
    moveTodoR1(list, 0, 2);
    expect(list.map((t) => t.id)).toEqual([1, 2, 3]);
});

test('R1-⑦ 负下标应被拒绝 —— 实际把最后一条挪到了最前', () => {
    expect(moveTodoR1(make(), -1, 0).map((t) => t.id)).toEqual([1, 2, 3]);
});
