/**
 * Content Script - 在每个网页中运行
 * 负责监听快捷键并触发对应的元素
 */

// 当前页面的快捷键绑定
let activeBindings = [];

// 元素选择器实例
let elementSelector = null;

// 配置面板实例
let configPanel = null;

/**
 * 初始化
 */
function init() {
  // 检查依赖是否加载
  console.log('[WebKeyBind] Content script initializing...');
  console.log('[WebKeyBind] ElementType:', typeof window.ElementType);
  console.log('[WebKeyBind] ElementHandler:', typeof window.ElementHandler);
  console.log('[WebKeyBind] ButtonHandler:', typeof window.ButtonHandler);
  console.log('[WebKeyBind] HandlerRegistry:', typeof window.HandlerRegistry);
  console.log('[WebKeyBind] ElementSelector:', typeof window.ElementSelector);
  console.log('[WebKeyBind] handlerRegistry instance:', typeof window.handlerRegistry);

  // 加载当前页面的快捷键配置
  loadBindings();

  // 监听来自popup的消息
  chrome.runtime.onMessage.addListener(handleMessage);

  // 监听键盘事件
  document.addEventListener('keydown', handleKeyDown, true);

  console.log('[WebKeyBind] Content script initialized');
}

/**
 * 加载当前页面的快捷键绑定
 */
async function loadBindings() {
  const domain = getDomain();
  const url = window.location.href;

  try {
    const result = await chrome.storage.sync.get(['bindings']);
    const allBindings = result.bindings || [];

    // 过滤出匹配当前页面的绑定
    activeBindings = allBindings.filter(binding => {
      if (!binding.enabled) return false;

      // 检查域名匹配
      if (binding.domain === domain) return true;

      // 检查URL模式匹配
      if (binding.url && matchUrlPattern(url, binding.url)) return true;

      return false;
    });

    console.log(`[WebKeyBind] Loaded ${activeBindings.length} bindings for ${domain}`);
  } catch (error) {
    console.error('[WebKeyBind] Failed to load bindings:', error);
  }
}

/**
 * 获取当前域名
 */
function getDomain() {
  return window.location.hostname;
}

/**
 * URL模式匹配（支持通配符*）
 */
function matchUrlPattern(url, pattern) {
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(url);
}

/**
 * 处理键盘事件
 */
function handleKeyDown(event) {
  // 如果元素选择器处于活动状态，不处理快捷键
  if (elementSelector && elementSelector.isActive) return;

  // 构建当前按下的快捷键字符串
  const pressedKey = buildKeyString(event);

  // 查找匹配的绑定
  for (let binding of activeBindings) {
    if (normalizeKey(binding.key) === normalizeKey(pressedKey)) {
      // 检查该绑定是否需要检查焦点
      // 默认情况下，在文本输入框中不触发快捷键（除非绑定明确设置 ignoreInputFocus = true）
      if (!binding.ignoreInputFocus && isInTextInput()) {
        continue; // 跳过这个绑定，继续检查其他绑定
      }

      event.preventDefault();
      event.stopPropagation();

      // 触发元素
      triggerElement(binding);
      break;
    }
  }
}

/**
 * 检查焦点是否在文本输入框中
 */
function isInTextInput() {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  return (
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.isContentEditable ||
    (activeElement.tagName === 'INPUT' &&
     !['radio', 'checkbox', 'button', 'submit', 'reset', 'image', 'file'].includes(
       activeElement.type?.toLowerCase()
     ))
  );
}

/**
 * 构建快捷键字符串
 */
function buildKeyString(event) {
  const parts = [];

  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  if (event.metaKey) parts.push('Meta');

  // 获取主键
  const key = event.key;
  if (key && !['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
    parts.push(key.length === 1 ? key.toUpperCase() : key);
  }

  return parts.join('+');
}

/**
 * 标准化快捷键字符串
 */
function normalizeKey(keyString) {
  return keyString
    .split('+')
    .map(k => k.trim())
    .map(k => k.length === 1 ? k.toUpperCase() : k)
    .sort()
    .join('+');
}

/**
 * 触发元素
 */
function triggerElement(binding) {
  try {
    // 获取对应的处理器
    const handler = window.handlerRegistry.getHandler(binding.elementType);
    if (!handler) {
      console.error(`[WebKeyBind] No handler found for type: ${binding.elementType}`);
      return;
    }

    // 查找元素
    const element = handler.findElement(binding.selector);
    if (!element) {
      console.warn(`[WebKeyBind] Element not found for binding:`, binding);
      showNotification('元素未找到', 'warning');
      return;
    }

    // 触发元素
    handler.trigger(element);
    console.log(`[WebKeyBind] Triggered element:`, binding.description);
    showNotification(`已触发: ${binding.description}`, 'success');

  } catch (error) {
    console.error('[WebKeyBind] Failed to trigger element:', error);
    showNotification('触发失败', 'error');
  }
}

/**
 * 显示通知
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.textContent = message;

  const colors = {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3'
  };

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    font-family: Arial, sans-serif;
    animation: slideIn 0.3s ease-out;
  `;

  // 添加动画
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // 3秒后自动移除
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * 处理来自popup的消息
 */
function handleMessage(message, sender, sendResponse) {
  switch (message.action) {
    case 'startElementSelection':
      startElementSelection();
      sendResponse({ success: true });
      break;

    case 'reloadBindings':
      loadBindings();
      sendResponse({ success: true });
      break;

    case 'testBinding':
      triggerElement(message.binding);
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }

  return true;
}

/**
 * 启动元素选择模式
 */
function startElementSelection() {
  console.log('[WebKeyBind] startElementSelection called');
  console.log('[WebKeyBind] ElementSelector class:', window.ElementSelector);
  console.log('[WebKeyBind] elementSelector instance:', elementSelector);

  if (!window.ElementSelector) {
    console.error('[WebKeyBind] ElementSelector class not found!');
    alert('元素选择器未加载，请刷新页面后重试');
    return;
  }

  if (!elementSelector) {
    console.log('[WebKeyBind] Creating new ElementSelector instance');
    elementSelector = new window.ElementSelector();
  }

  if (!configPanel) {
    configPanel = new window.ConfigPanel();
  }

  console.log('[WebKeyBind] Activating ElementSelector');
  elementSelector.activate((selectedData) => {
    console.log('[WebKeyBind] Element selected:', selectedData);

    // 直接显示配置面板，而不是发送消息
    configPanel.show(selectedData, async (binding) => {
      // 保存绑定
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'saveBinding',
          binding: binding
        }, (response) => {
          if (response && response.success) {
            console.log('[WebKeyBind] Binding saved successfully');
            // 重新加载绑定
            loadBindings();
            resolve();
          } else {
            console.error('[WebKeyBind] Failed to save binding:', response);
            reject(new Error(response?.error || '保存失败'));
          }
        });
      });
    });
  });
}

// 初始化
init();
