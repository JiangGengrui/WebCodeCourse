// ============================================================
// TodoAppDefect.tsx —— 任务 3 的「靶子代码」，一字不改地搬进可运行页面
//
// 目的是「动手验证」：它看起来完全正常，只有把 localStorage 手动塞一条数据
// 再打开页面，才能看到问题 ——
//   ① 读取写在 Effect 里，首帧渲染的 todos 是 []；
//   ② 写入 Effect 与读取 Effect 同级，挂载后先跑的是「读」，紧接着就跑「写 []」；
//   ③ 没有 try-catch 也没有 Array.isArray，脏数据进来直接炸。
// 这个文件只给 round1/defect.html 用，不参与正式入口，也不参与构建。
// ============================================================

import { useEffect, useState } from 'react';
import { TodoForm } from '../src/components/TodoForm';
import { TodoList } from '../src/components/TodoList';
import { addTodo, toggleTodo, removeTodo, type Todo } from '../src/todo';

export function TodoAppDefect(): JSX.Element {
    const [todos, setTodos] = useState<Todo[]>([]);

    // 靶子 ①：读取放在 Effect 里 —— 首帧 rendering 时 todos 还是空的
    useEffect(() => {
        const saved = localStorage.getItem('todos');
        if (saved) setTodos(JSON.parse(saved)); // 无 try-catch、无 Array.isArray
    }, []);

    // 靶子 ②：写入 Effect 与上面同级，挂载后立刻用「当时的 todos」写一次
    useEffect(() => {
        localStorage.setItem('todos', JSON.stringify(todos));
    }, [todos]);

    // 就地把新数组塞进 State：为了不改业务逻辑，这里复制一份再交给 addTodo
    function handleAdd(text: string): void {
        const draft = todos.map((t) => ({ ...t }));
        addTodo(draft, text);
        setTodos(draft);
    }

    function handleToggle(id: number): void {
        const draft = todos.map((t) => ({ ...t }));
        toggleTodo(draft, id);
        setTodos(draft);
    }

    function handleRemove(id: number): void {
        const draft = todos.map((t) => ({ ...t }));
        removeTodo(draft, id);
        setTodos(draft);
    }

    return (
        <main className="todo-card">
            <div className="todo-head">
                <h1>待办事项（靶子代码 · 有问题的持久化）</h1>
            </div>
            <TodoForm onAdd={handleAdd} />
            <TodoList
                todos={todos}
                emptyText="暂无任务"
                onToggle={handleToggle}
                onEdit={() => undefined}
                onRemove={handleRemove}
            />
            <p className="theme-now">read/write 各一个 Effect，读取不在惰性初始化里</p>
        </main>
    );
}
