export type ScheduledDetail={card:string;vat:string;slot:number;pieces?:number};
type CapacityOrder={card:string;vats:number;pieces:number};

export const scheduledDemoVatCount=20;

export function ensureScheduledDemo(orders:CapacityOrder[],details:ScheduledDetail[],target=scheduledDemoVatCount){
 const cards=new Set(orders.map(order=>order.card));
 const result=details.filter(detail=>cards.has(detail.card));
 if(result.length>=target)return result;
 const counts=result.reduce<Record<string,number>>((acc,detail)=>{acc[detail.card]=(acc[detail.card]||0)+1;return acc},{});
 const occupied=new Set(result.map(detail=>`${detail.vat}-${detail.slot}`));
 let position=0;
 for(const order of orders){
  while((counts[order.card]||0)<order.vats&&result.length<target){
   while(occupied.has(`J${String(position%16+1).padStart(2,'0')}#-${Math.floor(position/16)+1}`))position++;
   const vat=`J${String(position%16+1).padStart(2,'0')}#`,slot=Math.floor(position/16)+1;
   result.push({card:order.card,vat,slot,pieces:Math.max(1,Math.ceil(order.pieces/order.vats))});
   counts[order.card]=(counts[order.card]||0)+1;
   occupied.add(`${vat}-${slot}`);
   position++;
  }
  if(result.length>=target)break;
 }
 return result;
}
