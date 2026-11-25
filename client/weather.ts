import type { Info } from "../src/types.ts";

export interface Place {
	name: string;
	latitude: number;
	longitude: number;
}

export interface SearchResult extends Place {
	country?: string;
	admin1?: string;
}

async function getJson<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}
	return (await response.json()) as T;
}

export async function searchCity(name: string): Promise<SearchResult[]> {
	const params = new URLSearchParams({ name, count: "5", language: "ru" });
	const data = await getJson<{ results?: SearchResult[] }>(
		`https://geocoding-api.open-meteo.com/v1/search?${params}`,
	);
	return data.results ?? [];
}

// Погода и курсы приходят от нашего Worker одним ответом.
export function getInfo({ latitude, longitude }: Place): Promise<Info> {
	const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude) });
	return getJson<Info>(`/api/info?${params}`);
}

// Коды погоды WMO, которые возвращает Open-Meteo.
export function describe(code: number, isDay = true): { icon: string; text: string } {
	if (code === 0) return { icon: isDay ? "☀️" : "🌙", text: "Ясно" };
	if (code <= 2) return { icon: isDay ? "🌤️" : "☁️", text: "Переменная облачность" };
	if (code === 3) return { icon: "☁️", text: "Пасмурно" };
	if (code <= 48) return { icon: "🌫️", text: "Туман" };
	if (code <= 57) return { icon: "🌦️", text: "Морось" };
	if (code <= 67) return { icon: "🌧️", text: "Дождь" };
	if (code <= 77) return { icon: "🌨️", text: "Снег" };
	if (code <= 82) return { icon: "🌧️", text: "Ливень" };
	if (code <= 86) return { icon: "🌨️", text: "Снегопад" };
	return { icon: "⛈️", text: "Гроза" };
}
