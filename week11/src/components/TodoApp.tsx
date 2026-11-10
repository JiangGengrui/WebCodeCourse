import { useState } from 'react';
import { TodoForm } from './TodoForm';
import { TodoList } from './TodoList';
import {
    countDone,
    filterTodos,
    parseTodos,
    withAdded,
    withCleared,
    withRemoved,
    withToggled,
    withUpdated,
    type Filter,
    type Todo,
} from '../todo';

const KEY = 'todos';

const FILTERS: { value: Filter; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'active', label: '未完成' },
    { value: 'completed', label: '已完成' },
];

function loadTodos(): Todo[] {
    return parseTodos(localStorage.getItem(KEY));
}

function saveTodos(todos: Todo[]): void {
    localStorage.setItem(KEY, JSON.stringify(todos));
}

/**
 * 容器组件：整个应用只有这里持有 todos。
 * 数据往下传（todos / 回调），事件往上传（子组件只喊「有人点了 id 为 x 的删除」），
 * 所以任何一次数据变化都只有一条路径：子组件触发回调 → 这里 setState → React 重画。
 */
export function TodoApp(): JSX.Element {
    // 传函数而不是 parseTodos(...) 的结果：这是惰性初始化，只在首次渲染读一次 localStorage。
    // 直接传值的话，每次重渲染都会重新读盘 + 重新 JSON.parse。
    const [todos, setTodos] = useState<Todo[]>(loadTodos);
    const [filter, setFilter] = useState<Filter>('all'); // 视图状态，不落盘

    // 唯一修改 State 的出口：顺带落盘。
    // 如果散在各处写 setTodos + saveTodos，漏一个就会出现「页面有、刷新没了」。
    function commit(next: Todo[]): void {
        setTodos(next);
        saveTodos(next);
    }

    function handleAdd(text: string): void {
        commit(withAdded(todos, text));
    }

    function handleToggle(id: number): void {
        commit(withToggled(todos, id));
    }

    function handleRemove(id: number): void {
        commit(withRemoved(todos, id));
    }

    // 「问用户要新文本」属于交互，不属于数据，所以 prompt 留在组件里；
    // 拿到结果后交给 withUpdated 校验（null / 空串都由它拦）。
    function handleEdit(id: number): void {
        const cur = todos.find((t) => t.id === id);
        const text = prompt('修改任务', cur === undefined ? '' : cur.text);
        if (text === null) return; // 点了取消
        commit(withUpdated(todos, id, text));
    }

    function handleClear(): void {
        commit(withCleared(todos));
    }

    const shown = filterTodos(todos, filter);
    const done = countDone(todos);

    return (
        <main className="todo-card">
            <h1>待办事项 V4.0</h1>

            <TodoForm onAdd={handleAdd} />

            <div className="filters">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        type="button"
                        className={f.value === filter ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilter(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
                <span className="todo-count">
                    共 {todos.length} 项，已完成 {done} 项
                </span>
            </div>

            <TodoList
                todos={shown}
                emptyText={filter === 'all' ? '暂无任务' : '这个筛选下没有任务'}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onRemove={handleRemove}
            />

            {done > 0 && (
                <button type="button" className="clear-btn" onClick={handleClear}>
                    清除已完成（{done}）
                </button>
            )}
        </main>
    );
}
