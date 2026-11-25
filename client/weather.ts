export interface Place {
	name: string;
	latitude: number;
	longitude: number;
}

export interface SearchResult extends Place {
	country?: string;
	admin1?: string;
}

export interface Forecast {
	current: {
		temperature_2m: number;
		apparent_temperature: number;
		relative_humidity_2m: number;
		wind_speed_10m: number;
		weather_code: number;
		is_day: number;
	};
	daily: {
		time: string[];
		weather_code: number[];
		temperature_2m_max: number[];
		temperature_2m_min: number[];
		precipitation_probability_max: (number | null)[];
	};
}

async function getJson<T>(url: URL): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}
	return (await response.json()) as T;
}

export async function searchCity(name: string): Promise<SearchResult[]> {
	const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
	url.search = new URLSearchParams({ name, count: "5", language: "ru" }).toString();
	const data = await getJson<{ results?: SearchResult[] }>(url);
	return data.results ?? [];
}

export function getForecast({ latitude, longitude }: Place): Promise<Forecast> {
	const url = new URL("https://api.open-meteo.com/v1/forecast");
	url.search = new URLSearchParams({
		latitude: String(latitude),
		longitude: String(longitude),
		current:
			"temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
		daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
		timezone: "auto",
		forecast_days: "7",
	}).toString();
	return getJson<Forecast>(url);
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
