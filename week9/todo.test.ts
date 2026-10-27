// ============================================================
// todo.test.ts —— 任务 2：手写五条单元测试
//
// 被测对象：todo.ts 里的两个纯数据函数（不碰 DOM，所以在 Node 里能直接 import）
// 课件要求的五条：
//   1. addTodo 正常添加（长度 +1，且 text 等于输入）
//   2. addTodo 纯空格（长度不变）
//   3. addTodo 空字符串（长度不变）
//   4. toggleTodo 正常切换（目标翻转）
//   5. toggleTodo 不存在的 id（不崩溃）
//
// 写的时候踩过的坑（日志里要用）：
//   第一版五条全是 addTodo 换不同文本、期望全写 0，四条都压在同一个 push 出口上，
//   return 那条分支一次没走到；后来按「输入类别」而不是「输入内容」重排。
//   第二版 ④⑤ 只写了数字 1 和 0，没有落到字段上（哪个字段 === 什么值），等于没断言。
// ============================================================

import { test, expect } from 'vitest';
import { addTodo, toggleTodo, type Todo } from './todo';

// ① 正常分支：合法文本 → push 一条，长度 1，text 是 trim 之后的原样，completed 默认 false
test('① addTodo 正常添加：长度 +1，内容正确，默认未完成', () => {
    const todos: Todo[] = [];
    addTodo(todos, '学习TS');
    expect(todos.length).toBe(1);
    expect(todos[0].text).toBe('学习TS');
    expect(todos[0].completed).toBe(false);
});

// ② 空格分支：'   ' 不是空串，只有先 trim 才变空；这条专门守 trim 那一行
test('② addTodo 纯空格：被拦住，长度不变', () => {
    const todos: Todo[] = [];
    addTodo(todos, '   ');                 // 引号里三个空格，全靠 trim 变空
    expect(todos.length).toBe(0);
});

// ③ 空串分支：'' 本身就走空判断，和 ② 保护的不是同一行
test('③ addTodo 空字符串：被拦住，长度不变', () => {
    const todos: Todo[] = [];
    addTodo(todos, '');
    expect(todos.length).toBe(0);
});

// ④ 翻转分支：放两条，才能顺便证明「没误改别的」
test('④ toggleTodo 正常切换：目标翻转，其他项不动', () => {
    const todos: Todo[] = [
        { id: 1, text: '学习TS', completed: false },
        { id: 2, text: '写实验报告', completed: false },
    ];
    toggleTodo(todos, 1);
    expect(todos[0].completed).toBe(true);   // 目标翻转了
    expect(todos[1].completed).toBe(false);  // 第二条没被连带改
    expect(todos.length).toBe(2);            // 也没有被删
});

// ⑤ 找不到分支：find 返回 undefined 就 return，数组应该一个字节都没变
//    反面教材：写成「传空数组、断言长度 0」——空数组本来就是 0，改坏了也看不出来
test('⑤ toggleTodo 不存在的 id：不崩溃，数组原样', () => {
    const todos: Todo[] = [{ id: 1, text: '学习TS', completed: false }];
    toggleTodo(todos, 999);
    expect(todos.length).toBe(1);            // 一条都没少
    expect(todos[0].completed).toBe(false);  // 也没被误翻转
});

// 补① 空值：真 null，不用 as any
test('补① addTodo 传 null：拦住，长度不变', () => {
    const todos: Todo[] = [];
    addTodo(todos, null);
    expect(todos.length).toBe(0);
});

// 补② 格式拓展：超长文本原样保存，不截断、不报错
test('补② addTodo 超长文本：原样保存', () => {
    const todos: Todo[] = [];
    const long = '啊'.repeat(500);
    addTodo(todos, long);
    expect(todos.length).toBe(1);
    expect(todos[0].text.length).toBe(500);
});

// 补③ 类型/越界：NaN 与负数 id 都不该改到任何一条
test('补③ toggleTodo 传 NaN / 负数 id：数组不变', () => {
    const todos: Todo[] = [{ id: 1, text: '学习TS', completed: false }];
    toggleTodo(todos, Number.NaN);
    toggleTodo(todos, -1);
    expect(todos[0].completed).toBe(false);
});

// 补④ 重复：同一文本加两次要得两条，且 id 不能撞（Date.now() 同毫秒的坑）
test('补④ addTodo 同一文本连加两次：两条、id 不重复', () => {
    const todos: Todo[] = [];
    addTodo(todos, '学习TS');
    addTodo(todos, '学习TS');
    expect(todos.length).toBe(2);
    expect(todos[0].id).not.toBe(todos[1].id);
});
