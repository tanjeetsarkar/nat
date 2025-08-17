import { useCallback, useEffect, useState } from "react";

export function useLocalStorage(key, initialValue) {

    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (!item) window.localStorage.setItem(key, JSON.stringify(initialValue))
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error loading ${key} from localStorage:`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            const item = window.localStorage.getItem(key);
            const value = item ? JSON.parse(item) : initialValue;
            setStoredValue(value);
        } catch (error) {
            console.error(`Error loading ${key} from localStorage:`, error);
            setStoredValue(initialValue);
        }
    }, [key]);

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
        }
    }, [key, storedValue]);

    const removeValue = useCallback(() => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.error(`Error removing ${key} from localStorage:`, error);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
}
