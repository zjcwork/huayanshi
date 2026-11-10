import type {Change} from './dye-formula-model';

export function findFormulaChangeCard<T extends {card:string;order:string;colorNo:string}>(change:Pick<Change,'card'|'order'|'colorNo'>|null,cards:T[]):T|undefined{
 if(!change)return undefined;
 return cards.find(row=>row.card===change.card)??(change.colorNo?cards.find(row=>row.order===change.order&&row.colorNo===change.colorNo):undefined);
}
