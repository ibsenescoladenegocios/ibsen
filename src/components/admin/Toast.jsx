import { createContext, useCallback, useContext, useState } from 'react';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [t, setT] = useState(null);
  const show = useCallback((message, type = 'ok') => {
    setT({ message, type, id: Date.now() });
    setTimeout(() => setT((cur) => (cur && Date.now() - cur.id >= 3500 ? null : cur)), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {t && (
        <div role="status" className={`fixed bottom-5 right-5 z-[60] rounded-md px-4 py-3 text-sm font-medium text-white shadow-lg ${t.type === 'err' ? 'bg-red-600' : 'bg-green-600'}`}>
          {t.message}
        </div>
      )}
    </ToastCtx.Provider>
  );
}
