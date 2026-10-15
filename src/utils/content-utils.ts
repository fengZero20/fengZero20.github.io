import { type CollectionEntry, getCollection, getEntry } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl, getPostUrlBySlug, url } from "@utils/url-utils.ts";

export type SearchDocument = {
	url: string;
	title: string;
	text: string;
};

export async function getSearchDocuments(): Promise<SearchDocument[]> {
	const posts = await getRawSortedPosts();
	const documents: SearchDocument[] = posts.map((post) => ({
		url: getPostUrlBySlug(post.slug),
		title: post.data.title,
		text: [
			post.data.title,
			post.data.description,
			post.data.category ?? "",
			...(post.data.tags ?? []),
			post.body ?? "",
		].join("\n"),
	}));

	const about = await getEntry("spec", "about");
	if (about?.body) {
		documents.push({
			url: url("/about/"),
			title: i18n(I18nKey.about),
			text: about.body,
		});
	}

	documents.push({
		url: url("/guestbook/"),
		title: "留言",
		text: "想留一句，寄到 1173240618@qq.com",
	});

	const now = await getEntry("spec", "now");
	if (now?.body) {
		documents.push({
			url: url("/now/"),
			title: "此刻",
			text: now.body,
		});
	}

	return documents;
}

function isFuturePost(published: Date): boolean {
	return new Date(published).getTime() > Date.now();
}

async function loadPosts(includeFuture: boolean) {
	const posts = await getCollection("posts", ({ data }) => {
		if (import.meta.env.PROD && data.draft === true) {
			return false;
		}
		if (!includeFuture && isFuturePost(data.published)) {
			return false;
		}
		return true;
	});

	const sorted = posts.sort((a, b) => {
		const diff =
			new Date(b.data.published).getTime() -
			new Date(a.data.published).getTime();
		if (diff !== 0) return diff;
		return a.slug.localeCompare(b.slug, "zh");
	});

	const chain = sorted.filter((post) => !isFuturePost(post.data.published));
	for (let i = 1; i < chain.length; i++) {
		chain[i].data.nextSlug = chain[i - 1].slug;
		chain[i].data.nextTitle = chain[i - 1].data.title;
	}
	for (let i = 0; i < chain.length - 1; i++) {
		chain[i].data.prevSlug = chain[i + 1].slug;
		chain[i].data.prevTitle = chain[i + 1].data.title;
	}

	return sorted;
}

// Listed posts only. A future published date stays sealed until that day.
async function getRawSortedPosts() {
	return loadPosts(false);
}

// Dev can open a sealed letter by URL. Production builds omit it until the date has passed.
export async function getPostsForRender() {
	return loadPosts(!import.meta.env.PROD);
}

export async function getSortedPosts() {
	return getRawSortedPosts();
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getRawSortedPosts();

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(): Promise<Category[]> {
	const allBlogPosts = await getRawSortedPosts();
	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		});
	}
	return ret;
}
