// ============================================================
// feature.test.ts —— 实验2 Part3 两个新功能的单元测试
//
// 为什么要单独一个文件：todo.test.ts 是 W9 手写的 9 条，
// 它守的是「添加/切换」那份旧契约，一个字都不该动；
// 新功能有自己的契约（过滤、统计、不可变重排），单独归档更好定位。
//
// 每组都按「正常 / 边界 / 异常」三类铺，实验要求每功能点至少 3 组用例。
// ============================================================

import { test, expect } from 'vitest';
import {
    filterByKeyword,
    filterByStatus,
    countView,
    normalizeKeyword,
    moveTodo,
    indexOfId,
    type Todo,
} from '../src/todo';

// 三条样本，故意混了中英文和大小写：中文用来测子串，英文用来测大小写折叠
function make(): Todo[] {
    return [
        { id: 1, text: '买牛奶', completed: false },
        { id: 2, text: '写 React 作业', completed: true },
        { id: 3, text: 'Buy MILK for cat', completed: false },
    ];
}

// ============================================================
// 功能点 1：关键字过滤
// ============================================================

// ① 正常：中文子串命中
test('① filterByKeyword 正常命中：中文子串只留一条', () => {
    const out = filterByKeyword(make(), '牛奶');
    expect(out.length).toBe(1);
    expect(out[0].id).toBe(1);
});

// ② 正常：大小写不敏感（输入小写 milk，命中大写 MILK）
test('② filterByKeyword 大小写不敏感：milk 命中 MILK', () => {
    const out = filterByKeyword(make(), 'milk');
    expect(out.length).toBe(1);
    expect(out[0].id).toBe(3);
});

// ③ 边界：纯空格 = 没搜索。这是本功能最容易被写漏的一条：
//    如果直接 includes(rawKeyword)，'   ' 会把三条全过滤掉，列表瞬间变空。
test('③ filterByKeyword 纯空格：等价于无关键字，返回全部', () => {
    expect(filterByKeyword(make(), '   ').length).toBe(3);
});

// ④ 边界：空串
test('④ filterByKeyword 空串：返回全部', () => {
    expect(filterByKeyword(make(), '').length).toBe(3);
});

// ⑤ 异常：null（localStorage 里没这个键时读出来的就是 null）
test('⑤ filterByKeyword 传 null：不崩，返回全部', () => {
    expect(filterByKeyword(make(), null as unknown as string).length).toBe(3);
});

// ⑥ 异常：没有任何命中
test('⑥ filterByKeyword 无命中：返回空数组而不是 undefined', () => {
    const out = filterByKeyword(make(), 'zzz-不存在');
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBe(0);
});

// ⑦ 边界：返回值不能是原数组的别名，原数组也不能被改
test('⑦ filterByKeyword 不改原数组，返回的是新数组', () => {
    const list = make();
    const out = filterByKeyword(list, '');
    expect(out).not.toBe(list); // 引用不同
    out.push({ id: 99, text: '外部塞进来的', completed: false });
    expect(list.length).toBe(3); // 往返回值里 push 不该影响原数组
});

// ⑧ 统计：shown 取最终显示数，total 取全部
test('⑧ countView 统计口径：shown 是视图数，total 是总数', () => {
    const list = make();
    const stat = countView(list, filterByKeyword(list, '牛奶'));
    expect(stat.shown).toBe(1);
    expect(stat.total).toBe(3);
});

// ⑨ 组合：状态筛选 + 关键字，两个条件互不干扰
test('⑨ 状态筛选与关键字可叠加：未完成 + 含 buy', () => {
    const list = make();
    const byStatus = filterByStatus(list, 'active');
    const out = filterByKeyword(byStatus, 'buy');
    expect(out.length).toBe(1);
    expect(out[0].id).toBe(3);
});

// ⑩ 归一口径本身也值得测：首尾空格要去掉、大小写要统一
test('⑩ normalizeKeyword 去首尾空格并转小写', () => {
    expect(normalizeKeyword('  AbC  ')).toBe('abc');
    expect(normalizeKeyword(null)).toBe('');
    expect(normalizeKeyword('   ')).toBe('');
});

// ============================================================
// 功能点 2：拖拽排序
// ============================================================

// ① 正常：往后移
test('① moveTodo 往后移：第 0 项移到下标 2', () => {
    const out = moveTodo(make(), 0, 2);
    expect(out.map((t) => t.text)).toEqual(['写 React 作业', 'Buy MILK for cat', '买牛奶']);
});

// ② 正常：往前移
test('② moveTodo 往前移：第 2 项移到下标 0', () => {
    const out = moveTodo(make(), 2, 0);
    expect(out.map((t) => t.text)).toEqual(['Buy MILK for cat', '买牛奶', '写 React 作业']);
});

// ③ 边界：from === to，顺序不变但仍要返回新数组（调用方会拿它整体替换 todos）
test('③ moveTodo 原地不动：顺序不变，且返回新数组', () => {
    const list = make();
    const out = moveTodo(list, 1, 1);
    expect(out.map((t) => t.text)).toEqual(list.map((t) => t.text));
    expect(out).not.toBe(list);
});

// ④ 边界：负数下标。splice 里 -1 表示「从末尾数」，
//    不拦住就会把最后一条挪到别处，是这功能最隐蔽的坑。
test('④ moveTodo 负下标：原样返回，不动数据', () => {
    const out = moveTodo(make(), -1, 0);
    expect(out.map((t) => t.id)).toEqual([1, 2, 3]);
});

// ⑤ 边界：超上界
test('⑤ moveTodo 下标超上界：原样返回', () => {
    const out = moveTodo(make(), 0, 99);
    expect(out.map((t) => t.id)).toEqual([1, 2, 3]);
});

// ⑥ 异常：NaN / 小数（dataset 解析失败时会得到 NaN）
test('⑥ moveTodo 传 NaN 与小数：原样返回，不抛错', () => {
    expect(moveTodo(make(), Number.NaN, 0).map((t) => t.id)).toEqual([1, 2, 3]);
    expect(moveTodo(make(), 0, 1.5).map((t) => t.id)).toEqual([1, 2, 3]);
});

// ⑦ 核心：不可变原则。这条是本功能点的判据 ——
//    用 splice 原地改的写法会在这一条上变红。
test('⑦ moveTodo 遵守不可变：原数组的顺序与元素都不变', () => {
    const list = make();
    const backup = list.slice();
    moveTodo(list, 0, 2);
    expect(list.map((t) => t.id)).toEqual([1, 2, 3]); // 原顺序没动
    expect(list[0]).toBe(backup[0]); // 连元素引用都没被换掉
    expect(list.length).toBe(3);
});

// ⑧ 边界：空数组
test('⑧ moveTodo 空数组：返回空数组，不抛错', () => {
    expect(moveTodo([], 0, 0).length).toBe(0);
});

// ⑨ 边界：只有一条
test('⑨ moveTodo 单元素：还是那一条', () => {
    const one: Todo[] = [{ id: 7, text: '唯一一条', completed: false }];
    const out = moveTodo(one, 0, 0);
    expect(out.length).toBe(1);
    expect(out[0].id).toBe(7);
});

// ⑩ 数据源的真实脏值：从 DOM 反查下标，查不到要返回 -1 让调用方拒绝拖拽
test('⑩ indexOfId 找不到时返回 -1（空态 li 没有 data-id）', () => {
    const list = make();
    expect(indexOfId(list, 2)).toBe(1);
    expect(indexOfId(list, 404)).toBe(-1);
});
