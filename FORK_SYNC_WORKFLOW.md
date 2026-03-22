# Fork Sync Workflow

目标：长期跟进官方 `upstream` 最新代码，并把自己的开发持续推送到 `origin`（你自己的仓库）。

## 1. 一次性配置（只做一次）

```bash
git remote -v
```

期望：

- `origin` = 你的仓库（例如 `git@github.com:zerogu/openclaw.git`）
- `upstream` = 官方仓库（例如 `https://github.com/openclaw/openclaw.git`）

如果没有 `upstream`，添加：

```bash
git remote add upstream https://github.com/openclaw/openclaw.git
```

## 2. 每次开始开发前：同步官方最新到本地和你的 main

```bash
git fetch upstream
git switch main
git rebase upstream/main
git push origin main
```

说明：

- `rebase upstream/main`：把本地 `main` 移到官方最新提交上，保持历史线性。

## 3. 从最新 main 拉开发分支

```bash
git switch -c feat/your-topic
```

开发并提交：

```bash
git add -A
git commit -m "feat: your change"
git push -u origin feat/your-topic
```

## 4. 开发过程中，同步官方最新到你的开发分支

在 `feat/your-topic` 分支执行：

```bash
git fetch upstream
git rebase upstream/main
git push --force-with-lease
```

说明：

- rebase 后提交哈希会变化，所以需要推送时用 `--force-with-lease`。
- `--force-with-lease` 比 `--force` 安全：若远程分支被别人更新，会拒绝覆盖。

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

## 6. 把功能分支合回你的 main（可选）

```bash
git switch main
git merge --ff-only feat/your-topic
git push origin main
```

## 7. 常用检查命令

```bash
git remote -v
git branch -vv
git status
```

---

简化原则：

1. `upstream/main` 只用于同步官方，不直接开发。
2. 日常开发都在 `feat/*` 分支进行。
3. 同步官方优先用 `rebase`，推送改写历史时用 `--force-with-lease`。
