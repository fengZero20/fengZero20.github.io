---
title: "Git 常用操作"
published: 2026-10-14
description: "改分支名、首次推送到远程、删除本地和远程分支、撤销还没 push 的 merge，以及按提交信息查找分支。"
tags: ["Git"]
category: "笔记"
draft: false
---

下面是几件经常要用到的 Git 操作。命令按实际顺序写，复制前把分支名、仓库地址和版本号换成自己的。

## 一、更改分支名

先改本地分支名，再删掉远程上的旧分支，最后把新名字推上去并关联。

```bash
# 1. 修改本地分支名
git branch -m oldBranch newBranch

# 2. 删除远程的旧分支
git push --delete origin oldBranch

# 3. 把重命名后的分支推到远端
git push origin newBranch

# 4. 让本地分支跟踪远程同名分支
git branch --set-upstream-to origin/newBranch
```

第 4 步要在 `newBranch` 上执行。如果当前不在这个分支，先 `git checkout newBranch`。

## 二、把本地文件推到远程仓库

已有一个本地目录、远程仓库还是空的时，按这个顺序做。

```bash
cd existing_folder
git init
git remote add origin http://10.250.112.151:18888/huangfengling/vite.git
git add .
git commit -m "Initial commit"
git push -u origin master
```

`git push -u` 会把本地 `master` 和远程 `master` 关联起来，之后在这个分支上直接 `git push`、`git pull` 即可。远程默认分支如果叫 `main`，把最后一条里的 `master` 换成 `main`。

## 三、删除本地分支，再从远程拉下来

本地分支乱了、想按远程重新检出时用。先离开要删的分支，再删除，然后从远程建一份同名本地分支。

```bash
git checkout main
git branch -d branch_name
git fetch origin
git checkout -b branch_name origin/branch_name
```

`git branch -d` 只会删已经合并过的分支。还没合并、确定要丢掉本地这份时，把 `-d` 换成 `-D`。

## 四、同时删除本地和远程分支

先删本地：

```bash
git branch -d localBranch
# 分支还没合并、确认要强制删除时用这个
git branch -D localBranch
```

再删远程。下面两种写法效果一样：

```bash
git push origin :remoteBranch
# 或者
git push --delete origin remoteBranch
```

删除前先 `git checkout` 到别的分支。正在使用的分支删不掉。

## 五、撤销一次还没有 push 的 merge

例如已经执行了 `git merge dev_2.3.0`，但还没有 `git push`。可以用 reflog 回到 merge 之前。

先看操作记录：

```bash
git reflog
```

输出里能看到最近的操作，类似：

```text
939324b HEAD@{1}: checkout: moving from dev_2.3.0 to main
a1b2c3d HEAD@{0}: merge dev_2.3.0: Merge made by the 'ort' strategy
```

要回退的是 merge **上一行**那个版本号。看完后按 `q` 退出。

然后硬重置到那个版本：

```bash
git reset --hard 939324b
```

`939324b` 只是示例，换成你 reflog 里 merge 之前的那一串。这条命令会丢掉该版本之后的本地提交，以及工作区里还没提交的修改。它只适合还没推送到远程的情况。

## 六、按提交信息查找分支

记得一句提交说明，但忘了它在哪个分支上时，先按关键词搜提交：

```bash
git log --all --grep="关键词"
```

输出类似：

```text
commit a1b2c3d4e5f6g7h8i9j
Author: xxx <xxx@example.com>
Date:   Mon Sep 9 12:34:56 2025 +0800

    修复缺陷单据导出问题
```

拿到 commit id 之后，查哪些分支包含这次提交：

```bash
git branch -a --contains a1b2c3d4e5f6g7h8i9j
```

`-a` 会把远程分支也列出来。本地分支前面没有 `remotes/`。
