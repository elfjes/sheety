export function signedInt(value: number): string {
  return value >= 0 ? `+${value}` : "" + value;
}
export function hasOwnProperty<T extends object>(
  obj: T,
  key: string | number | symbol,
): key is keyof T {
  return key in obj;
}
