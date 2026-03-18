import axios from 'axios';

export interface ProxyConfig {
    url: string;
    type: 'raw' | 'json';
}

export const CORS_PROXIES: ProxyConfig[] = [
    { url: 'https://api.allorigins.win/raw?url=', type: 'raw' },
    { url: 'https://thingproxy.freeboard.io/fetch/', type: 'raw' },
    { url: 'https://api.allorigins.win/get?url=', type: 'json' },
    { url: 'https://corsproxy.org/?url=', type: 'raw' },
    { url: 'https://corsproxy.is/?url=', type: 'raw' },
    { url: 'https://api.codetabs.com/v1/proxy?quest=', type: 'raw' },
];

let currentProxyIndex = 0;
const PROXY_COOLDOWN = new Map<string, number>();
const COOLDOWN_MS = 30000;

export function getNextProxy(): ProxyConfig {
    const now = Date.now();
    for (let i = 0; i < CORS_PROXIES.length; i++) {
        const index = (currentProxyIndex + i) % CORS_PROXIES.length;
        const proxy = CORS_PROXIES[index];
        const cooldownUntil = PROXY_COOLDOWN.get(proxy.url) || 0;

        if (now > cooldownUntil) {
            currentProxyIndex = (index + 1) % CORS_PROXIES.length;
            return proxy;
        }
    }

    const proxy = CORS_PROXIES[currentProxyIndex];
    currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
    return proxy;
}

export function markProxyFailure(proxyUrl: string, err?: any) {
    if (axios.isCancel(err) || err?.name === 'AbortError') return;

    const status = err?.response?.status;
    const isNetworkError = !status && err?.code;
    const isRateLimit = status === 429;
    const isServerError = status >= 500;

    if (isNetworkError || isRateLimit || isServerError) {
        console.warn(`[Proxy] Penalty for ${proxyUrl}:`, err?.message || status);
        PROXY_COOLDOWN.set(proxyUrl, Date.now() + COOLDOWN_MS);
    }
}

export function buildProxyUrl(proxyConfig: ProxyConfig, url: string, forceRefresh = false): string {
    const { url: proxyBase } = proxyConfig;

    let targetUrl = url;
    if (forceRefresh) {
        const cacheBuster = `&_cb=${Date.now()}`;
        targetUrl = url + (url.includes('?') ? cacheBuster : `?${cacheBuster.substring(1)}`);
    }

    const encodedUrl = encodeURIComponent(targetUrl);

    if (proxyBase.includes('allorigins') || proxyBase.includes('codetabs')) {
        return `${proxyBase}${encodedUrl}`;
    }
    if (proxyBase.includes('?') && !proxyBase.endsWith('=')) {
        return `${proxyBase}${targetUrl}`;
    }
    if (proxyBase.endsWith('url=')) {
        return `${proxyBase}${encodedUrl}`;
    }
    return `${proxyBase}${targetUrl}`;
}

export async function fetchFromProxy(proxyConfig: ProxyConfig, url: string, signal?: AbortSignal, forceRefresh = false) {
    const proxyUrl = buildProxyUrl(proxyConfig, url, forceRefresh);
    const response = await axios.get(proxyUrl, { timeout: 10000, signal });

    if (proxyConfig.type === 'json') {
        const data = response.data;
        if (data && data.contents !== undefined) {
            if (typeof data.contents === 'string') {
                try {
                    if (data.contents.trim().startsWith('{') || data.contents.trim().startsWith('[')) {
                        return JSON.parse(data.contents);
                    }
                    return data.contents;
                } catch {
                    return data.contents;
                }
            }
            return data.contents;
        }
    }

    return response.data;
}
