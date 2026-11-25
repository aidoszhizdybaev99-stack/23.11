import { SELF } from "cloudflare:test";
import { expect, it } from "vite-plus/test";

it("returns 404 for requests that are not assets", async () => {
	const response = await SELF.fetch("https://example.com/api/unknown");
	expect(response.status).toBe(404);
});
