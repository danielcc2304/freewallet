# Ampliación editorial del radar

Clases en EUR seleccionadas para esta feature. Categorías solicitadas por el usuario, distintas en algunos casos de la clasificación del proveedor. No se afirma que la nota mida alfa. TER: peso cero.

| Fondo | ISIN | Categoría editorial | Fuente de identidad |
|---|---|---|---|
| Twelve Capital UCITS ICAV - Twelve Cat Bond Fund S EUR Acc | IE00BDRJLL87 | Alternativos | [Ficha](https://global.morningstar.com/en-eu/investments/funds/F0000101V6/documents) |
| B&H Deuda FI | ES0112618006 | Renta Fija Corto Plazo | [Ficha](https://www.buyandhold.es/ftpdata/files/FOLLETO%20BH%20DEUDA.PDF) |
| SIH FCP - BrightGate Global Income Fund A EUR | LU0942882589 | Renta Fija Corporativa | [Ficha](https://brightgatecapital.com/brightgate-gestion/brightgate-global-income/) |
| Gamma Global FI | ES0140794019 | Renta Fija Corporativa | [Ficha](https://www.cnmv.es/WebServices/VerDocumento/Ver?e=K7xoAUrKTM9jVoluBgYnQUTp4XFGi7tX%2FLGWZmcPZpBknv7VuEGvF9Pu7CatfXRG) |
| Robeco QI Emerging Markets Active Equities D EUR | LU0329355670 | Renta Variable Países Emergentes | [Ficha](https://www.robeco.com/en-int/products/funds/isin-lu0329355670/robeco-qi-emerging-markets-active-equities-d-eur) |
| Lazard Capital FI SRI PVC EUR | FR0010952788 | Renta Fija High Yield | [Ficha](https://www.prepar-vie.fr/wp-content/uploads/2025/02/FR0010952788.pdf) |
| Jupiter Merian Global Equity Absolute Return I EUR Hedged Acc | IE00BLP5S791 | Retorno Absoluto | [Ficha](https://markets.ft.markitdigital.com/data/funds/tearsheet/summary?s=IE00BLP5S791%3AEUR) |
| BlackRock Strategic Funds - Systematic World Equity Fund E2 EUR | LU1278928491 | Retorno Absoluto | [Ficha](https://www.blackrock.com/lu/intermediaries/literature/fact-sheet/bsf-systematic-world-equity-fund-class-e2-eur-factsheet-lu1278928491-lu-en-individual.pdf) |
| Pictet TR - Sirius HP EUR | LU1799936510 | Retorno Absoluto | [Ficha](https://am.pictet.com/api/gateways/publiccms-gateway/document/56e72722-b06d-4986-8fa1-40cbb4df2206) |
| Schroder ISF Securitised Credit C Acc EUR Hedged | LU1662755559 | Retorno Absoluto | [Ficha](https://api.schroders.com/document-store/id/D4915EDD-264D-452A-BFD2-F255A72541F0) |

Cartesio X (ES0116567035) se reclasifica sin duplicar; Vanguard Emerging (IE0031786142) se mueve a la nueva categoría.

El alta se prepara en `supabase/seed.sql`, idempotente y sin datos financieros de muestra. Aplicar en el entorno elegido durante el despliegue de esta feature; esta rama no modifica el catálogo remoto. Finect consultará cada ISIN en la siguiente actualización. Hasta obtener datos fechados, las nuevas fichas no reciben nota ni medalla.
