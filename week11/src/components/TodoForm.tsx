import { useState, type FormEvent } from 'react';

export interface TodoFormProps {
    onAdd: (text: string) => void;
}

/**
 * 输入框内容是「这个组件自己的」状态：别的组件不关心你在敲什么，
 * 只有按下添加那一刻才通过 onAdd 往上抛。
 * 数据向下传（onAdd 是父给的能力），事件向上传（text 只在提交时上交）。
 */
export function TodoForm({ onAdd }: TodoFormProps): JSX.Element {
    const [text, setText] = useState('');

    function handleSubmit(e: FormEvent<HTMLFormElement>): void {
        e.preventDefault(); // 用 form 而不是按钮 onClick：回车与点击走同一个入口
        onAdd(text); // 空串 / 纯空格 / null 的判断在 todo.ts，这里不写第二份
        setText(''); // 不管加没加成功，输入框都清空
    }

    return (
        <form className="todo-input" onSubmit={handleSubmit}>
            <input
                type="text"
                value={text}
                placeholder="输入待办事项，回车或点添加"
                onChange={(e) => setText(e.target.value)}
            />
            <button type="submit">添加</button>
        </form>
    );
}
