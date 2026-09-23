// Read existing cookie data once when upgrading to browser local storage.
export const projectStorage = {
	getItem(key: string): string | null {
		if (import.meta.server) return null;
		const stored = localStorage.getItem(key);
		if (stored !== null) return stored;
		const prefix = `${encodeURIComponent(key)}=`;
		const cookie = document.cookie.split('; ').find((item) => item.startsWith(prefix));
		if (!cookie) return null;
		const value = decodeURIComponent(cookie.slice(prefix.length));
		JSON.parse(value);
		localStorage.setItem(key, value);
		document.cookie = `${prefix}; Max-Age=0; Path=/`;
		return value;
	},
	setItem(key: string, value: string) {
		if (import.meta.client) localStorage.setItem(key, value);
	},
};
