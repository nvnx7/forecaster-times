export function capitalizeWords(value: string): string {
  return value.replace(
    /\p{L}[\p{L}\p{M}'’]*/gu,
    (word) => word[0]?.toUpperCase().concat(word.slice(1)) ?? word,
  );
}
