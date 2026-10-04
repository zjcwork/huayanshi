import {useEffect,useMemo,useState} from 'react';
import {App,Button,Checkbox,DatePicker,Input,Modal,Select,Space,Tabs,Tooltip} from 'antd';
import {ArrowRightOutlined,CheckCircleOutlined,ExperimentOutlined,FileTextOutlined,ReloadOutlined,SettingOutlined,TeamOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import {isOverdue,readWorkbenchItems,workCounts,workbenchTeams} from './workbench-model';
import type {WorkbenchTarget} from './workbench-navigation';
import './workbench-overview.css';
import DyeMatchingOverview from './DyeMatchingOverview';
import RepairOverview from './RepairOverview';
import {readRecords} from './matching-model';
const shortcuts=[['配方记录','配方查询','配方与流程卡'],['订单查询','订单查询','订单资料与进度'],['带布查询','带布查询','带布流转记录'],['对样查询','对样','流程卡对样'],['在制品查询','试样在制品库存','试样库存明细'],['工艺查询','染色工艺审核','染色工艺资料'],['回修报表','回修报表','回修记录汇总'],['加料报表','加料报表','加料记录汇总'],['染缸计划','染缸计划','生产排程管理'],['染缸看板','染缸看板','染缸运行概况']];
const readVisible=()=>{try{const value=JSON.parse(localStorage.getItem('lab-workbench-shortcuts')||'null');if(Array.isArray(value)&&value.every(v=>Number.isInteger(v)&&v>=0&&v<shortcuts.length))return value as number[]}catch{}return shortcuts.map((_,i)=>i)};
export default function Workbench({onNavigate,onOpenPage,currentTeam}:{currentTeam:string;onNavigate:(target:WorkbenchTarget)=>void;onOpenPage:(page:string)=>void}){
 const {message}=App.useApp();
 const [overviewTab,setOverviewTab]=useState('sampling');
 const [shiftStarts,setShiftStarts]=useState<Record<string,string>>(()=>{let saved:Record<string,string>={};try{saved=JSON.parse(localStorage.getItem('lab-team-shift-starts')||'{}')??{}}catch{}if(!saved[currentTeam]){saved={...saved,[currentTeam]:dayjs().subtract(2,'day').format('YYYY-MM-DD')};localStorage.setItem('lab-team-shift-starts',JSON.stringify(saved))}return saved});
 useEffect(()=>{if(shiftStarts[currentTeam])return;const next={...shiftStarts,[currentTeam]:dayjs().subtract(2,'day').format('YYYY-MM-DD')};localStorage.setItem('lab-team-shift-starts',JSON.stringify(next));setShiftStarts(next)},[currentTeam,shiftStarts]);
 const [shiftDateOpen,setShiftDateOpen]=useState(false),[shiftDate,setShiftDate]=useState<string|null>(null);

 const [matchingRecords,setMatchingRecords]=useState(readRecords);
 const [items,setItems]=useState(readWorkbenchItems),[team,setTeam]=useState(currentTeam),[now,setNow]=useState(Date.now());
 const [visible,setVisible]=useState(readVisible),[draft,setDraft]=useState<number[]>([]),[settings,setSettings]=useState(false),[code,setCode]=useState('');
 const refresh=()=>{setItems(readWorkbenchItems());setMatchingRecords(readRecords());setNow(Date.now())};
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);window.addEventListener('storage',refresh);return()=>{clearInterval(timer);window.removeEventListener('storage',refresh)}},[]);
 useEffect(()=>setTeam(currentTeam),[currentTeam]);
 const scope=useMemo(()=>items.filter(r=>team==='全部班组'||r.team===team),[items,team]);
 const counts=workCounts(scope,now);
 const shiftStart=shiftStarts[team];
 const shiftDay=shiftStart&&dayjs(shiftStart).isValid()&&dayjs(shiftStart).startOf('day').valueOf()<=dayjs(now).startOf('day').valueOf()?dayjs(now).startOf('day').diff(dayjs(shiftStart).startOf('day'),'day')+1:null;

 const overdueRepairs=scope.filter(row=>row.kind==='回修'&&row.processCard&&isOverdue(row,now)).sort((a,b)=>new Date(a.due).getTime()-new Date(b.due).getTime());
 const overdueDuration=(due:string)=>{const minutes=Math.max(1,Math.floor((now-new Date(due).getTime())/60000));const hours=Math.floor(minutes/60);return `${hours}小时${minutes%60}分钟`};
 const go=(target:WorkbenchTarget)=>onNavigate({...target,team});
 const todos=[{title:'大货订单审核',count:counts.bulk,note:'待审核订单',page:'大货订单审核',queue:'bulk',icon:<FileTextOutlined/>},{title:'预打样订单审核',count:counts.pre,note:'待审核订单',page:'预打样订单审核',queue:'pre',icon:<ExperimentOutlined/>},{title:'待分配大货',count:scope.filter(r=>r.phase==='待分配'&&r.kind==='大货').length,note:'等待分配打样员',page:'任务分配',queue:'assign',kind:'大货',icon:<TeamOutlined/>},{title:'待分配回修',count:scope.filter(r=>r.phase==='待分配'&&r.kind==='回修').length,note:'等待分配打样员',page:'任务分配',queue:'assign',kind:'回修',icon:<TeamOutlined/>},{title:'待分配预打样',count:scope.filter(r=>r.phase==='待分配'&&r.kind==='预打样').length,note:'等待分配打样员',page:'任务分配',queue:'assign',kind:'预打样',icon:<TeamOutlined/>},{title:'变更确认',count:counts.confirm,note:'打样配方待确认',page:'配方确认',queue:'confirm',icon:<CheckCircleOutlined/>}] as const;
 const direct=()=>{const index=Number(code)-1;if(!/^\d+$/.test(code)||!visible.includes(index)){message.warning('请输入已显示入口的编号');return}onOpenPage(shortcuts[index][1]);setCode('')};
 return <div className="foreman-workbench">

  <Tabs className="workbench-overview-tabs" activeKey={overviewTab==='matching'?'dye-matching':overviewTab} onChange={setOverviewTab} items={[{key:'sampling',label:'打样'},{key:'dye-matching',label:'对样'}]}/>
  {overviewTab==='sampling'?<div className="foreman-top">
   <section className="foreman-panel progress-panel"><div className="foreman-section-title"><div><span className="section-mark"/><h2>打样进度</h2><Select size="small" aria-label="打样统计班组" value={team} onChange={setTeam} style={{width:100}} options={workbenchTeams.map(value=>({value,label:value}))}/><Button type="text" size="small" className="shift-day-label" title="设置本轮当班开始日期" onClick={()=>{setShiftDate(shiftStart??null);setShiftDateOpen(true)}}>{shiftDay===null?'当班天数待设置':`当班第 ${shiftDay} 天`}</Button></div><Space size={8}><Button type="link" onClick={()=>go({page:'试样任务跟踪',queue:'all'})}>查看任务 <ArrowRightOutlined/></Button><Tooltip title="刷新工作台数据"><Button aria-label="刷新工作台数据" icon={<ReloadOutlined/>} onClick={refresh}/></Tooltip></Space></div>
   <div className="progress-table-wrap"><table className="progress-table sampling-kind-progress" aria-label="当前班组打样进度"><thead><tr><th><span className="matching-stage-sr-only">打样类型</span></th><th>已分配</th><th>已完成</th><th>超时</th></tr></thead><tbody>{(['预打样','大货','回修'] as const).map(kind=>{const rows=scope.filter(row=>row.kind===kind),c=workCounts(rows,now);const values=[c.assigned,rows.filter(row=>row.phase==='已完成').length,c.overdue];return <tr key={kind}><th scope="row">{kind}</th>{values.map((value,index)=><td key={index} className={index===2?'danger-value':index===1?'success-value':''}>{index===1?<strong>{value}</strong>:<button aria-label={`${team} ${kind} ${['已分配','已完成','超时'][index]} ${value} 项`} onClick={()=>go({page:'试样任务跟踪',kind,queue:(['assigned','all','all'] as const)[index],risk:index===2?'overdue':undefined})}>{value}</button>}</td>)}</tr>})}</tbody></table></div></section>
   <section className="foreman-panel repair-overdue-panel"><div className="foreman-section-title"><div><span className="section-mark coral"/><h2>回修超时</h2></div><span className="unit-label">共 <span style={{color:'#ff4d4f'}}>{overdueRepairs.length}</span> 条</span></div>
    <div className="repair-overdue-wrap"><table className="repair-overdue-table"><thead><tr><th>流程卡号</th><th>订字</th><th>色号</th><th>超时时间</th></tr></thead><tbody>{overdueRepairs.map(row=><tr key={row.id}><td>{row.processCard?.endsWith('H-1')?row.processCard:`${row.processCard}H-1`}</td><td>{row.order}</td><td>{row.colorNo}</td><td className="repair-overdue-duration">{overdueDuration(row.due)}</td></tr>)}</tbody></table>{!overdueRepairs.length&&<div className="repair-overdue-empty">当前班组暂无超时回修流程卡</div>}</div>
   </section>
   <RepairOverview team={team} now={now}/>
  </div>
  :<DyeMatchingOverview items={items} currentTeam={currentTeam} records={matchingRecords} now={now} onRefresh={refresh}/>}
  <section className="foreman-panel todo-panel"><div className="foreman-section-title"><div><span className="section-mark"/><h2>待办事项</h2></div></div><div className="foreman-todos">{todos.map(t=><button key={t.title} className={`foreman-todo tone-${t.queue==='assign'?2:t.queue==='confirm'?3:t.queue==='pre'?1:0}`} onClick={()=>go({page:t.page,queue:t.queue,kind:'kind' in t?t.kind:undefined})}><div className="todo-top"><span className="todo-icon">{t.icon}</span><span>{t.title}</span><ArrowRightOutlined/></div><div className="todo-bottom"><strong>{t.count}<small>项</small></strong><span>{t.note}</span></div></button>)}</div></section>
  <section className="foreman-panel shortcuts-panel"><div className="foreman-section-title"><div><span className="section-mark"/><h2>常用入口</h2></div><Space><Input aria-label="入口编号" placeholder="输入编号" value={code} onChange={e=>setCode(e.target.value)} onPressEnter={direct} style={{width:100}}/><Button onClick={direct}>直达 <ArrowRightOutlined/></Button><Button icon={<SettingOutlined/>} onClick={()=>{setDraft([...visible]);setSettings(true)}}>显示设置</Button></Space></div><div className="foreman-shortcuts">{visible.map(i=><button key={i} onClick={()=>onOpenPage(shortcuts[i][1])}><span className="shortcut-number">{String(i+1).padStart(2,'0')}</span><span><b>{shortcuts[i][0]}</b></span><ArrowRightOutlined/></button>)}</div>{!visible.length&&<div className="shortcut-empty">暂无常用入口，可通过“显示设置”添加。</div>}</section>
  <footer className="foreman-footer"><span><i/>{team} · 本地演示数据</span><span>更新于 {dayjs(now).format('HH:mm')} · 部分业务入口尚未接入</span></footer>
  <Modal title={`${team} · 本轮当班开始日期`} open={shiftDateOpen} onCancel={()=>setShiftDateOpen(false)} okText="保存" cancelText="取消" okButtonProps={{disabled:!shiftDate}} onOk={()=>{if(!shiftDate)return;const next={...shiftStarts,[team]:shiftDate};localStorage.setItem('lab-team-shift-starts',JSON.stringify(next));setShiftStarts(next);setShiftDateOpen(false)}}><p>开始当天为第 1 天，按自然日计算；新一轮当班时更新开始日期。</p><DatePicker aria-label="本轮当班开始日期" value={shiftDate?dayjs(shiftDate):null} allowClear onChange={value=>setShiftDate(value?value.format('YYYY-MM-DD'):null)} disabledDate={date=>date.startOf('day').valueOf()>dayjs(now).startOf('day').valueOf()}/></Modal>
  <Modal title="常用入口显示设置" open={settings} onCancel={()=>setSettings(false)} onOk={()=>{setVisible([...draft].sort((a,b)=>a-b));localStorage.setItem('lab-workbench-shortcuts',JSON.stringify([...draft].sort((a,b)=>a-b)));setSettings(false)}} okText="保存" cancelText="取消"><p>选择工作台需要显示的入口，编号保持不变。</p><Checkbox.Group className="shortcut-settings" value={draft} onChange={values=>setDraft(values as number[])} options={shortcuts.map((s,i)=>({label:`${String(i+1).padStart(2,'0')}  ${s[0]}`,value:i}))}/></Modal>
 </div>
}
