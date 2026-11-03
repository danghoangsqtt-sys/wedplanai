import React, { useRef, useEffect } from 'react';

// Lightweight sanitizer: strips all tags except safe inline formatting.
// Used only in read-only (non-editor) mode to prevent XSS from user-entered HTML.
const ALLOWED_TAGS = /^(b|strong|i|em|u|s|br|span)$/i;
export const sanitizeInlineHtml = (html: string): string => {
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
            const safeStyle = document.createElement('span').style;
            for (const property of ['color','font-family','font-size','font-weight','font-style','text-decoration','text-decoration-line']) {
                const value = (node as HTMLElement).style?.getPropertyValue(property);
                if (value && !/url\s*\(|expression\s*\(/i.test(value)) safeStyle.setProperty(property,value);
            }
            // Keep only inline typography, never events, links or layout overlays.
            Array.from(node.attributes).forEach(attr => {
                node!.removeAttribute(attr.name);
            });
            if (safeStyle.cssText) node.setAttribute('style',safeStyle.cssText);
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
}> = ({ value, field, placeholder, ec, tagName = 'span', className, style }) => {
    const Tag = tagName;
    const ref = useRef<HTMLElement|null>(null);
    const focused = useRef(false);
    const composing = useRef(false);
    const editable = !!ec?.onFieldEdit;
    useEffect(()=>{
        if(editable && ref.current && !focused.current && !composing.current) ref.current.innerHTML=sanitizeInlineHtml(value||'');
    },[value,editable]);
    const commit = (element:HTMLElement) => {
        if(composing.current) return;
        const html=element.textContent?.trim()?sanitizeInlineHtml(element.innerHTML):'';
        element.innerHTML=html;
        ec?.onFieldEdit?.(field,html);
    };
    if(editable) return <Tag ref={ref} className={className} style={style}
        contentEditable suppressContentEditableWarning data-field={field} data-placeholder={placeholder}
        aria-label={placeholder||field} role="textbox"
        onFocus={()=>{focused.current=true;}}
        onClick={(event:React.MouseEvent)=>event.stopPropagation()}
        onBlur={(event:React.FocusEvent<HTMLElement>)=>{focused.current=false;commit(event.currentTarget);}}
        onCompositionStart={()=>{composing.current=true;}}
        onCompositionEnd={(event:React.CompositionEvent<HTMLElement>)=>{composing.current=false;if(!focused.current) commit(event.currentTarget);}}
        onKeyDown={(event:React.KeyboardEvent<HTMLElement>)=>{
            if(event.key==='Enter'&&!event.shiftKey&&!composing.current&&tagName!=='p') { event.preventDefault();event.currentTarget.blur(); }
        }}
        onPaste={(event:React.ClipboardEvent<HTMLElement>)=>{
            event.preventDefault();const text=event.clipboardData.getData('text/plain');
            if(typeof document.execCommand==='function') { document.execCommand('insertText',false,text);return; }
            const selection=window.getSelection();
            if(selection?.rangeCount && event.currentTarget.contains(selection.anchorNode)) {
                const range=selection.getRangeAt(0);range.deleteContents();const node=document.createTextNode(text);range.insertNode(node);range.setStartAfter(node);range.collapse(true);
            } else event.currentTarget.appendChild(document.createTextNode(text));
        }}
    />;

    // Read-only path: sanitize HTML before rendering to prevent XSS
    return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(value || '') }} />;
};
