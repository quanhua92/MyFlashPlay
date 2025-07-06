import DOMPurify from 'dompurify';

/**
 * Safely sanitize HTML content to prevent XSS attacks
 * Allows only safe HTML tags and attributes for flashcard content
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Configuration for flashcard content
  // Allow basic formatting but strip dangerous elements
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'sub', 'sup',
      'mark', 'small'
    ],
    ALLOWED_ATTR: [
      'class', 'style', 'id'
    ],
    ALLOWED_ATTR_PREFIX: [],
    FORBID_TAGS: [
      'script', 'object', 'embed', 'link', 'meta', 'style',
      'iframe', 'frame', 'frameset', 'form', 'input', 'button',
      'textarea', 'select', 'option', 'audio', 'video'
    ],
    FORBID_ATTR: [
      'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
      'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
      'href', 'src', 'action', 'formaction', 'background',
      'dynsrc', 'lowsrc'
    ],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false
  };

  return DOMPurify.sanitize(html, config);
}

/**
 * Component helper for safely rendering HTML content
 * Use this instead of dangerouslySetInnerHTML
 */
export function createSafeHTML(html: string) {
  return {
    __html: sanitizeHTML(html)
  };
}

/**
 * Strip all HTML tags and return plain text
 * Useful for previews or search indexing
 */
export function stripHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true 
  }).trim();
}

/**
 * Validate that content is safe for display
 * Returns true if content is safe, false if it contains dangerous elements
 */
export function isContentSafe(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return true;
  }

  const sanitized = sanitizeHTML(html);
  // If sanitization changed the content significantly, it was potentially dangerous
  return sanitized.length > 0 && sanitized.length >= html.length * 0.8;
}