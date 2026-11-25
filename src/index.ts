import type { Currency, Forecast, Info, Rates } from "./types.ts";

// Страница и её файлы отдаются как статические ассеты, сюда попадают запросы к /api/*.

async function getJson<T>(url: string): Promise<T> {
	const response = await fetch(url);
	// fetch не бросает ошибку на 404 или 500, поэтому проверяем статус сами.
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${url}`);
	}
	return (await response.json()) as T;
}

function getWeather(latitude: number, longitude: number): Promise<Forecast> {
	const params = new URLSearchParams({
		latitude: String(latitude),
		longitude: String(longitude),
		current:
			"temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
		daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
		timezone: "auto",
		forecast_days: "7",
	});
	return getJson<Forecast>(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
}

function getCurrency(base: string, quote: string): Promise<Currency> {
	return getJson<Currency>(`https://api.frankfurter.dev/v2/rate/${base}/${quote}`);
}

// Кросс-курс USD → TRY через KZT. Нужны оба курса, поэтому Promise.all.
async function getRates(): Promise<Rates> {
	const [usdKzt, tryKzt] = await Promise.all([
		getCurrency("USD", "KZT"),
		getCurrency("TRY", "KZT"),
	]);
	return { usdKzt, tryKzt, cross: usdKzt.rate / tryKzt.rate };
}

function parseCoordinate(value: string | null, limit: number): number | null {
	if (!value) return null;
	const number = Number(value);
	return Math.abs(number) <= limit ? number : null;
}

export default {
	async fetch(request) {
		const url = new URL(request.url);
		if (url.pathname !== "/api/info") {
			return new Response("Not found", { status: 404 });
		}

		const latitude = parseCoordinate(url.searchParams.get("lat"), 90);
		const longitude = parseCoordinate(url.searchParams.get("lon"), 180);
		if (latitude === null || longitude === null) {
			return Response.json({ error: "Неверные координаты" }, { status: 400 });
		}

		try {
			// Погода и курсы запрашиваются одновременно.
			const [weather, rates] = await Promise.all([getWeather(latitude, longitude), getRates()]);
			return Response.json({ weather, rates } satisfies Info);
		} catch (error) {
			console.error(error);
			return Response.json({ error: "Источник данных не отвечает" }, { status: 502 });
		}
	},
} satisfies ExportedHandler;
