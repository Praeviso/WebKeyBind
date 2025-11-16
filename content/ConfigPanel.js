/**
 * 配置面板 - 在页面上显示浮动配置界面
 * 用户选择元素后自动弹出，无需重新打开扩展
 */
class ConfigPanel {
  constructor() {
    this.panel = null;
    this.overlay = null;
    this.selectedData = null;
    this.domain = window.location.hostname;
    this.onSaveCallback = null;
  }

  /**
   * 显示配置面板
   * @param {Object} selectedData - 选中的元素数据
   * @param {Function} onSave - 保存回调函数
   */
  show(selectedData, onSave) {
    this.selectedData = selectedData;
    this.onSaveCallback = onSave;

    // 创建遮罩层
    this.createOverlay();

    // 创建面板
    this.createPanel();

    // 显示
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.panel);

    // 焦点到快捷键输入框
    setTimeout(() => {
      const keyInput = this.panel.querySelector('#webkeybind-key-input');
      if (keyInput) keyInput.focus();
    }, 100);
  }

  /**
   * 隐藏配置面板
   */
  hide() {
    if (this.panel) this.panel.remove();
    if (this.overlay) this.overlay.remove();
    this.panel = null;
    this.overlay = null;
  }

  /**
   * 创建遮罩层
   */
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'webkeybind-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2147483646;
      animation: fadeIn 0.2s ease-out;
    `;

    // 点击遮罩关闭
    this.overlay.addEventListener('click', () => this.hide());
  }

  /**
   * 创建配置面板
   */
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'webkeybind-config-panel';
    this.panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 480px;
      max-width: 90vw;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: slideUp 0.3s ease-out;
    `;

    this.panel.innerHTML = `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        #webkeybind-config-panel * {
          box-sizing: border-box;
        }
        #webkeybind-config-panel input,
        #webkeybind-config-panel button {
          font-family: inherit;
        }
      </style>
      <div style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px; color: #333;">配置快捷键绑定</h2>
          <button id="webkeybind-close-btn" style="
            background: none;
            border: none;
            font-size: 24px;
            color: #999;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
            line-height: 32px;
            text-align: center;
            border-radius: 4px;
          " title="关闭">×</button>
        </div>

        <div style="margin-bottom: 16px; padding: 12px; background: #f0f7ff; border-radius: 6px; border-left: 3px solid #4CAF50;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">已选择元素</div>
          <div style="font-size: 14px; color: #333; font-weight: 500;">${this.escapeHtml(this.selectedData.selector.textContent || '元素')}</div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 6px; font-size: 14px; color: #555; font-weight: 500;">
            快捷键 <span style="color: #f44336;">*</span>
          </label>
          <input
            type="text"
            id="webkeybind-key-input"
            placeholder="点击后按下快捷键组合..."
            readonly
            style="
              width: 100%;
              padding: 10px 12px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              outline: none;
              cursor: pointer;
              background: #fafafa;
              transition: all 0.2s;
            "
          />
          <div style="font-size: 12px; color: #999; margin-top: 4px;">支持 Ctrl、Alt、Shift、Meta 组合键</div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 6px; font-size: 14px; color: #555; font-weight: 500;">
            描述 <span style="color: #f44336;">*</span>
          </label>
          <input
            type="text"
            id="webkeybind-description-input"
            placeholder="如：点击提交按钮"
            value="${this.escapeHtml('触发: ' + (this.selectedData.selector.textContent || ''))}"
            style="
              width: 100%;
              padding: 10px 12px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              outline: none;
              transition: all 0.2s;
            "
          />
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 6px; font-size: 14px; color: #555; font-weight: 500;">
            URL 模式 <span style="color: #999; font-weight: 400;">(可选)</span>
          </label>
          <input
            type="text"
            id="webkeybind-url-input"
            placeholder="留空则匹配整个域名，支持通配符 *"
            value="${window.location.href.split('?')[0]}*"
            style="
              width: 100%;
              padding: 10px 12px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              outline: none;
              transition: all 0.2s;
            "
          />
          <div style="font-size: 12px; color: #999; margin-top: 4px;">当前域名: ${this.domain}</div>
        </div>

        <div style="margin-bottom: 20px; padding: 12px; background: #f9f9f9; border-radius: 6px;">
          <label style="
            display: flex;
            align-items: center;
            cursor: pointer;
            user-select: none;
          ">
            <input
              type="checkbox"
              id="webkeybind-ignore-focus"
              style="
                width: 18px;
                height: 18px;
                margin: 0;
                margin-right: 10px;
                cursor: pointer;
              "
            />
            <span style="font-size: 14px; color: #555; font-weight: 500;">
              忽略输入框焦点限制
            </span>
          </label>
          <div style="font-size: 12px; color: #999; margin-top: 8px; margin-left: 28px;">
            勾选后，即使焦点在文本输入框中也能触发此快捷键
          </div>
        </div>

        <div style="display: flex; gap: 12px;">
          <button id="webkeybind-cancel-btn" style="
            flex: 1;
            padding: 12px;
            border: 2px solid #ddd;
            background: white;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            color: #666;
            cursor: pointer;
            transition: all 0.2s;
          ">取消</button>
          <button id="webkeybind-save-btn" style="
            flex: 2;
            padding: 12px;
            border: none;
            background: #4CAF50;
            color: white;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          ">保存快捷键</button>
        </div>
      </div>
    `;

    // 绑定事件
    this.bindPanelEvents();
  }

  /**
   * 绑定面板事件
   */
  bindPanelEvents() {
    // 关闭按钮
    const closeBtn = this.panel.querySelector('#webkeybind-close-btn');
    closeBtn.addEventListener('click', () => this.hide());

    closeBtn.addEventListener('mouseenter', (e) => {
      e.target.style.background = '#f5f5f5';
    });
    closeBtn.addEventListener('mouseleave', (e) => {
      e.target.style.background = 'none';
    });

    // 取消按钮
    const cancelBtn = this.panel.querySelector('#webkeybind-cancel-btn');
    cancelBtn.addEventListener('click', () => this.hide());

    cancelBtn.addEventListener('mouseenter', (e) => {
      e.target.style.background = '#f5f5f5';
      e.target.style.borderColor = '#999';
    });
    cancelBtn.addEventListener('mouseleave', (e) => {
      e.target.style.background = 'white';
      e.target.style.borderColor = '#ddd';
    });

    // 保存按钮
    const saveBtn = this.panel.querySelector('#webkeybind-save-btn');
    saveBtn.addEventListener('click', () => this.handleSave());

    saveBtn.addEventListener('mouseenter', (e) => {
      e.target.style.background = '#45a049';
    });
    saveBtn.addEventListener('mouseleave', (e) => {
      e.target.style.background = '#4CAF50';
    });

    // 快捷键输入
    const keyInput = this.panel.querySelector('#webkeybind-key-input');
    keyInput.addEventListener('keydown', (e) => this.captureKey(e));

    keyInput.addEventListener('focus', (e) => {
      e.target.style.borderColor = '#4CAF50';
      e.target.style.background = 'white';
    });
    keyInput.addEventListener('blur', (e) => {
      e.target.style.borderColor = '#ddd';
      e.target.style.background = '#fafafa';
    });

    // 描述输入框样式
    const descInput = this.panel.querySelector('#webkeybind-description-input');
    descInput.addEventListener('focus', (e) => {
      e.target.style.borderColor = '#4CAF50';
    });
    descInput.addEventListener('blur', (e) => {
      e.target.style.borderColor = '#ddd';
    });

    // URL 输入框样式
    const urlInput = this.panel.querySelector('#webkeybind-url-input');
    urlInput.addEventListener('focus', (e) => {
      e.target.style.borderColor = '#4CAF50';
    });
    urlInput.addEventListener('blur', (e) => {
      e.target.style.borderColor = '#ddd';
    });

    // 阻止面板内的点击事件冒泡到遮罩层
    this.panel.addEventListener('click', (e) => e.stopPropagation());
  }

  /**
   * 捕获快捷键
   */
  captureKey(event) {
    event.preventDefault();

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
      const keyInput = this.panel.querySelector('#webkeybind-key-input');
      keyInput.value = parts.join('+');
    }
  }

  /**
   * 处理保存
   */
  async handleSave() {
    const keyInput = this.panel.querySelector('#webkeybind-key-input');
    const descInput = this.panel.querySelector('#webkeybind-description-input');
    const urlInput = this.panel.querySelector('#webkeybind-url-input');
    const ignoreFocusCheckbox = this.panel.querySelector('#webkeybind-ignore-focus');

    const key = keyInput.value.trim();
    const description = descInput.value.trim();
    const url = urlInput.value.trim();
    const ignoreInputFocus = ignoreFocusCheckbox.checked;

    // 验证
    if (!key) {
      alert('请设置快捷键');
      keyInput.focus();
      return;
    }

    if (!description) {
      alert('请填写描述');
      descInput.focus();
      return;
    }

    // 构建绑定对象
    const binding = {
      id: 'binding_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      domain: this.domain,
      url: url || '',
      elementType: this.selectedData.elementType,
      selector: this.selectedData.selector,
      key: key,
      description: description,
      ignoreInputFocus: ignoreInputFocus,
      enabled: true,
      createdAt: Date.now()
    };

    // 禁用保存按钮
    const saveBtn = this.panel.querySelector('#webkeybind-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';
    saveBtn.style.opacity = '0.6';

    try {
      // 调用回调保存
      if (this.onSaveCallback) {
        await this.onSaveCallback(binding);
      }

      // 关闭面板
      this.hide();

      // 显示成功通知
      showNotification('✓ 快捷键保存成功！', 'success');

    } catch (error) {
      console.error('[WebKeyBind] Failed to save binding:', error);
      alert('保存失败: ' + error.message);

      // 恢复按钮
      saveBtn.disabled = false;
      saveBtn.textContent = '保存快捷键';
      saveBtn.style.opacity = '1';
    }
  }

  /**
   * HTML 转义
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// 导出到全局
if (typeof window !== 'undefined') {
  window.ConfigPanel = ConfigPanel;
}
