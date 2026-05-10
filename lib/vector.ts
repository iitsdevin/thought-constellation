export function vectorToSql(vector: number[]): string {
  return `[${vector.join(",")}]`;
}
