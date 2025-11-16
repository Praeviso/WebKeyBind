/**
 * Background Service Worker
 * 管理插件的后台任务和消息传递
 */

// 监听插件安装
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[WebKeyBind] Extension installed');

    // 初始化存储
    chrome.storage.sync.set({
      bindings: []
    });
  } else if (details.reason === 'update') {
    console.log('[WebKeyBind] Extension updated');
  }
});

// 监听来自content script和popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[WebKeyBind Background] Received message:', message.action, message);

  switch (message.action) {
    case 'elementSelected':
      // 转发元素选择消息到popup
      console.log('[WebKeyBind Background] Forwarding element selection to storage');
      forwardToPopup(message);
      sendResponse({ success: true });
      break;

    case 'saveBinding':
      saveBinding(message.binding)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // 保持消息通道开放

    case 'deleteBinding':
      deleteBinding(message.id)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getBindings':
      getBindings(message.domain)
        .then(bindings => sendResponse({ success: true, bindings }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

/**
 * 保存快捷键绑定
 */
async function saveBinding(binding) {
  const result = await chrome.storage.sync.get(['bindings']);
  const bindings = result.bindings || [];

  // 检查是否已存在相同ID的绑定
  const existingIndex = bindings.findIndex(b => b.id === binding.id);

  if (existingIndex >= 0) {
    // 更新现有绑定
    bindings[existingIndex] = binding;
  } else {
    // 添加新绑定
    bindings.push(binding);
  }

  await chrome.storage.sync.set({ bindings });

  // 通知所有content scripts重新加载绑定
  notifyReloadBindings();

  console.log('[WebKeyBind] Binding saved:', binding);
}

/**
 * 删除快捷键绑定
 */
async function deleteBinding(id) {
  const result = await chrome.storage.sync.get(['bindings']);
  const bindings = result.bindings || [];

  const filteredBindings = bindings.filter(b => b.id !== id);

  await chrome.storage.sync.set({ bindings: filteredBindings });

  // 通知所有content scripts重新加载绑定
  notifyReloadBindings();

  console.log('[WebKeyBind] Binding deleted:', id);
}

/**
 * 获取快捷键绑定
 */
async function getBindings(domain = null) {
  const result = await chrome.storage.sync.get(['bindings']);
  let bindings = result.bindings || [];

  // 如果指定了域名，只返回该域名的绑定
  if (domain) {
    bindings = bindings.filter(b => b.domain === domain);
  }

  return bindings;
}

/**
 * 通知所有content scripts重新加载绑定
 */
async function notifyReloadBindings() {
  const tabs = await chrome.tabs.query({});

  for (let tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'reloadBindings' });
    } catch (error) {
      // 忽略无法发送消息的标签页（如chrome://页面）
    }
  }
}

/**
 * 转发消息到popup
 */
function forwardToPopup(message) {
  // 注意：在Manifest V3中，popup和background之间的通信需要通过storage或其他方式
  // 这里我们使用storage作为临时存储
  console.log('[WebKeyBind Background] Storing selection data:', message.data);
  chrome.storage.local.set({ pendingSelection: message.data }, () => {
    console.log('[WebKeyBind Background] Selection data stored successfully');
  });
}

console.log('[WebKeyBind] Background service worker initialized');
