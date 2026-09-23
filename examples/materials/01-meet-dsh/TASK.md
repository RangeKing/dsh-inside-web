# DSH 到底怎么帮我做事？

## 输入提示词

我不会编程。请读 DSH 的官方介绍，用“收到任务 → 读资料 → 动手做 → 汇报结果”解释它怎么工作。再告诉我每一步由哪个源码包负责。不要修改文件。

## 这个案例看什么

看见模型负责提出动作、工具负责执行、会话负责留下记录。

## 教学预设

standard

## 教学答案

DSH 像一个能调用工具的任务执行系统。

1. 接收你的任务：会话入口找到 Agent。
2. 准备资料：system-prompt 组装说明与工具目录。
3. 模型提出动作：llm 对接模型；tools 调度工具。
4. 完成后汇报：agent-loop 继续循环或结束；session 留下记录。

源码入口：packages/core/{agent-loop,system-prompt,tools,session}。
读取文件会用到 tool-fs 与 ctx.fs；具体存储实现可替换。
