import assert from 'node:assert/strict';
import { fundBlockAllocation, portfolioBlocks } from '../src/services/portfolioBlocks';
import type { Asset } from '../src/types/types';
const fund = fundBlockAllocation({category:'Mixed',categoryDescription:'',breakdowns:[{type:'asset-allocation',items:[{label:'Equity',value:60},{label:'Bonds',value:30},{label:'Cash',value:5}]}] } as Parameters<typeof fundBlockAllocation>[0]);
assert.deepEqual(fund, {'Renta variable':60,'Renta fija':30,Cripto:0,Liquidez:5,Otros:5});
const base = {id:'test',symbol:'TEST',name:'Synthetic',quantity:1,purchasePrice:100,currentPrice:100,currency:'EUR',purchaseDate:'2026-01-01'};
const assets: Asset[] = [{...base,type:'stock'}, {...base,id:'crypto',type:'crypto'}, {...base,id:'fund',type:'fund',isin:'IE00BYX5NX33'}, {...base,id:'unknown',type:'fund',symbol:'UNKNOWN'}, {...base,id:'cash',type:'cash'}];
const blocks = portfolioBlocks(assets, {'IE00BYX5NX33':fund});
assert.equal(blocks.total,500);
assert.equal(blocks.unclassifiedValue,100);
assert.equal(blocks.rows.reduce((sum,row)=>sum+row.weight,0),100);
assert.equal(blocks.rows.find(row=>row.name==='Renta variable')?.value,160);
assert.equal(blocks.rows.find(row=>row.name==='Renta fija')?.value,30);
assert.equal(blocks.rows.find(row=>row.name==='Cripto')?.value,100);
assert.equal(blocks.rows.find(row=>row.name==='Otros')?.value,105);
assert.equal(portfolioBlocks([],{}).total,0);
console.log('PASS: mixed funds split by actual composition, crypto and cash separated, unknown funds retained, totals and weights reconciled.');

assert.equal(fundBlockAllocation({category:'Equity and bonds',categoryDescription:'',breakdowns:[]}).Otros,100);

const normalized = fundBlockAllocation({category:'Mixed',categoryDescription:'',breakdowns:[{type:'asset-allocation',items:[{label:'Equity',value:55},{label:'Bonds',value:55}]}]} as Parameters<typeof fundBlockAllocation>[0]);
assert.equal(normalized['Renta variable'],50);
assert.equal(normalized['Renta fija'],50);
assert.equal(normalized.Otros,0);
assert.equal(fundBlockAllocation({category:'Money market',categoryDescription:'',breakdowns:[]}).Liquidez,100);
assert.equal(fundBlockAllocation({category:'Fixed income',categoryDescription:'',breakdowns:[]})['Renta fija'],100);
