import {ensureFormulaChangeDemo} from './formula-change-demo';
import {useEffect,useState} from 'react';
import {App,Button,DatePicker,Descriptions,Empty,Input,Modal,Popover,Select,Space,Table,Tag,Tooltip} from 'antd';
import {ColumnHeightOutlined,FullscreenOutlined,InfoCircleOutlined,ReloadOutlined,SettingOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import {dyeReviewCards} from './dye-review-cards';
import './formula-change-workspace.css';
import './formula-change-review.css';
import {loadFormulaState,requestFormulaRetry,reviewFormula,saveFormulaState,updateReviewFormula,type Change,type Formula} from './dye-formula-model';
import {formulaChangeDefaultDates,formulaRetryProgress,type FormulaRetryProgress} from './formula-change-filters';
import DyeFormulaTable from './DyeFormulaTable';

const hiddenChangeReasons=new Set(['色光偏红，红染料用量降低10%','对样颜色偏浅，艳蓝用量提高8%']);
const changeStatusOptions=[{value:'待工段长审核',label:'待确认'},{value:'已通过',label:'已确认'},{value:'已退回',label:'未确认生产'}];
const retryProgressColors:Record<FormulaRetryProgress,string>={'待分配':'orange','进行中':'blue','已完成':'green'};
function changeTypes(change:Change){
 if(change.changeTypes?.length)return change.changeTypes;
 if(change.requestType==='bath')return ['浴比调整'];
 if(change.requestType==='auxiliary')return ['助剂调整'];
 return ['助剂调整'];
}
function changeReason(reason:string){
 const separator=reason.indexOf('：');
 return separator>=0?reason.slice(separator+1).trim():reason;
}
function waitingDuration(change:Change){
 const end=change.status==='待工段长审核'?dayjs():dayjs(change.reviewedAt??change.submittedAt);
 const minutes=Math.max(0,end.diff(dayjs(change.submittedAt),'minute'));
 const days=Math.floor(minutes/1440),hours=Math.floor(minutes%1440/60),rest=minutes%60;
 return days?`${days}天${hours}小时`:hours?`${hours}小时${rest}分`:`${rest}分钟`;
}

export default function FormulaChangeReview(){
 const {message}=App.useApp();
 const [defaultDates]=useState(()=>formulaChangeDefaultDates());
 const [state,setState]=useState(()=>loadFormulaState());
 const [orderQuery,setOrderQuery]=useState('');
 const [colorQuery,setColorQuery]=useState('');
 const [cardQuery,setCardQuery]=useState('');
 const [applied,setApplied]=useState({order:'',color:'',card:''});
 const [startDate,setStartDate]=useState<dayjs.Dayjs|null>(defaultDates.start);
 const [endDate,setEndDate]=useState<dayjs.Dayjs|null>(defaultDates.end);
 const [filterStatus,setFilterStatus]=useState<string>('待工段长审核');
 const [selectedKeys,setSelectedKeys]=useState<string[]>([]);
 const [selected,setSelected]=useState<Change|null>(null);
 const [detailOpen,setDetailOpen]=useState(false);
 const [editing,setEditing]=useState(false);
 const [draft,setDraft]=useState<Formula|null>(null);
 const [confirmationMode,setConfirmationMode]=useState<'original'|'requested'|'custom'|null>(null);
 useEffect(()=>{setState(ensureFormulaChangeDemo())},[]);
 const rows=state.changes.filter(change=>(change.category??'change')==='change'&&!hiddenChangeReasons.has(change.reason)&&change.order.toLowerCase().includes(applied.order)&&(change.colorNo??'').toLowerCase().includes(applied.color)&&change.card.toLowerCase().includes(applied.card)&&(!filterStatus||change.status===filterStatus)&&(!startDate||!dayjs(change.submittedAt).isBefore(startDate.startOf('day')))&&(!endDate||!dayjs(change.submittedAt).isAfter(endDate.endOf('day')))).slice(0,10);
 const selectedInfo=selected?dyeReviewCards.find(item=>item.card===selected.card||item.order===selected.order):undefined;
 const displayedConfirmation=selected?(draft??(selected.status==='已通过'?(selected.formulaChoice==='original'?selected.before:selected.reviewedFormula??selected.after):null)):null;
 const startEditing=()=>{if(!selected)return;setDraft(structuredClone(selected.reviewedFormula??selected.after));setConfirmationMode('custom');setEditing(true)};
 const saveEditedFormula=()=>{if(!selected||!draft)return;try{const next=updateReviewFormula(loadFormulaState(),selected.id,draft);saveFormulaState(next);setState(next);setSelected(next.changes.find(change=>change.id===selected.id)??selected);setDraft(structuredClone(draft));setEditing(false);message.success('编辑配方已保存，请确认配方')}catch(error){message.error((error as Error).message)}};
 const search=()=>{setApplied({order:orderQuery.trim().toLowerCase(),color:colorQuery.trim().toLowerCase(),card:cardQuery.trim().toLowerCase()});setState(loadFormulaState())};
 const selectChange=(change:Change,open=true)=>{setSelected(change);setEditing(false);setConfirmationMode(null);setDraft(null);if(open)setDetailOpen(true)};
 const useFormula=(mode:'original'|'requested')=>{if(!selected)return;setDraft(structuredClone(mode==='original'?selected.before:selected.after));setConfirmationMode(mode);setEditing(false)};
 const confirmReview=()=>{if(!selected||!confirmationMode||!draft)return;try{let current=loadFormulaState();if(confirmationMode==='custom')current=updateReviewFormula(current,selected.id,draft);const choice=confirmationMode==='original'?'original':'requested';const next=reviewFormula(current,selected.id,true,'水木',confirmationMode==='original'?'使用原比例':confirmationMode==='requested'?'使用申请比例':'编辑确认比例',choice);saveFormulaState(next);setState(next);setSelected(null);setDetailOpen(false);setEditing(false);setDraft(null);setConfirmationMode(null);message.success('配方变更已确认');}catch(error){message.error((error as Error).message)}};
 const requestRetry=()=>{if(!selected)return;try{const next=requestFormulaRetry(loadFormulaState(),selected.id,'水木',selected.reason);saveFormulaState(next);setState(next);const updated=next.changes.find(change=>change.id===selected.id)??null;setSelected(updated);message.success('已发起复样，请到打样页面处理');}catch(error){message.error((error as Error).message)}};
 const resetFilters=()=>{const dates=formulaChangeDefaultDates();setOrderQuery('');setColorQuery('');setCardQuery('');setApplied({order:'',color:'',card:''});setStartDate(dates.start);setEndDate(dates.end);setFilterStatus('待工段长审核');setSelectedKeys([]);setState(loadFormulaState())};
 return <section className="panel formula-change-table-page">
  <div className="formula-change-table-filters"><label><span>订字：</span><Input aria-label="变更订字" placeholder="请输入订字" value={orderQuery} onChange={event=>setOrderQuery(event.target.value)} onPressEnter={search}/></label><label><span>色号：</span><Input aria-label="变更色号" placeholder="请输入色号" value={colorQuery} onChange={event=>setColorQuery(event.target.value)} onPressEnter={search}/></label><label><span>流程卡号：</span><Input aria-label="变更流程卡号" placeholder="请输入流程卡号" value={cardQuery} onChange={event=>setCardQuery(event.target.value)} onPressEnter={search}/></label><label className="formula-change-date"><span>创建时间：</span><DatePicker.RangePicker aria-label="变更创建时间" value={[startDate,endDate]} onChange={value=>{setStartDate(value?.[0]??null);setEndDate(value?.[1]??null)}} format="YYYY-MM-DD"/></label><label><span>变更状态：</span><Select aria-label="变更状态" allowClear placeholder="状态：请选择" value={filterStatus} onChange={setFilterStatus} options={changeStatusOptions}/></label><span className="formula-change-filter-spacer"/><Button type="primary" onClick={search}>查询</Button><Button onClick={resetFilters}>重置</Button></div>
  <div className="formula-change-table-heading"><div><i/><h2>配方变更</h2><Popover trigger="click" title="开发批注" content={<div className="dye-formula-note">此处展示染色工段提交的配方相关变更。<br/>状态包括：待确认、已确认、未确认生产。<br/>已确认状态下需额外显示确认人和确认时间。</div>}><Button type="text" style={{width:30,height:30,color:'#faad14',fontSize:19}} aria-label="查看配方变更开发批注" icon={<InfoCircleOutlined/>}/></Popover></div><Space size={6}><Tooltip title="全屏"><Button type="text" icon={<FullscreenOutlined/>} onClick={()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}/></Tooltip><Tooltip title="刷新"><Button type="text" icon={<ReloadOutlined/>} onClick={()=>setState(loadFormulaState())}/></Tooltip><Tooltip title="表格密度"><Button type="text" icon={<ColumnHeightOutlined/>} onClick={()=>document.body.classList.toggle('comfortable')}/></Tooltip><Tooltip title="显示设置"><Button type="text" icon={<SettingOutlined/>}/></Tooltip></Space></div>
  <Table<Change> className="formula-change-record-table" bordered size="small" rowKey="id" tableLayout="fixed" dataSource={rows} rowSelection={{selectedRowKeys:selectedKeys,onChange:keys=>setSelectedKeys(keys.map(String)),columnWidth:34}} pagination={{pageSize:20,showSizeChanger:false,showTotal:total=>`共 ${total} 条`}} locale={{emptyText:<Empty description="暂无符合条件的配方变更"/>}} scroll={{x:filterStatus==='已通过'?1580:1320}} onRow={change=>({onDoubleClick:()=>selectChange(change)})} columns={[
   {title:'序号',width:55,align:'center',render:(_,__,index)=>index+1},
   {title:'订字',dataIndex:'order',width:150,ellipsis:true},
   {title:'色号',width:120,ellipsis:true,render:(_,change)=>change.colorNo||dyeReviewCards.find(item=>item.card===change.card||item.order===change.order)?.colorNo||'—'},
   {title:'流程卡号',dataIndex:'card',width:145,ellipsis:true},
   {title:'变更类型',width:210,render:(_,change)=>{const types=changeTypes(change);return types.length?<Space size={[4,4]} wrap>{types.map(type=><Tag color="orange" key={type}>{type}</Tag>)}</Space>:<span className="muted">未记录</span>}},
   {title:'变更原因',dataIndex:'reason',width:220,ellipsis:true,render:value=>changeReason(value)},
   {title:'申请人',width:90,align:'center',render:(_,change)=>change.applicant?.trim()||'未记录'},
   {title:'申请时间',width:165,align:'center',render:(_,change)=>new Date(change.submittedAt).toLocaleString()},
   ...(filterStatus==='已通过'?[{title:'确认人',width:90,align:'center' as const,render:(_:unknown,change:Change)=>change.reviewer?.trim()||'未记录'},{title:'确认时间',width:165,align:'center' as const,render:(_:unknown,change:Change)=>change.reviewedAt?new Date(change.reviewedAt).toLocaleString():'未记录'}]:[]),
   {title:'等待时长',width:110,align:'center',render:(_,change)=>waitingDuration(change)},
   {title:<Space size={2}>复样进度<Tooltip title="此处显示复样进度：待分配、进行中、已完成。"><Button type="text" size="small" aria-label="查看复样进度说明" icon={<InfoCircleOutlined/>}/></Tooltip></Space>,width:120,align:'center',render:(_,change)=>{const progress=formulaRetryProgress(change);return <Tag color={retryProgressColors[progress]}>{progress}</Tag>}},
   {title:'操作',fixed:'right',width:90,align:'center',render:(_,change)=><Button type="link" onClick={()=>selectChange(change)}>{change.status==='待工段长审核'?'去处理':'查看'}</Button>},
  ]}/>
  <Modal className="formula-change-detail-modal" title={selected?<span>{selected.order}　{selected.colorNo||selectedInfo?.colorNo||'—'}</span>:undefined} width="calc(100vw - 40px)" style={{top:12}} open={detailOpen&&!!selected} onCancel={()=>{setDetailOpen(false);setEditing(false);setConfirmationMode(null);setDraft(null)}} footer={selected&&(selected.status!=='待工段长审核'?<Button onClick={()=>setDetailOpen(false)}>关闭</Button>:<div className="formula-change-detail-footer"><span>{confirmationMode==='original'?'将使用原比例':confirmationMode==='requested'?'将使用申请比例':confirmationMode==='custom'?'将使用编辑后的确认比例':''}</span><Space><Button disabled={!!selected.retry&&!selected.retry.completedAt} onClick={requestRetry}>{selected.retry&&!selected.retry.completedAt?'复样进行中':'发起复样'}</Button><Button onClick={()=>{setDetailOpen(false);setEditing(false);setConfirmationMode(null);setDraft(null)}}>取消</Button><Button type="primary" disabled={!confirmationMode||!draft||editing} onClick={confirmReview}>确认配方</Button></Space></div>)}>
   {selected&&<><div className="formula-change-card-summary"><h3 className="formula-change-modal-section formula-change-card-summary-title">流程卡详情</h3><Descriptions bordered size="small" column={3} items={[
    {key:'base',label:'基础信息',children:`${selected.card} | ${selected.order} | ${selectedInfo?.product||'短纤与棉'}`},{key:'colorSummary',label:'颜色信息',children:`${selected.colorNo||selectedInfo?.colorNo||'—'} | ${selectedInfo?.color||'—'} | ${selectedInfo?.depth||'—'}`},{key:'greige',label:'白坯信息',children:'门幅150cm | 克重200g'},
    {key:'badSummary',label:'不良信息',children:'— | — | —'},{key:'metersSummary',label:'米数信息',children:'预配1匹 | 实配1匹 | 实配100米'},{key:'finishedSummary',label:'成品要求',children:'门幅无要求 | 克重无要求'},
    {key:'processingSummary',label:'加工要求',children:'成品手感：滑爽 | 成品光暗：一般 | 布面起皱风格：否 | 布面光洁：否 | 高牢度：否 | 预缩要求：否',span:2},{key:'openingSummary',label:'开卡信息',children:`${selected.applicant?.trim()||'未记录'} | ${new Date(selected.submittedAt).toLocaleString()}`},
   ]}/></div><h3 className="formula-change-modal-section formula-change-formula-title">配方详情 <span className="formula-change-request-meta"><span><b>变更人：</b>{selected.applicant?.trim()||'未记录'}</span><span><b>变更时间：</b>{new Date(selected.submittedAt).toLocaleString()}</span><span><b>变更原因：</b>{changeReason(selected.reason)||'未记录'}</span></span></h3><div className="formula-change-pair-grid"><section><h3>变更前配方</h3><DyeFormulaTable compact fitWidth ratioTitle="大货比例" formula={selected.before}/></section><section><h3>申请配方</h3><DyeFormulaTable compact fitWidth ratioTitle="申请比例" original={selected.before} formula={selected.after}/></section><section><div className="formula-change-pair-heading"><h3>确认配方</h3>{selected.status==='待工段长审核'&&<Space size={6} wrap><Button size="small" type={confirmationMode==='original'?'primary':'default'} onClick={()=>useFormula('original')}>使用原比例</Button><Button size="small" type={confirmationMode==='requested'?'primary':'default'} onClick={()=>useFormula('requested')}>使用申请比例</Button><Button size="small" type={confirmationMode==='custom'?'primary':'default'} onClick={startEditing}>编辑配方</Button>{editing&&<Button size="small" type="primary" onClick={saveEditedFormula}>保存</Button>}</Space>}</div><DyeFormulaTable compact fitWidth={!editing} ratioTitle="确认比例" original={selected.after} formula={displayedConfirmation??{...selected.after,rows:selected.after.rows.map(row=>({...row,ratio:null}))}} editing={editing} onChange={setDraft}/></section></div></>}
  </Modal>
 </section>;
}
