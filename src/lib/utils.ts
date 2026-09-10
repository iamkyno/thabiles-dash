import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Nudge a focused form field into view once the mobile on-screen keyboard has finished animating in. */
export function scrollFieldIntoView(element: Element) {
  window.setTimeout(() => {
    element.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 300);
}
