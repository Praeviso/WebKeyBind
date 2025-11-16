/**
 * 元素处理器注册表
 * 管理所有元素类型的处理器，支持扩展新类型
 */
class HandlerRegistry {
  constructor() {
    this.handlers = new Map();
    this._registerDefaultHandlers();
  }

  /**
   * 注册默认处理器
   * @private
   */
  _registerDefaultHandlers() {
    // 注册按钮处理器
    this.register(ElementType.BUTTON, new ButtonHandler());
  }

  /**
   * 注册新的处理器
   * @param {string} type - 元素类型
   * @param {ElementHandler} handler - 处理器实例
   */
  register(type, handler) {
    if (!(handler instanceof ElementHandler)) {
      throw new Error('Handler must extend ElementHandler');
    }
    this.handlers.set(type, handler);
  }

  /**
   * 获取指定类型的处理器
   * @param {string} type - 元素类型
   * @returns {ElementHandler|null}
   */
  getHandler(type) {
    return this.handlers.get(type) || null;
  }

  /**
   * 根据元素自动检测并返回合适的处理器
   * @param {HTMLElement} element
   * @returns {ElementHandler|null}
   */
  detectHandler(element) {
    for (let [type, handler] of this.handlers) {
      if (handler.canHandle(element)) {
        return handler;
      }
    }
    return null;
  }

  /**
   * 获取所有支持的元素类型
   * @returns {string[]}
   */
  getSupportedTypes() {
    return Array.from(this.handlers.keys());
  }
}

// 创建全局单例
if (typeof window !== 'undefined') {
  window.HandlerRegistry = HandlerRegistry;
  window.handlerRegistry = new HandlerRegistry();
}
