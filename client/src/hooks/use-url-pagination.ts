import { useState, useEffect } from "react";

export function useUrlPagination(defaultPage = 1) {
  const [page, setPageState] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get("page");
      return pageParam ? parseInt(pageParam, 10) : defaultPage;
    }
    return defaultPage;
  });

  const setPage = (newPage: number) => {
    setPageState(newPage);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("page", newPage.toString());
      window.history.pushState({}, "", url.toString());
    }
  };

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