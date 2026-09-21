import {vatBathRange,schedulingFormula,bathFits} from './schedule-bath';
import {useState} from 'react';
import {App,Button,InputNumber,Popover,Select,Space,Table} from 'antd';
export type Allocation={key:string;pieces:number|null;vat:string;slot:number};
export default function SchedulePopover({pieces,bath,card,order,history,onSchedule}:{card?:string;pieces:number;bath:string;order:string;history:string;onSchedule:(rows:Allocation[])=>boolean}){
 const {message}=App.useApp();const [open,setOpen]=useState(false),[rows,setRows]=useState<Allocation[]>([]);
 const newRow=():Allocation=>({key:crypto.randomUUID(),pieces,vat:'J01#',slot:1});
 const update=(key:string,patch:Partial<Allocation>)=>setRows(rs=>rs.map(r=>r.key===key?{...r,...patch}:r));
 const total=rows.reduce((n,r)=>n+(r.pieces||0),0),remaining=pieces-total;
 const submit=()=>{if(rows.some(r=>!r.pieces||r.pieces<=0)){message.warning('请填写大于 0 的预配数量');return;}if(remaining<0){message.warning('预配数量不能超过可排匹数');return;}if(new Set(rows.map(r=>`${r.vat}-${r.slot}`)).size!==rows.length){message.warning('同一染缸的排缸位置不能重复');return;}if(onSchedule(rows)){setOpen(false)}};
 return <Popover trigger="click" placement="leftTop" open={open} onOpenChange={v=>{if(v)setRows([newRow()]);setOpen(v)}} overlayClassName="capacity-schedule-popover" content={<div className="allocation-panel" role="dialog" aria-label={`${order}排单`}>
  <Table rowKey="key" bordered size="small" pagination={false} dataSource={rows} scroll={{y:150}} columns={[
   {title:'操作',width:60,render:(_,r)=><Space size={4}><Button type="link" onClick={()=>setRows(rs=>[...rs,{...newRow(),pieces:Math.max(0,remaining),slot:Math.min(8,r.slot+1)}])}>增</Button><span>|</span><Button type="link" disabled={rows.length===1} onClick={()=>setRows(rs=>rs.filter(x=>x.key!==r.key))}>删</Button></Space>},
   {title:'预配数量',width:105,render:(_,r)=><Space size={4}><InputNumber aria-label={`预配数量${rows.indexOf(r)+1}`} min={0} precision={0} value={r.pieces} onChange={v=>update(r.key,{pieces:v})} style={{width:65}}/>匹</Space>},
   {title:'排缸号',width:105,render:(_,r)=><Select aria-label={`排缸号${rows.indexOf(r)+1}`} value={r.vat} onChange={v=>update(r.key,{vat:v})} options={Array.from({length:16},(_,i)=>{const value=`J${String(i+1).padStart(2,'0')}#`;return {value,label:value}})}/>},
   {title:'排缸位置',width:100,render:(_,r)=><Select aria-label={`排缸位置${rows.indexOf(r)+1}`} value={r.slot} onChange={v=>update(r.key,{slot:v})} options={Array.from({length:8},(_,i)=>({value:i+1,label:String(i+1)}))}/>},
   {title:'配方(浴比)',width:100,render:(_,r)=>{const value=card?schedulingFormula(card,bath).approved.bath:Number(bath.split(':')[1])||null;const outside=value!==null&&!bathFits(value,r.vat);return <span style={{color:outside?'#ff4d4f':undefined,fontWeight:outside?600:undefined}} title={outside?'配方浴比超出染缸浴比范围':undefined}>{value?`1:${value}`:bath}</span>;}} ,
   {title:'染缸浴比范围',width:110,render:(_,r)=>{const range=vatBathRange(r.vat);return `${range.min}～${range.max}`} }
  ]}/>
  <div className="allocation-footer"><span className="allocation-history">历史缸号：{history&&history!=='-'?history:'暂无'}</span><Button onClick={()=>setOpen(false)}>取消</Button><Button type="primary" onClick={submit}>排产</Button></div>
 </div>}><Button type="link">排单</Button></Popover>
}
