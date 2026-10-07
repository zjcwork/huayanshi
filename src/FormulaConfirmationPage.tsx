import {useState} from 'react';
import {App,Button,DatePicker,Descriptions,Input,Modal,Select,Space,Table,Tabs,Tag,Tooltip} from 'antd';
import {ColumnHeightOutlined,FullscreenOutlined,ReloadOutlined,SettingOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import {type LabRecord} from './data';
import {loadFormulaState} from './dye-formula-model';
import type {Formula} from './dye-formula-model';
import {matchingFormula,readRecords,type AdditionBatch} from './matching-model';
import {readScheduleJobs} from './schedule-model';
import {displayProcessCard} from './formula-number';
import DyeFormulaTable from './DyeFormulaTable';
import './formula-confirmation-page.css';

type ConfirmationStatus='待确认'|'已确认'|'已退回';
type ConfirmationCategory='first'|'linked'|'repair';
type ConfirmationLog=Record<string,{status:ConfirmationStatus;operator:string;time:string;reason?:string;formula?:Formula}>;
type ConfirmationRetryLog=Record<string,{requestedAt:string;operator:string}>;

const readLog=():ConfirmationLog=>{try{return JSON.parse(localStorage.getItem('lab-formula-confirmations')||'{}')}catch{return {}}};
const saveLog=(value:ConfirmationLog)=>{localStorage.setItem('lab-formula-confirmations',JSON.stringify(value))};
const readRetryLog=():ConfirmationRetryLog=>{try{return JSON.parse(localStorage.getItem('lab-formula-confirmation-retries')||'{}')}catch{return {}}};
const saveRetryLog=(value:ConfirmationRetryLog)=>{localStorage.setItem('lab-formula-confirmation-retries',JSON.stringify(value))};
const confirmationCategory=(row:LabRecord):ConfirmationCategory=>row.type==='回修'||row.formulaType==='回修'?'repair':row.round===0?'first':'linked';
const confirmationCategories:[ConfirmationCategory,string][]=[['linked','变更'],['first','加料'],['repair','回修']];
const confirmationSource=(records:LabRecord[])=>records.slice(0,10).map((row,index)=>({...row,key:`formula-confirmation-${row.key}`,round:index<3?0:index<7?Math.max(1,row.round):row.round,halfInspectionDirection:row.halfInspectionDirection??['正常','偏蓝','正常','偏黄','偏绿','正常','偏蓝','偏黄','正常','偏红'][index],halfInspectionDeviation:row.halfInspectionDeviation??['正常','偏浅','正常','偏深','偏浅','正常','偏深','偏浅','正常','偏深'][index],...(index>=7?{formulaType:'回修' as const,type:'回修'}:{})}));
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
const confirmationStatusOptions=[{value:'待确认',label:'待确认'},{value:'已确认',label:'已确认'},{value:'已退回',label:'未确认'}];
const directionColor=(value:string)=>value.includes('红')?'red':value.includes('黄')?'gold':value.includes('蓝')?'blue':value.includes('绿')?'green':undefined;
const depthLabel=(value:string)=>value.includes('深')?`↑ ${value}`:value.includes('浅')?`↓ ${value}`:value;

export default function FormulaConfirmationPage({records}:{records:LabRecord[]}){
 const {message}=App.useApp();
 const [orderQuery,setOrderQuery]=useState('');
 const [cardQuery,setCardQuery]=useState('');
 const [applied,setApplied]=useState({order:'',card:''});
 const [startDate,setStartDate]=useState<dayjs.Dayjs|null>(null);
 const [endDate,setEndDate]=useState<dayjs.Dayjs|null>(null);
 const [status,setStatus]=useState<ConfirmationStatus>('待确认');
 const [category,setCategory]=useState<ConfirmationCategory>('linked');
 const [log,setLog]=useState<ConfirmationLog>(()=>initialConfirmationLog(records));
 const [detail,setDetail]=useState<LabRecord|null>(null);
 const [adjustOpen,setAdjustOpen]=useState(false);
 const [adjustFormula,setAdjustFormula]=useState<Formula|null>(null);
 const [adjustReason,setAdjustReason]=useState('');
 const [rejectOpen,setRejectOpen]=useState(false);
 const [rejectReason,setRejectReason]=useState('');
 const [retryLog,setRetryLog]=useState<ConfirmationRetryLog>(readRetryLog);
 const source=confirmationSource(records);
 const formulaChanges=loadFormulaState().changes;
 const matchingRecords=readRecords();
 const scheduleJobs=readScheduleJobs();
 const remainingVats=(row:LabRecord)=>new Set(scheduleJobs.filter(job=>job.order===row.order&&job.color===row.color&&!job.completed&&job.state!=='running'&&displayProcessCard(job.card)!==displayProcessCard(row.processCard??'')).map(job=>job.id)).size;
 const resampleStatus=(row:LabRecord)=>formulaChanges.filter(change=>change.retry&&(row.processCard?change.card===row.processCard:change.order===row.order&&change.colorNo===row.colorNo)).sort((left,right)=>right.submittedAt.localeCompare(left.submittedAt))[0]?.retry??retryLog[row.key];
 const matchingResult=(row:LabRecord)=>row.processCard?matchingRecords[row.processCard]:undefined;
 const detailAdditions=(row:LabRecord):AdditionBatch[]=>{
  const saved=matchingResult(row)?.additions;
  if(saved?.length)return saved;
  return Array.from({length:row.additionCount??0},(_,index)=>({
   code:matchingFormula[index%3].code,
   amount:0.1,
   reason:'模拟加料记录',
   time:row.created,
   mode:'正常加料',
   direction:row.colorDirection,
   depth:row.shadeDeviation,
   rows:matchingFormula.slice(0,3).map(formulaRow=>({...formulaRow,amount:0.1,process:String(index+1)})),
  }));
 };
 const detailBaseFormula=(row:LabRecord):Formula=>({bath:row.ratio,rows:matchingFormula.slice(0,4).map(formulaRow=>({...formulaRow,name:'',process:formulaRow.code==='CP1'?'02':formulaRow.code==='B28'?'67':'',processName:formulaRow.code==='CP1'?"130°C*10′":formulaRow.code==='B28'?"60°C*50′":'',ph:formulaRow.code==='CP1'?'3.4–5.6':formulaRow.code==='B28'?'10.8–11.8':''}))});
 const detailChangedFormula=(row:LabRecord,base:Formula):Formula|undefined=>{
  const saved=matchingResult(row)?.formula;
  const rows=saved?.length?base.rows.map(baseRow=>({...baseRow,...saved.find(savedRow=>savedRow.code===baseRow.code)})):((row.additionCount??0)>=2?base.rows.map((formulaRow,index)=>index<2?{...formulaRow,ratio:Number(((formulaRow.ratio??0)+(index===0?0.1:0.05)).toFixed(3))}:formulaRow):undefined);
  if(!rows||rows.length!==base.rows.length||!rows.some((formulaRow,index)=>formulaRow.ratio!==base.rows[index]?.ratio))return undefined;
  return {bath:matchingResult(row)?.bathRatio??base.bath,rows};
 };
 const categoryRows=source.filter(row=>confirmationCategory(row)===category);
 const rows=categoryRows.filter(row=>{
  const current=log[row.key]?.status??'待确认';
  const created=dayjs(row.created);
  return [row.order,row.colorNo].join(' ').toLowerCase().includes(applied.order)&&(row.processCard??'').toLowerCase().includes(applied.card)&&(!status||current===status)&&(!startDate||!created.isBefore(startDate.startOf('day')))&&(!endDate||!created.isAfter(endDate.endOf('day')));
 });
 const search=()=>setApplied({order:orderQuery.trim().toLowerCase(),card:cardQuery.trim().toLowerCase()});
 const reset=()=>{setOrderQuery('');setCardQuery('');setApplied({order:'',card:''});setStartDate(null);setEndDate(null);setStatus('待确认')};
 const closeDetail=()=>{setDetail(null);setAdjustOpen(false);setAdjustFormula(null);setAdjustReason('');setRejectOpen(false);setRejectReason('')};
 const decide=(row:LabRecord,nextStatus:ConfirmationStatus,successText?:string,reason='',formula?:Formula)=>{
  const next={...log,[row.key]:{status:nextStatus,operator:'水木',time:new Date().toISOString(),...(reason.trim()?{reason:reason.trim()}:{}),...(formula?{formula:structuredClone(formula)}:{})}};
  setLog(next);saveLog(next);closeDetail();message.success(successText??(nextStatus==='已确认'?'配方已确认':'配方已标记为未确认'));
 };
 const requestRetry=()=>{if(!detail)return;const next={...retryLog,[detail.key]:{requestedAt:new Date().toISOString(),operator:'水木'}};setRetryLog(next);saveRetryLog(next);closeDetail();message.success('已发起重打，配方继续保持待确认')};
 const openAdjust=()=>{if(!detail)return;const base=detailBaseFormula(detail);setAdjustFormula(structuredClone(detailChangedFormula(detail,base)??base));setAdjustReason('');setAdjustOpen(true)};
 const saveAdjust=()=>{if(!detail||!adjustFormula)return;if(!adjustReason.trim()){message.warning('请填写连缸调整原因');return}if(!adjustFormula.bath||!adjustFormula.rows.length||adjustFormula.rows.some(row=>!row.code.trim()||row.ratio===null||row.ratio<0)){message.warning('请填写有效的浴比、染助剂和比例');return}decide(detail,'已确认','连缸调整配方已保存',adjustReason,adjustFormula)};
 return <section className="panel formula-confirmation-page">
  <div className="formula-confirmation-filters"><Input aria-label="订字或色号" placeholder="订字色号：请输入" value={orderQuery} onChange={event=>setOrderQuery(event.target.value)} onPressEnter={search}/><Input aria-label="流程卡号" placeholder="流程卡号：请输入" value={cardQuery} onChange={event=>setCardQuery(event.target.value)} onPressEnter={search}/><DatePicker aria-label="提交开始日期" value={startDate} onChange={setStartDate} placeholder="开始日期" format="YYYY-MM-DD"/><DatePicker aria-label="提交结束日期" value={endDate} onChange={setEndDate} placeholder="结束日期" format="YYYY-MM-DD"/><Select aria-label="配方确认状态" allowClear placeholder="状态：请选择" value={status} onChange={setStatus} options={confirmationStatusOptions}/><span className="formula-confirmation-filter-spacer"/><Button type="primary" onClick={search}>查询</Button><Button onClick={reset}>重置</Button></div>
  <div className="formula-confirmation-heading"><div className="formula-confirmation-tab-heading"><i/><Tabs activeKey={category} onChange={key=>setCategory(key as ConfirmationCategory)} items={confirmationCategories.map(([key,label])=>({key,label:`${label} (${source.filter(row=>confirmationCategory(row)===key).length})`}))}/></div><Space size={6}><Tag color="blue">待确认 {categoryRows.filter(row=>(log[row.key]?.status??'待确认')==='待确认').length} 条</Tag><Tooltip title="全屏"><Button type="text" icon={<FullscreenOutlined/>} onClick={()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}/></Tooltip><Tooltip title="刷新"><Button type="text" icon={<ReloadOutlined/>} onClick={()=>setLog(readLog())}/></Tooltip><Tooltip title="表格密度"><Button type="text" icon={<ColumnHeightOutlined/>} onClick={()=>document.body.classList.toggle('comfortable')}/></Tooltip><Tooltip title="显示设置"><Button type="text" icon={<SettingOutlined/>}/></Tooltip></Space></div>
  <Table<LabRecord> className="formula-confirmation-table" bordered size="small" rowKey="key" tableLayout="fixed" dataSource={rows} pagination={false} locale={{emptyText:'暂无符合条件的待确认配方'}} columns={[
   {title:'序号',width:55,align:'center',render:(_,__,index)=>index+1},
   {title:'订字',dataIndex:'order',width:150,ellipsis:true},
   {title:'品名',dataIndex:'product',width:140,ellipsis:true},
   {title:'色号',dataIndex:'colorNo',width:140,ellipsis:true},
   {title:'流程卡号',dataIndex:'processCard',width:145,ellipsis:true,render:value=>value||''},
   {title:'浴比',dataIndex:'ratio',width:80,align:'center',render:value=>`1:${value}`},
   {title:'加料次数',width:90,align:'center',render:(_,row)=>`${matchingResult(row)?.additions.length??row.additionCount??0}次`},
   {title:'染色对样',width:170,align:'center',render:(_,row)=>{const matched=matchingResult(row),additionCount=matched?.additions.length??row.additionCount??0;if(additionCount===0)return <Tag color="green">OK</Tag>;const latest=matched?.additions.at(-1),direction=latest?.direction??row.colorDirection??'正常',depth=latest?.depth??row.shadeDeviation??'正常';return <Space className="formula-confirmation-defect" size={4}><Tag color={directionColor(direction)}>{direction}</Tag><Tag className={`formula-confirmation-depth ${depth.includes('深')?'deep':depth.includes('浅')?'light':'normal'}`}>{depthLabel(depth)}</Tag></Space>}},
   {title:'成品对样',width:170,align:'center',render:(_,row)=>{const direction=row.halfInspectionDirection,depth=row.halfInspectionDeviation;if(!direction||!depth)return <Tag>待对样</Tag>;if(direction==='正常'&&depth==='正常')return <Tag color="green">OK</Tag>;return <Space className="formula-confirmation-defect" size={4}><Tag color={directionColor(direction)}>{direction}</Tag><Tag className={`formula-confirmation-depth ${depth.includes('深')?'deep':depth.includes('浅')?'light':'normal'}`}>{depthLabel(depth)}</Tag></Space>}},
   {title:'不良',width:110,align:'center',render:(_,row)=>matchingResult(row)?.reason||'-'},
   {title:'剩余缸数',width:100,align:'center',render:(_,row)=>`${remainingVats(row)} 缸`},
   {title:'复样状态',width:100,align:'center',render:(_,row)=>{const retry=resampleStatus(row);return retry?<Tag color={'completedAt' in retry&&retry.completedAt?'green':'blue'}>{'completedAt' in retry&&retry.completedAt?'重打完成':'重打中'}</Tag>:'—'}},
   {title:'操作',width:110,align:'center',render:(_,row)=>{const current=log[row.key]?.status??'待确认';return <Button type="link" disabled={current!=='待确认'} onClick={()=>setDetail(row)}>去确认</Button>}},
  ]}/>
  <Modal className="formula-confirmation-modal" width="calc(100vw - 40px)" style={{top:12}} open={!!detail} onCancel={closeDetail} footer={detail&&<Space><Button type="primary" onClick={()=>decide(detail,'已确认','已确认连缸使用当前配方')}>连缸使用</Button><Button onClick={openAdjust}>连缸调整</Button><Button disabled={!!retryLog[detail.key]} onClick={requestRetry}>{retryLog[detail.key]?'重打已发起':'配方重打'}</Button><Button danger onClick={()=>setRejectOpen(true)}>配方不确认</Button></Space>}>
   {detail&&<><h3 className="formula-confirmation-section">流程卡详情</h3><Descriptions className="formula-confirmation-card-details" bordered size="small" column={5} items={[
    {key:'product',label:'品名',children:detail.product},{key:'colorNo',label:'色号',children:detail.colorNo},{key:'color',label:'颜色',children:detail.color},{key:'depth',label:'浅中深',children:detail.depth},{key:'ratio',label:'比例',children:'未填写'},
    {key:'weight',label:'白坯克重',children:detail.greigeWeight||'200g'},{key:'width',label:'白坯门幅',children:detail.greigeWidth||'150cm'},{key:'dye',label:'染料',children:detail.dyeCategory||'活性染料'},{key:'edge',label:'两纱边',children:'是'},{key:'shrink',label:'缩水',children:'无要求'},
    {key:'finishedWeight',label:'成品克重',children:'无要求'},{key:'finishedWidth',label:'成品门幅',children:'无要求'},{key:'planned',label:'预配匹数',children:'1'},{key:'actual',label:'实配匹数',children:'1'},{key:'meters',label:'实配米数',children:'100'},
    {key:'operator',label:'开卡人',children:detail.worker},{key:'time',label:'开卡时间',children:dayjs(detail.created).format('YYYY/M/D HH:mm:ss'),span:2},{key:'badProcess',label:'不良工序',children:'-'},{key:'defect',label:'不良',children:'-'},{key:'reason',label:'原因',children:'-'},
    {key:'requirements',label:'加工要求',children:detail.processingRequirements||'无要求',span:5},{key:'production',label:'生产要求',children:<Space wrap><Tag>成品手感：滑爽</Tag><Tag>成品光暗：一般</Tag><Tag>布面起皱风格：否</Tag><Tag>布面光洁：否</Tag><Tag>高牢度：否</Tag><Tag>预缩要求：否</Tag></Space>,span:5},
   ]}/><h3 className="formula-confirmation-section formula-confirmation-formula-title">配方详情</h3><div className="formula-confirmation-detail">{(()=>{const base=detailBaseFormula(detail);return <DyeFormulaTable compact fitWidth ratioTitle="大货配方比例" additions={detailAdditions(detail)} formula={base} changedFormula={detailChangedFormula(detail,base)}/>})()}</div></>}
  </Modal>
  <Modal title="连缸调整" width={1200} open={adjustOpen&&!!detail} onCancel={()=>{setAdjustOpen(false);setAdjustFormula(null);setAdjustReason('')}} onOk={saveAdjust} okText="保存调整并用于连缸" cancelText="取消" okButtonProps={{disabled:!adjustReason.trim()}} destroyOnHidden>{adjustFormula&&<><DyeFormulaTable formula={adjustFormula} editing showBath onChange={setAdjustFormula}/><Input.TextArea aria-label="连缸调整原因" placeholder="请输入连缸调整原因（必填）" value={adjustReason} onChange={event=>setAdjustReason(event.target.value)} rows={3} style={{marginTop:16}}/></>}</Modal>
  <Modal title="暂不确认" open={rejectOpen&&!!detail} onCancel={()=>{setRejectOpen(false);setRejectReason('')}} onOk={()=>{if(detail)decide(detail,'已退回','配方已标记为暂不确认',rejectReason)}} okText="确认" cancelText="取消" okButtonProps={{danger:true,disabled:!rejectReason.trim()}}><label htmlFor="formula-reject-reason"><span style={{color:'#ff4d4f'}}>*</span> 暂不确认原因</label><Input.TextArea id="formula-reject-reason" aria-label="暂不确认原因" placeholder="请填写暂不确认原因（必填）" value={rejectReason} onChange={event=>setRejectReason(event.target.value)} rows={4} style={{marginTop:8}}/></Modal>
 </section>;
}
