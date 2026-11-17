import type { Todo } from '../todo';

export interface TodoItemProps {
    todo: Todo;
    onToggle: (id: number) => void;
    onEdit: (id: number) => void;
    onRemove: (id: number) => void;
}

/**
 * 叶子组件：只回答「一条任务长什么样」。
 * 它自己不改任何数据 —— 三个动作都通过 props 里的回调往上传，
 * 真正的修改在 TodoApp 里交给 withToggled / withRemoved / withUpdated。
 * 这样这一层可以完全无状态：给它什么 todo，它就画什么。
 */
export function TodoItem({ todo, onToggle, onEdit, onRemove }: TodoItemProps): JSX.Element {
    return (
        <li className={todo.completed ? 'done' : ''}>
            <span onClick={() => onToggle(todo.id)}>{todo.text}</span>
            <button type="button" className="edit-btn" onClick={() => onEdit(todo.id)}>
                ✎
            </button>
            <button type="button" className="del-btn" onClick={() => onRemove(todo.id)}>
                <span>×</span>
            </button>
        </li>
    );
}
