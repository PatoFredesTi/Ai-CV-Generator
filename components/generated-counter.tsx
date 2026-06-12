"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cv-generated-count";
const BASE_COUNT = 128;

export function GeneratedCounter() {
  const [count, setCount] = useState(BASE_COUNT);

  useEffect(() => {
    const syncCount = () => {
      const stored = Number(window.localStorage.getItem(STORAGE_KEY));
      setCount(Number.isFinite(stored) && stored > 0 ? stored : BASE_COUNT);
    };

    syncCount();
    window.addEventListener("cv-generated", syncCount);
    window.addEventListener("storage", syncCount);

    return () => {
      window.removeEventListener("cv-generated", syncCount);
      window.removeEventListener("storage", syncCount);
    };
  }, []);

  return <>{count.toLocaleString("es-CL")}</>;
}
