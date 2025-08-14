import { useRef, useEffect } from 'react';
import { useEditable } from '../hooks/useEditable';

export function EditableText({ as: Component = 'span', initialValue = '', onCustomChange }) {
    const {
        isEditing,
        value,
        startEditing,
        stopEditing,
        handleChange,
        handleKeyDown,
    } = useEditable(initialValue);

    const inputRef = useRef(null);

    // Optional: Auto-resize input width to match text
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.width = inputRef.current.scrollWidth + 'px';
        }
        typeof(onCustomChange) === 'function' && onCustomChange(value)
    }, [value]);

    return isEditing ? (
        <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onBlur={stopEditing}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
                all: 'unset', // reset all default input styles
                font: 'inherit', // match font family, size, weight, etc.
                width: 'fit-content',
                minWidth: '1ch',
                lineHeight: 'inherit',
                display: 'inline-block',
                outline: 'none',
                cursor: 'text',
            }}
        />
    ) : (
        <Component onDoubleClick={startEditing} style={{ cursor: 'pointer' }}>
            {value}
        </Component>
    );
}
