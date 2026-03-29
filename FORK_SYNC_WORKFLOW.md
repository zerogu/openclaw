# Fork Sync Workflow

目标：长期跟进官方 `upstream` 最新代码，在 `my-master` 上日常开发，需要给官方提 PR 时从 `main` 切干净的 fix 分支。

## 分支说明

| 分支               | 用途               | 规则                                             |
| ------------------ | ------------------ | ------------------------------------------------ |
| `main`             | 追踪 upstream/main | **只同步，不提交任何自己的代码**                 |
| `my-master`        | 日常开发分支       | 包含自己的 feat + upstream 最新代码              |
| `fix/*` / `feat/*` | 给官方提 PR 用     | 从 `main` 切出，只含一个 fix/feat，PR 合并后删除 |

## 1. 一次性配置（只做一次）

```bash
git remote -v
```

期望：

- `origin` = 你的 fork（`git@github.com:zerogu/openclaw.git`，必须是通过 GitHub Fork 按钮创建的）
- `upstream` = 官方仓库（`https://github.com/openclaw/openclaw.git`）

如果没有 `upstream`，添加：

```bash
git remote add upstream https://github.com/openclaw/openclaw.git
```

## 2. 日常开发流程（每次开始前）

```bash
# 1. 同步 main
git switch main
git pull upstream main
git push origin main

# 2. 切到开发分支，rebase 最新代码
git switch my-master
git rebase main

# 3. 如果有冲突，解决后继续
git add <resolved-files>
git rebase --continue

# 4. 推送到 fork（rebase 后哈希变了，需要 force）
git push origin my-master --force-with-lease
```

日常运行、测试都在 `my-master` 上进行。

## 3. 给官方提 PR

```bash
# 1. 确保 main 是最新的
git switch main
git pull upstream main
git push origin main

# 2. 从 main 切一个干净的分支
git switch -c fix/describe-the-issue main

# 3. 做修改、提交
git add <files>
git commit -m "fix(scope): describe the fix"

# 4. 推送到 fork
git push origin fix/describe-the-issue

# 5. 去 GitHub 创建 PR
#    https://github.com/openclaw/openclaw/compare/main...zerogu:openclaw:fix/describe-the-issue
```

> 也可以从 `my-master` 用 `git cherry-pick <commit>` 把已有的修改挑到 fix 分支。

## 4. PR 合并后清理

```bash
# 同步 main（你的 fix 已经在 upstream 里了）
git switch main
git pull upstream main
git push origin main

# 删除 fix 分支
git branch -D fix/describe-the-issue
git push origin --delete fix/describe-the-issue

# 更新 my-master（rebase 时已合并的 commit 会自动消失）
git switch my-master
git rebase main
git push origin my-master --force-with-lease
```

## 5. 如果 rebase 冲突

Git 会停住并提示冲突文件：

```bash
git status
```

处理冲突后继续：

```bash
git add <resolved-files>
git rebase --continue
```

放弃这次 rebase：

```bash
git rebase --abort
```

## 6. 常用检查命令

```bash
git remote -v          # 查看远程仓库
git branch -vv         # 查看分支状态
git status             # 查看工作区状态
git log --oneline -5   # 查看最近提交
git log main --not upstream/main --oneline  # 查看 main 上有没有多余的本地 commit（应该为空）
```

---

核心原则：

1. **`main` 永远和 upstream 一致**，不提交自己的代码。
2. **`my-master` 是日常工作分支**，通过 `rebase main` 保持最新。
3. **提 PR 用临时 fix/feat 分支**，从 `main` 切出，合并后删除。
4. 同步和推送改写历史时用 `--force-with-lease`（安全 force push）。
