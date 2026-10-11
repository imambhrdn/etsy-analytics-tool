import "server-only";

export type ExchangeRates = {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
  nextUpdateAt: string;
};

/**
 * Ambil kurs mata uang (base USD) dari API publik open.er-api.com.
 * Di-cache 24 jam agar nilai kurs ter-update sekali sehari (hemat & cepat).
 * Jika gagal, kembalikan null agar UI memakai fallback (tanpa konversi).
 */
export async function getExchangeRates(): Promise<ExchangeRates | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      // Cache 24 jam: kurs diperbarui sekali per hari.
      next: { revalidate: 86400, tags: ["exchange-rates"] },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn(`[currency] Gagal ambil kurs: HTTP ${res.status}`);
      return null;
    }

    const json = (await res.json()) as {
      result?: string;
      base_code?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
      time_next_update_utc?: string;
    };

    if (json.result !== "success" || !json.rates) {
      console.warn("[currency] Respons kurs tidak valid");
      return null;
    }

    return {
      base: json.base_code || "USD",
      rates: json.rates,
      updatedAt: json.time_last_update_utc || new Date().toISOString(),
      nextUpdateAt: json.time_next_update_utc || "",
    };
  } catch (err) {
    console.warn("[currency] Error ambil kurs:", (err as Error).message);
    return null;
  }
}
