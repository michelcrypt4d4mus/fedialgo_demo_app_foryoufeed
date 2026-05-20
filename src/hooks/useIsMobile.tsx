import { useEffect, useState } from "react";

// Matches Bootstrap's "md" breakpoint boundary (>= 768px is desktop).
const MOBILE_QUERY = "(max-width: 767.98px)";

/** Returns true when the viewport is narrower than Bootstrap's `md` breakpoint. */
export default function useIsMobile(): boolean {
    const getMatch = () =>
        typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;

    const [isMobile, setIsMobile] = useState<boolean>(getMatch);

    useEffect(() => {
        const mql = window.matchMedia(MOBILE_QUERY);
        const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return isMobile;
};
