
export function money(value: number): string {
  return Number(value || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function int(value: number): string {
  return Number(value || 0).toLocaleString('th-TH');
}

export function km(value: number): string {
  return Number(value || 0).toFixed(2);
}

export function dateTime(value: string | undefined): string {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toMinutes(time: string): number {
  const parts = time.split(':');
  return Number(parts[0]) * 60 + Number(parts[1]);
}
