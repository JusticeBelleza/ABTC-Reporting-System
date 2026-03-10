import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Make sure it says "export default" right here:
export default function ModalPortal({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="portal-root relative z-[9999]">
      {children}
    </div>,
    document.body
  );
}