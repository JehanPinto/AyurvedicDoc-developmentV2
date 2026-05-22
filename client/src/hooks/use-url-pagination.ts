// src/hooks/use-url-pagination.ts
import { useState, useEffect } from "react";

export function useUrlPagination(defaultPage = 1) {
  // Initial load එකේදී URL එකේ page එකක් තියෙනවද බලනවා
  const [page, setPageState] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get("page");
      return pageParam ? parseInt(pageParam, 10) : defaultPage;
    }
    return defaultPage;
  });

  // Page එක වෙනස් කරන විට URL එකත් update කරන function එක
  const setPage = (newPage: number) => {
    setPageState(newPage);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("page", newPage.toString());
      // Page එක reload නොකර URL එක විතරක් update කරනවා
      window.history.pushState({}, "", url.toString());
    }
  };

  // Browser එකේ Back / Forward බොත්තම් එබූ විට state එක update කිරීම
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get("page");
      setPageState(pageParam ? parseInt(pageParam, 10) : defaultPage);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [defaultPage]);

  return [page, setPage] as const;
}