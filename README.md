# 飞书妙记字幕导出（无导出权限版）

> ⚠️ **免责声明**：本工具仅供学习和研究使用，请遵守飞书服务条款和相关法律法规。未经授权下载他人会议内容可能涉及隐私和版权问题。

---

## 📖 目录

- [快速开始](#-快速开始)
- [详细教程](#-详细教程)
- [技术原理](#-技术原理)
- [失败尝试记录](#-失败尝试记录)
- [输出格式说明](#-输出格式说明)
- [相关项目对比](#-相关项目对比)
- [重要限制](#-重要限制)

---

## 🚀 快速开始

### 前提条件

1. 已登录飞书账号的浏览器（Chrome / Edge / Safari）
2. 可以访问目标飞书妙记页面
3. 按 F12 打开开发者工具的基本知识

### 一键导出（30 秒）

```javascript
// 1. 打开飞书妙记页面
// 2. 按 F12 → Console 标签
// 3. 粘贴以下代码并回车

(async function() {
  const token = window.location.pathname.split('/').pop();
  const url = `https://${location.hostname}/minutes/api/subtitles/webvtt?object_token=${token}`;
  const res = await fetch(url);
  const vtt = await res.text();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([vtt], {type: 'text/vtt'}));
  a.download = `飞书字幕_${Date.now()}.vtt`;
  a.click();
  console.log('✅ 下载完成！');
})();
```

---

## 📚 详细教程

### 第一步：打开飞书妙记页面

在浏览器中打开目标飞书妙记 URL，格式如下：

```
https://{domain}.feishu.cn/minutes/{object_token}
```

例如：
```
https://{domain}.feishu.cn/minutes/{object_token}
```

### 第二步：打开开发者工具

| 操作系统 | 快捷键 |
|---------|-------|
| Windows / Linux | `F12` 或 `Ctrl + Shift + I` |
| macOS | `Cmd + Option + I` |

### 第三步：切换到 Console 标签

在开发者工具顶部标签栏中找到 **Console** 并点击。

### 第四步：粘贴并执行代码

将以下完整代码粘贴到 Console 中，按 `Enter` 执行：

```javascript
(async function exportFeishuSubtitles() {
  try {
    // 1. 获取 object_token
    const pathParts = window.location.pathname.split('/');
    const objectToken = pathParts[pathParts.length - 1];
    
    if (!objectToken || objectToken.length < 10) {
      console.error('❌ 无法从 URL 中提取 object_token');
      return;
    }
    
    console.log(`📋 object_token: ${objectToken}`);
    
    // 2. 构建 VTT API URL
    const vttUrl = `https://${window.location.hostname}/minutes/api/subtitles/webvtt?object_token=${objectToken}`;
    console.log(`🔗 API URL: ${vttUrl}`);
    
    // 3. 调用 API（浏览器会话自动携带认证 cookie）
    console.log('⏳ 正在下载字幕...');
    const response = await fetch(vttUrl, {
      credentials: 'same-origin',
      headers: { 'Accept': 'text/vtt' }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const vttContent = await response.text();
    console.log(`✅ 字幕下载成功！大小: ${vttContent.length.toLocaleString()} 字节`);
    
    // 4. 触发下载
    const blob = new Blob([vttContent], { type: 'text/vtt' });
    const downloadUrl = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `飞书会议字幕_${timestamp}.vtt`;
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    
    console.log(`📥 文件已下载: ${filename}`);
    
    // 5. 显示统计信息
    const cueCount = (vttContent.match(/^\d{2}:\d{2}:\d{2}/gm) || []).length;
    console.log(`📊 字幕统计: 约 ${cueCount} 条字幕`);
    
  } catch (error) {
    console.error('❌ 导出失败:', error.message);
    console.error('可能原因:');
    console.error('  1. 未登录飞书账号');
    console.error('  2. 当前页面不是飞书妙记页面');
    console.error('  3. 会话已过期，请刷新页面后重试');
  }
})();
```

### 第五步：验证下载

检查浏览器下载目录，应该有一个 `.vtt` 文件，大小约 100KB-500KB（取决于会议时长）。

---

## 🔬 技术原理

### 核心发现

飞书妙记页面加载时，会在浏览器环境中注入以下数据结构：

```javascript
// 页面脚本中隐藏的数据（通过查看页面源代码或 Network 面板发现）
{
  "web_vtt_url": "https://{domain}/minutes/api/subtitles/webvtt?object_token={token}",
  "owner_info": { "user_name": "会议主持人", ... },
  "speaker_ai_status": 0,  // 0=未开启声纹识别
  "can_edit_speaker": false
}
```

### API 端点

```
GET https://{domain}/minutes/api/subtitles/webvtt?object_token={object_token}
```

### 认证机制

| 调用方式 | 结果 | 原因 |
|---------|------|------|
| 浏览器内 JavaScript | ✅ 成功 | 自动携带 `feishu.cn` 域名的 cookie 和会话信息 |
| 外部 curl / Python requests | ❌ `session is invalid` | 缺少浏览器会话上下文（cookie、ws_session、设备指纹） |

**关键代码验证**：

```javascript
// ✅ 浏览器内 - 成功
fetch('https://{domain}.feishu.cn/minutes/api/subtitles/webvtt?object_token={token}')
  .then(r => r.text())
  .then(console.log);  // 返回 VTT 内容

// ❌ 外部 curl - 失败
curl "https://{domain}.feishu.cn/minutes/api/subtitles/webvtt?object_token={token}"
# 返回: {"code": 99991667, "message": "session is invalid"}
```

---

## ❌ 失败尝试记录

> 这部分记录了我的探索过程，希望能帮到你少走弯路。

### 尝试 1：直接用 JavaScript fetch 外部 API

**代码**：
```javascript
fetch('https://{domain}.feishu.cn/minutes/api/subtitles/webvtt?object_token={token}')
  .then(r => r.text())
  .then(console.log);
```

**结果**：❌ 失败  
**错误**：`session is invalid`（错误码 99991667）

**原因分析**：
- 飞书使用基于浏览器会话的认证机制
- 外部请求缺少以下关键信息：
  - `feishu.cn` 域名的 cookie
  - WebSocket 会话令牌 (`ws_session`)
  - 设备指纹信息
- 即使手动复制 cookie 到 curl，也会因为 `Secure` 标志和 Host 验证失败

---

### 尝试 2：通过页面 JavaScript 对象直接访问

**代码**：
```javascript
// 尝试从页面脚本变量中直接获取字幕数据
console.log(window.lark);
console.log(window.bootData);
console.log(window.__INITIAL_STATE__);
```

**结果**：⚠️ 部分成功  
**发现**：
- `window.lark.bootData.web_vtt_url` 确实存在
- 但字幕数据本身不在内存中，需要调用 API 获取

**原因分析**：
- 飞书采用懒加载策略，字幕数据不在初始页面中
- 必须通过 API 请求获取

---

### 尝试 3：使用 Python + requests 调用 API

**代码**：
```python
import requests

headers = {
    'Cookie': '复制自浏览器的完整 cookie 字符串',
    'User-Agent': 'Mozilla/5.0 ...'
}

url = 'https://{domain}.feishu.cn/minutes/api/subtitles/webvtt?object_token={token}'
resp = requests.get(url, headers=headers)
print(resp.text)
```

**结果**：❌ 失败  
**错误**：`session is invalid`

**原因分析**：
- 飞书的 cookie 包含 `Secure` 和 `SameSite` 标志
- 某些 cookie 与浏览器会话绑定（如 `ws_session`）
- 设备指纹验证失败（飞书检测请求来源是否为真实浏览器）

---

### 尝试 4：通过页面 DOM 提取字幕文本

**代码**：
```javascript
// 尝试从页面可见元素中提取字幕
const elements = document.querySelectorAll('[class*="subtitle"], [class*="transcript"]');
elements.forEach(el => console.log(el.innerText));
```

**结果**：⚠️ 部分成功，但数据不完整  
**问题**：
- 页面只显示当前播放位置附近的字幕
- 需要手动滚动或播放整个视频才能加载全部内容
- 对于 2 小时的会议，手动操作不现实

---

### 尝试 5：查找其他字幕格式 API（SRT、JSON）

**尝试的端点**：
```
https://{domain}/minutes/api/subtitles/srt?object_token={token}
https://{domain}/minutes/api/subtitles/json?object_token={token}
https://{domain}/minutes/api/subtitles/transcript?object_token={token}
https://{domain}/minutes/api/v1/subtitles?object_token={token}
```

**结果**：❌ 全部失败  
**原因**：
- 这些端点不存在或返回 404
- 飞书只提供了 VTT 格式的字幕 API

---

### 尝试 6：通过飞书官方 API（Open Platform）

**文档**：https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/minutes-v1/minute-media/get

**代码**：
```python
# 需要创建飞书企业应用，获取 app_access_token
# 然后调用：
# GET /open-apis/minutes/v1/minutes/:minute_token/media
```

**结果**：❌ 不可行  
**原因**：
- 需要创建企业应用并通过飞书审核
- 需要"妙记"相关权限，普通用户无法申请
- 即使有权限，返回的是音视频文件，不是字幕

---

### 最终成功方案

**核心突破**：在浏览器控制台直接执行 JavaScript，利用同源策略自动携带认证信息。

```javascript
// 关键：必须在已登录飞书的浏览器会话中执行
fetch(`https://${location.hostname}/minutes/api/subtitles/webvtt?object_token=${token}`, {
  credentials: 'same-origin'  // 自动携带 cookie
})
```

---

## 📄 输出格式说明

### VTT 格式示例

```vtt
WEBVTT - This file has cues.

1
00:00:01.000 --> 00:00:03.000
你好，欢迎参加本次会议。

2
00:00:03.500 --> 00:00:05.500
大家下午好。

3
00:00:06.000 --> 00:00:08.000
我们开始今天的讨论。
```

### 转换为 Markdown

使用项目中的 `vtt_to_md.py` 脚本：

```bash
python vtt_to_md.py subtitle.vtt output.md
```

### 输出示例：

```markdown
# 飞书妙记字幕导出

**会议标题：** {会议标题}
**会议时间：** {会议时间}
**会议时长：** {会议时长}
**发言人：** {人数}人

---

### 00:04:54
hello

### 00:04:58
哦

### 00:04:58
那知道了
```

---

## 🔗 相关项目对比

| 项目 | 实现方式 | 权限要求 | 与本项目区别 |
|------|---------|---------|-------------|
| [initH271/monkeyScripts](https://github.com/initH271/monkeyScripts) | 油猴脚本，页面 UI 按钮 | ✅ 需要导出权限 | 依赖页面导出功能 |
| [Icy-Cat/feishu-minutes-export](https://github.com/Icy-Cat) | 油猴脚本，一键导出 Markdown | ✅ 需要导出权限 | 依赖页面导出功能 |
| [bingsanyu/feishu_minutes](https://github.com/bingsanyu/feishu_minutes) | Python + cookie + aria2 | ⚠️ 需要 cookie + 下载权限 | 通过列表 API 获取视频+SRT |
| [Greasy Fork 488062](https://greasyfork.org/zh-CN/scripts/488062) | 油猴脚本 | ✅ 需要导出权限 | 依赖页面导出功能 |
| **本项目** | 浏览器内 JavaScript 调用 VTT API | ❌ **不需要导出权限** | **绕过权限限制** |

---

## ⚠️ 重要限制

### 1. 发言人识别

**飞书妙记的声纹识别功能需要管理方手动开启**：

```javascript
// 页面数据中的关键标志
speaker_ai_status: 0  // 0=未开启, 1=已开启
can_edit_speaker: false  // 当前用户无权限编辑发言人
```

| 状态 | 说明 |
|------|------|
| `speaker_ai_status: 0` | VTT 文件中**不包含发言人标识** |
| `speaker_ai_status: 1` | VTT 文件中包含 `speaker_id`，但仍需手动映射到姓名 |

**解决方案**：联系会议主持人开启"说话人识别"后重新导出。

### 2. 会话过期

如果浏览器会话已过期，API 会返回 `session is invalid`。

**解决方法**：刷新页面重新登录，然后重试。

### 3. 跨域限制

此方法**只能在飞书域名下执行**（`*.feishu.cn` 或 `*.larksuite.com`）。

---

## 📜 许可证

MIT License - 仅供学习和研究使用。

详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

- 飞书妙记团队的语音识别技术
- 现有开源项目的技术探索
- 所有为知识共享做出贡献的开发者

---

> 💡 **提示**：如果你成功使用本方案导出了字幕，欢迎提交 Issue 分享你的使用体验或改进建议！
