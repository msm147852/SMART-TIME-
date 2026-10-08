export function normalizeEG(phone: string): string | null {
  const arabicDigits: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };

  let value = String(phone || '').trim().replace(/[٠-٩]/g, (digit) => arabicDigits[digit] || digit);
  value = value.replace(/[\s\-().]/g, '');

  if (value.startsWith('002')) value = '+' + value.slice(3);
  if (value.startsWith('01') && value.length === 11) value = '+2' + value;
  else if (value.startsWith('201') && !value.startsWith('+201')) value = '+' + value;

  if (!/^\+201\d{9}$/.test(value)) return null;
  return value;
}
