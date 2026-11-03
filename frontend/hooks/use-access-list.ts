"use client";
import { useCallback, useEffect, useState } from "react";
import { accessRequest } from "@/lib/access/api";
import type { Page } from "@/lib/access/types";

export function useAccessList<T>(path: string, resource = "") {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<Page<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search.trim()) params.set("search", search.trim());
      if (resource) params.set("resource", resource);
      setResult(await accessRequest<Page<T>>(`${path}?${params}`));
    } catch (err) { setError(err instanceof Error ? err.message : "Error al cargar datos."); setResult(null); }
    finally { setLoading(false); }
  }, [path, page, search, resource]);
  useEffect(() => { const timer = setTimeout(() => void load(), 250); return () => clearTimeout(timer); }, [load]);
  const changeSearch = (value: string) => { setPage(1); setSearch(value); };
  return { page, setPage, search, changeSearch, result, loading, error, reload: load };
}
