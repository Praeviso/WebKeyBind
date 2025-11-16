/**
 * 元素选择器
 * 允许用户通过鼠标在页面上选择元素
 */
class ElementSelector {
  constructor() {
    this.isActive = false;
    this.hoveredElement = null;
    this.originalOutline = null;
    this.onSelectCallback = null;

    // 绑定事件处理器
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleClick = this._handleClick.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  /**
   * 激活元素选择模式
   * @param {Function} callback - 选择元素后的回调函数
   */
  activate(callback) {
    if (this.isActive) return;

    this.isActive = true;
    this.onSelectCallback = callback;

    // 添加事件监听器
    document.addEventListener('mousemove', this._handleMouseMove, true);
    document.addEventListener('click', this._handleClick, true);
    document.addEventListener('keydown', this._handleKeyDown, true);

    // 改变鼠标样式
    document.body.style.cursor = 'crosshair';

    // 显示提示信息
    this._showTip();
  }

  /**
   * 停用元素选择模式
   */
  deactivate() {
    if (!this.isActive) return;

    this.isActive = false;

    // 移除事件监听器
    document.removeEventListener('mousemove', this._handleMouseMove, true);
    document.removeEventListener('click', this._handleClick, true);
    document.removeEventListener('keydown', this._handleKeyDown, true);

    // 恢复鼠标样式
    document.body.style.cursor = '';

    // 移除高亮
    this._removeHighlight();

    // 移除提示信息
    this._removeTip();
  }

  /**
   * 处理鼠标移动事件
   * @private
   */
  _handleMouseMove(event) {
    event.stopPropagation();

    // 获取鼠标位置下的所有元素
    let element = event.target;

    // 忽略提示框本身
    if (element.id === 'webkeybind-selector-tip') return;

    // 尝试获取实际的可交互元素（穿透 span 等内联元素）
    element = this._findInteractiveElement(element);

    // 如果是新元素，更新高亮
    if (element !== this.hoveredElement) {
      this._removeHighlight();
      this._highlightElement(element);
      this.hoveredElement = element;
    }
  }

  /**
   * 处理点击事件
   * @private
   */
  _handleClick(event) {
    event.preventDefault();
    event.stopPropagation();

    let element = event.target;

    // 忽略提示框点击
    if (element.id === 'webkeybind-selector-tip') return;

    // 尝试获取实际的可交互元素（穿透 span 等内联元素）
    element = this._findInteractiveElement(element);

    console.log('[WebKeyBind] Element clicked:', element);
    console.log('[WebKeyBind] Element tag:', element.tagName);
    console.log('[WebKeyBind] Element classes:', element.className);
    console.log('[WebKeyBind] Element type:', element.getAttribute('type'));

    // 检测元素类型
    const handler = window.handlerRegistry.detectHandler(element);

    if (handler) {
      console.log('[WebKeyBind] Handler found:', handler.constructor.name);

      // 获取元素选择器信息
      const selectorInfo = handler.getSelector(element);

      // 确定元素类型
      let elementType = ElementType.CUSTOM;
      for (let [type, h] of window.handlerRegistry.handlers) {
        if (h === handler) {
          elementType = type;
          break;
        }
      }

      console.log('[WebKeyBind] Element type:', elementType);
      console.log('[WebKeyBind] Selector info:', selectorInfo);

      // 调用回调
      if (this.onSelectCallback) {
        this.onSelectCallback({
          elementType: elementType,
          selector: selectorInfo,
          element: element
        });
      }
    } else {
      console.log('[WebKeyBind] No handler found for element');
      alert('该元素类型暂不支持，请选择按钮元素。');
    }

    this.deactivate();
  }

  /**
   * 处理键盘事件
   * @private
   */
  _handleKeyDown(event) {
    // ESC键取消选择
    if (event.key === 'Escape') {
      event.preventDefault();
      this.deactivate();
    }
  }

  /**
   * 高亮元素
   * @private
   */
  _highlightElement(element) {
    this.originalOutline = element.style.outline;
    element.style.outline = '2px solid #4CAF50';
    element.style.outlineOffset = '2px';
  }

  /**
   * 移除高亮
   * @private
   */
  _removeHighlight() {
    if (this.hoveredElement) {
      this.hoveredElement.style.outline = this.originalOutline || '';
      this.hoveredElement.style.outlineOffset = '';
      this.hoveredElement = null;
    }
  }

  /**
   * 显示提示信息
   * @private
   */
  _showTip() {
    const tip = document.createElement('div');
    tip.id = 'webkeybind-selector-tip';
    tip.textContent = '点击选择元素，按 ESC 取消';
    tip.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 999999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      font-family: Arial, sans-serif;
    `;
    document.body.appendChild(tip);
  }

  /**
   * 移除提示信息
   * @private
   */
  _removeTip() {
    const tip = document.getElementById('webkeybind-selector-tip');
    if (tip) {
      tip.remove();
    }
  }

  /**
   * 查找可交互的父元素
   * 当用户点击按钮内的 span 或其他内联元素时，找到实际的按钮元素
   * @private
   */
  _findInteractiveElement(element) {
    let current = element;
    let depth = 0;
    const maxDepth = 5; // 最多向上查找5层

    while (current && depth < maxDepth) {
      // 检查当前元素是否可以被任何 handler 处理
      const handler = window.handlerRegistry.detectHandler(current);
      if (handler) {
        console.log(`[WebKeyBind] Found interactive element at depth ${depth}:`, current);
        return current;
      }

      current = current.parentElement;
      depth++;
    }

    // 如果没找到，返回原始元素
    console.log('[WebKeyBind] No interactive parent found, using original element');
    return element;
  }
}

// 导出到全局
if (typeof window !== 'undefined') {
  window.ElementSelector = ElementSelector;
}
