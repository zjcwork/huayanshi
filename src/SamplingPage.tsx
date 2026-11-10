import FormulaRetryTasks from './FormulaRetryTasks';
import {loadFormulaState} from './dye-formula-model';
import {useEffect,useState} from 'react';
import {App,Button,Checkbox,Input,InputNumber,Modal,Select,Space,Table,Tabs} from 'antd';
import {ArrowDownOutlined,ArrowUpOutlined} from '@ant-design/icons';
import BadFormulas from './BadFormulas';
import {defectStatus,readRecords} from './matching-model';
import './sampling-page.css';
type Row={key:string;stage:number;code:string;ratio:number|null};
type Ticket={id:string;order:string;color:string;hex:string;worker:string;date:string;bath:number;processCard?:string};
const base:Ticket[]=[
 {id:'bulk-1',order:'阿建91079',color:'1',hex:'#c95472',worker:'俞狄锋',date:'26-08-23',bath:7},
 {id:'bulk-2',order:'顶发666',color:'hong',hex:'#a6cc67',worker:'戚兴锋',date:'26-08-25',bath:7},
 {id:'bulk-3',order:'顶发666',color:'lv',hex:'#c95472',worker:'戚兴锋',date:'26-08-25',bath:7},
 {id:'bulk-4',order:'芹王AE',color:'壁土灰',hex:'#967621',worker:'沈锋',date:'26-08-28',bath:7},
 {id:'bulk-5',order:'国张711',color:'测试826',hex:'#bea44e',worker:'smcs',date:'26-08-30',bath:7},
 {id:'bulk-6',order:'芹王TEST',color:'酒红',hex:'#a0a2a0',worker:'IE通用',date:'26-09-01',bath:7}
];
const blank=():Row=>({key:crypto.randomUUID(),stage:1,code:'',ratio:null});
const readSaved=():Record<string,Row[]>=>{try{return JSON.parse(localStorage.getItem('lab-sampling-drafts')||'{}')}catch{return {}}};
export default function SamplingPage({onMatching,onQuery}:{onMatching:(card:string)=>void;onQuery:()=>void}){
 const [,refreshTasks]=useState(0);
 const [handoverMode,setHandoverMode]=useState(false);
 const [submissionMode,setSubmissionMode]=useState(false);
 const retryCount=loadFormulaState().changes.filter(c=>c.status==='待工段长审核'&&c.retry&&!c.retry.completedAt).length;
 const {message}=App.useApp();const [category,setCategory]=useState('bulk'),[query,setQuery]=useState(''),[applied,setApplied]=useState(''),[active,setActive]=useState('bulk-1'),[checked,setChecked]=useState<string[]>([]),[rounds,setRounds]=useState<number[]>([]),[logOpen,setLogOpen]=useState(false);
 const [drafts,setDrafts]=useState<Record<string,Row[]>>(()=>{const saved=readSaved();try{const old=JSON.parse(localStorage.getItem('lab-sample')||'null');if(old&&!saved['bulk-5'])saved['bulk-5']=old.map((r:Row)=>({...r,key:String(r.key)}));}catch{/* Keep current drafts. */}return saved;}),[emptyRows]=useState(()=>[blank()]);
 const [drops,setDrops]=useState<{id:string;order:string;time:string}[]>(()=>{try{return JSON.parse(localStorage.getItem('lab-sampling-drops')||'[]')}catch{return []}});
 const tickets=category==='bulk'?base:category==='repair'?base.map((r,i)=>({...r,id:`repair-${i}`,processCard:`Y260903${String(i+1).padStart(4,'0')}H-1`,date:'26-09-03'})):Array.from({length:42},(_,i)=>({...base[i%6],id:`pre-${i}`,color:i<6?base[i%6].color:`预打样${i+1}`,date:'26-09-05'}));
 const ticket=tickets.find(r=>r.id===active)??tickets[0];const rows=drafts[ticket.id]??emptyRows;
 const reference=base[(base.findIndex(item=>item.order===ticket.order)+1)%base.length];
 const update=(next:Row[])=>setDrafts(d=>({...d,[ticket.id]:next}));
 const patch=(key:string,p:Partial<Row>)=>update(rows.map(r=>r.key===key?{...r,...p}:r));
 const bring=()=>{update(['A1','A12','P103','P2'].map((code,i)=>({key:crypto.randomUUID(),stage:1,code,ratio:[1,1,1,1.1][i]})));message.success('已带入配方');};
 useEffect(()=>{const handler=(e:KeyboardEvent)=>{if(e.key==='F8'&&category!=='resample'){e.preventDefault();bring();}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);});
 let count=0;try{count=Object.values(readRecords()).filter(r=>defectStatus(r)==='待重新打样').length}catch{/* No tasks available. */}
 const resampleTickets=[
  ...Object.entries(readRecords()).filter(([,record])=>defectStatus(record)==='待重新打样').map(([card,record])=>({id:`matching-${card}`,card,order:record.order||'未记录',color:record.colorNo||'未记录',source:'不良配方复样'})),
  ...loadFormulaState().changes.filter(change=>change.status==='待工段长审核'&&change.retry&&!change.retry.completedAt).map(change=>({id:`retry-${change.id}`,card:change.card,order:change.order||'未记录',color:change.colorNo||'未记录',source:'配方重打'})),
 ].filter(task=>[task.card,task.order,task.color].join(' ').includes(applied.trim()));
 const filtered=tickets.filter(t=>(t.order+' '+t.color+' '+t.id+' '+(t.processCard??'')).includes(applied.trim()));
 const save=()=>{if(!rows.length||rows.some(r=>!r.code||r.ratio===null||r.ratio<0)||!rows.some(r=>(r.ratio??0)>0)){message.warning('请填写染助剂及有效比例');return;}try{localStorage.setItem('lab-sampling-drafts',JSON.stringify({...readSaved(),[ticket.id]:rows}));message.success('配方已保存')}catch{message.error('保存失败，请重试')}};
 const move=(key:string,offset:number)=>{const index=rows.findIndex(r=>r.key===key),target=index+offset;if(target<0||target>=rows.length)return;const next=[...rows];[next[index],next[target]]=[next[target],next[index]];update(next);};
 return <div className="sampling-page"><section className="sampling-sidebar"><Space.Compact className="sampling-search"><Input placeholder="请输入订字/色号/流程卡" value={query} onChange={e=>setQuery(e.target.value)} onPressEnter={()=>setApplied(query)}/><Button type="primary" onClick={()=>setApplied(query)}>查询</Button><Button onClick={()=>{setQuery('');setApplied('')}}>重置</Button><Button type="primary" onClick={()=>{try{const next=[{id:crypto.randomUUID(),order:ticket.order,time:new Date().toLocaleString()},...drops];localStorage.setItem('lab-sampling-drops',JSON.stringify(next));setDrops(next);message.success('滴液任务已记录');}catch{message.error('记录失败')}}}>滴液</Button></Space.Compact><Tabs activeKey={category} onChange={key=>{setCategory(key);setSubmissionMode(false);setRounds([]);setChecked([]);setHandoverMode(false);setActive(key==='bulk'?'bulk-1':key==='repair'?'repair-0':'pre-0')}} items={[{key:'bulk',label:'大货(6)'},{key:'repair',label:'回修(6)'},{key:'resample',label:`复样(${count+retryCount})`},{key:'pre',label:'预打样(42)'}]}/><div className="sampling-tickets">{category==='resample'?<><Table className="sampling-task-table" tableLayout="fixed" rowKey="id" size="small" bordered pagination={false} dataSource={resampleTickets} locale={{emptyText:'暂无符合条件的复样任务'}} columns={[
 {title:'订字 / 色号 / 流程卡',width:126,render:(_,task)=><div className="sampling-task-order" title={task.source}><i className="sampling-resample-swatch"/><span className="sampling-task-identity"><strong>{task.order}</strong><small>{task.color}</small><span className="sampling-process-card">{task.card||'未关联流程卡'}</span></span></div>},
 {title:'浴比',width:52,align:'center',render:()=> '—'},
 {title:'要求完成',width:66,render:()=> <span className="sampling-task-due">—</span>}
 ]}/><p className="muted">在右侧对应任务中录入打样结果。</p></>:<Table<Ticket> className="sampling-task-table" tableLayout="fixed" rowKey="id" size="small" bordered pagination={false} dataSource={filtered} locale={{emptyText:'暂无符合条件的任务'}} rowSelection={handoverMode?{columnWidth:24,selectedRowKeys:checked,onChange:keys=>setChecked(keys.map(String))}:undefined} rowClassName={row=>row.id===ticket.id?'sampling-task-active':''} onRow={row=>({onClick:()=>{setActive(row.id);setSubmissionMode(false);setRounds([])}})} columns={[{title:category==='repair'?'订字 / 色号 / 流程卡':'订字 / 色号',dataIndex:'order',width:126,render:(value:string,row:Ticket)=><button className="sampling-task-order" title={`${row.processCard?row.processCard+' / ':''}${value} / ${row.color}`} onClick={()=>{setActive(row.id);setSubmissionMode(false);setRounds([])}}><i style={{background:row.hex}}/><span className="sampling-task-identity"><strong>{value}</strong><small>{row.color}</small>{category==='repair'&&<span className="sampling-process-card">{row.processCard||'未关联流程卡'}</span>}</span></button>},{title:'浴比',width:52,align:'center',dataIndex:'bath'},{title:'要求完成',dataIndex:'date',width:66,render:(value:string,row:Ticket)=><span className="sampling-task-due"><span>{value}</span><small>{row.worker}</small></span>}]}/>}</div><div className="sampling-sidebar-footer"><Button type="primary" disabled={!handoverMode||category==='resample'||!filtered.length} onClick={()=>setChecked(filtered.every(t=>checked.includes(t.id))?[]:filtered.map(t=>t.id))}>全选</Button>{handoverMode&&<Button onClick={()=>{setHandoverMode(false);setChecked([])}}>取消</Button>}<Button disabled={category==='resample'||(handoverMode&&!checked.length)} onClick={()=>{if(!handoverMode){setChecked([]);setHandoverMode(true);return;}message.success(`已完成 ${checked.length} 项任务交接班`);setChecked([]);setHandoverMode(false)}}>{handoverMode?'确认交接':'交接班'}</Button></div></section>
 <section className="sampling-main">{category==='resample'?<><FormulaRetryTasks onUpdate={()=>refreshTasks(n=>n+1)}/><BadFormulas tasks onMatching={onMatching}/></>:<><div className="sampling-material-card">
 {ticket.processCard&&<div className="sampling-material-process">流程卡号：{ticket.processCard}</div>}
 <div className="sampling-fabric-info"><div className="sampling-fabric sampling-annotated-fabric" role="img" aria-label={`布料资料：品名T/R四面弹，色号${ticket.color}，经向成分A 10%，纬向成分C 90%，白坯克重256克每平方米，白坯门幅120厘米`}>
 <div className="sampling-fabric-drawing sampling-fabric-three-columns">
 <div className="sampling-fabric-facts"><span>品名<strong>T/R四面弹</strong></span><span>色号<strong>{ticket.color}</strong></span><span>白坯门幅<strong>120 cm</strong></span><span>白坯克重<strong>256 g/m²</strong></span><span>对色光源<strong>—</strong></span></div>
 <div className="sampling-weave"/>
 <div className="sampling-fabric-components"><div className="sampling-fabric-warp-note"><span>↓ 经向成分</span><strong>A（10%）</strong></div><div className="sampling-fabric-weft-note"><span>→ 纬向成分</span><strong>C（90%）</strong></div></div>
 </div>
 </div><div className="sampling-requirements-panel">
 <dl className="sampling-requirements-grid">
 <div><dt>参照订字色号</dt><dd>{reference.order} / {reference.color}</dd></div>
 <div><dt>要求浴比</dt><dd>1:{ticket.bath}</dd></div>
 <div><dt>对色光源</dt><dd>—</dd></div>
 <div><dt>颜色</dt><dd>浅色 | 浅红</dd></div>
 <div className="sampling-requirement-processing"><dt>加工要求</dt><dd>无要求</dd></div>
 <div className="sampling-requirement-date"><dt>下单时间</dt><dd>2026-08-19 09:30</dd></div>
 </dl>
 </div></div></div>

 <div className="sampling-tables"><div><div className="sampling-table-toolbar"><strong>历史枪次</strong></div><Table className="sampling-round-table" bordered size="small" pagination={false} dataSource={['A1','A12','P103','P2','工艺/pH'].map((code,i)=>({key:i,code}))} columns={[
 {title:<div className="sampling-stage-heading">{submissionMode&&<Checkbox aria-label="选择全部枪次" checked={rounds.length===2} indeterminate={rounds.length===1} onChange={e=>setRounds(e.target.checked?[2,1]:[])}/>}<span>阶段</span></div>,width:'25%',onCell:(_,i)=>({rowSpan:i===0?4:i===4?1:0,colSpan:i===4?2:1}),render:(_,r)=>r.key===4?'工艺/pH':1},
 {title:'染助剂',width:'25%',dataIndex:'code',onCell:(_,i)=>({colSpan:i===4?0:1})},
 ...[2,1].map(n=>({title:<div className="sampling-round-heading">第{n}枪 {submissionMode&&<Checkbox aria-label={`选择第${n}枪`} checked={rounds.includes(n)} onChange={e=>setRounds(v=>e.target.checked?[...v,n]:v.filter(x=>x!==n))}/>}<div>09-03 15:09</div></div>,children:[{title:'打样比例',render:(_:unknown,r:{key:number})=>r.key===4?'--':n===1?r.key===1?'1':'--':r.key===1?<span>-- <b className="red">-1</b></span>:<span>{r.key===3?'1.1':'1'} <b className="green">+{r.key===3?'1.1':'1'}</b></span>}]}))
 ]}/></div><div><div className="sampling-table-toolbar"><strong>当前配方</strong></div> <div className="sampling-actions"><Space wrap>{submissionMode&&<Button onClick={()=>{setSubmissionMode(false);setRounds([])}}>取消提审</Button>}<Button disabled={submissionMode&&!rounds.length} onClick={()=>{if(!submissionMode){setRounds([]);setSubmissionMode(true);return;}message.success(`第${rounds.join('、')}枪配方已提交审核`);setSubmissionMode(false);setRounds([])}}>{submissionMode?'确认提审':'配方提审'}</Button><Button onClick={onQuery}>打样查询</Button><Button onClick={()=>setLogOpen(true)}>滴液查询</Button><Button onClick={bring}>带入(F8)</Button><Button danger onClick={()=>update([])}>清空</Button><Button type="primary" onClick={save}>保存</Button></Space></div><Table className="sampling-edit-table" bordered size="small" rowKey="key" pagination={false} dataSource={rows} locale={{emptyText:<Button onClick={()=>update([blank()])}>新增染助剂</Button>}} columns={[
 {title:'',width:60,render:(_,r)=><Space size={2}><Button type="text" aria-label="上移染助剂" disabled={rows[0].key===r.key} icon={<ArrowUpOutlined/>} onClick={()=>move(r.key,-1)}/><Button type="text" aria-label="下移染助剂" disabled={rows.at(-1)?.key===r.key} icon={<ArrowDownOutlined/>} onClick={()=>move(r.key,1)}/></Space>},
 {title:'操作',width:80,render:(_,r)=><Space><Button type="link" onClick={()=>{const next=[...rows];next.splice(next.findIndex(x=>x.key===r.key)+1,0,blank());update(next)}}>新增</Button><Button type="link" danger onClick={()=>update(rows.filter(x=>x.key!==r.key))}>删除</Button></Space>},
 {title:'阶段',width:65,render:(_,r)=><InputNumber aria-label={`${r.key}阶段`} min={1} precision={0} value={r.stage} onChange={stage=>patch(r.key,{stage:stage??1})}/>},{title:'类别',width:65,render:()=> '染料'},
 {title:'染助剂',width:140,render:(_,r)=><Select aria-label={`${r.key}染助剂`} showSearch value={r.code||undefined} options={['A1','A12','A14','P103','P2'].map(value=>({value,label:value}))} onChange={code=>patch(r.key,{code})}/>},
 {title:'比例',width:95,render:(_,r)=><InputNumber aria-label={`${r.key}比例`} min={0} value={r.ratio} onChange={ratio=>patch(r.key,{ratio})}/>}
 ]}/></div></div></>}
 </section><Modal title="滴液查询" open={logOpen} onCancel={()=>setLogOpen(false)} footer={null}><Table rowKey="id" dataSource={drops} columns={[{title:'订字',dataIndex:'order'},{title:'时间',dataIndex:'time'}]}/></Modal></div>;
}
