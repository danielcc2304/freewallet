import assert from 'node:assert/strict';
import {fundChartSymbols, fundClassNameKey} from '../src/services/funds/fundChartResolution';

const isin='LU0034353002';
assert.deepEqual(fundChartSymbols({quotes:[{symbol:'DI4A.F',quoteType:'ETF',longname:'DWS Floating Rate Notes'}]},isin),[]);
const quotes=[
    {symbol:'0P00000N4I.F',quoteType:'MUTUALFUND',longname:'DWS Floating Rate Notes LC'},
    {symbol:'WRONG-LD',quoteType:'MUTUALFUND',longname:'DWS Floating Rate Notes LD'},
    {symbol:'WRONG-IC',quoteType:'MUTUALFUND',longname:'DWS Floating Rate Notes IC'},
    {symbol:'WRONG-EUR',quoteType:'MUTUALFUND',longname:'DWS Floating Rate Notes LC EUR'},
    {symbol:'WRONG-ISIN',quoteType:'MUTUALFUND',longname:'DWS Floating Rate Notes LC',isin:'LU1534073041'},
    {symbol:'0P00000N4I.F',quoteType:'MUTUALFUND',longname:'DWS Floating Rate Notes LC'},
];
assert.deepEqual(fundChartSymbols({quotes},isin,'DWS Floating Rate Notes LC'),['0P00000N4I.F']);
assert.deepEqual(fundChartSymbols({quotes:[{symbol:'0P0001CLDK.F',quoteType:'MUTUALFUND',longname:'Fidelity MSCI World Index EUR P Acc'}]},'IE00BYX5NX33'),['0P0001CLDK.F']);
assert.notEqual(fundClassNameKey('Fidelity MSCI World EUR P Acc'),fundClassNameKey('Fidelity MSCI World EUR P Dist'));
assert.equal(fundClassNameKey('Ábaco € Acc'),fundClassNameKey('Abaco EUR Acc'));
assert.deepEqual(fundChartSymbols(null,isin),[]);
assert.deepEqual(fundChartSymbols({quotes:[null,{},'invalid']},isin),[]);
console.log('Fund chart resolution passed: ISIN lookup, DWS NAV class, full class tokens, foreign ISIN rejection, duplicates and malformed searches.');
