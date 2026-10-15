function asDate(value: Date | string): Date {
	return value instanceof Date ? value : new Date(value);
}

// Frontmatter times have no timezone and are stored as UTC.
// Use the UTC calendar date so the page matches the date written in the file.
function calendarDate(value: Date | string): string {
	return asDate(value).toISOString().slice(0, 10);
}

export function formatDateToYYYYMMDD(date: Date | string): string {
	return calendarDate(date);
}

export function formatYear(date: Date | string): number {
	return Number(calendarDate(date).slice(0, 4));
}

export function formatMonthDay(date: Date | string): string {
	return calendarDate(date).slice(5);
}
