# WebKeyBind

一个强大的Chrome扩展插件，允许您为不同网站的页面元素（按钮、输入框等）绑定自定义快捷键。

## 功能特点

- ✨ **可视化元素选择**: 通过可视化界面直接在页面上选择元素
- 🎯 **域名/URL匹配**: 支持按域名或URL模式（支持通配符）配置快捷键
- ⌨️ **灵活的快捷键**: 支持各种组合键（Ctrl、Alt、Shift、Meta）
- 🔧 **可扩展架构**: 轻松扩展支持更多元素类型
- 💾 **云端同步**: 使用Chrome Sync存储，配置在所有设备间同步
- 🎨 **现代化UI**: 简洁美观的用户界面

## 目前支持的元素类型

- ✅ 按钮 (Button)
- 🚧 输入框 (Input) - 即将支持
- 🚧 链接 (Link) - 即将支持
- 🚧 自定义元素 - 即将支持

## 安装方法

### 从源码安装（开发模式）

1. 克隆或下载此仓库到本地
2. 打开Chrome浏览器，进入扩展程序管理页面 (`chrome://extensions/`)
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本项目的根目录

## 使用方法

### 1. 添加快捷键绑定

1. 在想要绑定快捷键的网页上，点击浏览器工具栏的WebKeyBind图标
2. 点击"新增快捷键绑定"按钮
3. 点击"点击选择页面元素"按钮
4. 弹出窗口会关闭，在页面上移动鼠标，目标元素会高亮显示
5. 点击要绑定的元素（目前仅支持按钮）
6. 在快捷键输入框中按下想要的快捷键组合
7. 填写描述信息（可选）
8. 点击"保存"

### 2. 使用快捷键

保存绑定后，在对应的网页上按下设置的快捷键，即可触发绑定的元素（如点击按钮）。

### 3. 管理快捷键

- 在弹出窗口中可以查看当前页面和所有页面的快捷键绑定
- 点击"测试"按钮可以测试快捷键是否工作
- 点击"删除"按钮可以删除不需要的绑定

## 项目结构

```
WebKeyBind/
├── manifest.json                 # Chrome扩展配置文件
├── background/
│   └── background.js            # 后台服务脚本
├── content/
│   └── content.js               # 内容脚本（注入到网页）
├── core/
│   ├── types.js                 # 核心类型定义
│   ├── ElementSelector.js       # 元素选择器
│   ├── HandlerRegistry.js       # 处理器注册表
│   └── handlers/
│       └── ButtonHandler.js     # 按钮处理器
├── popup/
│   ├── popup.html               # 弹出窗口HTML
│   ├── popup.css                # 弹出窗口样式
│   └── popup.js                 # 弹出窗口逻辑
├── icons/                        # 图标文件夹
└── README.md                     # 说明文档
```

## 架构设计

### 可扩展性

本项目采用模块化和面向对象的设计，便于扩展新的元素类型：

1. **ElementHandler接口**: 定义了处理器的标准接口
2. **HandlerRegistry**: 管理所有元素类型的处理器
3. **插件式架构**: 只需实现ElementHandler接口即可添加新的元素类型支持

### 添加新元素类型

要添加新的元素类型支持（如输入框），只需：

1. 在 `core/handlers/` 目录创建新的处理器类（如 `InputHandler.js`）
2. 继承 `ElementHandler` 类并实现所有方法：
   - `canHandle(element)`: 判断元素是否可处理
   - `trigger(element)`: 触发元素的行为
   - `getSelector(element)`: 获取元素的选择器信息
   - `findElement(selector)`: 根据选择器查找元素

3. 在 `HandlerRegistry` 中注册新处理器：
```javascript
this.register(ElementType.INPUT, new InputHandler());
```

4. 更新 `popup/popup.html` 中的元素类型选择器

### 示例: 添加输入框支持

```javascript
// core/handlers/InputHandler.js
class InputHandler extends ElementHandler {
  canHandle(element) {
    return element.tagName.toLowerCase() === 'input' &&
           ['text', 'email', 'password'].includes(element.type);
  }

  trigger(element) {
    element.focus();
    // 其他触发逻辑
  }

  getSelector(element) {
    // 实现选择器生成逻辑
  }

  findElement(selector) {
    // 实现元素查找逻辑
  }
}
```

## 技术栈

- **Manifest V3**: 使用Chrome最新的扩展API规范
- **Vanilla JavaScript**: 无依赖，纯JavaScript实现
- **Chrome Storage API**: 云端同步配置
- **Chrome Tabs/Scripting API**: 与网页交互

## 配置数据结构

每个快捷键绑定包含以下信息：

```javascript
{
  id: "binding_xxx",              // 唯一标识符
  domain: "example.com",          // 域名
  url: "https://example.com/*",   // URL模式（可选）
  elementType: "button",          // 元素类型
  selector: {                     // 元素选择器
    selector: "#submit-btn",      // CSS选择器
    xpath: "//button[@id='submit-btn']",  // XPath
    textContent: "提交",           // 元素文本
    index: 0                       // 索引
  },
  key: "Ctrl+S",                  // 快捷键
  description: "点击提交按钮",     // 描述
  enabled: true,                  // 是否启用
  createdAt: 1234567890           // 创建时间戳
}
```

## 注意事项

- 快捷键不会在输入框（input、textarea）获得焦点时触发，避免干扰正常输入
- 某些系统级快捷键（如 Ctrl+T, Ctrl+W）无法被覆盖
- URL模式支持通配符 `*`，例如 `https://example.com/*` 匹配该域名下所有页面

## 开发调试

1. 修改代码后，在扩展程序管理页面点击刷新图标
2. 如果修改了content script，需要刷新对应的网页
3. 使用Chrome DevTools调试：
   - Popup: 右键点击插件图标 → "检查弹出内容"
   - Background: 扩展程序管理页面 → "服务工作进程" → "检查"
   - Content Script: 在网页中按F12，查看Console

## 未来计划

- [ ] 支持输入框元素
- [ ] 支持链接元素
- [ ] 快捷键冲突检测
- [ ] 导入/导出配置
- [ ] 快捷键分组管理
- [ ] 支持更复杂的URL匹配规则
- [ ] 支持快捷键序列（如 Vim 的组合键）

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License
