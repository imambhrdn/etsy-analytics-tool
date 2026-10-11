export { cn } from "cn";

/**
 * Format angka besar ke format Indonesia dengan titik ribuan (mis. 278.389).
 * Deterministik (manual) agar identik di server dan client.
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return "—";
  const s = Math.trunc(num).toString();
  const neg = s.startsWith("-");
  const digits = neg ? s.slice(1) : s;
  const withDots = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "-" : "") + withDots;
}

/**
 * Format nominal Rupiah: tanpa desimal, pemisah ribuan titik (mis. Rp 178.891).
 * Deterministik (manual) agar identik di server dan client.
 */
export function formatIDR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  const rounded = Math.round(amount);
  const s = Math.abs(rounded).toString();
  const withDots = s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${rounded < 0 ? "-" : ""}Rp ${withDots}`;
}

/**
 * Konversi harga dari suatu mata uang ke IDR memakai peta kurs (base USD).
 * Mengembalikan null bila kurs tidak tersedia.
 */
export function convertToIDR(
  amount: number | null | undefined,
  currencyCode: string | null | undefined,
  rates: Record<string, number> | null | undefined,
): number | null {
  if (amount === null || amount === undefined || isNaN(amount)) return null;
  if (!rates) return null;
  const code = (currencyCode || "USD").toUpperCase();

  // rates berbasis USD: 1 USD = rates[X] unit X
  const idrPerUsd = rates.IDR;
  if (!idrPerUsd) return null;

  if (code === "IDR") return amount;
  const rateOfCode = rates[code];
  if (!rateOfCode) return null;

  // amount (dalam code) -> USD -> IDR
  const usd = amount / rateOfCode;
  return usd * idrPerUsd;
}

/**
 * Format string tanggal (ISO/epoch) ke format tanggal nama bulan dan tahun Indonesia (mis. 15 Oktober 2024).
 * Memakai peta bulan statis agar deterministik (menghindari hydration mismatch antar-ICU).
 */
const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function formatDateIndo(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  // Tampilkan dalam WIB (UTC+7) secara deterministik.
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return `${wib.getUTCDate()} ${MONTHS_ID[wib.getUTCMonth()]} ${wib.getUTCFullYear()}`;
}

/**
 * Peta nama negara statis (kode ISO 2-huruf -> nama Indonesia).
 * Statis & deterministik agar identik di server dan client (mencegah hydration mismatch).
 */
const COUNTRY_NAMES: Record<string, string> = {
  ID: "Indonesia",
  US: "Amerika Serikat",
  GB: "Inggris",
  CA: "Kanada",
  AU: "Australia",
  DE: "Jerman",
  FR: "Prancis",
  IT: "Italia",
  ES: "Spanyol",
  NL: "Belanda",
  BE: "Belgia",
  CH: "Swiss",
  AT: "Austria",
  SE: "Swedia",
  NO: "Norwegia",
  DK: "Denmark",
  FI: "Finlandia",
  PL: "Polandia",
  PT: "Portugal",
  GR: "Yunani",
  IE: "Irlandia",
  CZ: "Ceko",
  RO: "Rumania",
  HU: "Hungaria",
  TR: "Turki",
  RU: "Rusia",
  UA: "Ukraina",
  CN: "Tiongkok",
  HK: "Hong Kong",
  TW: "Taiwan",
  JP: "Jepang",
  KR: "Korea Selatan",
  IN: "India",
  PK: "Pakistan",
  BD: "Bangladesh",
  LK: "Sri Lanka",
  TH: "Thailand",
  VN: "Vietnam",
  MY: "Malaysia",
  SG: "Singapura",
  PH: "Filipina",
  KH: "Kamboja",
  BR: "Brasil",
  MX: "Meksiko",
  AR: "Argentina",
  CL: "Chili",
  CO: "Kolombia",
  PE: "Peru",
  ZA: "Afrika Selatan",
  EG: "Mesir",
  MA: "Maroko",
  NG: "Nigeria",
  KE: "Kenya",
  IL: "Israel",
  SA: "Arab Saudi",
  AE: "Uni Emirat Arab",
  NZ: "Selandia Baru",
  LT: "Lituania",
  LV: "Latvia",
  EE: "Estonia",
  BG: "Bulgaria",
  HR: "Kroasia",
  SI: "Slovenia",
  SK: "Slovakia",
  RS: "Serbia",
  MD: "Moldova",
  GE: "Georgia",
  AM: "Armenia",
  AZ: "Azerbaijan",
  KZ: "Kazakhstan",
  UZ: "Uzbekistan",
  BY: "Belarus",
  IS: "Islandia",
  LU: "Luksemburg",
  MT: "Malta",
  CY: "Siprus",
  TN: "Tunisia",
  DZ: "Aljazair",
  CR: "Kosta Rika",
  PA: "Panama",
  GT: "Guatemala",
  EC: "Ekuador",
  UY: "Uruguay",
  PY: "Paraguay",
  BO: "Bolivia",
  VE: "Venezuela",
  DO: "Republik Dominika",
  CU: "Kuba",
};

/**
 * Mengubah kode negara 2-huruf ISO menjadi nama negara teks (mis. US -> Amerika Serikat).
 * Deterministik (statis) untuk mencegah hydration mismatch.
 */
export function getCountryName(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const code = countryCode.toUpperCase();
  return COUNTRY_NAMES[code] || code;
}
