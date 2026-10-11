export { cn } from "cn";

/**
 * Format angka besar ke format Indonesia dengan titik ribuan (mis. 278.389).
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return "—";
  return new Intl.NumberFormat("id-ID").format(num);
}

/**
 * Format string tanggal (ISO/epoch) ke format tanggal nama bulan dan tahun Indonesia (mis. 15 Oktober 2024).
 */
export function formatDateIndo(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Mengubah kode negara 2-huruf ISO (mis. US, ID, GB) menjadi bendera emoji (🇺🇸, 🇮🇩, 🇬🇧).
 */
export function getCountryFlag(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
