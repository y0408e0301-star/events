"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** 週表示の時間軸。開いたときに、決めた位置（8:00 あたり）までスクロールしておく */
export function CalendarScroll({
  scrollTop,
  className,
  children,
}: {
  scrollTop: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = scrollTop;
    }
  }, [scrollTop]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
