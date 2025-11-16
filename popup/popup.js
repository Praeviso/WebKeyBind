/**
 * Popup Script - 管理界面逻辑
 */

let currentDomain = '';
let currentTab = null;
let editingBindingId = null;
let selectedElement = null;

// DOM元素
const elements = {
  currentDomain: document.getElementById('currentDomain'),
  addBindingBtn: document.getElementById('addBindingBtn'),
  bindingForm: document.getElementById('bindingForm'),
  formTitle: document.getElementById('formTitle'),
  selectElementBtn: document.getElementById('selectElementBtn'),
  selectedElementInfo: document.getElementById('selectedElementInfo'),
  selectedElementText: document.getElementById('selectedElementText'),
  keyInput: document.getElementById('keyInput'),
  descriptionInput: document.getElementById('descriptionInput'),
  urlPattern: document.getElementById('urlPattern'),
  elementType: document.getElementById('elementType'),
  saveBindingBtn: document.getElementById('saveBindingBtn'),
  cancelFormBtn: document.getElementById('cancelFormBtn'),
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

  // 检查是否有待处理的元素选择结果
  const local = await chrome.storage.local.get(['pendingSelection', 'selectionTabId']);
  if (local.pendingSelection && local.selectionTabId === currentTab.id) {
    console.log('[WebKeyBind Popup] Found pending selection:', local.pendingSelection);

    // 显示表单
    showAddForm();

    // 处理选择结果
    handleElementSelected(local.pendingSelection);

    // 清除标记
    await chrome.storage.local.remove(['pendingSelection', 'selectionTabId']);
  }

  // 加载绑定列表
  loadBindings();

  // 绑定事件
  bindEvents();

  // 监听来自content script的消息（通过 storage）
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.pendingSelection && namespace === 'local') {
      console.log('[WebKeyBind Popup] Received element selection via storage:', changes.pendingSelection.newValue);
      handleElementSelected(changes.pendingSelection.newValue);
    }
  });

  console.log('[WebKeyBind Popup] Popup initialized');
}

/**
 * 绑定事件
 */
function bindEvents() {
  elements.addBindingBtn.addEventListener('click', showAddForm);
  elements.selectElementBtn.addEventListener('click', startElementSelection);
  elements.keyInput.addEventListener('keydown', captureKeyPress);
  elements.saveBindingBtn.addEventListener('click', saveBinding);
  elements.cancelFormBtn.addEventListener('click', hideForm);
}

/**
 * 显示新增表单
 */
function showAddForm() {
  editingBindingId = null;
  elements.formTitle.textContent = '新增快捷键绑定';
  elements.bindingForm.classList.remove('hidden');
  elements.urlPattern.value = `${currentTab.url.split('?')[0]}*`;
  elements.descriptionInput.value = '';
  elements.keyInput.value = '';
  selectedElement = null;
  elements.selectedElementInfo.classList.add('hidden');
}

/**
 * 隐藏表单
 */
function hideForm() {
  elements.bindingForm.classList.add('hidden');
  editingBindingId = null;
  selectedElement = null;
}

/**
 * 启动元素选择
 */
async function startElementSelection() {
  try {
    // 先标记当前标签页ID，选择完成后恢复时使用
    await chrome.storage.local.set({
      selectionTabId: currentTab.id
    });

    // 发送消息到content script
    await chrome.tabs.sendMessage(currentTab.id, {
      action: 'startElementSelection'
    });

    console.log('[WebKeyBind Popup] Element selection started, popup will close...');

    // 关闭 popup，让用户可以在页面上选择元素
    // 选择完成后，用户重新打开 popup 时会自动恢复状态
    window.close();

  } catch (error) {
    console.error('Failed to start element selection:', error);
    alert('无法启动元素选择，请刷新页面后重试');
  }
}

/**
 * 处理选中的元素
 */
function handleElementSelected(data) {
  console.log('[WebKeyBind Popup] Handling element selection:', data);

  selectedElement = data;
  elements.selectedElementText.textContent = data.selector.textContent || '元素';
  elements.selectedElementInfo.classList.remove('hidden');

  // 自动填充描述
  if (!elements.descriptionInput.value && data.selector.textContent) {
    elements.descriptionInput.value = `触发: ${data.selector.textContent}`;
  }

  console.log('[WebKeyBind Popup] Element selection complete');
}

/**
 * 捕获快捷键
 */
function captureKeyPress(event) {
  event.preventDefault();

  // 构建快捷键字符串
  const parts = [];

  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  if (event.metaKey) parts.push('Meta');

  const key = event.key;
  if (key && !['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
    parts.push(key.length === 1 ? key.toUpperCase() : key);
  }

  if (parts.length > 1) {
    elements.keyInput.value = parts.join('+');
  }
}

/**
 * 保存绑定
 */
async function saveBinding() {
  // 验证输入
  if (!selectedElement) {
    alert('请先选择页面元素');
    return;
  }

  if (!elements.keyInput.value) {
    alert('请设置快捷键');
    return;
  }

  if (!elements.descriptionInput.value) {
    alert('请填写描述');
    return;
  }

  // 构建绑定对象
  const binding = {
    id: editingBindingId || generateId(),
    domain: currentDomain,
    url: elements.urlPattern.value.trim() || '',
    elementType: selectedElement.elementType,
    selector: selectedElement.selector,
    key: elements.keyInput.value,
    description: elements.descriptionInput.value,
    enabled: true,
    createdAt: Date.now()
  };

  try {
    // 发送到background script保存
    const response = await chrome.runtime.sendMessage({
      action: 'saveBinding',
      binding: binding
    });

    if (response.success) {
      hideForm();
      loadBindings();
    } else {
      alert('保存失败: ' + response.error);
    }
  } catch (error) {
    console.error('Failed to save binding:', error);
    alert('保存失败: ' + error.message);
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
 * 生成唯一ID
 */
function generateId() {
  return 'binding_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
