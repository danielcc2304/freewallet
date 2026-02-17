import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

type Fund = {
    id: string;
    name: string;
    isin: string;
    link: string;
};

type Result = {
    id: string;
    ok: boolean;
    status: number;
    isinExpected: string;
    isinFound?: string;
    nameExpected: string;
    titleFound?: string;
    problems: string[];
};

function norm(s: string) {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quita acentos
        .replace(/\s+/g, " ")
        .trim();
}

function similarityLoose(a: string, b: string) {
    const A = new Set(norm(a).split(" ").filter(w => w.length >= 3));
    const B = new Set(norm(b).split(" ").filter(w => w.length >= 3));
    if (A.size === 0) return 0;
    let hits = 0;
    for (const w of A) if (B.has(w)) hits++;
    return hits / A.size;
}

async function fetchHtml(url: string) {
    const res = await fetch(url, {
        redirect: "follow",
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        },
    });
    const html = await res.text();
    return { status: res.status, html };
}

function extractIsinFromText(text: string) {
    const m = text.match(/\b[A-Z]{2}[A-Z0-9]{10}\b/);
    return m?.[0];
}

async function verifyOne(fund: Fund): Promise<Result> {
    const problems: string[] = [];
    let status = 0;

    try {
        const { status: st, html } = await fetchHtml(fund.link);
        status = st;

        if (status >= 400) {
            problems.push(`HTTP ${status}`);
        } else {
            const $ = cheerio.load(html);
            const title = $("title").first().text().trim();
            const h1 = $("h1").first().text().trim();
            const pageText = $.text();

            const isinExpected = fund.isin.toUpperCase();
            const isinAppears = pageText.toUpperCase().includes(isinExpected);
            const isinFound = extractIsinFromText(pageText);

            const titleFound = h1 || title;
            const sim = similarityLoose(fund.name, titleFound);

            if (!isinAppears) {
                problems.push(`ISIN no aparece en la página (${isinExpected})`);
            }
            if (isinFound && isinFound !== isinExpected) {
                problems.push(`ISIN encontrado distinto: ${isinFound} (esperado ${isinExpected})`);
            }
            if (sim < 0.40) {
                problems.push(`Nombre parece no coincidir (sim=${sim.toFixed(2)}). Encontrado: "${titleFound}"`);
            }
        }

        return {
            id: fund.id,
            ok: problems.length === 0,
            status,
            isinExpected: fund.isin,
            isinFound: undefined, // simplify for now
            nameExpected: fund.name,
            titleFound: undefined, // simplify for now
            problems
        };
    } catch (e: any) {
        return {
            id: fund.id,
            ok: false,
            status: 0,
            isinExpected: fund.isin,
            nameExpected: fund.name,
            problems: [`Error: ${e?.message ?? String(e)}`]
        };
    }
}

async function main() {
    const fundsPath = path.resolve(process.cwd(), "src/data/academyData.ts");
    const file = fs.readFileSync(fundsPath, "utf8");

    // Regex ajustado para academyData.ts
    const match = file.match(/export const BEST_FUNDS: Fund\[\]\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) {
        console.error("No pude localizar BEST_FUNDS en:", fundsPath);
        process.exit(1);
    }

    // Limpiar posibles comentarios o referencias de chatgpt en el array extraído si existen
    let arrayStr = match[1].replace(/\/\/ :contentReference.*/g, "");

    const BEST_FUNDS: Fund[] = Function(`"use strict"; return (${arrayStr});`)();

    console.log(`Verificando ${BEST_FUNDS.length} fondos...\n`);

    const results: Result[] = [];
    for (const f of BEST_FUNDS) {
        const r = await verifyOne(f);
        results.push(r);
        const tag = r.ok ? "✅ OK" : "❌ FAIL";
        console.log(`${tag} | ${f.isin} | ${f.id.padEnd(20)} | ${r.problems.join(" ; ")}`);
    }

    const out = path.resolve(process.cwd(), "finect-verify-report.json");
    fs.writeFileSync(out, JSON.stringify(results, null, 2), "utf8");
    console.log(`\nReporte guardado en: ${out}`);
}

main();
