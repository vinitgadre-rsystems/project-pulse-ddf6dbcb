import { createFileRoute } from "@tanstack/react-router";

const BASE = "https://rethinkhealthdashboard.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date().toISOString();
        const urls = ["/", "/auth", "/dashboard"]
          .map(
            (path) => `  <url>
    <loc>${BASE}${path}</loc>
    <lastmod>${now}</lastmod>
  </url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
