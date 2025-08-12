// hooks/useEditable.js
import { useState, useCallback } from 'react';

export function useEditable(initialValue = '') {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [previousValue, setPreviousValue] = useState(initialValue);

  const startEditing = useCallback(() => {
    setPreviousValue(value); // Save previous value in case of cancel
    setIsEditing(true);
  }, [value]);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const cancelEditing = useCallback(() => {
    setValue(previousValue); // Restore previous value
    setIsEditing(false);
  }, [previousValue]);

  const handleChange = useCallback((e) => {
    setValue(e.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        stopEditing();
      } else if (e.key === 'Escape') {
        cancelEditing();
      }
    },
    [stopEditing, cancelEditing]
  );

  return {
    isEditing,
    value,
    setValue,
    startEditing,
    stopEditing,
    handleChange,
    handleKeyDown,
  };
}
