import type {LabRecord} from './data.ts';

export type FormulaAuditCategory='sample'|'copy'|'repair'|'pre';
export type FormulaAuditFilters={query?:string;color?:string;order?:string;colorNo?:string;card?:string;formula?:string;status:string;start?:string;end?:string};

export const formulaAuditCategory=(row:LabRecord):FormulaAuditCategory=>{
 if(row.type==='回修'||row.formulaType==='回修')return 'repair';
 if(row.type==='预打样')return 'pre';
 if(row.formulaType==='小样')return 'copy';
 return 'sample';
};

export const filterFormulaAuditRows=(rows:LabRecord[],category:FormulaAuditCategory,filters:FormulaAuditFilters)=>{
 const query=filters.query?.trim().toLowerCase()??'',color=filters.color?.trim().toLowerCase()??'';
 const order=filters.order?.trim().toLowerCase()??'',colorNo=filters.colorNo?.trim().toLowerCase()??'';
 const card=filters.card?.trim().toLowerCase()??'',formula=filters.formula?.trim().toLowerCase()??'';
 return rows.filter(row=>{
  const created=row.created.slice(0,10);
  return formulaAuditCategory(row)===category
   &&(!query||[row.order,row.processCard,row.formula].some(value=>value?.toLowerCase().includes(query)))
   &&(!color||[row.colorNo,row.dmNo].some(value=>value?.toLowerCase().includes(color)))
   &&(!order||row.order.toLowerCase().includes(order))
   &&(!colorNo||row.colorNo.toLowerCase().includes(colorNo))
   &&(!card||row.processCard?.toLowerCase().includes(card))
   &&(!formula||row.formula.toLowerCase().includes(formula))
   &&(!filters.status||filters.status==='全部'||row.status===filters.status)
   &&(!filters.start||created>=filters.start)
   &&(!filters.end||created<=filters.end);
 });
};
