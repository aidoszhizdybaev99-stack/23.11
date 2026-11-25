import { defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "aid-worker",
		compatibilityDate: "2026-11-23",
		entrypoint,
		assets: {
			notFoundHandling: "single-page-application",
		},
	},
});
