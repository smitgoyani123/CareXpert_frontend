import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Returns a human-friendly relative time string for a timestamp.
// Examples: "Just now", "5 minutes ago", "3 hours ago", "2 days ago", "Jan 2, 2024"
export function relativeTime(input: Date | string | number): string {
  const date =
    input instanceof Date ? input : typeof input === "number" ? new Date(input) : new Date(String(input));
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return "Just now";
  if (diffSeconds < 3600) {
    const m = Math.floor(diffSeconds / 60);
    return `${m} minute${m > 1 ? "s" : ""} ago`;
  }
  if (diffSeconds < 86400) {
    const h = Math.floor(diffSeconds / 3600);
    return `${h} hour${h > 1 ? "s" : ""} ago`;
  }
  if (diffSeconds < 7 * 86400) {
    const d = Math.floor(diffSeconds / 86400);
    return `${d} day${d > 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
