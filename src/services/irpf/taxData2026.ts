/** Verified 2026 rules. Update the year and sources together; never silently roll forward. */
export const TAX_YEAR = 2026;
export const TAX_REVIEW_DATE = '2026-10-08';
export const TAX_SOURCES = {
    withholding: 'https://sede.agenciatributaria.gob.es/static_files/Sede/Programas_ayuda/Retenciones/2026/Algoritmo%20Retenciones-2026_10sept.pdf',
    regions: 'https://www.hacienda.gob.es/sgfal/financiacionterritorial/autonomica/capitulo-iv-tributacion-autonomica-2026.pdf',
    socialSecurity: 'https://www.boe.es/eli/es/o/2026/03/30/pjc297',
    incomeTax: 'https://www.boe.es/eli/es/l/2006/11/28/35/con/20261002',
    aeatCalculator: 'https://sede.agenciatributaria.gob.es/Sede/Retenciones.shtml',
    navarra: 'https://hacienda.navarra.es/CalculoRetencion/Inicio.aspx',
    bizkaia: 'https://www.bizkaia.eus/es/normativa-tributaria/retenciones-de-trabajo',
    araba: 'https://web.araba.eus/es/hacienda/retenciones',
    gipuzkoa: 'https://www.gipuzkoa.eus/es/web/ogasuna',
};

/** Starting base, published accumulated quota, marginal percentage. */
export type TaxScale = ReadonlyArray<readonly [number, number, number]>;
export const STATE_SCALE: TaxScale = [[0, 0, 9.5], [12450, 1182.75, 12], [20200, 2112.75, 15], [35200, 4362.75, 18.5], [60000, 8950.75, 22.5], [300000, 62950.75, 24.5]];
export const WITHHOLDING_SCALE: TaxScale = [[0, 0, 19], [12450, 2365.5, 24], [20200, 4225.5, 30], [35200, 8725.5, 37], [60000, 17901.5, 45], [300000, 125901.5, 47]];

export interface Minimums {
    personal: number; over65: number; over75: number;
    personalOver65?: number;
    children: readonly number[]; under3: number;
    disability: number; severeDisability: number; assistance: number;
    childDisability?: number; childSevereDisability?: number;
}
export const STATE_MINIMUMS: Minimums = { personal: 5550, over65: 1150, over75: 1400, children: [2400, 2700, 4000, 4500], under3: 2800, disability: 3000, severeDisability: 9000, assistance: 3000 };
const increased: Minimums = { personal: 6105, over65: 1265, over75: 1540, children: [2640, 2970, 4400, 4950], under3: 3080, disability: 3300, severeDisability: 9900, assistance: 3300 };

export interface TaxRegion { id: string; name: string; scale?: TaxScale; minimums?: Minimums; foral?: boolean; source?: string }
export const TAX_REGIONS: TaxRegion[] = [
    { id: 'andalucia', name: 'Andalucía', scale: [[0, 0, 9.5], [13000, 1235, 12], [21100, 2207, 15], [35200, 4322, 18.5], [60000, 8910, 22.5]], minimums: { personal: 5790, over65: 1200, over75: 1460, children: [2510, 2820, 4170, 4700], under3: 2920, disability: 3130, severeDisability: 9390, assistance: 3130 } },
    { id: 'aragon', name: 'Aragón', scale: [[0, 0, 9.5], [13072.5, 1241.89, 12], [21210, 2218.39, 15], [36960, 4580.89, 18.5], [52500, 7455.79, 20.5], [60000, 8993.29, 23], [80000, 13593.29, 24], [90000, 15993.29, 25], [130000, 25993.29, 25.5]] },
    { id: 'asturias', name: 'Asturias', scale: [[0, 0, 9], [12450, 1120.5, 12], [17707.2, 1751.36, 14], [33007.2, 3893.36, 19.2], [53407.2, 7810.16, 21.5], [70000, 11377.62, 22.5], [90000, 15877.62, 25], [175000, 37127.62, 26]], minimums: increased },
    { id: 'baleares', name: 'Illes Balears', scale: [[0, 0, 9], [10000, 900, 11.25], [18000, 1800, 14.25], [30000, 3510, 17.5], [48000, 6660, 19], [70000, 10840, 21.75], [90000, 15190, 22.75], [120000, 22015, 23.75], [175000, 35077.5, 24.75]], minimums: { ...increased, personal: 5550, personalOver65: 6105, children: [2400, 2970, 4400, 4950], under3: 2800 } },
    { id: 'canarias', name: 'Canarias', scale: [[0, 0, 9], [13748, 1237.3, 11.5], [19422, 1889.83, 14], [35924, 4200.11, 18.5], [57566, 8203.88, 23.5], [93268, 16593.85, 25], [123745, 24213.1, 26]], minimums: { personal: 5606, over65: 1162, over75: 1414, children: [2424, 2727, 4040, 4545], under3: 2828, disability: 3030, severeDisability: 9090, assistance: 3030 } },
    { id: 'cantabria', name: 'Cantabria', scale: [[0, 0, 8.5], [13000, 1105, 11], [21000, 1985, 14.5], [35200, 4044, 18], [60000, 8508, 22.5], [90000, 15258, 24.5]] },
    { id: 'castilla-mancha', name: 'Castilla-La Mancha', scale: [[0, 0, 9.5], [12450, 1182.75, 12], [20200, 2112.75, 15], [35200, 4362.75, 18.5], [60000, 8950.75, 22.5]] },
    { id: 'castilla-leon', name: 'Castilla y León', scale: [[0, 0, 9], [12450, 1120.5, 12], [20200, 2050.5, 14], [35200, 4150.5, 18.5], [53407.2, 7518.83, 21.5]] },
    { id: 'cataluna', name: 'Cataluña', scale: [[0, 0, 9.5], [12500, 1187.5, 12.5], [22000, 2375, 16], [33000, 4135, 19], [53000, 7935, 21.5], [90000, 15890, 23.5], [120000, 22940, 24.5], [175000, 36415, 25.5]] },
    { id: 'extremadura', name: 'Extremadura', scale: [[0, 0, 7.75], [12450, 964.88, 9.75], [20200, 1720.5, 16], [24200, 2360.5, 17.5], [35200, 4285.5, 21], [60000, 9493.5, 23.5], [80200, 14240.5, 24], [99200, 18800.5, 24.5], [120200, 23945.5, 25]] },
    { id: 'galicia', name: 'Galicia', scale: [[0, 0, 9], [12985.35, 1168.68, 11.65], [21068.6, 2110.38, 14.9], [35200, 4215.96, 18.4], [60000, 8779.16, 22.5]], minimums: { personal: 5789, over65: 1199, over75: 1460, children: [2503, 2816, 4172, 4694], under3: 2920, disability: 3129, severeDisability: 9387, assistance: 3129 } },
    { id: 'madrid', name: 'Comunidad de Madrid', scale: [[0, 0, 8.5], [13362.22, 1135.79, 10.7], [19004.63, 1739.53, 12.8], [35425.68, 3841.42, 17.4], [57320.4, 7651.1, 20.5]], minimums: { personal: 5956.65, over65: 1234.26, over75: 1502.58, children: [2575.85, 2897.83, 4400, 4950], under3: 3005.16, disability: 3219.81, severeDisability: 9659.44, assistance: 3219.81 } },
    { id: 'murcia', name: 'Región de Murcia', scale: [[0, 0, 9.5], [12450, 1182.75, 11.2], [20200, 2050.75, 13.3], [34000, 3886.15, 17.9], [60000, 8540.15, 22.5]] },
    { id: 'rioja', name: 'La Rioja', scale: [[0, 0, 8], [12450, 996, 10.6], [20200, 1817.5, 13.6], [35200, 3857.5, 17.8], [40000, 4711.9, 18.3], [50000, 6541.9, 19], [60000, 8441.9, 24.5], [120000, 23141.9, 27]], minimums: { ...STATE_MINIMUMS, childDisability: 3300, childSevereDisability: 9900 } },
    { id: 'valencia', name: 'Comunitat Valenciana', scale: [[0, 0, 8.8], [12000, 1056, 11.7], [22000, 2226, 14.6], [32000, 3686, 17], [42000, 5386, 19.4], [52000, 7326, 21.9], [62000, 9516, 24.4], [72000, 11956, 26.1], [100000, 19264, 27.35], [150000, 32939, 28.35], [200000, 47114, 29.35]], minimums: increased },
    { id: 'ceuta', name: 'Ceuta', scale: STATE_SCALE },
    { id: 'melilla', name: 'Melilla', scale: STATE_SCALE },
    { id: 'navarra', name: 'Navarra', foral: true, source: TAX_SOURCES.navarra },
    { id: 'araba', name: 'País Vasco · Álava', foral: true, source: TAX_SOURCES.araba },
    { id: 'bizkaia', name: 'País Vasco · Bizkaia', foral: true, source: TAX_SOURCES.bizkaia },
    { id: 'gipuzkoa', name: 'País Vasco · Gipuzkoa', foral: true, source: TAX_SOURCES.gipuzkoa },
];

export const SS_2026 = { maximumMonthlyBase: 5101.2, minimumMonthlyBases: [1989.3, 1649.7, 1435.2, 1424.4, 1424.4, 1424.4, 1424.4], common: 4.7, permanentUnemployment: 1.55, temporaryUnemployment: 1.6, training: 0.1, mei: 0.15 } as const;
