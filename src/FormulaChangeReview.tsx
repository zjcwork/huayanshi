import {ensureFormulaChangeDemo} from './formula-change-demo';
import {useEffect,useState} from 'react';
import {App,Button,DatePicker,Descriptions,Empty,Input,Modal,Select,Space,Table,Tag,Tooltip} from 'antd';
import {ColumnHeightOutlined,FullscreenOutlined,ReloadOutlined,SettingOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import {dyeReviewCards} from './dye-review-cards';
import './formula-change-workspace.css';
import './formula-change-review.css';
import {changeFormulaNumber,loadFormulaState,requestFormulaRetry,reviewFormula,saveFormulaState,updateReviewFormula,type Change,type Formula} from './dye-formula-model';
import {formulaChangeDefaultDates} from './formula-change-filters';
import DyeFormulaTable from './DyeFormulaTable';

type ScheduledVat={card:string;vat:string;entryWeight?:string|number};
const hiddenChangeReasons=new Set(['色光偏红，红染料用量降低10%','对样颜色偏浅，艳蓝用量提高8%']);
function scheduledVats(card:string):ScheduledVat[]{
 try{const data=JSON.parse(localStorage.getItem('lab-dye-schedule')||'[]');return Array.isArray(data)?data.filter((row:ScheduledVat)=>row.card===card&&row.vat):[];}catch{return [];}
}
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
 const [cardQuery,setCardQuery]=useState('');
 const [applied,setApplied]=useState({order:'',card:''});
 const [startDate,setStartDate]=useState<dayjs.Dayjs|null>(defaultDates.start);
 const [endDate,setEndDate]=useState<dayjs.Dayjs|null>(defaultDates.end);
 const [filterStatus,setFilterStatus]=useState<string>();
 const [selectedKeys,setSelectedKeys]=useState<string[]>([]);
 const [selected,setSelected]=useState<Change|null>(null);
 const [detailOpen,setDetailOpen]=useState(false);
 const [changeMethodOpen,setChangeMethodOpen]=useState(false);
 const [editing,setEditing]=useState(false);
 const [draft,setDraft]=useState<Formula|null>(null);
 useEffect(()=>{setState(ensureFormulaChangeDemo())},[]);
 const rows=state.changes.filter(change=>(change.category??'change')==='change'&&!hiddenChangeReasons.has(change.reason)&&[change.order,change.colorNo??'',change.dmNo??''].join(' ').toLowerCase().includes(applied.order)&&[change.card,changeFormulaNumber(change)].join(' ').toLowerCase().includes(applied.card)&&(!filterStatus||change.status===filterStatus)&&(!startDate||!dayjs(change.submittedAt).isBefore(startDate.startOf('day')))&&(!endDate||!dayjs(change.submittedAt).isAfter(endDate.endOf('day')))).slice(0,10);
 const selectedInfo=selected?dyeReviewCards.find(item=>item.card===selected.card||item.order===selected.order):undefined;
 const selectedVat=selected?scheduledVats(selected.card)[0]:undefined;
 const search=()=>{setApplied({order:orderQuery.trim().toLowerCase(),card:cardQuery.trim().toLowerCase()});setState(loadFormulaState())};
 const selectChange=(change:Change,open=true)=>{setSelected(change);setEditing(false);setChangeMethodOpen(false);setDraft(structuredClone(change.reviewedFormula??change.after));if(open)setDetailOpen(true)};
 const saveEdit=()=>{if(!selected||!draft)return;try{const next=updateReviewFormula(loadFormulaState(),selected.id,draft);saveFormulaState(next);setState(next);setSelected(next.changes.find(change=>change.id===selected.id)??null);setEditing(false);message.success('变更后配方已保存，审核通过后生效');}catch(error){message.error((error as Error).message)}};
 const review=(change=selected)=>{if(!change)return;try{const next=reviewFormula(loadFormulaState(),change.id,true,'水木','无需调整','original');saveFormulaState(next);setState(next);setSelected(null);setDetailOpen(false);setEditing(false);setDraft(null);message.success('已确认无需调整，保留原配方');}catch(error){message.error((error as Error).message)}};
 const requestResample=()=>{if(!selected)return;try{const next=requestFormulaRetry(loadFormulaState(),selected.id,'水木',selected.reason);saveFormulaState(next);setState(next);const updated=next.changes.find(change=>change.id===selected.id)??null;setSelected(updated);setChangeMethodOpen(false);message.success('已发起复样，请到打样页面的复样页签处理');}catch(error){message.error((error as Error).message)}};
 const resetFilters=()=>{const dates=formulaChangeDefaultDates();setOrderQuery('');setCardQuery('');setApplied({order:'',card:''});setStartDate(dates.start);setEndDate(dates.end);setFilterStatus(undefined);setSelectedKeys([]);setState(loadFormulaState())};
 return <section className="panel formula-change-table-page">
  <div className="formula-change-table-filters"><Input aria-label="订字或色号" placeholder="订字色号：请输入" value={orderQuery} onChange={event=>setOrderQuery(event.target.value)} onPressEnter={search}/><Input aria-label="流程卡号" placeholder="流程卡号：请输入" value={cardQuery} onChange={event=>setCardQuery(event.target.value)} onPressEnter={search}/><DatePicker aria-label="申请开始日期" value={startDate} onChange={setStartDate} format="YYYY-MM-DD"/><DatePicker aria-label="申请结束日期" value={endDate} onChange={setEndDate} format="YYYY-MM-DD"/><Select aria-label="变更状态" allowClear placeholder="状态：请选择" value={filterStatus} onChange={setFilterStatus} options={['待工段长审核','已通过','已退回'].map(value=>({value,label:value}))}/><span className="formula-change-filter-spacer"/><Button type="primary" onClick={search}>查询</Button><Button onClick={resetFilters}>重置</Button></div>
  <div className="formula-change-table-heading"><div><i/><h2>配方变更</h2></div><Space size={6}><Tooltip title="全屏"><Button type="text" icon={<FullscreenOutlined/>} onClick={()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}/></Tooltip><Tooltip title="刷新"><Button type="text" icon={<ReloadOutlined/>} onClick={()=>setState(loadFormulaState())}/></Tooltip><Tooltip title="表格密度"><Button type="text" icon={<ColumnHeightOutlined/>} onClick={()=>document.body.classList.toggle('comfortable')}/></Tooltip><Tooltip title="显示设置"><Button type="text" icon={<SettingOutlined/>}/></Tooltip></Space></div>
  <Table<Change> className="formula-change-record-table" bordered size="small" rowKey="id" tableLayout="fixed" dataSource={rows} rowSelection={{selectedRowKeys:selectedKeys,onChange:keys=>setSelectedKeys(keys.map(String)),columnWidth:34}} pagination={{pageSize:20,showSizeChanger:false,showTotal:total=>`共 ${total} 条`}} locale={{emptyText:<Empty description="暂无符合条件的配方变更"/>}} scroll={{x:1320}} onRow={change=>({onDoubleClick:()=>selectChange(change)})} columns={[
   {title:'序号',width:55,align:'center',render:(_,__,index)=>index+1},
   {title:'订字',dataIndex:'order',width:150,ellipsis:true},
   {title:'色号',width:120,ellipsis:true,render:(_,change)=>change.colorNo||dyeReviewCards.find(item=>item.card===change.card||item.order===change.order)?.colorNo||'—'},
   {title:'流程卡号',dataIndex:'card',width:145,ellipsis:true},
   {title:'变更类型',width:210,render:(_,change)=>{const types=changeTypes(change);return types.length?<Space size={[4,4]} wrap>{types.map(type=><Tag color="orange" key={type}>{type}</Tag>)}</Space>:<span className="muted">未记录</span>}},
   {title:'变更原因',dataIndex:'reason',width:220,ellipsis:true,render:value=>changeReason(value)},
   {title:'申请人',width:90,align:'center',render:(_,change)=>change.applicant?.trim()||'未记录'},
   {title:'申请时间',width:165,align:'center',render:(_,change)=>new Date(change.submittedAt).toLocaleString()},
   {title:'等待时长',width:110,align:'center',render:(_,change)=>waitingDuration(change)},
   {title:'复样状态',width:95,align:'center',render:(_,change)=>change.retry?<Tag color={change.retry.completedAt?'green':'blue'}>{change.retry.completedAt?'复样完成':'复样中'}</Tag>:'—'},
   {title:'操作',fixed:'right',width:90,align:'center',render:(_,change)=><Button type="link" onClick={()=>selectChange(change)}>去处理</Button>},
  ]}/>
  <Modal className="formula-change-detail-modal" width="calc(100vw - 40px)" style={{top:12}} open={detailOpen&&!!selected} onCancel={()=>{setDetailOpen(false);setChangeMethodOpen(false);setEditing(false)}} footer={selected&&<div className="formula-change-detail-footer"><span/>{editing?<Space><Button onClick={()=>{setEditing(false);setDraft(structuredClone(selected.reviewedFormula??selected.after))}}>取消</Button><Button type="primary" onClick={saveEdit}>保存变更</Button></Space>:<Space><Button type="primary" onClick={()=>setChangeMethodOpen(true)}>变更配方</Button><Button onClick={()=>review()}>无需变更</Button></Space>}</div>}>
   {selected&&<><h3 className="formula-change-modal-section">流程卡详情</h3><Descriptions className="formula-change-card-details" bordered size="small" column={5} items={[
    {key:'product',label:'品名',children:selectedInfo?.product||'短纤与棉'},{key:'colorNo',label:'色号',children:selected.colorNo||selectedInfo?.colorNo||'—'},{key:'color',label:'颜色',children:selectedInfo?.color||'—'},{key:'depth',label:'浅中深',children:selectedInfo?.depth||'—'},{key:'ratio',label:'比例',children:'未填写'},
    {key:'weight',label:'白坯克重',children:'200g'},{key:'width',label:'白坯门幅',children:'150cm'},{key:'dye',label:'染料',children:'活性染料'},{key:'edge',label:'两纱边',children:'是'},{key:'shrink',label:'缩水',children:'无要求'},
    {key:'finishedWeight',label:'成品克重',children:'无要求'},{key:'finishedWidth',label:'成品门幅',children:'无要求'},{key:'planned',label:'预配匹数',children:'1'},{key:'actual',label:'实配匹数',children:'1'},{key:'meters',label:'实配米数',children:'100'},
    {key:'operator',label:'开卡人',children:selected.applicant?.trim()||'未记录'},{key:'time',label:'开卡时间',children:new Date(selected.submittedAt).toLocaleString(),span:2},{key:'badProcess',label:'不良工序',children:'-'},{key:'defect',label:'不良',children:'-'},{key:'reason',label:'原因',children:'-'},
    {key:'requirements',label:'加工要求',children:'无要求',span:5},{key:'production',label:'生产要求',children:<Space wrap><Tag>成品手感：滑爽</Tag><Tag>成品光暗：一般</Tag><Tag>布面起皱风格：否</Tag><Tag>布面光洁：否</Tag><Tag>高牢度：否</Tag><Tag>预缩要求：否</Tag></Space>,span:5},
   ]}/><h3 className="formula-change-modal-section formula-change-formula-title">配方详情 <span>预排染缸号：{selectedVat?.vat||selected.vat||'未排产'}，实配：1匹/100米，预计进缸布重：{selectedVat?.entryWeight??selected.entryWeight??'未记录'}，预计进缸浴比：1:{selected.after.bath??selected.before.bath}，超出浴比允差±1.5；</span></h3><DyeFormulaTable compact fitWidth={!editing} ratioTitle="比例" original={selected.before} formula={editing&&draft?draft:selected.before} editing={editing} editRatioComparison={editing} ratioOnlyEditing={editing} onChange={setDraft}/></>}
  </Modal>
  <Modal title="选择变更方式" open={changeMethodOpen&&!!selected} onCancel={()=>setChangeMethodOpen(false)} footer={null} destroyOnHidden>
   <div className="formula-change-methods"><Button type="primary" disabled={!!selected?.retry&&!selected.retry.completedAt} onClick={requestResample}>{selected?.retry&&!selected.retry.completedAt?'复样进行中':'发起复样'}</Button><Button onClick={()=>{if(!selected)return;setDraft(structuredClone(selected.reviewedFormula??selected.after));setChangeMethodOpen(false);setEditing(true)}}>直接变更</Button></div>
  </Modal>
 </section>;
}
