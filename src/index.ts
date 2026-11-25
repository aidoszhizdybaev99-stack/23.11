// Страница и её файлы отдаются как статические ассеты, сюда попадают только остальные запросы.
export default {
	fetch() {
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler;
