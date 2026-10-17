export const DEFAULT_SITE_URL = 'https://freewallet-gilt.vercel.app';
export function seoConfig(env = process.env) {
    const url = new URL(env.FREEWALLET_SITE_URL || DEFAULT_SITE_URL);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname))
        throw new Error('FREEWALLET_SITE_URL debe ser el origen HTTPS público de producción, sin ruta ni credenciales.');
    if (env.FREEWALLET_DEPLOYMENT_ENV && !['production', 'preproduction'].includes(env.FREEWALLET_DEPLOYMENT_ENV))
        throw new Error('FREEWALLET_DEPLOYMENT_ENV debe ser production o preproduction.');
    // PRE is a separate Vercel project whose production branch is release.
    const preview = env.FREEWALLET_DEPLOYMENT_ENV === 'preproduction'
        || ['preview', 'development'].includes(env.VERCEL_ENV)
        || ['release', 'dev'].includes(env.VERCEL_GIT_COMMIT_REF);
    return { domain: url.origin, preview };
}
export function seoFiles(routes, config) {
    const published = config.preview ? [] : [...new Set(routes)];
    if (published.some(route => !/^\/(?:[a-z0-9-]+\/?)*$/.test(route))) throw new Error('Ruta SEO no válida');
    return {
        sitemap: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${published.map(route => `  <url><loc>${config.domain}${route}</loc><changefreq>weekly</changefreq></url>`).join('\n')}\n</urlset>`,
        robots: config.preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${config.domain}/sitemap.xml\n`,
    };
}
