declare module 'prerender-spa-plugin-next' {
    interface PrerenderOptions {
        staticDir: string;
        routes: string[];
        rendererOptions?: {
            maxConcurrentRoutes?: number;
            renderAfterDocumentEvent?: string;
            headless?: boolean;
        };
    }
    export default function prerender(options: PrerenderOptions): any;
}
