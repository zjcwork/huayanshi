import {useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {Button,Descriptions,Empty,Input,Modal,Table} from 'antd';
import {readScheduleJobs} from './schedule-model';
import {dyeReviewCards} from './dye-review-cards';
import {initialRecords,queryRecords} from './data';
import './global-quick-query.css';

function readCards(){
 const cards=new Map<string,{card:string;order:string;color:string;product?:string;vat?:string;pieces?:number}>();
 [...initialRecords,...queryRecords].forEach(row=>{if(row.processCard)cards.set(row.processCard,{card:row.processCard,order:row.order,color:row.colorNo,product:row.product,vat:row.dyeVat})});
 dyeReviewCards.forEach(row=>cards.set(row.card,{...cards.get(row.card),card:row.card,order:row.order,color:row.colorNo,product:row.product,pieces:row.pieces}));
 readScheduleJobs().forEach(row=>cards.set(row.card,{...cards.get(row.card),card:row.card,order:row.order||cards.get(row.card)?.order||'—',color:row.color||cards.get(row.card)?.color||'—',vat:row.vat,pieces:row.pieces??cards.get(row.card)?.pieces}));
 return [...cards.values()];
}
function ProcessCardQuery(){
 const [rows,setRows]=useState(readCards),[search,setSearch]=useState(''),[selected,setSelected]=useState('');
 const filtered=rows.filter(row=>[row.card,row.order,row.color].join(' ').toLowerCase().includes(search.trim().toLowerCase()));
 const current=filtered.find(row=>row.card===selected)??filtered[0];
 return <><div className="quick-query-tools"><Input.Search autoFocus allowClear aria-label="流程卡查询搜索" placeholder="流程卡号 / 订字 / 色号" value={search} onChange={event=>setSearch(event.target.value)}/><Button onClick={()=>setRows(readCards())}>刷新</Button></div>
 <Table rowKey="card" size="small" dataSource={filtered} pagination={{pageSize:8,showSizeChanger:false}} scroll={{x:700}} rowClassName={row=>row.card===current?.card?'active-row':''} onRow={row=>({onClick:()=>setSelected(row.card),style:{cursor:'pointer'}})} columns={[{title:'流程卡号',dataIndex:'card'},{title:'订字',dataIndex:'order'},{title:'色号',dataIndex:'color'},{title:'品名',dataIndex:'product'},{title:'染缸',dataIndex:'vat'}]}/>
 {current?<Descriptions title="流程卡资料" bordered column={2} items={[{key:'card',label:'流程卡号',children:current.card},{key:'order',label:'订字',children:current.order},{key:'color',label:'色号',children:current.color},{key:'product',label:'品名',children:current.product??'—'},{key:'vat',label:'染缸',children:current.vat??'—'},{key:'pieces',label:'匹数',children:current.pieces??'—'}]}/>:<Empty description="未找到匹配的流程卡"/>}</>;
}
export default function GlobalQuickQuery({renderFormula}:{renderFormula:()=>ReactNode}){
 const [position,setPosition]=useState<{x:number;y:number}|null>(null),[query,setQuery]=useState<string|null>(null);
 const menu=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const open=(event:MouseEvent)=>{event.preventDefault();setPosition({x:Math.max(8,Math.min(event.clientX,window.innerWidth-168)),y:Math.max(8,Math.min(event.clientY,window.innerHeight-94))})};
  const close=(event:Event)=>{if(!menu.current?.contains(event.target as Node))setPosition(null)};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setPosition(null)};
  const dismiss=()=>setPosition(null);
  document.addEventListener('contextmenu',open);document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);window.addEventListener('resize',dismiss);window.addEventListener('scroll',dismiss,true);window.addEventListener('blur',dismiss);
  return()=>{document.removeEventListener('contextmenu',open);document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);window.removeEventListener('resize',dismiss);window.removeEventListener('scroll',dismiss,true);window.removeEventListener('blur',dismiss)};
 },[]);
 useEffect(()=>{if(position)menu.current?.querySelector<HTMLButtonElement>('button')?.focus()},[position]);
 return <>{position&&createPortal(<div ref={menu} className="global-query-menu" role="menu" aria-label="快捷查询" style={{left:position.x,top:position.y}} onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const buttons=Array.from(menu.current!.querySelectorAll('button'));buttons[(buttons.indexOf(document.activeElement as HTMLButtonElement)+1)%buttons.length]?.focus()}}}>{['配方查询','流程卡查询'].map(name=><button key={name} role="menuitem" onClick={()=>{setQuery(name);setPosition(null)}}>{name}</button>)}</div>,document.body)}
 <Modal title={query} open={!!query} width="calc(100vw - 64px)" style={{top:24}} styles={{body:{maxHeight:'calc(100vh - 160px)',overflow:'auto'}}} footer={<Button onClick={()=>setQuery(null)}>关闭</Button>} onCancel={()=>setQuery(null)} destroyOnClose><div className="global-query-content">{query==='配方查询'?renderFormula():query==='流程卡查询'?<ProcessCardQuery/>:null}</div></Modal></>;
}
