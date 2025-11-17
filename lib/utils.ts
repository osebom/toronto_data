import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDistance(miles: number): string {
  return `${miles.toFixed(1)} mi`;
}

