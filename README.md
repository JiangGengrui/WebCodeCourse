# WebCodeCourse

深圳大学《基于 Web 的编程》课程代码仓库。

- **姓名**：江耿锐
- **学号**：2024150107
- **专业**：计算机科学与技术（本科）

## 目录结构

| 目录 | 内容 |
| --- | --- |
| `week7/` | 第 7 周实验：待办事项 V2.0 —— 数据驱动重构 + localStorage 持久化 + 状态筛选 |
| `week7/`（W8） | 第 8 周实验：在同一套代码上把交互改为**事件委托**，并做一次 AI-2 调试挑战 |

后续每周的实现会继续以 `weekN/` 的形式追加。

## 各周说明

### week7 —— 待办事项 V2.0

第 6 周的待办列表以 **DOM 作为数据源**（直接 `appendChild` / `remove()`），没有独立的数据层，
刷新即丢失，也无法按状态筛选。第 7 周把 V2.0 升级为「**数据驱动 + 可持久化**」：

- **单一数据源**：`todos` 数组是唯一事实来源，DOM 只是它的投影；
  任何操作都走同一条路 —— **改数据 → `save()` → `render()`**。
- **不可变更新**：三个操作都「生成新数组」，不修改原数组 / 原对象。
  - 添加 `[...todos, newItem]`
  - 删除 `todos.filter(t => t.id !== id)`
  - 切换 `todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)`
- **持久化**：每次数据变更后 `localStorage.setItem('todos', ...)`，启动时 `load()` 恢复。
- **视图状态不落盘**：`filter`（all / active / done）只是筛选，不进 `localStorage`，
  刷新后重新回到「全部」。
- **`clearCompleted()`**：脱离 AI 手写，用同一条路径删除所有已完成任务。

## 运行方式

纯静态页面，直接双击 `week7/index.html` 即可。
由于用到了 `localStorage`，用本地服务器打开体验更完整：

```bash
cd week7
python -m http.server 8000
# 浏览器访问 http://localhost:8000/
```

### 自检页面

`week7/tests/` 下是三个用于验证的页面，与主页面共用 `week7/app.js`：

| 文件 | 作用 |
| --- | --- |
| `tests/self-check-1.html` | 自检①：添加 / 空输入拦截 / 切换 / 三档筛选 / 删除 / `clearCompleted` / 持久化写入 |
| `tests/self-check-2.html` | 自检②：**模拟刷新**后数据与完成状态是否恢复、`filter` 是否未落盘 |
| `tests/ai-v1-defects.html` | 复现 AI 第一版代码的 6 处缺陷（对照用） |

自检结果以 `PASS / FAIL` 形式输出在页面的 `#RESULT` 元素中，
可以用无头浏览器 `--dump-dom` 直接读取，例如：

```bash
chrome --headless=new --dump-dom http://localhost:8000/tests/self-check-1.html
```

### reference/

`reference/app-ai-v1.js` 是让 AI 生成的第一版脚本（保留原样，**未修正**）。
把它的缺陷用无头浏览器实测复现出来，是本次「AI 生成 → 人审查 → 验证 → 决策」
闭环里的证据来源。已确认的缺陷：

| # | 位置 | 问题 | 后果 |
| --- | --- | --- | --- |
| ① | `addTodo` | 用 `push` 就地修改，且整条路径上没有 `save()` | 新增项刷新后丢失 |
| ② | `removeTodo` | 用 `splice` 就地修改 | 违反「生成新数组」约束，外部持有的引用被静默改写 |
| ③ | `toggleTodo` | 直接改对象属性 `t.completed = ...` | 原对象被就地污染 |
| ④ | `setFilter` | 把视图状态 `filter` 也 `save()` 进 localStorage | 刷新后回不到「全部」 |
| ⑤ | `render` | 增量更新（只 append + 改 class），不清空列表 | 切换筛选后旧节点残留，条目数偏多 |
| ⑥ | `addTodo` | 没有空输入拦截 | 纯空格也能加进一条空任务 |

此外还有一处课程示例里另一个更容易被忽略的问题：用 `Date.now()` 作 `id`，
**同一毫秒内连续添加会拿到完全相同的 id**，而 `toggleTodo` / `removeTodo` 都按 id 匹配，
于是点一条会一次改动多条。V2.0 的 `nextId()` 在保留 `Date.now()` 的前提下加了一层单调递增兜底。

## Git 工作流

第 7 周要求用分支完成 V2.0 升级，并在合并回 `main` 前保留多次提交：

- 分支：`feature/v2-data-driven`
- `main` 上保留第 6 周 V1 基线（DOM 直接增删，无数据层）
- 分支上 3 次提交，依次为：数据驱动重构 → 持久化 → 状态切换与筛选
- 最后以 `--no-ff` 合并回 `main`，保留分支的提交结构

```bash
git log --graph --oneline --all
```

第 8 周在同一目录上继续，分支 `feature/v2-event-delegation`（见下节）。

### week8 —— 事件委托重构

W7 的列表交互是**循环绑定**：`render()` 里每建一个 `li` 就 `addEventListener` 一次，
删除按钮上还靠 `stopPropagation()` 挡住冒泡。代价是监听器跟着节点的生死一起维护 ——
每次重画都要重新绑一遍，新增节点必须走 `render()` 才能拥有交互。

W8 把交互改成**父容器统一接管**：

| | W7：循环绑定 | W8：事件委托 |
| --- | --- | --- |
| 监听器在哪 | 每个 `li` 一个 + 每个删除按钮一个 | `ul#todo-list` 上只绑一个 |
| 重画之后 | 监听器随 `li` 一起消失 | 不受影响，新节点无需重绑 |
| 定位哪一条 | 闭包捕获 `t.id` | `e.target.closest('li').dataset.id` |
| 区分操作 | 按钮上 `stopPropagation()` | `[data-action]` 判断 + `if / else` 分流 |

三个关键点：

1. **渲染时写身份**：`li.dataset.id = t.id`、`delBtn.dataset.action = 'delete'`。
   委托之后处理函数挂在父容器上，拿不到那个 `t`，必须让节点自己记住「我是谁、点我要干什么」。
2. **交给父容器**：`list.addEventListener('click', ...)` 绑在不会被重画的 `ul` 上，
   靠冒泡收到来自任意后代的事件。
3. **边界防御（顺序不能反）**：
   ```js
   if (!(e.target instanceof Element)) return;   // ① 不是元素
   const item = e.target.closest('li');
   if (!item || !list.contains(item)) return;    // ② 点空白 → null；③ 越界
   const id = item.dataset.id;
   if (!id) return;                              // ④ 没有 data-id（如空态提示）
   ```
   空值要挡在「读属性」之前，否则点列表空白处会抛
   `Cannot read properties of null (reading 'dataset')`。

另外补了一处 `dataset` 的坑：**`dataset.id` 读出来永远是字符串**，而 `todos` 里的 `id` 是
`Date.now()` 得到的数字。直接写 `t.id !== id` 会永远不相等 —— 删除删不掉、切换没反应，
而且**不报错**。所以统一用 `sameId()` 比较前先归一化成字符串。

#### 任务 2：AI-2 调试挑战

`tests/defect-no-else.js` 是缺陷版（与 `app.js` 只差一处：删除分支少了 `else` / `return`），
`tests/defect-demo.html` 是给人用浏览器手动点、看控制台的页面。

实测复现：点一次「删除」，控制台输出两行 ——

```
[delete] 1792478904610
[toggle] 1792478904610     ← 多出来的
```

页面看上去完全正常（那条确实被删掉了），因为 `toggleTodo` 执行时该 id 已经不在 `todos` 里，
`map` 找不到匹配项，只是白跑一遍 `save()` + `render()`。
**根因是「操作分流缺失」**：`if (delBtn) { deleteTodo(id); }` 后面没有 `else`，
删除之后继续往下执行了 `toggleTodo(id)`。修复只需把第二句放进 `else`，或删除后 `return`。

#### 新增的自检页

| 文件 | 作用 |
| --- | --- |
| `tests/delegation-check.html` | 五个场景：点文字只切换 / 点按钮只删除 / 点按钮里的图标只删除 / 点空白处不报错 / 动态新增后能直接交互；另外统计整页 `addEventListener` 的调用方，验证 `li` 上绑定数为 0 |
| `tests/defect-demo.html` | 缺陷版页面，手工点删除看控制台（截图为证） |
| `tests/defect-check.html` | 缺陷版的自动复现，断言「delete 调一次、toggle 也调一次、id 相同」 |

实测结果：`delegation-check` 17 项全 PASS；`defect-check` 5 项全 PASS（缺陷稳定复现）。

