/**
 * 核心类型定义 - 为可扩展架构提供基础
 */

/**
 * 元素类型枚举
 * 目前支持按钮，未来可扩展到输入框、链接等
 */
const ElementType = {
  BUTTON: 'button',
  INPUT: 'input',
  LINK: 'link',
  CUSTOM: 'custom'
};

/**
 * 元素选择器信息
 * @typedef {Object} ElementSelector
 * @property {string} selector - CSS选择器
 * @property {string} xpath - XPath路径（备用）
 * @property {string} textContent - 元素文本内容
 * @property {number} index - 如果有多个相同选择器，使用索引区分
 */

/**
 * 快捷键绑定配置
 * @typedef {Object} KeyBinding
 * @property {string} id - 唯一标识符
 * @property {string} domain - 域名
 * @property {string} url - 完整URL模式（支持通配符）
 * @property {string} elementType - 元素类型（来自ElementType）
 * @property {ElementSelector} selector - 元素选择器
 * @property {string} key - 快捷键（如 'Ctrl+K', 'Alt+S'）
 * @property {string} description - 绑定描述
 * @property {boolean} enabled - 是否启用
 * @property {number} createdAt - 创建时间戳
 */

/**
 * 元素处理器接口
 * 不同类型的元素需要实现此接口
 */
class ElementHandler {
  /**
   * 检查元素是否匹配此处理器
   * @param {HTMLElement} element
   * @returns {boolean}
   */
  canHandle(element) {
    throw new Error('canHandle() must be implemented');
  }

  /**
   * 触发元素的默认行为
   * @param {HTMLElement} element
   */
  trigger(element) {
    throw new Error('trigger() must be implemented');
  }

  /**
   * 获取元素的选择器信息
   * @param {HTMLElement} element
   * @returns {ElementSelector}
   */
  getSelector(element) {
    throw new Error('getSelector() must be implemented');
  }

  /**
   * 根据选择器查找元素
   * @param {ElementSelector} selector
   * @returns {HTMLElement|null}
   */
  findElement(selector) {
    throw new Error('findElement() must be implemented');
  }
}

// 导出到全局
if (typeof window !== 'undefined') {
  window.ElementType = ElementType;
  window.ElementHandler = ElementHandler;
}
