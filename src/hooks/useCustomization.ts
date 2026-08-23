"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VisibilityMap = Record<string, boolean>;

// =============================================================================
// useCustomization — Kustomizasiya (widget/sütun/kart görünürlüyü) hook-u
// =============================================================================
// Hər səhifə/bölmə öz "scope" açarı ilə işləyir (məs: "my-work-dashboard",
// "kanban-columns"). Dəyərlər `User.preferences` JSON sahəsində saxlanılır:
//   { "<scope>": { "<itemKey>": true|false } }
// Naməlum (heç vaxt toxunulmamış) açarlar defaultVisible-a düşür ki, yeni
// əlavə olunan vidjetlər köhnə istifadəçilər üçün avtomatik gizli qalmasın.
// =============================================================================
export function useCustomization(scope: string, initialValues?: VisibilityMap) {
  const [values, setValues] = useState<VisibilityMap>(initialValues ?? {});
  const [loaded, setLoaded] = useState(Boolean(initialValues));
  const hasInitial = useRef(Boolean(initialValues));

  useEffect(() => {
    if (hasInitial.current) return; // Server artıq ilkin dəyərləri ötürüb
    let cancelled = false;
    fetch("/api/settings/preferences")
      .then((res) => (res.ok ? res.json() : Promise.resolve({} as Record<string, VisibilityMap>)))
      .then((data: Record<string, VisibilityMap>) => {
        if (!cancelled) setValues((data && data[scope]) || {});
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const isVisible = useCallback(
    (key: string, defaultVisible = true) => {
      const v = values[key];
      return v === undefined ? defaultVisible : v;
    },
    [values]
  );

  const setVisible = useCallback(
    (key: string, value: boolean) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      fetch("/api/settings/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, key, value }),
      }).catch(() => {
        // Sükutla uğursuz ola bilər — UI optimistik qalır, növbəti tam yükləmədə server dəyəri qalib gələcək
      });
    },
    [scope]
  );

  const toggle = useCallback(
    (key: string, defaultVisible = true) => {
      setVisible(key, !isVisible(key, defaultVisible));
    },
    [isVisible, setVisible]
  );

  return { values, loaded, isVisible, setVisible, toggle };
}
