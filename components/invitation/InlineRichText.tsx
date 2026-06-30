import React, { useRef, useEffect, useState } from 'react';

// Lightweight sanitizer: strips all tags except safe inline formatting.
// Used only in read-only (non-editor) mode to prevent XSS from user-entered HTML.
const ALLOWED_TAGS = /^(b|strong|i|em|u|s|br|span)$/i;
const sanitizeHtml = (html: string): string => {
    if (!html) return '';
    // Use a temporary DOM element for parsing — server-safe (only runs in browser)
    const template = document.createElement('template');
    template.innerHTML = html;
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
    const toRemove: Element[] = [];
    let node = walker.nextNode() as Element | null;
    while (node) {
        if (!ALLOWED_TAGS.test(node.tagName)) {
            toRemove.push(node);
        } else {
            // Strip all attributes except style (for color/font) from allowed tags
            Array.from(node.attributes).forEach(attr => {
                if (attr.name !== 'style') node!.removeAttribute(attr.name);
            });
        }
        node = walker.nextNode() as Element | null;
    }
    // Replace disallowed elements with their text content
    toRemove.forEach(el => {
        const text = document.createTextNode(el.textContent || '');
        el.parentNode?.replaceChild(text, el);
    });
    const div = document.createElement('div');
    div.appendChild(template.content.cloneNode(true));
    return div.innerHTML;
};

export const InlineRichText: React.FC<{
    field: string;
    placeholder?: string;
    value: string;
    tagName?: any;
    className?: string;
    style?: React.CSSProperties;
    ec?: { onFieldEdit?: (field: string, val: string) => void };
}> = ({ value, tagName = 'span', className, style }) => {
    const Tag = tagName;

    // Read-only path: sanitize HTML before rendering to prevent XSS
    return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: sanitizeHtml(value || '') }} />;
};
