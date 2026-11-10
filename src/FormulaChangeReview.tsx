import {ensureFormulaChangeDemo} from './formula-change-demo';
import {useEffect,useRef,useState} from 'react';
import {Alert,App,Button,DatePicker,Descriptions,Empty,Input,Modal,Popover,Select,Space,Table,Tabs,Tag,Tooltip} from 'antd';
import {ColumnHeightOutlined,FullscreenOutlined,InfoCircleOutlined,ReloadOutlined,SettingOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import {dyeReviewCards} from './dye-review-cards';
import './formula-change-workspace.css';
import './formula-change-review.css';
import {loadFormulaState,requestFormulaRetry,reviewFormula,saveFormulaState,updateReviewFormula,type Change,type Formula} from './dye-formula-model';
import {formulaChangeDefaultDates,formulaRetryProgress,type FormulaRetryProgress} from './formula-change-filters';
import DyeFormulaTable from './DyeFormulaTable';
import FormulaBasicInfo from './FormulaBasicInfo';
import FormulaChangeComparison from './FormulaChangeComparison';
import {findFormulaChangeCard} from './formula-change-card';
import {queryRecords} from './data';
import './formula-change-detail.css';

const hiddenChangeReasons=new Set(['色光偏红，红染料用量降低10%','对样颜色偏浅，艳蓝用量提高8%']);
type WorkflowStatus='待变更'|'已变更'|'待确认'|'已确认';
const workflowStatuses:WorkflowStatus[]=['待变更','已变更','待确认','已确认'];
const changeStatusOptions=workflowStatuses.map(value=>({value,label:value}));
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
function workflowStatus(change:Change):WorkflowStatus{
 if(change.status==='已通过')return '已确认';
 if(change.status==='已退回')return '待变更';
 if(change.reviewedFormula||change.retry?.completedAt)return '已变更';
 return '待确认';
}

export default function FormulaChangeReview(){
 const {message,modal}=App.useApp();
 const [defaultDates]=useState(()=>formulaChangeDefaultDates());
 const [state,setState]=useState(()=>loadFormulaState());
 const [orderQuery,setOrderQuery]=useState('');
 const [colorQuery,setColorQuery]=useState('');
 const [cardQuery,setCardQuery]=useState('');
 const [applied,setApplied]=useState({order:'',color:'',card:''});
 const [startDate,setStartDate]=useState<dayjs.Dayjs|null>(defaultDates.start);
 const [endDate,setEndDate]=useState<dayjs.Dayjs|null>(defaultDates.end);
 const [filterStatus,setFilterStatus]=useState<WorkflowStatus>('待确认');
 const [selectedKeys,setSelectedKeys]=useState<string[]>([]);
 const [selected,setSelected]=useState<Change|null>(null);
 const [detailOpen,setDetailOpen]=useState(false);
 const [editing,setEditing]=useState(false);
 const [draft,setDraft]=useState<Formula|null>(null);
 const [confirmationMode,setConfirmationMode]=useState<'original'|'requested'|'custom'|null>(null);
 const [retryOpen,setRetryOpen]=useState(false);
 const [retryDraft,setRetryDraft]=useState<Formula|null>(null);
 const [retryReason,setRetryReason]=useState('');
 const editOrigin=useRef<{draft:Formula|null;mode:'original'|'requested'|'custom'|null}>({draft:null,mode:null});
 const detailTop=useRef<HTMLElement>(null);
 useEffect(()=>{if(detailOpen)detailTop.current?.closest<HTMLElement>('.ant-modal-body')?.scrollTo({top:0});},[detailOpen,selected?.id]);
 useEffect(()=>{setState(ensureFormulaChangeDemo())},[]);
 const eligibleChanges=state.changes.filter(change=>(change.category??'change')==='change'&&!hiddenChangeReasons.has(change.reason));
 const statusCounts=Object.fromEntries(workflowStatuses.map(status=>[status,eligibleChanges.filter(change=>workflowStatus(change)===status).length])) as Record<WorkflowStatus,number>;
 const rows=eligibleChanges.filter(change=>change.order.toLowerCase().includes(applied.order)&&(change.colorNo??'').toLowerCase().includes(applied.color)&&change.card.toLowerCase().includes(applied.card)&&workflowStatus(change)===filterStatus&&(!startDate||!dayjs(change.submittedAt).isBefore(startDate.startOf('day')))&&(!endDate||!dayjs(change.submittedAt).isAfter(endDate.endOf('day')))).slice(0,10);
 const selectedInfo=findFormulaChangeCard(selected,dyeReviewCards);
 const displayedConfirmation=selected?(draft??(selected.status==='已通过'?(selected.formulaChoice==='original'?selected.before:selected.reviewedFormula??selected.after):null)):null;
 const startEditing=()=>{if(!selected)return;editOrigin.current={draft:structuredClone(draft),mode:confirmationMode};setDraft(structuredClone(displayedConfirmation??selected.reviewedFormula??selected.after));setConfirmationMode('custom');setEditing(true)};
 const cancelEditing=()=>{setDraft(editOrigin.current.draft);setConfirmationMode(editOrigin.current.mode);setEditing(false)};
 const saveEditedFormula=()=>{if(!selected||!draft)return;try{const next=updateReviewFormula(loadFormulaState(),selected.id,draft);saveFormulaState(next);setState(next);setSelected(next.changes.find(change=>change.id===selected.id)??selected);setDraft(structuredClone(draft));setEditing(false);message.success('编辑配方已保存，请确认配方')}catch(error){message.error((error as Error).message)}};
 const search=()=>{setApplied({order:orderQuery.trim().toLowerCase(),color:colorQuery.trim().toLowerCase(),card:cardQuery.trim().toLowerCase()});setState(loadFormulaState())};
 const selectChange=(change:Change,open=true)=>{setSelected(change);setEditing(false);setConfirmationMode(null);setDraft(null);if(open)setDetailOpen(true)};
 const useFormula=(mode:'original'|'requested')=>{if(!selected)return;setDraft(structuredClone(mode==='original'?selected.before:selected.after));setConfirmationMode(mode);setEditing(false)};
 const confirmReview=()=>{if(!selected||!confirmationMode||!draft)return;try{let current=loadFormulaState();if(confirmationMode!=='original')current=updateReviewFormula(current,selected.id,draft);const choice=confirmationMode==='original'?'original':'requested';const next=reviewFormula(current,selected.id,true,'水木',confirmationMode==='original'?'使用原配方':confirmationMode==='requested'?'使用申请配方':'编辑确认配方',choice);saveFormulaState(next);setState(next);setSelected(null);setDetailOpen(false);setEditing(false);setDraft(null);setConfirmationMode(null);message.success('配方变更已确认');}catch(error){message.error((error as Error).message)}};
 const openRetry=()=>{if(!selected)return;setRetryDraft(structuredClone(draft??selected.reviewedFormula??selected.after));setRetryReason(changeReason(selected.reason));setRetryOpen(true)};
 const closeRetry=()=>{setRetryOpen(false);setRetryDraft(null);setRetryReason('')};
 const requestRetry=()=>{if(!selected||!retryDraft)return;if(!retryReason.trim()){message.warning('请填写复样原因');return;}try{let current=updateReviewFormula(loadFormulaState(),selected.id,retryDraft);current=requestFormulaRetry(current,selected.id,'水木',retryReason);saveFormulaState(current);setState(current);const updated=current.changes.find(change=>change.id===selected.id)??null;setSelected(updated);setDraft(null);setConfirmationMode(null);closeRetry();message.success('已按调整后的配方发起复样，请到打样页面处理');}catch(error){message.error((error as Error).message)}};
 const closeDetail=()=>{
  const close=()=>{setDetailOpen(false);setEditing(false);setConfirmationMode(null);setDraft(null);closeRetry()};
  if(editing){modal.confirm({title:'放弃尚未保存的配方修改？',content:'关闭后，本次编辑将不会保存。',okText:'放弃修改',cancelText:'继续编辑',onOk:close});return;}
  close();
 };
 const orderInfo=selected?(queryRecords.find(row=>row.processCard===selected.card)??queryRecords.find(row=>row.order===selected.order&&row.colorNo===(selected.colorNo||selectedInfo?.colorNo))):undefined;
 const selectedRecord=selected?{
  ...orderInfo,order:selected.order,colorNo:selected.colorNo||selectedInfo?.colorNo,
  product:selectedInfo?.product||orderInfo?.product,color:selectedInfo?.color||orderInfo?.color,depth:selectedInfo?.depth||orderInfo?.depth,
  ratio:selected.before.bath??selectedInfo?.bath,greigeWidth:orderInfo?.greigeWidth||(selected.source==='demo'?'150cm':undefined),
  greigeWeight:orderInfo?.greigeWeight||(selected.source==='demo'?'200g':undefined),
  processingRequirements:orderInfo?.processingRequirements||(selected.source==='demo'?'成品手感：滑爽 | 成品光暗：一般 | 布面起皱风格：否 | 布面光洁：否 | 高牢度：否 | 预缩要求：否':undefined)
 }:null;
 const retryPending=!!selected?.retry&&!selected.retry.completedAt;
 const resetFilters=()=>{const dates=formulaChangeDefaultDates();setOrderQuery('');setColorQuery('');setCardQuery('');setApplied({order:'',color:'',card:''});setStartDate(dates.start);setEndDate(dates.end);setFilterStatus('待确认');setSelectedKeys([]);setState(loadFormulaState())};
 return <section className="panel formula-change-table-page">
  <div className="formula-change-table-filters"><label><span>订字：</span><Input aria-label="变更订字" placeholder="请输入订字" value={orderQuery} onChange={event=>setOrderQuery(event.target.value)} onPressEnter={search}/></label><label><span>色号：</span><Input aria-label="变更色号" placeholder="请输入色号" value={colorQuery} onChange={event=>setColorQuery(event.target.value)} onPressEnter={search}/></label><label><span>流程卡号：</span><Input aria-label="变更流程卡号" placeholder="请输入流程卡号" value={cardQuery} onChange={event=>setCardQuery(event.target.value)} onPressEnter={search}/></label><label className="formula-change-date"><span>创建时间：</span><DatePicker.RangePicker aria-label="变更创建时间" value={[startDate,endDate]} onChange={value=>{setStartDate(value?.[0]??null);setEndDate(value?.[1]??null)}} format="YYYY-MM-DD"/></label><label><span>变更状态：</span><Select aria-label="变更状态" value={filterStatus} onChange={value=>setFilterStatus(value as WorkflowStatus)} options={changeStatusOptions}/></label><span className="formula-change-filter-spacer"/><Button type="primary" onClick={search}>查询</Button><Button onClick={resetFilters}>重置</Button></div>
  <div className="formula-change-table-heading"><div className="formula-change-heading-main"><div className="formula-change-heading-title"><i/><h2>配方变更</h2><Popover trigger="click" title="开发批注" content={<div className="dye-formula-note">此处展示染色工段提交的配方相关变更。<br/>状态包括：待变更、已变更、待确认、已确认。<br/>已确认状态下需额外显示确认人和确认时间。</div>}><Button type="text" style={{width:30,height:30,color:'#faad14',fontSize:19}} aria-label="查看配方变更开发批注" icon={<InfoCircleOutlined/>}/></Popover></div><Tabs className="formula-change-status-tabs" activeKey={filterStatus} onChange={key=>{setFilterStatus(key as WorkflowStatus);setSelectedKeys([])}} items={workflowStatuses.map(status=>({key:status,label:`${status} (${statusCounts[status]})`}))}/></div><Space size={6}><Tooltip title="全屏"><Button type="text" icon={<FullscreenOutlined/>} onClick={()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}/></Tooltip><Tooltip title="刷新"><Button type="text" icon={<ReloadOutlined/>} onClick={()=>setState(loadFormulaState())}/></Tooltip><Tooltip title="表格密度"><Button type="text" icon={<ColumnHeightOutlined/>} onClick={()=>document.body.classList.toggle('comfortable')}/></Tooltip><Tooltip title="显示设置"><Button type="text" icon={<SettingOutlined/>}/></Tooltip></Space></div>
  <Table<Change> className="formula-change-record-table" bordered size="small" rowKey="id" tableLayout="fixed" dataSource={rows} rowSelection={{selectedRowKeys:selectedKeys,onChange:keys=>setSelectedKeys(keys.map(String)),columnWidth:34}} pagination={{pageSize:20,showSizeChanger:false,showTotal:total=>`共 ${total} 条`}} locale={{emptyText:<Empty description="暂无符合条件的配方变更"/>}} scroll={{x:filterStatus==='已确认'?1580:1320}} onRow={change=>({onDoubleClick:()=>selectChange(change)})} columns={[
   {title:'序号',width:55,align:'center',render:(_,__,index)=>index+1},
   {title:'订字',dataIndex:'order',width:150,ellipsis:true},
   {title:'色号',width:120,ellipsis:true,render:(_,change)=>change.colorNo||dyeReviewCards.find(item=>item.card===change.card||item.order===change.order)?.colorNo||'—'},
   {title:'流程卡号',dataIndex:'card',width:145,ellipsis:true},
   {title:'变更类型',width:210,render:(_,change)=>{const types=changeTypes(change);return types.length?<Space size={[4,4]} wrap>{types.map(type=><Tag color="orange" key={type}>{type}</Tag>)}</Space>:<span className="muted">未记录</span>}},
   {title:'变更原因',dataIndex:'reason',width:220,ellipsis:true,render:value=>changeReason(value)},
   {title:'申请人',width:90,align:'center',render:(_,change)=>change.applicant?.trim()||'未记录'},
   {title:'申请时间',width:165,align:'center',render:(_,change)=>new Date(change.submittedAt).toLocaleString()},
   ...(filterStatus==='已确认'?[{title:'确认人',width:90,align:'center' as const,render:(_:unknown,change:Change)=>change.reviewer?.trim()||'未记录'},{title:'确认时间',width:165,align:'center' as const,render:(_:unknown,change:Change)=>change.reviewedAt?new Date(change.reviewedAt).toLocaleString():'未记录'}]:[]),
   {title:'等待时长',width:110,align:'center',render:(_,change)=>waitingDuration(change)},
   {title:<Space size={2}>复样进度<Tooltip title="此处显示复样进度：待分配、进行中、已完成。"><Button type="text" size="small" aria-label="查看复样进度说明" icon={<InfoCircleOutlined/>}/></Tooltip></Space>,width:120,align:'center',render:(_,change)=>{const progress=formulaRetryProgress(change);return <Tag color={retryProgressColors[progress]}>{progress}</Tag>}},
   {title:'操作',fixed:'right',width:90,align:'center',render:(_,change)=><Button type="link" onClick={()=>selectChange(change)}>{change.status==='待工段长审核'?'去处理':'查看'}</Button>},
  ]}/>
  <Modal className="formula-change-detail-modal" title={selected?<div className="change-detail-title"><span>配方变更</span><strong>{selected.order}</strong><span>色号：{selected.colorNo||selectedInfo?.colorNo||'—'}</span><Tag color={selected.status==='已通过'?'green':selected.status==='已退回'?'orange':'blue'}>{workflowStatus(selected)}</Tag></div>:undefined} width="min(1480px, calc(100vw - 48px))" style={{top:24}} open={detailOpen&&!!selected} afterOpenChange={open=>{if(open)detailTop.current?.closest<HTMLElement>('.ant-modal-body')?.scrollTo({top:0});}} onCancel={closeDetail} maskClosable={false} footer={selected&&(selected.status!=='待工段长审核'?<Button onClick={closeDetail}>关闭</Button>:<div className="formula-change-detail-footer"><span>{confirmationMode==='original'?'将使用原配方':confirmationMode==='requested'?'将使用申请配方':confirmationMode==='custom'?'将使用编辑后的确认配方':'请选择确认方案'}</span><Space><Button disabled={editing||retryPending} onClick={openRetry}>{retryPending?'复样进行中':'发起复样'}</Button><Button onClick={closeDetail}>取消</Button><Tooltip title={retryPending&&confirmationMode!=='original'?'请先完成复样，再确认申请或编辑后的配方':undefined}><Button type="primary" disabled={!confirmationMode||!draft||editing||(retryPending&&confirmationMode!=='original')} onClick={confirmReview}>确认配方</Button></Tooltip></Space></div>)}>
   {selected&&selectedRecord&&<>
    <section className="change-detail-card" ref={detailTop}>
     <div className="change-detail-card-heading"><h3>流程卡 <span>{selected.card}</span></h3></div>
     <FormulaBasicInfo record={selectedRecord}/>
     <dl className="change-detail-extra">
      <div><dt>计划米匹数</dt><dd>{selectedInfo?`${selectedInfo.pieces} 匹 / ${selectedInfo.meters} 米`:'未记录'}</dd></div>
      <div><dt>实配米匹数</dt><dd>{selected.source==='demo'?'1 匹 / 100 米':'未记录'}</dd></div>
      <div><dt>成品门幅 / 克重要求</dt><dd>{selected.source==='demo'?'门幅无要求 / 克重无要求':'未记录'}</dd></div>
      <div><dt>开卡信息</dt><dd>未记录</dd></div>
      <div><dt>不良信息</dt><dd>—</dd></div>
     </dl>
    </section>
    <section className="change-detail-application">
     <Descriptions size="small" column={{xs:1,sm:2,lg:3}} items={[
      {key:'applicant',label:'申请人',children:selected.applicant?.trim()||'未记录'},
      {key:'time',label:'申请时间',children:dayjs(selected.submittedAt).format('YYYY-MM-DD HH:mm')},
      {key:'type',label:'变更类型',children:<Space size={[4,4]} wrap>{changeTypes(selected).map(type=><Tag key={type} color="orange">{type}</Tag>)}</Space>},
      {key:'reason',label:'变更原因',children:changeReason(selected.reason)||'未记录',span:'filled'}
     ]}/>
     {selected.status==='已退回'&&<Alert type="warning" showIcon message={`退回原因：${selected.reviewReason||'未记录'}`} description={`${selected.reviewer||'未记录处理人'} · ${selected.reviewedAt?dayjs(selected.reviewedAt).format('YYYY-MM-DD HH:mm'):'未记录处理时间'}`}/>}
     {selected.status==='已通过'&&<div className="change-detail-confirmed"><span>确认人：{selected.reviewer||'未记录'}</span><span>确认时间：{selected.reviewedAt?dayjs(selected.reviewedAt).format('YYYY-MM-DD HH:mm'):'未记录'}</span><span>处理说明：{selected.reviewReason||'未记录'}</span></div>}
    </section>
    <div className="change-detail-comparison-heading"><h3>配方对比</h3>{selected.status==='待工段长审核'&&<Space size={6} wrap>{editing?<><Button size="small" onClick={cancelEditing}>取消编辑</Button><Button size="small" type="primary" onClick={saveEditedFormula}>保存编辑</Button></>:<><Button size="small" type={confirmationMode==='original'?'primary':'default'} onClick={()=>useFormula('original')}>使用原配方</Button><Button size="small" type={confirmationMode==='requested'?'primary':'default'} onClick={()=>useFormula('requested')}>使用申请配方</Button><Button size="small" type={confirmationMode==='custom'?'primary':'default'} onClick={startEditing}>编辑确认配方</Button></>}</Space>}</div>
    <FormulaChangeComparison key={selected.id} before={selected.before} requested={selected.after} confirmed={displayedConfirmation} editing={editing} onChange={setDraft}/>
   </>}
  </Modal>
  <Modal className="formula-retry-modal" title="调整配方后发起复样" width="min(1100px, calc(100vw - 48px))" open={retryOpen&&!!selected&&!!retryDraft} onCancel={closeRetry} onOk={requestRetry} okText="确认并发起复样" cancelText="取消" destroyOnHidden>
   {selected&&retryDraft&&<><div className="formula-retry-summary"><span>流程卡：<b>{selected.card}</b></span><span>订字：<b>{selected.order}</b></span><span>色号：<b>{selected.colorNo||selectedInfo?.colorNo||'—'}</b></span></div><h3 className="formula-change-modal-section">调整复样配方</h3><DyeFormulaTable formula={retryDraft} original={selected.after} editing compact fitWidth showBath onChange={setRetryDraft}/><label className="formula-retry-reason"><span>复样原因</span><Input.TextArea aria-label="复样原因" rows={3} value={retryReason} onChange={event=>setRetryReason(event.target.value)} placeholder="请填写本次复样原因"/></label></>}
  </Modal>
 </section>;
}
