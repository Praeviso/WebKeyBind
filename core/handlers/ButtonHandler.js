/**
 * 按钮元素处理器
 */
class ButtonHandler extends ElementHandler {
  canHandle(element) {
    if (!element) return false;

    const tagName = element.tagName.toLowerCase();
    const type = element.getAttribute('type');
    const role = element.getAttribute('role');

    // 检查是否为按钮元素
    return tagName === 'button' ||
           (tagName === 'input' && (type === 'button' || type === 'submit')) ||
           role === 'button' ||
           element.classList.contains('btn') ||
           element.classList.contains('button');
  }

  trigger(element) {
    if (!element) return;

    // 优先使用原生 click() 方法
    // 如果 click() 不起作用，再考虑手动触发事件
    element.click();

    // 注意：不再手动触发额外的鼠标事件，避免重复触发
    // 如果某些特殊按钮需要完整的事件序列，可以根据需要启用下面的代码
    /*
    const events = ['mousedown', 'mouseup', 'click'];
    events.forEach(eventType => {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(event);
    });
    */
  }

  getSelector(element) {
    // 生成唯一的CSS选择器
    const selector = this._generateCSSSelector(element);
    const xpath = this._generateXPath(element);

    return {
      selector: selector,
      xpath: xpath,
      textContent: element.textContent.trim(),
      index: this._getElementIndex(element, selector)
    };
  }

  findElement(selectorInfo) {
    // 首先尝试使用CSS选择器
    let elements = document.querySelectorAll(selectorInfo.selector);

    if (elements.length === 0) {
      // 如果CSS选择器失败，尝试XPath
      const xpathResult = document.evaluate(
        selectorInfo.xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return xpathResult.singleNodeValue;
    }

    // 如果有多个匹配，使用索引
    if (elements.length > 1 && selectorInfo.index !== undefined) {
      return elements[selectorInfo.index];
    }

    // 如果索引无效，尝试通过文本内容匹配
    if (selectorInfo.textContent) {
      for (let elem of elements) {
        if (elem.textContent.trim() === selectorInfo.textContent) {
          return elem;
        }
      }
    }

    return elements[0];
  }

  /**
   * 生成元素的CSS选择器
   * @private
   */
  _generateCSSSelector(element) {
    // 如果有ID，优先使用ID
    if (element.id) {
      return `#${element.id}`;
    }

    // 构建路径
    const path = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.tagName.toLowerCase();

      // 添加类名
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).filter(c => c);
        if (classes.length > 0) {
          selector += '.' + classes.join('.');
        }
      }

      // 添加属性选择器（如果有有用的属性）
      const attrs = ['data-testid', 'data-id', 'name', 'aria-label'];
      for (let attr of attrs) {
        const value = current.getAttribute(attr);
        if (value) {
          selector += `[${attr}="${value}"]`;
          break;
        }
      }

      path.unshift(selector);

      // 如果已经足够唯一，停止
      if (document.querySelectorAll(path.join(' > ')).length === 1) {
        break;
      }

      current = current.parentElement;

      // 限制深度
      if (path.length > 5) break;
    }

    return path.join(' > ');
  }

  /**
   * 生成元素的XPath
   * @private
   */
  _generateXPath(element) {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    const path = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling = current.previousSibling;

      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE &&
            sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }

      const tagName = current.tagName.toLowerCase();
      const pathIndex = index > 0 ? `[${index + 1}]` : '';
      path.unshift(`${tagName}${pathIndex}`);

      current = current.parentElement;
    }

    return '/' + path.join('/');
  }

  /**
   * 获取元素在相同选择器中的索引
   * @private
   */
  _getElementIndex(element, selector) {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).indexOf(element);
  }
}

// 导出到全局
if (typeof window !== 'undefined') {
  window.ButtonHandler = ButtonHandler;
}
