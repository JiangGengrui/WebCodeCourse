// ============================================================
// storage.test.ts —— 安全读取的四道关，每条都用一个用例钉住
//
// 环境是 node（没有 localStorage），所以这里自己塞一个假的进去：
// storage.ts 只在函数体内访问 localStorage，导入时并不求值，
// 因此「先定义假实现、再调用 loadTodos」是可行的。
// ============================================================

import { beforeEach, describe, expect, it } from 'vitest';
import { loadTodos, saveTodos, TODOS_KEY } from '../src/storage';
import type { Todo } from '../src/todo';

const memory = new Map<string, string>();

const fakeStorage = {
    getItem: (k: string): string | null => memory.get(k) ?? null,
    setItem: (k: string, v: string): void => {
        memory.set(k, v);
    },
    removeItem: (k: string): void => {
        memory.delete(k);
    },
    clear: (): void => {
        memory.clear();
    },
    key: (): string | null => null,
    get length(): number {
        return memory.size;
    },
} as unknown as Storage;

Object.defineProperty(globalThis, 'localStorage', { value: fakeStorage, configurable: true });

beforeEach(() => {
    memory.clear();
});

describe('loadTodos 的四道关', () => {
    it('key 不存在 → 空数组（第一次打开）', () => {
        expect(loadTodos()).toEqual([]);
    });

    it('非法 JSON → 空数组，不抛错', () => {
        memory.set(TODOS_KEY, '{"id":1,'); // 半截字符串
        expect(() => loadTodos()).not.toThrow();
        expect(loadTodos()).toEqual([]);
    });

    it('合法 JSON 但不是数组 → 空数组', () => {
        memory.set(TODOS_KEY, '{"id":1,"text":"对象不是数组","completed":false}');
        expect(loadTodos()).toEqual([]);
        memory.set(TODOS_KEY, '"abc"');
        expect(loadTodos()).toEqual([]);
        memory.set(TODOS_KEY, 'null');
        expect(loadTodos()).toEqual([]);
    });

    it('数组里混着脏条目 → 只保留合法项', () => {
        memory.set(
            TODOS_KEY,
            JSON.stringify([
                { id: 1, text: '合法', completed: false },
                { id: '2', text: 'id 是字符串', completed: false },
                { id: 3, completed: true }, // 缺 text
                { id: 4, text: 'completed 不是布尔', completed: 0 },
                null,
                'x',
            ]),
        );
        expect(loadTodos()).toEqual([{ id: 1, text: '合法', completed: false }]);
    });

    it('getItem 抛错（隐私模式）→ 空数组，不炸页面', () => {
        Object.defineProperty(globalThis, 'localStorage', {
            value: {
                ...fakeStorage,
                getItem: (): string | null => {
                    throw new Error('SecurityError: storage disabled');
                },
            },
            configurable: true,
        });
        expect(loadTodos()).toEqual([]);
        Object.defineProperty(globalThis, 'localStorage', { value: fakeStorage, configurable: true });
    });
});

describe('saveTodos / loadTodos 往返', () => {
    it('写进去再读出来，数据一字不差', () => {
        const data: Todo[] = [
            { id: 1700000000000, text: '买菜', completed: false },
            { id: 1700000000001, text: '写实验报告', completed: true },
        ];
        saveTodos(data);
        expect(loadTodos()).toEqual(data);
    });

    it('空数组写进去，读出来还是空数组（不是 null）', () => {
        saveTodos([]);
        expect(memory.get(TODOS_KEY)).toBe('[]');
        expect(loadTodos()).toEqual([]);
    });
});
