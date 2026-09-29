import {formulaVersions} from './card-opening-model.ts';
import {formulaNumber} from './formula-number.ts';
import {sameFormula,type FormulaState,type Formula} from './dye-formula-model.ts';
import type {Job} from './schedule-model.ts';

export type OpeningReview={version:number;formulaNo:string;formula:Formula;operator:string;reviewedAt:string};
export function captureOpeningReview(state:FormulaState,card:string,version:number,expected:Formula,operator:string):OpeningReview{
 const chosen=formulaVersions(state,card).find(row=>row.version===version);
 if(!chosen||!sameFormula(chosen.formula,expected))throw new Error('所选配方已更新，请刷新后审核');
 if(!chosen.formula.bath||!chosen.formula.rows.length)throw new Error('配方未出，暂不能开卡');
 return {version,formulaNo:formulaNumber(chosen.formula.bath,card,version),formula:structuredClone(chosen.formula),operator,reviewedAt:new Date().toISOString()};
}
export function formulaUsage(jobs:Job[],card:string){
 return jobs.filter(job=>job.card===card).map(job=>({
  key:job.id,card:job.card,vat:job.vat,converted:!!job.converted,
  snapshot:job.openingReview?structuredClone(job.openingReview):null,
 }));
}
export function queryVersions(state:FormulaState,card:string){
 return formulaVersions(state,card).map(row=>{
  const change=state.changes.find(c=>c.card===card&&c.status==='已通过'&&c.formulaChoice!=='original'&&c.version+1===row.version&&!sameFormula(c.before,c.reviewedFormula??c.after));
  return {...row,formula:structuredClone(row.formula),formulaNo:formulaNumber(row.formula.bath,card,row.version),current:row.version===state.version,applicant:change?.applicant??'—',reviewer:change?.reviewer??'—',change};
 });
}
