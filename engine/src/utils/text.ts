export function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
