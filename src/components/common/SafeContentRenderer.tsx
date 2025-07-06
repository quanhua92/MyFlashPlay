import React from 'react';

interface SafeContentRendererProps {
  content: string;
  className?: string;
}

/**
 * Safely renders user content without using dangerouslySetInnerHTML
 * Supports:
 * - Plain text
 * - Basic formatting (*bold*, _italic_, `code`)
 * - Images with URL validation
 * - Line breaks
 * - Links (made safe)
 */
export function SafeContentRenderer({ content, className }: SafeContentRendererProps) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // Split content into parts and process each part
  const parts = parseContent(content);
  
  return (
    <div className={className}>
      {parts.map((part, index) => renderPart(part, index))}
    </div>
  );
}

interface ContentPart {
  type: 'text' | 'bold' | 'italic' | 'code' | 'image' | 'link' | 'linebreak';
  content: string;
  url?: string;
  alt?: string;
}

function parseContent(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  let remaining = content;
  
  while (remaining.length > 0) {
    // Look for images first: ![alt](url)
    const imageMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      const [fullMatch, alt, url] = imageMatch;
      if (isValidImageUrl(url)) {
        parts.push({
          type: 'image',
          content: alt || 'Image',
          url: url,
          alt: alt || 'Image'
        });
      } else {
        // Invalid image URL, treat as text
        parts.push({
          type: 'text',
          content: fullMatch
        });
      }
      remaining = remaining.slice(fullMatch.length);
      continue;
    }

    // Look for links: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const [fullMatch, text, url] = linkMatch;
      if (isValidUrl(url)) {
        parts.push({
          type: 'link',
          content: text,
          url: url
        });
      } else {
        // Invalid URL, treat as text
        parts.push({
          type: 'text',
          content: fullMatch
        });
      }
      remaining = remaining.slice(fullMatch.length);
      continue;
    }

    // Look for bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
    if (boldMatch) {
      const [fullMatch, , text] = boldMatch;
      parts.push({
        type: 'bold',
        content: text
      });
      remaining = remaining.slice(fullMatch.length);
      continue;
    }

    // Look for italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
    if (italicMatch) {
      const [fullMatch, , text] = italicMatch;
      parts.push({
        type: 'italic',
        content: text
      });
      remaining = remaining.slice(fullMatch.length);
      continue;
    }

    // Look for code: `text`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      const [fullMatch, text] = codeMatch;
      parts.push({
        type: 'code',
        content: text
      });
      remaining = remaining.slice(fullMatch.length);
      continue;
    }

    // Look for line breaks
    if (remaining.startsWith('\\n') || remaining.startsWith('\n')) {
      parts.push({
        type: 'linebreak',
        content: ''
      });
      remaining = remaining.slice(remaining.startsWith('\\n') ? 2 : 1);
      continue;
    }

    // Regular character - take until next special character
    const nextSpecial = remaining.search(/[\*_`!\[\n\\]/);
    if (nextSpecial === -1) {
      // No more special characters, take the rest
      parts.push({
        type: 'text',
        content: remaining
      });
      break;
    } else if (nextSpecial === 0) {
      // Special character that didn't match patterns, treat as text
      parts.push({
        type: 'text',
        content: remaining[0]
      });
      remaining = remaining.slice(1);
    } else {
      // Text before next special character
      parts.push({
        type: 'text',
        content: remaining.slice(0, nextSpecial)
      });
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
}

function renderPart(part: ContentPart, index: number): React.ReactNode {
  switch (part.type) {
    case 'text':
      return <span key={index}>{part.content}</span>;
    
    case 'bold':
      return <strong key={index}>{part.content}</strong>;
    
    case 'italic':
      return <em key={index}>{part.content}</em>;
    
    case 'code':
      return (
        <code 
          key={index} 
          className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono"
        >
          {part.content}
        </code>
      );
    
    case 'image':
      return (
        <img 
          key={index}
          src={part.url} 
          alt={part.alt}
          className="max-w-full h-auto rounded-lg shadow-sm my-2"
          onError={(e) => {
            // If image fails to load, replace with alt text
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentNode;
            if (parent) {
              const altSpan = document.createElement('span');
              altSpan.textContent = `[Image: ${part.alt}]`;
              altSpan.className = 'text-gray-500 italic';
              parent.insertBefore(altSpan, target);
            }
          }}
          loading="lazy"
        />
      );
    
    case 'link':
      return (
        <a 
          key={index}
          href={part.url}
          className="text-blue-600 dark:text-blue-400 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {part.content}
        </a>
      );
    
    case 'linebreak':
      return <br key={index} />;
    
    default:
      return <span key={index}>{part.content}</span>;
  }
}

function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Allow http, https, and data URLs
    if (!['http:', 'https:', 'data:'].includes(parsedUrl.protocol)) {
      return false;
    }
    // For data URLs, check if it's an image
    if (parsedUrl.protocol === 'data:') {
      return url.startsWith('data:image/');
    }
    // Check for common image extensions
    const pathname = parsedUrl.pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    return imageExtensions.some(ext => pathname.endsWith(ext)) || pathname.includes('/image');
  } catch {
    return false;
  }
}

function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:', 'mailto:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}