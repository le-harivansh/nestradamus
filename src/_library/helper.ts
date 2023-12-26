export function generateNumericPasswordOfLength(length: number): string {
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

  return [...Array(length)]
    .map(() => numbers[Math.floor(Math.random() * numbers.length)])
    .join('');
}
