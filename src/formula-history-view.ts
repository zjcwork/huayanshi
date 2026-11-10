export type HistoryIdentity = {formula:string;card:string;isSample:boolean;available:boolean};

export function historyVersions<T extends HistoryIdentity>(rows:T[]):T[]{
 const seen=new Set<string>();
 return rows.filter(row=>{if(seen.has(row.formula))return false;seen.add(row.formula);return true;});
}
export function selectHistoryUsage<T extends HistoryIdentity>(rows:T[],formula:string):T|undefined{
 return rows.find(row=>row.formula===formula)??rows.find(row=>row.available)??rows[0];
}
export function historyProductionCards<T extends HistoryIdentity>(rows:T[],formula:string):T[]{
 return rows.filter(row=>!row.isSample&&row.formula===formula);
}
