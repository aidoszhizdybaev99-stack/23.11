import { describe, getForecast, searchCity, type Forecast, type Place } from "./weather.ts";

const DEFAULT_PLACE: Place = { name: "Алматы", latitude: 43.24, longitude: 76.89 };

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
	return document.getElementById(id) as T;
}

const form = byId<HTMLFormElement>("search");
const input = byId<HTMLInputElement>("query");
const results = byId<HTMLUListElement>("results");
const statusLine = byId("status");
const weather = byId("weather");

// Номер последнего запроса: ответы на устаревшие запросы отбрасываются.
let latestForecast = 0;
let latestSearch = 0;

function degrees(value: number): string {
	const rounded = Math.round(value);
	return `${rounded > 0 ? "+" : ""}${rounded}°`;
}

function span(text: string, className: string): HTMLSpanElement {
	const element = document.createElement("span");
	element.className = className;
	element.textContent = text;
	return element;
}

function placeFromUrl(): Place {
	const params = new URLSearchParams(location.search);
	const name = params.get("city");
	const latitude = Number(params.get("lat") ?? Number.NaN);
	const longitude = Number(params.get("lon") ?? Number.NaN);
	if (name && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
		return { name, latitude, longitude };
	}
	return DEFAULT_PLACE;
}

function render(place: Place, { current, daily }: Forecast): void {
	const now = describe(current.weather_code, current.is_day === 1);
	byId("place").textContent = place.name;
	byId("icon").textContent = now.icon;
	byId("temp").textContent = degrees(current.temperature_2m);
	byId("summary").textContent = now.text;
	byId("feels").textContent = degrees(current.apparent_temperature);
	byId("humidity").textContent = `${current.relative_humidity_2m}%`;
	byId("wind").textContent = `${Math.round(current.wind_speed_10m)} км/ч`;

	const dayName = new Intl.DateTimeFormat("ru-RU", {
		weekday: "short",
		day: "numeric",
		month: "short",
		timeZone: "UTC",
	});
	byId("days").replaceChildren(
		...daily.time.map((date, index) => {
			const day = describe(daily.weather_code[index]);
			const rain = daily.precipitation_probability_max[index];
			const icon = span(day.icon, "day-icon");
			icon.title = day.text;
			const item = document.createElement("li");
			item.append(
				span(dayName.format(new Date(date)), "day-name"),
				icon,
				span(rain == null ? "" : `💧 ${rain}%`, "day-rain"),
				span(
					`${degrees(daily.temperature_2m_min[index])} … ${degrees(daily.temperature_2m_max[index])}`,
					"day-temp",
				),
			);
			return item;
		}),
	);
}

async function show(place: Place): Promise<void> {
	const request = ++latestForecast;
	statusLine.textContent = "Загружаю…";
	weather.hidden = true;
	try {
		const forecast = await getForecast(place);
		if (request !== latestForecast) return;
		render(place, forecast);
		document.title = `Погода: ${place.name}`;
		statusLine.textContent = "";
		weather.hidden = false;
	} catch {
		if (request !== latestForecast) return;
		statusLine.textContent = "Не удалось загрузить погоду. Попробуйте ещё раз.";
	}
}

function select(place: Place): void {
	const params = new URLSearchParams({
		city: place.name,
		lat: String(place.latitude),
		lon: String(place.longitude),
	});
	history.pushState(null, "", `?${params}`);
	results.hidden = true;
	input.value = "";
	void show(place);
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	const query = input.value.trim();
	if (query.length < 2) return;
	const request = ++latestSearch;
	results.hidden = true;
	statusLine.textContent = "Ищу…";
	try {
		const found = await searchCity(query);
		if (request !== latestSearch) return;
		statusLine.textContent = found.length ? "" : "Город не найден.";
		results.replaceChildren(
			...found.map((result) => {
				const button = document.createElement("button");
				button.type = "button";
				button.textContent = [result.name, result.admin1, result.country]
					.filter(Boolean)
					.join(", ");
				button.addEventListener("click", () => select(result));
				const item = document.createElement("li");
				item.append(button);
				return item;
			}),
		);
		results.hidden = found.length === 0;
	} catch {
		if (request !== latestSearch) return;
		statusLine.textContent = "Поиск не удался. Попробуйте ещё раз.";
	}
});

window.addEventListener("popstate", () => {
	results.hidden = true;
	void show(placeFromUrl());
});

void show(placeFromUrl());
