import type {MatchingRecord} from './matching-model';
export type DyeOverviewCard={card:string;team:string;status:'待对样'|'进行中'|'已完成';additions:number;direction:string;depth:string};
export const dyeOverviewTeams=['甲班','乙班','丙班'];
const localDate=(time:number|string)=>{const date=new Date(time);return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`};
export function dyeOverviewCards(records:Record<string,MatchingRecord>,now:number):{demo:boolean;cards:DyeOverviewCard[]}{
 const today=localDate(now);
 const cards=Object.entries(records).map(([card,record])=>{
  const batches=record.additions.filter(batch=>localDate(batch.time)===today).sort((a,b)=>new Date(a.time).getTime()-new Date(b.time).getTime());
  const latest=batches.at(-1);
  return {card,team:record.team??dyeOverviewTeams[Array.from(card).reduce((n,c)=>n+c.charCodeAt(0),0)%3],status:record.result==='待对样'?'待对样' as const:record.result==='未通过'?'进行中' as const:'已完成' as const,additions:batches.length,direction:latest?.direction??latest?.reason??'',depth:latest?.depth??latest?.reason??''};
 });
 if(cards.some(card=>card.additions>0))return {demo:false,cards};
 return {demo:true,cards:Array.from({length:30},(_,i)=>({card:`DEMO-DYE-${i+1}`,team:dyeOverviewTeams[i%3],status:(['待对样','进行中','已完成'] as const)[Math.floor(i/3)%3],additions:i<6?0:1+(i%5),direction:['偏红','偏黄','偏蓝','正常'][i%4],depth:['偏深','偏浅','正常'][i%3]}))};
}
export function dyeOverviewStats(cards:DyeOverviewCard[]){
 const added=cards.filter(card=>card.additions>0);
 return {progress:['待对样','进行中','已完成'].map(status=>cards.filter(card=>card.status===status).length),additions:[1,2,3,4,5].map(count=>added.filter(card=>card.additions===count).length),overFive:added.filter(card=>card.additions>5).length,bias:['红','黄','蓝'].map(color=>added.filter(card=>card.direction.includes(color)).length).concat(['深','浅'].map(depth=>added.filter(card=>card.depth.includes(depth)).length))};
}
