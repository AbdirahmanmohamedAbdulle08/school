import React, { createContext, useCallback, useMemo, useRef, useState } from 'react';
import AlertModal from './AlertModal.jsx';

export const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);
  const resolverRef = useRef(null);

  const openAlert = useCallback((payload) => new Promise((resolve) => {
    resolverRef.current = resolve;
    setAlert(payload);
  }), []);

  const showAlert = useCallback((options) => openAlert({
    kind: 'alert',
    type: options?.type || 'info',
    title: options?.title,
    message: options?.message,
    buttonText: options?.buttonText,
  }), [openAlert]);

  const showConfirm = useCallback((options) => openAlert({
    kind: 'confirm',
    type: options?.type || 'warning',
    title: options?.title,
    message: options?.message,
    confirmText: options?.confirmText,
    cancelText: options?.cancelText,
    danger: options?.danger,
  }), [openAlert]);

  const handleResolve = useCallback((result) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setAlert(null);
    if (resolver) resolver(result);
  }, []);

  const value = useMemo(() => ({ showAlert, showConfirm }), [showAlert, showConfirm]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertModal alert={alert} onResolve={handleResolve} />
    </AlertContext.Provider>
  );
};
