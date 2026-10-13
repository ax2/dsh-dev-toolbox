# dsh-toolbox-bundle

**一条命令，给 DSH 装上 46 个确定性工具**：JSON/YAML/CSV/文本/编码/正则这类"格式活"，加上 JVM、Python、Windows 生产报告的"诊断活"。纯本地、无网络、无安装期脚本、无二进制依赖。

[![npm](https://img.shields.io/npm/v/dsh-toolbox-bundle)](https://www.npmjs.com/package/dsh-toolbox-bundle)
![tools](https://img.shields.io/badge/tools-46-blue)
![tests](https://img.shields.io/badge/tests-214%20passing-brightgreen)
![offline](https://img.shields.io/badge/network-none-informational)
![license](https://img.shields.io/badge/license-MIT-lightgrey)

## 30 秒安装

> **包名与仓库**：npm 上是 `dsh-toolbox-bundle`，仓库是 [`ax2/dsh-toolbox-bundle`](https://github.com/ax2/dsh-toolbox-bundle)。（前身 `dsh-zidev-toolbox`、`@ax2zicode/dsh-dev-toolbox` 都已在 npm 上废弃并指向这里——`dsh-dev-toolbox` 这个名字发不出去：npm 判定它与生态里已有的 `dsh-devtoolbox` 过于相似。）

```sh
dsh plugin --profile web add dsh-toolbox-bundle
```

装完**重启应用**（bundle 列表是启动时读的）。想装到桌面版就把 `web` 换成 `desktop`。

**家族总览**：[zicode.com/software](https://zicode.com/software/) 是四个插件、合装包与桌面软件的统一入口。

离线或固定版本：

```sh
dsh plugin --profile web add https://github.com/ax2/dsh-toolbox-bundle/releases/latest/download/dsh-toolbox-bundle.tgz
```

> 这个包是**四个独立插件的合装层**：它一次插入四行 bundle，四个插件仍各自独立版本。**不要**把它和单独安装的那四个混用（会重复注册同名工具）。

## 15 秒看到效果

把这段贴进对话：

```
Traceback (most recent call last):
  File "svc.py", line 42, in handle
KeyError: 'user_id'
```

模型会调用 `python_traceback`，拿回这样的结构化结果（实测输出）：

```json
{
  "exception_type": "KeyError",
  "exception_message": "'user_id'",
  "deepest_frame": { "file": "svc.py", "line": 42, "function": "handle" },
  "cause_hints": [{ "hint": "The mapping has no key 'user_id'; production data is usually missing the key that test data always has." }],
  "coverage": { "total_lines": 3, "parsed_lines": 3, "unknown_count": 0, "confidence": 1, "parser_version": "tb-1" }
}
```

其他几个一看就懂的：

| 你说 | 它调用 | 你拿到 |
|---|---|---|
| "校验 `{"a":1,}`，要精确行列" | `json_validate` | `line 1 / column 9 / position 8` + 错误文案 |
| "`C:\temp\CON.txt` 这个路径能用吗" | `path_inspect` | `reserved_name`（error）：保留 DOS 设备名，带扩展名也算，`position: 8` |
| "贴上 jstack，有没有死锁" | `java_thread_dump` | Java 级死锁环（`waiting_for`/`holding` 链）、锁竞争队列、状态直方图 |
| "这是 GC 日志，p99 停顿多少" | `java_gc_log` | 事件与停顿计数、p50/p90/p99、Young/Full 拆分、promotion failure |
| "`netstat -ano` 里谁在监听 8080" | `netstat_parse` | 监听项 + PID/进程名，并按状态分组；**文本里没有的绝不编造** |
| "D 盘哪个目录最占空间" | `dir_usage` | 总字节、最大文件、扩展名直方图（只读，符号链接从不跟随） |

## 装了哪四个

| 插件 | 工具 | 做什么 | 测试 |
|---|---|---|---|
| [dsh-deterministic-tools](https://github.com/ax2/dsh-deterministic-tools) | 29 | JSON 校验（精确行列偏移）/ 受限 JSONPath / 结构化 diff / CSV↔JSON / YAML↔JSON / 文本统计 / 正则捕获 / base64·hex·URL 编解码 / 哈希 / Unicode·进制·颜色·CIDR·JWT·时间戳检查 | 35 |
| [dsh-jvm-doctor](https://github.com/ax2/dsh-jvm-doctor) | 5 | thread dump（含 Java 级死锁环）/ GC 日志 / Maven·Gradle 依赖冲突 / 异常链（`... N more` 还原）/ Spring 配置 diff（载荷前脱敏） | 47 |
| [dsh-py-doctor](https://github.com/ax2/dsh-py-doctor) | 6 | traceback 根因 / pytest 摘要 / Django migrations·N+1·checks / celery 报告 —— 每个都带解析覆盖率 | 75 |
| [dsh-win-native](https://github.com/ax2/dsh-win-native) | 6 | 编码检测与转换（GBK/Big5/Shift-JIS 置信度）/ Windows 路径合法性 / netstat 解读 / 只读磁盘巡检与重复文件 | 57 |

## 为什么不直接让模型自己算？

**它确实能算。** 我们实测过：不给插件、只让它算 `hello world` 的 sha256，模型自己写了两轮 pwsh，**算对了**。所以这些工具卖的不是"模型做不到"，而是：

- **一次就对的概率**——214 个测试盯着的固定实现，而不是每次现写命令、和引号/编码/PowerShell 版本搏斗；
- **可复现**：同样输入永远同样输出；
- **边界明确**：结构化输入超预算**拒绝**（`INPUT_TOO_LARGE`），文本截断按 code point 并标 `truncated`，解析覆盖率与未识别行**明确上报**；
- **知道自己不知道**：`jwt_inspect` 声明不验签、`netstat_parse` 不编造进程名与 UDP 状态、诊断工具只出事实不做因果推断；
- **结构化回执**：`{ result, meta }` 可以直接进下一步，而不是让模型解析自由文本。

## 它要花多少 token（实测，不是估算）

工具 schema 每个请求都要发，**装了不用也要付**：

| 配置 | 工具名数 | 首次请求 inputTokens |
|---|---|---|
| 干净 headless base | 75 | 11,931 |
| base + 这四个插件（46 工具） | 121 | **19,608**（+7,677，占 39%） |

同一个"校验 JSON 并给精确行列"的任务：不装插件，模型自己写 pwsh 走 3 步、输出 1,323 tokens、13.0 s；装插件 2 步、输出 314 tokens、6.1 s，但 **raw token 反而多 17%**。

**所以：一次性小活它更贵。** 划算的是聚合压缩（内容不进上下文）、结果远小于输入、shell 一行搞不定的活、以及模型算不准的活。只想留常用的就按 id 覆盖：

```yaml
# profiles/<name>/cordis.patch.yml
- id: deterministic-tools
  config:
    only: [json_format, json_validate, json_query, text_diff, csv_to_json]
    toolPrefix: zi
```

（同一任务实测三组首次请求 prompt：干净 base 75 个工具名 **12,838** → 只留 5 个 **13,529**（+0.7k）→ 装全部 29 个 **16,799**（+4.0k）。裁剪配置要写进 **profile 自己的** `cordis.patch.yml`（文件头写着 "applied after every bundle layer"）；用 `dsh --patch <file>` 那种 CLI 覆盖层改同一个 id 会报 `patch: entry "deterministic-tools" not found`。真实启动后模型只收到 `zi__json_format`、`zi__json_validate`。）

## 边界

- **46 个工具里只有 2 个碰磁盘**：`dir_usage`、`file_duplicates`，都是只读、有文件数/字节预算、软链接与 junction 跳过并上报、从不跟随。
- 其余全部是**纯文本/纯字节分析**：你不给数据，它不会自己去读。
- 不发网络请求、不装二进制、不写安装期脚本（pnpm 的 `allowBuilds` 拦不住它）。
- 超预算**拒绝**而不是静默截断；截断一定标出来。

## 从哪来

这四个插件是 [zi-devtools](https://github.com/ax2)（Rust 工具箱，16 个 crate / 154 个工具）在 DSH 上的对应实现：按同一份契约（回执信封、预算门禁、边界行为）用 TypeScript 重写，独立版本、独立测试。

- npm：[dsh-deterministic-tools](https://www.npmjs.com/package/dsh-deterministic-tools) · [dsh-jvm-doctor](https://www.npmjs.com/package/dsh-jvm-doctor) · [dsh-py-doctor](https://www.npmjs.com/package/dsh-py-doctor) · [dsh-win-native](https://www.npmjs.com/package/dsh-win-native)
- 每个仓库都有 Release + 预构建 tarball（`releases/latest/download/<repo>.tgz`）

## License

MIT
