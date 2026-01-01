"use client";

import { useEffect, useRef } from "react";

interface AutoClickButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export default function AutoClickButton({
  onClick,
  children,
}: AutoClickButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const clickedOnce = useRef(false);

  useEffect(() => {
    if (!clickedOnce.current && buttonRef.current) {
      clickedOnce.current = true;
      buttonRef.current.click();
    }
  }, []);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold"
    >
      {children}
    </button>
  );
}
