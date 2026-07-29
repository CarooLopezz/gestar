import { useCallback, useRef, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const showToast = useCallback((message, success = true) => {
    clearTimeout(timeoutRef.current);
    setToast({ message, success });
    timeoutRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  return { toast, showToast };
}
