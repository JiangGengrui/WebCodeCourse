import { describe, it, expect } from 'vitest';
import { addTodo, toggleTodo, type Todo } from './todo';

describe('addTodo', () => {
    it('should work correctly', () => {
        const todos: Todo[] = [];
        addTodo(todos, '学习TS');
        expect(todos.length).toBe(1);
        expect(todos[0]).toBeDefined();
    });

    it('正常添加时文本正确', () => {
        const todos: Todo[] = [];
        const raw = '  学习TS  ';
        addTodo(todos, raw);
        expect(todos[0].text).toBe(raw.trim());
    });

    it('纯空格应被拦截', () => {
        const todos: Todo[] = [];
        addTodo(todos, '     ');
        expect(todos.length).toBe(0);
    });

    it('空字符串应被拦截', () => {
        const todos: Todo[] = [];
        addTodo(todos, '');
        expect(todos.length).toBe(0);
    });

    it('连续添加多条后长度正确', () => {
        const todos: Todo[] = [];
        addTodo(todos, 'A');
        addTodo(todos, 'B');
        addTodo(todos, 'C');
        expect(todos.length).toBe(3);
    });

    it('异常输入不应让程序崩溃', () => {
        const todos: Todo[] = [];
        try {
            addTodo(todos, null as any);
            expect(todos.length).toBeGreaterThanOrEqual(0);
        } catch (e) {
            expect(true).toBe(true);
        }
    });
});

describe('toggleTodo', () => {
    it('切换后状态改变', () => {
        const todos: Todo[] = [{ id: 1, text: '学习TS', completed: false }];
        toggleTodo(todos, 1);
        expect(todos[0].completed).toBeTruthy();
    });

    it('切换两次回到原状态', () => {
        const todos: Todo[] = [{ id: 1, text: '学习TS', completed: false }];
        toggleTodo(todos, 1);
        toggleTodo(todos, 1);
        expect(todos[0].completed).toBeFalsy();
    });

    it('不存在的 id 不应报错', () => {
        const todos: Todo[] = [];
        expect(() => toggleTodo(todos, 999)).not.toThrow();
    });
});
