// Общие типы для Worker и страницы.

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

export interface Currency {
	date: string;
	base: string;
	quote: string;
	rate: number;
}

export interface Rates {
	usdKzt: Currency;
	tryKzt: Currency;
	cross: number; // сколько лир в 1 долларе
}

export interface Info {
	weather: Forecast;
	rates: Rates;
}
