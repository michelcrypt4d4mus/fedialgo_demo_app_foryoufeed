import { RefObject, useEffect, useMemo, useState } from "react";


/**
 * Used to determine if an element is in the viewport. Currently sets the isBottom variable
 * which triggers the loading of infinite scroll content.
 */
export default function useOnScreen(ref: RefObject<HTMLElement>): boolean {
    const [isIntersecting, setIntersecting] = useState(false);

    const observer = useMemo(
        () => new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting)),
        [ref]
    );

    useEffect(() => {
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return isIntersecting;
};
