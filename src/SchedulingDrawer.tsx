import {useState} from 'react';
import {Button,Drawer,Empty,Input,Radio,Select,Tabs} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import {items,sales,type Item} from './CapacityDialog';
import SchedulePopover,{type Allocation} from './SchedulePopover';
import './scheduling-drawer.css';
const types=['全部','正常单','厂外回修','厂外染','清洗布','试样布'];
const shades=['全部','浅色','中色','深色','漂白','本白','特外'];
function overrides<T>(key:string):Record<string,T>{try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{return {}}}
export default function SchedulingDrawer({open,onClose,jobs,onSchedule}:{open:boolean;onClose:()=>void;jobs:{card:string;pieces?:number}[];onSchedule:(item:Item,rows:Allocation[])=>boolean}){
 const [view,setView]=useState('order'),[query,setQuery]=useState(''),[seller,setSeller]=useState(''),[kind,setKind]=useState('全部'),[shade,setShade]=useState('全部'),[formula,setFormula]=useState('全部'),[head,setHead]=useState('全部'),[sort,setSort]=useState('asc'),[process,setProcess]=useState<string>();
 const heads=overrides<boolean>('lab-capacity-head-vats');
 const available=items.map(item=>{const scheduled=jobs.filter(j=>j.card===item.card);const used=scheduled.some(j=>j.pieces===undefined)?item.pieces:scheduled.reduce((n,j)=>n+(j.pieces||0),0);return {...item,pieces:Math.max(0,item.pieces-used),vats:Math.max(1,item.vats-scheduled.length),head:heads[item.card]===undefined?item.head:heads[item.card]?'头缸':'连缸'};}).filter(r=>r.pieces>0);
 const base=available.filter(r=>(!query||`${r.order} ${r.color} ${r.card}`.toLowerCase().includes(query.trim().toLowerCase()))&&(!seller||r.sales===seller)&&(!process||r.process===process));
 const typeMatches=(r:Item,t:string)=>t==='全部'||r.type===(t==='正常单'?'正常订单':t);
 const typed=base.filter(r=>typeMatches(r,kind));
 const colorName=(r:Item)=>r.colorGroup==='本白'?'本白':`${r.colorGroup}色`;
 const rows=typed.filter(r=>(shade==='全部'||colorName(r)===shade)&&(formula==='全部'||(r.bath==='配方未出'?'配方未出':'配方已出')===formula)&&(head==='全部'||r.head===head)).sort((a,b)=>(sort==='asc'?1:-1)*a.due.localeCompare(b.due));
 const vats=available.reduce((n,r)=>n+r.vats,0);
 return <Drawer className="scheduling-drawer" open={open} onClose={onClose} width="min(660px, 100vw)" mask={false} styles={{wrapper:{top:56},body:{padding:0}}} title={<Tabs activeKey={view} onChange={setView} items={[{key:'order',label:`订单排产(${vats}缸)`},{key:'card',label:`流程卡排产(${available.length}张)`}]}/>}>
  <div className="scheduling-filters"><div className="scheduling-search"><Input aria-label="待排订单搜索" suffix={<SearchOutlined/>} placeholder="请输入订字/色号/流程卡号" value={query} allowClear onChange={e=>setQuery(e.target.value)}/><Select aria-label="交期排序" value={sort} onChange={setSort} options={[{value:'asc',label:'交期时间正序'},{value:'desc',label:'交期时间倒序'}]}/><Select aria-label="排产工序筛选" placeholder="工序筛选" value={process} allowClear onChange={setProcess} options={['染色','定型'].map(value=>({value,label:value}))}/></div>
   <div className="scheduling-sellers">{['全部业务员',...sales].map(name=><Button key={name} type={seller===(name==='全部业务员'?'':name)?'primary':'default'} onClick={()=>setSeller(name==='全部业务员'?'':name)}>{name}</Button>)}</div>
   <Tabs activeKey={kind} onChange={setKind} items={types.map(t=>({key:t,label:`${t}(${base.filter(r=>typeMatches(r,t)).length})`}))}/>
  </div>
  <div className="scheduling-results"><nav className="scheduling-shades">{shades.map(s=><button key={s} className={s===shade?'active':''} onClick={()=>setShade(s)}>{s}<span>{typed.filter(r=>s==='全部'||colorName(r)===s).length}</span></button>)}</nav><div className="scheduling-list-area"><div className="scheduling-radios"><Radio.Group aria-label="配方状态" value={formula} onChange={e=>setFormula(e.target.value)} options={['全部','配方已出','配方未出']}/><Radio.Group aria-label="头缸连缸筛选" value={head} onChange={e=>setHead(e.target.value)} options={['全部','头缸','连缸']}/></div>
   <div className="scheduling-cards">{rows.map(r=>{const overdue=Math.max(0,dayjs().diff(dayjs(r.due),'day'));return <article className="scheduling-order" key={r.card}><div className="scheduling-order-color"><i style={{background:r.colorHex}}/>{colorName(r)}</div><div className="scheduling-order-content"><div className="scheduling-order-top"><span><b className="scheduling-order-tag">{r.type}</b> {view==='card'?r.card:r.order} | {r.color}</span><span>交期{r.due.slice(5)} <em>{overdue>0?`（超期${overdue}天）`:''}</em></span></div>{view==='card'&&<div>{r.order} | {r.head}</div>}<div className="scheduling-order-meta"><span>{r.product} | 白坯克重：{r.weight} | 白坯门幅：{r.width}</span><span>剩余：{r.vats}缸 {r.pieces}匹</span></div><div className="scheduling-order-actions"><span>{r.linked!=='ok'&&<b>{r.linked}</b>}</span><SchedulePopover card={r.card} key={`${r.card}-${r.pieces}`} history={r.history} order={r.order} pieces={r.pieces} bath={r.bath} onSchedule={allocations=>onSchedule(r,allocations)}/></div></div></article>})}{!rows.length&&<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无符合条件的待排订单"/>}</div>
  </div></div>
 </Drawer>
}
