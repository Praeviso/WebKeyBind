/**
 * Popup Script - 管理界面逻辑
 */

let currentDomain = '';
let currentTab = null;

// DOM元素
const elements = {
  currentDomain: document.getElementById('currentDomain'),
  addBindingBtn: document.getElementById('addBindingBtn'),
  bindingsList: document.getElementById('bindingsList'),
  allBindingsList: document.getElementById('allBindingsList')
};

/**
 * 初始化
 */
async function init() {
  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // 解析域名
  const url = new URL(tab.url);
  currentDomain = url.hostname;
  elements.currentDomain.textContent = currentDomain;

  // 加载绑定列表
  loadBindings();

  // 绑定事件
  bindEvents();

  console.log('[WebKeyBind Popup] Popup initialized');
}

/**
 * 绑定事件
 */
function bindEvents() {
  elements.addBindingBtn.addEventListener('click', startElementSelection);
}

/**
 * 启动元素选择
 */
async function startElementSelection() {
  try {
    // 发送消息到content script启动元素选择
    await chrome.tabs.sendMessage(currentTab.id, {
      action: 'startElementSelection'
    });

    console.log('[WebKeyBind Popup] Element selection started');

    // 关闭 popup，让用户在页面上选择元素
    window.close();

  } catch (error) {
    console.error('Failed to start element selection:', error);
    alert('无法启动元素选择，请刷新页面后重试');
  }
}

/**
 * 加载绑定列表
 */
async function loadBindings() {
  try {
    const result = await chrome.storage.sync.get(['bindings']);
    const allBindings = result.bindings || [];

    // 当前页面的绑定
    const currentBindings = allBindings.filter(b => b.domain === currentDomain);

    // 渲染当前页面的绑定
    renderBindings(currentBindings, elements.bindingsList);

    // 渲染所有绑定
    renderBindings(allBindings, elements.allBindingsList);

  } catch (error) {
    console.error('Failed to load bindings:', error);
  }
}

/**
 * 渲染绑定列表
 */
function renderBindings(bindings, container) {
  if (bindings.length === 0) {
    container.innerHTML = '<p class="empty-state">暂无快捷键绑定</p>';
    return;
  }

  container.innerHTML = bindings.map(binding => `
    <div class="binding-item">
      <div class="binding-header">
        <span class="binding-key">${escapeHtml(binding.key)}</span>
        <div class="binding-actions">
          <button class="btn btn-small btn-success" data-id="${binding.id}" data-action="test">
            测试
          </button>
          <button class="btn btn-small btn-danger" data-id="${binding.id}" data-action="delete">
            删除
          </button>
        </div>
      </div>
      <div class="binding-description">${escapeHtml(binding.description)}</div>
      <div class="binding-meta">
        <span class="element-type">${getElementTypeName(binding.elementType)}</span>
        <span>${binding.domain}</span>
        ${binding.ignoreInputFocus ? '<span style="color: #ff9800;">⚡忽略焦点</span>' : ''}
      </div>
    </div>
  `).join('');

  // 绑定按钮事件
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', handleBindingAction);
  });
}

/**
 * 处理绑定操作（测试、删除）
 */
async function handleBindingAction(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;

  if (action === 'delete') {
    if (confirm('确定要删除这个快捷键绑定吗？')) {
      await deleteBinding(id);
    }
  } else if (action === 'test') {
    await testBinding(id);
  }
}

/**
 * 删除绑定
 */
async function deleteBinding(id) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'deleteBinding',
      id: id
    });

    if (response.success) {
      loadBindings();
    } else {
      alert('删除失败: ' + response.error);
    }
  } catch (error) {
    console.error('Failed to delete binding:', error);
    alert('删除失败: ' + error.message);
  }
}

/**
 * 测试绑定
 */
async function testBinding(id) {
  try {
    const result = await chrome.storage.sync.get(['bindings']);
    const binding = (result.bindings || []).find(b => b.id === id);

    if (!binding) {
      alert('绑定不存在');
      return;
    }

    // 发送消息到content script测试
    await chrome.tabs.sendMessage(currentTab.id, {
      action: 'testBinding',
      binding: binding
    });

  } catch (error) {
    console.error('Failed to test binding:', error);
    alert('测试失败，请确保页面已加载');
  }
}

/**
 * 获取元素类型名称
 */
function getElementTypeName(type) {
  const names = {
    'button': '按钮',
    'input': '输入框',
    'link': '链接',
    'custom': '自定义'
  };
  return names[type] || type;
}

/**
 * HTML转义
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 初始化
init();
