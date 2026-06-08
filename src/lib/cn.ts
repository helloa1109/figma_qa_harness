import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * className 병합 유틸.
 * - clsx: 조건부 클래스 합치기 (false/null/undefined 자동 제외)
 * - twMerge: Tailwind 충돌 자동 해결 (예: "bg-red-500 bg-blue-500" → "bg-blue-500")
 *
 * 사용:
 *   <div className={cn("p-4 bg-red-500", isActive && "bg-blue-500", className)} />
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
