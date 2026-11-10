import type { Todo } from '../todo';
import { TodoItem } from './TodoItem';

export interface TodoListProps {
    todos: Todo[];
    emptyText: string;
    onToggle: (id: number) => void;
    onEdit: (id: number) => void;
    onRemove: (id: number) => void;
}

/**
 * 中间层：只负责遍历和空态，不碰数据也不碰输入框。
 * key 用 todo.id 而不是数组下标：用下标的话，删掉第一项后
 * 后面每一项的 key 都会往前挪，React 会把「第二项的输入焦点/动画状态」
 * 错认到第一项上。
 */
export function TodoList({ todos, emptyText, onToggle, onEdit, onRemove }: TodoListProps): JSX.Element {
    if (todos.length === 0) {
        return (
            <ul className="todo-list">
                <li className="todo-empty">{emptyText}</li>
            </ul>
        );
    }

    return (
        <ul className="todo-list">
            {todos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onEdit={onEdit} onRemove={onRemove} />
            ))}
        </ul>
    );
}
