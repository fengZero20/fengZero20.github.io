<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { onMount } from "svelte";
import type { SearchResult } from "@/global";

export let documents: { url: string; title: string; text: string }[] = [];

let keywordDesktop = "";
let keywordMobile = "";
let result: SearchResult[] = [];
let initialized = false;
let searched = false;

const closePanel = () => {
	document.getElementById("search-panel")?.classList.add("float-panel-closed");
};

const togglePanel = () => {
	document.getElementById("search-panel")?.classList.toggle("float-panel-closed");
};

const clearSearch = () => {
	keywordDesktop = "";
	keywordMobile = "";
	result = [];
	searched = false;
	closePanel();
};

const setPanelVisibility = (show: boolean, isDesktop: boolean): void => {
	const panel = document.getElementById("search-panel");
	if (!panel || !isDesktop) return;

	if (show) {
		panel.classList.remove("float-panel-closed");
	} else {
		panel.classList.add("float-panel-closed");
	}
};

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function plainText(value: string): string {
	return value
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/!\[[^\]]*]\([^)]*\)/g, " ")
		.replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
		.replace(/^#{1,6}\s+/gm, "")
		.replace(/[*_`>#]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function buildExcerpt(text: string, keyword: string): string {
	const plain = plainText(text);
	const lower = plain.toLowerCase();
	const key = keyword.trim().toLowerCase();
	const index = lower.indexOf(key);
	if (index < 0) {
		return escapeHtml(plain.slice(0, 80));
	}

	const start = Math.max(0, index - 24);
	const end = Math.min(plain.length, index + key.length + 40);
	const slice = plain.slice(start, end);
	const marked = escapeHtml(slice).replace(
		new RegExp(escapeRegExp(escapeHtml(plain.slice(index, index + key.length))), "i"),
		"<mark>$&</mark>",
	);
	return `${start > 0 ? "…" : ""}${marked}${end < plain.length ? "…" : ""}`;
}

function searchDocuments(keyword: string): SearchResult[] {
	const terms = keyword
		.trim()
		.toLowerCase()
		.split(/\s+/)
		.filter(Boolean);
	if (terms.length === 0) return [];

	return documents
		.filter((doc) => {
			const haystack = `${doc.title}\n${doc.text}`.toLowerCase();
			return terms.every((term) => haystack.includes(term));
		})
		.slice(0, 8)
		.map((doc) => ({
			url: doc.url,
			meta: { title: doc.title },
			excerpt: buildExcerpt(`${doc.title} ${doc.text}`, terms[0]),
		}));
}

const search = async (keyword: string, isDesktop: boolean): Promise<void> => {
	if (!keyword.trim()) {
		setPanelVisibility(false, isDesktop);
		result = [];
		searched = false;
		return;
	}

	if (!initialized) {
		return;
	}

	try {
		result = searchDocuments(keyword);
		searched = true;
		setPanelVisibility(true, isDesktop);
	} catch (error) {
		console.error("Search error:", error);
		result = [];
		searched = true;
		setPanelVisibility(false, isDesktop);
	}
};

onMount(() => {
	initialized = true;
	if (keywordDesktop) search(keywordDesktop, true);
	if (keywordMobile) search(keywordMobile, false);
});

$: if (initialized && keywordDesktop) {
	(async () => {
		await search(keywordDesktop, true);
	})();
}

$: if (initialized && keywordMobile) {
	(async () => {
		await search(keywordMobile, false);
	})();
}
</script>

<!-- search bar for desktop view -->
<div id="search-bar" class="hidden lg:flex transition-all items-center h-11 mr-2 rounded-lg
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
">
    <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
    <input placeholder="{i18n(I18nKey.search)}" bind:value={keywordDesktop} on:focus={() => search(keywordDesktop, true)}
           class="transition-all pl-10 text-sm bg-transparent outline-0
         h-full w-40 active:w-60 focus:w-60 text-black/50 dark:text-white/50"
    >
    {#if keywordDesktop}
        <button type="button" aria-label="清空搜索" on:click={clearSearch}
                class="btn-plain rounded-lg w-8 h-8 mr-1.5 shrink-0">
            <Icon icon="material-symbols:close-rounded" class="text-[1.15rem]"></Icon>
        </button>
    {/if}
</div>

<!-- toggle btn for phone/tablet view -->
<button on:click={togglePanel} aria-label="Search Panel" id="search-switch"
        class="btn-plain scale-animation lg:!hidden rounded-lg w-11 h-11 active:scale-90">
    <Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
</button>

<!-- search panel -->
<div id="search-panel" class="float-panel float-panel-closed search-panel absolute md:w-[30rem]
top-20 left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-2">

    <!-- search bar inside panel for phone/tablet -->
    <div id="search-bar-inside" class="flex relative lg:hidden transition-all items-center h-11 rounded-xl
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
  ">
        <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
        <input placeholder={i18n(I18nKey.search)} bind:value={keywordMobile}
               class="pl-10 pr-10 absolute inset-0 text-sm bg-transparent outline-0
               focus:w-60 text-black/50 dark:text-white/50"
        >
        {#if keywordMobile}
            <button type="button" aria-label="清空搜索" on:click={clearSearch}
                    class="btn-plain absolute right-1 z-10 rounded-lg w-8 h-8">
                <Icon icon="material-symbols:close-rounded" class="text-[1.15rem]"></Icon>
            </button>
        {/if}
    </div>

    <!-- search results -->
    {#if searched && result.length === 0}
        <div class="px-3 py-2 text-sm text-50">没有找到相关内容</div>
    {/if}
    {#each result as item}
        <a href={item.url} on:click={clearSearch}
           class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block
       rounded-xl text-lg px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]">
            <div class="transition text-90 inline-flex font-bold group-hover:text-[var(--primary)]">
                {item.meta.title}<Icon icon="fa6-solid:chevron-right" class="transition text-[0.75rem] translate-x-1 my-auto text-[var(--primary)]"></Icon>
            </div>
            <div class="transition text-sm text-50">
                {@html item.excerpt}
            </div>
        </a>
    {/each}
</div>

<style>
  input:focus {
    outline: 0;
  }
  .search-panel {
    max-height: calc(100vh - 100px);
    overflow-y: auto;
  }
</style>
