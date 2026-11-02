/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

// In-app replacement for window.confirm (which shows the browser's own "localhost says..." box):
//   const confirm = useConfirm();
//   if (!(await confirm({ title, message, confirmText, tone: "danger" }))) return;
const ConfirmContext = createContext(() => Promise.resolve(window.confirm("Are you sure?")));

export const ConfirmProvider = ({ children }) => {
  const [request, setRequest] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback(
    options =>
      new Promise(resolve => {
        resolveRef.current = resolve;
        setRequest(options);
      }),
    []
  );

  const close = answer => {
    resolveRef.current?.(answer);
    resolveRef.current = null;
    setRequest(null);
  };

  const danger = request?.tone === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(request)}
        onClose={() => close(false)}
        size="sm"
        icon={danger ? AlertTriangle : CheckCircle2}
        title={request?.title || "Are you sure?"}
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>{request?.cancelText || "Cancel"}</Button>
            <Button variant={danger ? "destructive" : "default"} onClick={() => close(true)} autoFocus>
              {request?.confirmText || "Confirm"}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-muted-foreground">{request?.message}</p>
      </Modal>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);
