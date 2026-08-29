import {
    buildFinectProxyUrl,
    extractFinectInitialState,
    normalizeFinectFundModel,
    normalizeIsin,
} from '../src/services/finect/finectService';

function assert(condition: boolean, message: string): asserts condition {
    if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function run() {
    assert(normalizeIsin(' ie00byx5nx33 ') === 'IE00BYX5NX33', 'normaliza el ISIN');
    assert(normalizeIsin('US0378331005') === 'US0378331005', 'acepta un ISIN válido de acciones');
    assert(
        buildFinectProxyUrl('https://api.finect.com/v4/search?q=IE00BYX5NX33') === '/__finect/api/v4/search?q=IE00BYX5NX33',
        'usa el proxy same-origin de la API también fuera de desarrollo',
    );
    assert(
        buildFinectProxyUrl('https://www.finect.com/fondos-inversion/IE00BYX5NX33-fondo') === '/__finect/site/fondos-inversion/IE00BYX5NX33-fondo',
        'usa el proxy same-origin de la ficha HTML',
    );

    try {
        normalizeIsin('IE00BYX5NX32');
        throw new Error('Se esperaba rechazar el dígito de control incorrecto');
    } catch (error) {
        assert(error instanceof Error && error.name === 'FinectError', 'rechaza un ISIN inválido');
    }

    const model = {
        name: 'Fondo de prueba',
        alias: 'fondo_de_prueba',
        isin: 'IE00BYX5NX33',
        classes: [
            {
                name: 'Fondo cubierto',
                alias: 'fondo_cubierto',
                isin: 'IE00BYX5P602',
                fees: { ter: { value: 0.22 } },
            },
            {
                name: 'Fondo EUR P Acc',
                alias: 'fondo_de_prueba',
                isin: 'IE00BYX5NX33',
                classTotalNetAsset: 100,
                fees: { ter: { value: 0.12 }, mgr: { value: 0.1 } },
                currency: { code: 'EUR', name: 'Euro' },
                annualizedPerformance: { type: 'annualized', period: 'M36', value: 8.4 },
            },
        ],
        managementCompany: { name: 'Gestora de prueba' },
        category: { name: 'RV Global' },
        currency: { code: 'EUR', name: 'Euro' },
        srri: 5,
        attributes: { indexed: true },
        stats: {
            performance: { periods: [{ type: 'accumulated', period: 'M12', value: 12.5 }] },
            maxDrawdown: [{ period: 'M36', value: -15 }],
            standardDeviation: [{ period: 'M36', value: 12.3 }],
        },
    };
    const encodedState = encodeURIComponent(JSON.stringify({
        fund: { fund: { model } },
        filters: { country: "eq+'esp'" },
    }));
    const state = extractFinectInitialState(`<script>window.INITIAL_STATE="${encodedState}";</script>`);
    const parsedModel = (state as { fund: { fund: { model: unknown } } }).fund.fund.model;
    const result = normalizeFinectFundModel(parsedModel, 'IE00BYX5NX33', 'https://www.finect.com/fondos-inversion/fondo');

    assert(result.className === 'Fondo EUR P Acc', 'selecciona la clase cuyo ISIN coincide');
    assert(result.fees.totalExpenseRatio === 0.12, 'normaliza las comisiones de la clase');
    assert(result.performance.some((point) => point.period === 'M12'), 'normaliza la rentabilidad acumulada');
    assert(result.performance.some((point) => point.period === 'M36'), 'incorpora la rentabilidad anualizada de la clase');
    assert(result.statistics.standardDeviation.some((point) => point.period === 'M36'), 'normaliza la volatilidad a 3 años');

    console.log('Finect service checks passed.');
}

run();
