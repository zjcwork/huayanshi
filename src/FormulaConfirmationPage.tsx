import {useState} from 'react';
import {App,Button,DatePicker,Descriptions,Input,Modal,Space,Table,Tabs,Tag,Tooltip} from 'antd';
import {ColumnHeightOutlined,EditOutlined,FullscreenOutlined,PrinterOutlined,ReloadOutlined,SettingOutlined} from '@ant-design/icons';
import dayjs,{type Dayjs} from 'dayjs';
import {type LabRecord} from './data';
import {loadFormulaState} from './dye-formula-model';
import type {Formula} from './dye-formula-model';
import {matchingFormula,readRecords} from './matching-model';
import {readScheduleJobs} from './schedule-model';
import {displayProcessCard} from './formula-number';
import DyeFormulaTable from './DyeFormulaTable';
import './formula-confirmation-page.css';
import './formula-confirmation-history.css';
import './formula-confirmation-retry.css';

type ConfirmationStatus='待确认'|'已确认'|'已退回';
type ConfirmationCategory='first'|'linked'|'repair';
type ConfirmationLog=Record<string,{status:ConfirmationStatus;operator:string;time:string;reason?:string;formula?:Formula}>;
type ConfirmationRetryLog=Record<string,{requestedAt:string;operator:string;reason?:string;formula?:Formula}>;
type RangeValue=[Dayjs|null,Dayjs|null]|null;
type FormulaHistoryRow={key:string;formula:string;bath:number;reason:string;created:string;confirmed:boolean;operator:string;isSample?:boolean};
type LinkedProcessCard={card:string;addition:number;defect:string;halfDirection:string;halfDepth:string;finishedDirection:string;finishedDepth:string};
type HistoryProcessCard=LinkedProcessCard&{key:string;formula:string;reason:string;groupStart:boolean;groupSize:number;confirmed:boolean;isSample?:boolean};

const readLog=():ConfirmationLog=>{try{return JSON.parse(localStorage.getItem('lab-formula-confirmations')||'{}')}catch{return {}}};
const saveLog=(value:ConfirmationLog)=>{localStorage.setItem('lab-formula-confirmations',JSON.stringify(value))};
const readRetryLog=():ConfirmationRetryLog=>{try{return JSON.parse(localStorage.getItem('lab-formula-confirmation-retries')||'{}')}catch{return {}}};
const saveRetryLog=(value:ConfirmationRetryLog)=>{localStorage.setItem('lab-formula-confirmation-retries',JSON.stringify(value))};
const confirmationCategory=(row:LabRecord):ConfirmationCategory=>row.type==='回修'||row.formulaType==='回修'?'repair':row.round===0?'first':'linked';
const confirmationCategories:[ConfirmationCategory,string][]=[['linked','变更'],['first','加料'],['repair','回修']];
const confirmationSource=(records:LabRecord[])=>records.slice(0,10).map((row,index)=>({...row,key:`formula-confirmation-${row.key}`,round:index<3?0:index<7?Math.max(1,row.round):row.round,halfInspectionDirection:row.halfInspectionDirection??['正常','偏蓝','正常','偏黄','偏绿','正常','偏蓝','偏黄','正常','偏红'][index],halfInspectionDeviation:row.halfInspectionDeviation??['正常','偏浅','正常','偏深','偏浅','正常','偏深','偏浅','正常','偏深'][index],...(index>=7?{formulaType:'回修' as const,type:'回修'}:{})}));
const confirmationFormulaNo=(row:LabRecord)=>/v\d+$/.test(row.formula)?row.formula:`C${String(row.ratio).padStart(2,'0')}${row.formula.replace(/^C/,'')}v0`;
const initialConfirmationLog=(records:LabRecord[])=>{
 const saved=readLog();
 if(localStorage.getItem('lab-formula-confirmations-demo-seeded'))return saved;
 const source=confirmationSource(records);
 for(const [category] of confirmationCategories){
  const group=source.filter(row=>confirmationCategory(row)===category);
  if(group.length&&!group.some(row=>saved[row.key]?.status==='已确认')){
   const target=group.find(row=>!saved[row.key])??group[0];
   saved[target.key]={status:'已确认',operator:'水木',time:new Date().toISOString()};
  }
 }
 saveLog(saved);
 localStorage.setItem('lab-formula-confirmations-demo-seeded','1');
 return saved;
};
const directionColor=(value:string)=>value.includes('红')?'red':value.includes('黄')?'gold':value.includes('蓝')?'blue':value.includes('绿')?'green':undefined;
const depthLabel=(value:string)=>value.includes('深')?`↑ ${value}`:value.includes('浅')?`↓ ${value}`:value;

export default function FormulaConfirmationPage({records}:{records:LabRecord[]}){
 const {message}=App.useApp();
 const [orderQuery,setOrderQuery]=useState('');
 const [colorQuery,setColorQuery]=useState('');
 const [cardQuery,setCardQuery]=useState('');
 const [dates,setDates]=useState<RangeValue>(null);
 const [applied,setApplied]=useState({order:'',color:'',card:'',start:'',end:''});
 const [category,setCategory]=useState<ConfirmationCategory>('linked');
 const [log,setLog]=useState<ConfirmationLog>(()=>initialConfirmationLog(records));
 const [detail,setDetail]=useState<LabRecord|null>(null);
 const [historyBath,setHistoryBath]=useState(6);
 const [selectedHistoryFormula,setSelectedHistoryFormula]=useState('');
 const [editOpen,setEditOpen]=useState(false);
 const [editFormula,setEditFormula]=useState<Formula|null>(null);
 const [editReasonOpen,setEditReasonOpen]=useState(false);
 const [editReason,setEditReason]=useState('');
 const [rejectOpen,setRejectOpen]=useState(false);
 const [rejectReason,setRejectReason]=useState('');
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [confirmReason,setConfirmReason]=useState('');
 const [retryLog,setRetryLog]=useState<ConfirmationRetryLog>(readRetryLog);
 const [retryOpen,setRetryOpen]=useState(false);
 const [retryFormula,setRetryFormula]=useState<Formula|null>(null);
 const [retryReason,setRetryReason]=useState('');
 const source=confirmationSource(records);
 const formulaChanges=loadFormulaState().changes;
 const matchingRecords=readRecords();
 const scheduleJobs=readScheduleJobs();
 const remainingVats=(row:LabRecord)=>new Set(scheduleJobs.filter(job=>job.order===row.order&&job.color===row.color&&!job.completed&&job.state!=='running'&&displayProcessCard(job.card)!==displayProcessCard(row.processCard??'')).map(job=>job.id)).size;
 const resampleStatus=(row:LabRecord)=>formulaChanges.filter(change=>change.retry&&(row.processCard?change.card===row.processCard:change.order===row.order&&change.colorNo===row.colorNo)).sort((left,right)=>right.submittedAt.localeCompare(left.submittedAt))[0]?.retry??retryLog[row.key];
 const matchingResult=(row:LabRecord)=>row.processCard?matchingRecords[row.processCard]:undefined;
 const detailBaseFormula=(row:LabRecord):Formula=>({bath:row.ratio,rows:matchingFormula.slice(0,4).map(formulaRow=>({...formulaRow,name:'',process:formulaRow.code==='CP1'?'02':formulaRow.code==='B28'?'67':'',processName:formulaRow.code==='CP1'?"130°C*10′":formulaRow.code==='B28'?"60°C*50′":'',ph:formulaRow.code==='CP1'?'3.4–5.6':formulaRow.code==='B28'?'10.8–11.8':''}))});
 const detailChangedFormula=(row:LabRecord,base:Formula):Formula|undefined=>{
  const saved=matchingResult(row)?.formula;
  const rows=saved?.length?base.rows.map(baseRow=>({...baseRow,...saved.find(savedRow=>savedRow.code===baseRow.code)})):((row.additionCount??0)>=2?base.rows.map((formulaRow,index)=>index<2?{...formulaRow,ratio:Number(((formulaRow.ratio??0)+(index===0?0.1:0.05)).toFixed(3))}:formulaRow):undefined);
  if(!rows||rows.length!==base.rows.length||!rows.some((formulaRow,index)=>formulaRow.ratio!==base.rows[index]?.ratio))return undefined;
  return {bath:matchingResult(row)?.bathRatio??base.bath,rows};
 };
 const currentOrderFormula=(row:LabRecord):Formula=>{const base=detailBaseFormula(row);return log[row.key]?.formula??detailChangedFormula(row,base)??base};
 const detailHistoryRows=(row:LabRecord,bath:number):FormulaHistoryRow[]=>{
  const prefix=`C${String(bath).padStart(2,'0')}`;
  const root=confirmationFormulaNo(row).replace(/^C\d{2}/,prefix).replace(/v\d+$/,'');
  const reasons=['优化主染料比例','延长保温并校正 pH','降低红色染料比例','修正色光，增加蓝色染料','初始配方'];
  const versions=reasons.map((reason,index)=>({key:`${root}v${4-index}`,formula:`${root}v${4-index}`,bath,reason,created:dayjs(row.created).subtract(index,'day').format('YYYY-MM-DD HH:mm'),confirmed:index>0,operator:index>0?'水木':'—'}));
  return [...versions,{key:`A${root.slice(1)}v0`,formula:`A${root.slice(1)}v0`,bath,reason:'小样确认配方',created:dayjs(row.created).subtract(5,'day').format('YYYY-MM-DD HH:mm'),confirmed:true,operator:'水木',isSample:true}];
 };
 const detailHistoryFormula=(row:LabRecord,formulaNo:string):Formula=>{
  const base=detailBaseFormula(row),version=Number(formulaNo.match(/v(\d+)$/)?.[1]??0);
  return {...base,bath:historyBath,rows:base.rows.map((formulaRow,index)=>({...formulaRow,ratio:Number(((formulaRow.ratio??0)+(version>0&&index<3?(version*(3-index))/100:0)).toFixed(3))}))};
 };
 const detailLinkedCards=(row:LabRecord,formulaNo:string):LinkedProcessCard[]=>{
  if(formulaNo.startsWith('A'))return [];
  const baseCard=row.processCard||'Y2608150005',match=baseCard.match(/^(.*?)(\d+)$/),cardPrefix=match?.[1]??baseCard,cardDigits=match?.[2]??'0005',baseNumber=Number(cardDigits);
  const directions=[row.colorDirection??'偏绿','正常','偏蓝'],depths=[row.shadeDeviation??'偏深','正常','偏浅'];
  return Array.from({length:3},(_,index)=>({
   card:match?`${cardPrefix}${String(Math.max(0,baseNumber-index*3)).padStart(cardDigits.length,'0')}`:`${baseCard}-${index+1}`,
   addition:Math.max(0,(row.additionCount??2)-index),
   defect:index===0?(matchingResult(row)?.reason||'—'):'—',
   halfDirection:index===1?'正常':directions[index],halfDepth:index===1?'正常':depths[index],
   finishedDirection:index===2?'正常':directions[index],finishedDepth:index===2?'正常':depths[index],
  }));
 };
 const detailHistoryCards=(row:LabRecord,bath:number):HistoryProcessCard[]=>detailHistoryRows(row,bath).flatMap(history=>{
  const linked=detailLinkedCards(row,history.formula),cards=linked.length?linked:[{card:'—',addition:-1,defect:'—',halfDirection:'正常',halfDepth:'正常',finishedDirection:'正常',finishedDepth:'正常'}];
  return cards.map((card,index)=>({...card,key:`${history.formula}-${card.card}-${index}`,formula:history.formula,reason:history.reason,groupStart:index===0,groupSize:cards.length,confirmed:history.confirmed,isSample:history.isSample}));
 });
 const selectedHistoryEntry=detail&&selectedHistoryFormula?detailHistoryRows(detail,historyBath).find(row=>row.formula===selectedHistoryFormula):undefined;
 const renderMatch=(direction:string,depth:string)=>direction==='正常'&&depth==='正常'?<Tag color="green">OK</Tag>:<Space size={4}><Tag color={directionColor(direction)}>{direction}</Tag><Tag className={`formula-confirmation-depth ${depth.includes('深')?'deep':depth.includes('浅')?'light':'normal'}`}>{depthLabel(depth)}</Tag></Space>;
 const categoryRows=source.filter(row=>confirmationCategory(row)===category);
 const rows=categoryRows.filter(row=>{
  const current=log[row.key]?.status??'待确认';
  const created=row.created.slice(0,10);
  return current==='待确认'&&row.order.toLowerCase().includes(applied.order)&&row.colorNo.toLowerCase().includes(applied.color)&&(row.processCard??'').toLowerCase().includes(applied.card)&&(!applied.start||created>=applied.start)&&(!applied.end||created<=applied.end);
 });
 const search=()=>setApplied({order:orderQuery.trim().toLowerCase(),color:colorQuery.trim().toLowerCase(),card:cardQuery.trim().toLowerCase(),start:dates?.[0]?.format('YYYY-MM-DD')??'',end:dates?.[1]?.format('YYYY-MM-DD')??''});
 const reset=()=>{setOrderQuery('');setColorQuery('');setCardQuery('');setDates(null);setApplied({order:'',color:'',card:'',start:'',end:''})};
 const closeRetry=()=>{setRetryOpen(false);setRetryFormula(null);setRetryReason('')};
 const closeDetail=()=>{setDetail(null);setSelectedHistoryFormula('');setEditOpen(false);setEditFormula(null);setEditReasonOpen(false);setEditReason('');setRejectOpen(false);setRejectReason('');setConfirmOpen(false);setConfirmReason('');closeRetry()};
 const decide=(row:LabRecord,nextStatus:ConfirmationStatus,successText?:string,reason='',formula?:Formula)=>{
  const next={...log,[row.key]:{status:nextStatus,operator:'水木',time:new Date().toISOString(),...(reason.trim()?{reason:reason.trim()}:{}),...(formula?{formula:structuredClone(formula)}:{})}};
  setLog(next);saveLog(next);closeDetail();message.success(successText??(nextStatus==='已确认'?'配方已确认':'配方已标记为未确认'));
 };
 const openRetry=()=>{if(!detail)return;setRetryFormula(structuredClone(currentOrderFormula(detail)));setRetryReason('');setRetryOpen(true)};
 const requestRetry=()=>{if(!detail||!retryFormula)return;if(!retryFormula.bath||!retryFormula.rows.length||retryFormula.rows.some(row=>!row.code.trim()||row.ratio===null||row.ratio<0)){message.warning('请填写有效的浴比、染助剂和比例');return}if(!retryReason.trim()){message.warning('请填写复样原因');return}const next={...retryLog,[detail.key]:{requestedAt:new Date().toISOString(),operator:'水木',reason:retryReason.trim(),formula:structuredClone(retryFormula)}};setRetryLog(next);saveRetryLog(next);closeDetail();message.success('已发起复样，配方继续保持待确认')};
 const openEdit=()=>{if(!detail)return;setEditFormula(structuredClone(currentOrderFormula(detail)));setEditOpen(true)};
 const openEditReason=()=>{if(!editFormula)return;if(!editFormula.bath||!editFormula.rows.length||editFormula.rows.some(row=>!row.code.trim()||row.ratio===null||row.ratio<0)){message.warning('请填写有效的浴比、染助剂和比例');return}setEditReason('');setEditReasonOpen(true)};
 const saveEdit=()=>{if(!detail||!editFormula||!editReason.trim())return;const previous=log[detail.key];const next={...log,[detail.key]:{status:previous?.status??'待确认',operator:'水木',time:new Date().toISOString(),reason:editReason.trim(),formula:structuredClone(editFormula)}};setLog(next);saveLog(next);setEditReasonOpen(false);setEditReason('');setEditOpen(false);setEditFormula(null);message.success('配方已保存')};
 return <section className="panel formula-confirmation-page">
  <div className="formula-confirmation-filters"><label><span>订字：</span><Input aria-label="确认订字" placeholder="请输入订字" value={orderQuery} onChange={event=>setOrderQuery(event.target.value)} onPressEnter={search}/></label><label><span>色号：</span><Input aria-label="确认色号" placeholder="请输入色号" value={colorQuery} onChange={event=>setColorQuery(event.target.value)} onPressEnter={search}/></label><label><span>流程卡号：</span><Input aria-label="确认流程卡号" placeholder="请输入流程卡号" value={cardQuery} onChange={event=>setCardQuery(event.target.value)} onPressEnter={search}/></label><label className="formula-confirmation-date"><span>创建时间：</span><DatePicker.RangePicker aria-label="确认创建时间" value={dates} onChange={value=>setDates(value as RangeValue)} format="YYYY-MM-DD"/></label><span className="formula-confirmation-filter-spacer"/><Button type="primary" onClick={search}>查询</Button><Button onClick={reset}>重置</Button></div>
  <div className="formula-confirmation-heading"><div className="formula-confirmation-tab-heading"><i/><Tabs activeKey={category} onChange={key=>setCategory(key as ConfirmationCategory)} items={confirmationCategories.map(([key,label])=>({key,label:`${label} (${source.filter(row=>confirmationCategory(row)===key).length})`}))}/></div><Space size={6}><Tag color="blue">待确认 {categoryRows.filter(row=>(log[row.key]?.status??'待确认')==='待确认').length} 条</Tag><Tooltip title="全屏"><Button type="text" icon={<FullscreenOutlined/>} onClick={()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}/></Tooltip><Tooltip title="刷新"><Button type="text" icon={<ReloadOutlined/>} onClick={()=>setLog(readLog())}/></Tooltip><Tooltip title="表格密度"><Button type="text" icon={<ColumnHeightOutlined/>} onClick={()=>document.body.classList.toggle('comfortable')}/></Tooltip><Tooltip title="显示设置"><Button type="text" icon={<SettingOutlined/>}/></Tooltip></Space></div>
  <Table<LabRecord> className="formula-confirmation-table" bordered size="small" rowKey="key" tableLayout="fixed" dataSource={rows} pagination={false} locale={{emptyText:'暂无符合条件的待确认配方'}} columns={[
   {title:'序号',width:55,align:'center',render:(_,__,index)=>index+1},
   {title:'订字',dataIndex:'order',width:150,ellipsis:true},
   {title:'品名',dataIndex:'product',width:140,ellipsis:true},
   {title:'色号',dataIndex:'colorNo',width:140,ellipsis:true},
   {title:'配方号',width:170,ellipsis:true,render:(_,row)=>confirmationFormulaNo(row)},
   {title:'流程卡号',dataIndex:'processCard',width:145,ellipsis:true,render:value=>value||''},
   {title:'浴比',dataIndex:'ratio',width:80,align:'center',render:value=>`1:${value}`},
   {title:'加料次数',width:90,align:'center',render:(_,row)=>`${matchingResult(row)?.additions.length??row.additionCount??0}次`},
   {title:'染色对样',width:170,align:'center',render:(_,row)=>{const matched=matchingResult(row),additionCount=matched?.additions.length??row.additionCount??0;if(additionCount===0)return <Tag color="green">OK</Tag>;const latest=matched?.additions.at(-1),direction=latest?.direction??row.colorDirection??'正常',depth=latest?.depth??row.shadeDeviation??'正常';return <Space className="formula-confirmation-defect" size={4}><Tag color={directionColor(direction)}>{direction}</Tag><Tag className={`formula-confirmation-depth ${depth.includes('深')?'deep':depth.includes('浅')?'light':'normal'}`}>{depthLabel(depth)}</Tag></Space>}},
   {title:'成品对样',width:170,align:'center',render:(_,row)=>{const direction=row.halfInspectionDirection,depth=row.halfInspectionDeviation;if(!direction||!depth)return <Tag>待对样</Tag>;if(direction==='正常'&&depth==='正常')return <Tag color="green">OK</Tag>;return <Space className="formula-confirmation-defect" size={4}><Tag color={directionColor(direction)}>{direction}</Tag><Tag className={`formula-confirmation-depth ${depth.includes('深')?'deep':depth.includes('浅')?'light':'normal'}`}>{depthLabel(depth)}</Tag></Space>}},
   {title:'不良',width:110,align:'center',render:(_,row)=>matchingResult(row)?.reason||'-'},
   {title:'剩余库存',width:100,align:'center',render:(_,row)=>`${remainingVats(row)} 匹`},
   {title:'复样状态',width:100,align:'center',render:(_,row)=>{const retry=resampleStatus(row);return retry?<Tag color={'completedAt' in retry&&retry.completedAt?'green':'blue'}>{'completedAt' in retry&&retry.completedAt?'重打完成':'待分配'}</Tag>:'—'}},
   {title:'操作',width:110,align:'center',render:(_,row)=>{const current=log[row.key]?.status??'待确认';return <Button type="link" disabled={current!=='待确认'} onClick={()=>{setDetail(row);setHistoryBath(row.ratio);setSelectedHistoryFormula('')}}>去确认</Button>}},
  ]}/>
  <Modal className="formula-confirmation-modal" title={detail?<span>{detail.order}　{detail.colorNo}</span>:undefined} width="calc(100vw - 40px)" style={{top:12}} open={!!detail} onCancel={closeDetail} footer={detail&&<Space><Button disabled={!!retryLog[detail.key]} onClick={openRetry}>{retryLog[detail.key]?'复样已发起':'发起复样'}</Button><Button danger onClick={()=>setRejectOpen(true)}>配方不确认</Button><Button type="primary" onClick={()=>{setConfirmReason('');setConfirmOpen(true)}}>配方确认</Button></Space>}>
   {detail&&<><h3 className="formula-confirmation-section">流程卡详情</h3><Descriptions className="formula-confirmation-card-details" bordered size="small" column={3} items={[
    {key:'base',label:'基础信息',children:[detail.processCard||'—',detail.order,detail.product].join(' | ')},
    {key:'color',label:'颜色信息',children:[detail.colorNo,detail.color,detail.depth].join(' | ')},
    {key:'greige',label:'白坯信息',children:`门幅${detail.greigeWidth||'150cm'} | 克重${detail.greigeWeight||'200g'}`},
    {key:'bad',label:'不良信息',children:'— | — | —'},
    {key:'meters',label:'米数信息',children:'预配1匹 | 实配1匹 | 实配100米'},
    {key:'finished',label:'成品要求',children:'门幅无要求 | 克重无要求'},
    {key:'processing',label:'加工要求',children:'成品手感：滑爽 | 成品光暗：一般 | 布面起皱风格：否 | 布面光洁：否 | 高牢度：否 | 预缩要求：否',span:2},
    {key:'opening',label:'开卡信息',children:`${detail.worker} | ${dayjs(detail.created).format('YYYY/M/D HH:mm:ss')}`},
   ]}/><div className="formula-confirmation-history-layout"><section className="formula-confirmation-history-list"><div className="formula-confirmation-history-heading"><h3 className="formula-confirmation-section">配方履历</h3><Tabs className="formula-confirmation-bath-heading-tabs" activeKey={String(historyBath)} onChange={key=>{setHistoryBath(Number(key));setSelectedHistoryFormula('')}} items={Array.from(new Set([4,6,detail.ratio])).map(bath=>({key:String(bath),label:`浴比 1:${bath}`}))}/></div><div className="formula-confirmation-history-browser"><div className="formula-confirmation-history-main"><Table<HistoryProcessCard> className="formula-confirmation-history-cards" bordered size="small" rowKey="key" tableLayout="fixed" pagination={false} scroll={{y:245}} dataSource={detailHistoryCards(detail,historyBath)} locale={{emptyText:'该浴比暂无配方履历'}} columns={[
    {title:'配方号',width:150,onCell:row=>({rowSpan:row.groupStart?row.groupSize:0,style:{verticalAlign:'middle'}}),render:(_,row)=><div className="formula-confirmation-history-formula-cell"><a onClick={()=>setSelectedHistoryFormula(row.formula)}>{row.formula}{row.isSample&&<Tag color="blue">小样</Tag>}{!row.confirmed&&<sup className="formula-confirmation-unconfirmed">未确认</sup>}</a><small>{row.reason}</small></div>},
    {title:'流程卡号',dataIndex:'card',width:125,ellipsis:true},
    {title:'加料',dataIndex:'addition',width:55,align:'center',render:value=>value<0?'—':`${value}次`},
    {title:'不良',dataIndex:'defect',width:65,align:'center',ellipsis:true},
    {title:'半检对样',width:145,align:'center',render:(_,row)=>renderMatch(row.halfDirection,row.halfDepth)},
    {title:'成品对样',width:145,align:'center',render:(_,row)=>renderMatch(row.finishedDirection,row.finishedDepth)},
   ]}/></div></div></section><section className="formula-confirmation-history-detail"><div className="formula-confirmation-current-order"><div className="formula-confirmation-history-detail-heading"><h3>当前订单配方<span>配方号：{confirmationFormulaNo(detail)}</span></h3>{editOpen?<Space size={4}><Button size="small" onClick={()=>{setEditOpen(false);setEditFormula(null)}}>取消</Button><Button className="formula-confirmation-inline-save" type="primary" size="small" onClick={openEditReason}>保存</Button></Space>:<Space size={4}><Button type="link" size="small" icon={<EditOutlined/>} onClick={openEdit}>编辑</Button><Button type="link" size="small" icon={<PrinterOutlined/>} onClick={()=>window.print()}>打印</Button></Space>}</div><div className="formula-confirmation-detail">{editOpen&&editFormula?<DyeFormulaTable compact fitWidth formula={editFormula} editing showBath onChange={setEditFormula}/>:<DyeFormulaTable compact fitWidth formula={currentOrderFormula(detail)}/>}</div></div></section></div></>}
  </Modal>
  <Modal className="formula-confirmation-retry-modal" title="调整配方后发起复样" width="min(1100px, calc(100vw - 48px))" open={retryOpen&&!!detail&&!!retryFormula} onCancel={closeRetry} onOk={requestRetry} okText="确认并发起复样" cancelText="取消" destroyOnHidden>
   {detail&&retryFormula&&<><div className="formula-confirmation-retry-summary"><span>流程卡：<b>{detail.processCard||'—'}</b></span><span>订字：<b>{detail.order}</b></span><span>色号：<b>{detail.colorNo||'—'}</b></span></div><h3 className="formula-confirmation-section">调整复样配方</h3><DyeFormulaTable formula={retryFormula} original={currentOrderFormula(detail)} editing compact fitWidth showBath onChange={setRetryFormula}/><label className="formula-confirmation-retry-reason"><span>复样原因</span><Input.TextArea aria-label="复样原因" rows={3} value={retryReason} onChange={event=>setRetryReason(event.target.value)} placeholder="请填写本次复样原因"/></label></>}
  </Modal>
  <Modal title={selectedHistoryFormula?<div className="formula-confirmation-detail-modal-title"><strong>配方详情　{selectedHistoryFormula}</strong><div><span>确认人：{selectedHistoryEntry?.confirmed?selectedHistoryEntry.operator:'—'}</span><span>确认时间：{selectedHistoryEntry?.confirmed?selectedHistoryEntry.created:'—'}</span><span>变更原因：{selectedHistoryEntry?.reason??'—'}</span></div></div>:'配方详情'} width={1000} open={!!detail&&!!selectedHistoryFormula} onCancel={()=>setSelectedHistoryFormula('')} footer={null} destroyOnHidden>{detail&&selectedHistoryFormula&&<div className="formula-confirmation-detail-modal"><DyeFormulaTable compact fitWidth formula={detailHistoryFormula(detail,selectedHistoryFormula)}/></div>}</Modal>
  <Modal title="暂不确认" open={rejectOpen&&!!detail} onCancel={()=>{setRejectOpen(false);setRejectReason('')}} onOk={()=>{if(detail)decide(detail,'已退回','配方已标记为暂不确认',rejectReason)}} okText="确认" cancelText="取消" okButtonProps={{danger:true,disabled:!rejectReason.trim()}}><label htmlFor="formula-reject-reason"><span style={{color:'#ff4d4f'}}>*</span> 暂不确认原因</label><Input.TextArea id="formula-reject-reason" aria-label="暂不确认原因" placeholder="请填写暂不确认原因（必填）" value={rejectReason} onChange={event=>setRejectReason(event.target.value)} rows={4} style={{marginTop:8}}/></Modal>
  <Modal title="保存配方" open={editReasonOpen&&!!detail&&!!editFormula} onCancel={()=>{setEditReasonOpen(false);setEditReason('')}} onOk={saveEdit} okText="保存配方" cancelText="取消" okButtonProps={{disabled:!editReason.trim()}}><label htmlFor="formula-edit-reason"><span style={{color:'#ff4d4f'}}>*</span> 变更原因</label><Input.TextArea id="formula-edit-reason" aria-label="编辑配方变更原因" placeholder="请填写本次配方变更原因（必填）" value={editReason} onChange={event=>setEditReason(event.target.value)} rows={4} style={{marginTop:8}}/></Modal>
  <Modal title="确认配方" open={confirmOpen&&!!detail} onCancel={()=>{setConfirmOpen(false);setConfirmReason('')}} onOk={()=>{if(detail)decide(detail,'已确认','配方已确认',confirmReason,currentOrderFormula(detail))}} okText="确认配方" cancelText="取消" okButtonProps={{disabled:!confirmReason.trim()}}><label htmlFor="formula-confirm-reason"><span style={{color:'#ff4d4f'}}>*</span> 变更原因</label><Input.TextArea id="formula-confirm-reason" aria-label="变更原因" placeholder="请填写本次配方变更原因（必填）" value={confirmReason} onChange={event=>setConfirmReason(event.target.value)} rows={4} style={{marginTop:8}}/></Modal>
 </section>;
}
