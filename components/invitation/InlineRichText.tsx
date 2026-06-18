import React, { useRef, useEffect, useState } from 'react';

export const InlineRichText: React.FC<{
    field: string;
    placeholder?: string;
    value: string;
    tagName?: any;
    className?: string;
    style?: React.CSSProperties;
    ec?: { onFieldEdit?: (field: string, val: string) => void };
}> = ({ field, placeholder, value, tagName = 'span', className, style, ec }) => {
    const Tag = tagName;
    const ref = useRef<HTMLElement>(null);
    const [focused, setFocused] = useState(false);

    // Sync innerHTML manually to prevent React from destroying focus or cursor
    // Only update if not focused to avoid cursor jumping
    useEffect(() => {
        if (ref.current && !focused && ref.current.innerHTML !== (value || '')) {
            ref.current.innerHTML = value || '';
        }
    }, [value, focused]);

    if (!ec?.onFieldEdit) {
        return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: value || '' }} />;
    }

    return (
        <Tag
            ref={ref}
            className={className}
            contentEditable={true}
            suppressContentEditableWarning={true}
            data-field={field}
            data-placeholder={placeholder}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            onFocus={(e: React.FocusEvent<HTMLElement>) => {
                setFocused(true);
                e.currentTarget.style.borderBottomColor = '#3b82f6';
            }}
            onBlur={(e: React.FocusEvent<HTMLElement>) => {
                setFocused(false);
                e.currentTarget.style.borderBottomColor = 'transparent';
                const html = e.currentTarget.innerHTML || '';
                if (html !== value) {
                    ec.onFieldEdit!(field, html);
                }
            }}
            style={{
                outline: 'none',
                cursor: 'text',
                borderBottom: '2px solid transparent',
                transition: 'border-color 0.2s',
                ...style
            }}
        />
    );
};
