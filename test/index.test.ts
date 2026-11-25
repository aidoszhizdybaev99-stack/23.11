import { SELF } from "cloudflare:test";
import { afterEach, expect, it, vi } from "vite-plus/test";

const URL_OK = "https://example.com/api/info?lat=43.24&lon=76.89";

// Подменяем fetch, чтобы тесты не ходили в интернет.
function mockSources(failing?: string) {
	return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
		const url = input instanceof Request ? input.url : String(input);
		if (failing && url.includes(failing)) return new Response("error", { status: 500 });
		if (url.includes("open-meteo")) return Response.json({ current: { temperature_2m: 5 } });
		return Response.json({ rate: url.includes("/USD/") ? 500 : 10 });
	});
}

afterEach(() => {
	vi.restoreAllMocks();
});

it("returns weather and rates together", async () => {
	mockSources();
	const response = await SELF.fetch(URL_OK);
	expect(response.status).toBe(200);
	expect(await response.json()).toMatchObject({
		weather: { current: { temperature_2m: 5 } },
		rates: { usdKzt: { rate: 500 }, tryKzt: { rate: 10 }, cross: 50 },
	});
});

it.each(["open-meteo", "frankfurter"])("returns 502 when %s fails", async (source) => {
	mockSources(source);
	vi.spyOn(console, "error").mockImplementation(() => {});
	const response = await SELF.fetch(URL_OK);
	expect(response.status).toBe(502);
	expect(await response.json()).toHaveProperty("error");
});

it("returns 400 for missing coordinates", async () => {
	const response = await SELF.fetch("https://example.com/api/info");
	expect(response.status).toBe(400);
});

it("returns 404 for unknown paths", async () => {
	const response = await SELF.fetch("https://example.com/api/unknown");
	expect(response.status).toBe(404);
});
