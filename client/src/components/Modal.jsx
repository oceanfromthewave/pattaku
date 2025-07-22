import React, { useEffect } from "react";
import styles from "../styles/Modal.module.scss";

export default function Modal({ children, onClose }) {
  // ESC 키로 닫기 (옵션)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
