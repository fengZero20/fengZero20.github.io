import type { APIRoute } from "astro";

const aiCrawlers = [
	"GPTBot",
	"ChatGPT-User",
	"OAI-SearchBot",
	"Google-Extended",
	"ClaudeBot",
	"Claude-Web",
	"anthropic-ai",
	"Applebot-Extended",
	"Amazonbot",
	"CCBot",
	"Bytespider",
	"meta-externalagent",
	"FacebookBot",
	"PerplexityBot",
	"Diffbot",
	"cohere-ai",
	"ImagesiftBot",
	"YouBot",
	"PetalBot",
];

const robotsTxt = `
# 普通搜索引擎可以抓取页面。
# 下面这些爬虫会把页面拿去训练或回答，整站不允许。

User-agent: *
Allow: /
Disallow: /_astro/

${aiCrawlers
	.map(
		(name) => `User-agent: ${name}
Disallow: /`,
	)
	.join("\n\n")}

Sitemap: ${new URL("sitemap-index.xml", import.meta.env.SITE).href}
`.trim();

export const GET: APIRoute = () => {
	return new Response(robotsTxt, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};
