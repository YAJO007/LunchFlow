
export function money(value: number): string {
  return Number(value).toFixed(2);
}

export function km(value: number): string {
  return Number(value).toFixed(2);
}

export function dateTime(value: string | undefined): string {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('th-TH');
}
