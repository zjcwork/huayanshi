import {useState} from 'react';
import {App,Badge,Button,Checkbox,DatePicker,Form,Empty,Input,Modal,Select,Space,Table,Tabs,Tag,Tooltip} from 'antd';
import {DownOutlined,FileTextOutlined,ReloadOutlined,SearchOutlined,UpOutlined} from '@ant-design/icons';
import './capacity-dialog.css';
import './card-opening-review.css';
import dayjs from 'dayjs';
import SchedulePopover,{type Allocation} from './SchedulePopover';
import {ensureScheduledDemo,type ScheduledDetail} from './capacity-demo';
import DyeFormulaTable from './DyeFormulaTable';
import OpeningProcessDetails from './OpeningProcessDetails';
import {schedulingFormula} from './schedule-bath';
import {formulaNumber} from './formula-number';
export const sales=['陆华根','朱建深','施建国','魏梦婷','郭卫刚','杜平','曾传亮','沈佩南','朱建军','王丽美','沈海军','项峰','沈亚飞','於荣伟'];
export const productionProcesses=['预定型','上油定型','退煮','酶退'] as const;
const devices=['平蒸机','酶退-退煮机','冷堆机','精炼机','磨毛机','丝光机','烧毛机','染缸','脱水机','开幅机','定型机','烘干机','轧光机','缩绒机','预缩机','蒸呢机','空拉机','喷布机','装箱机','打卷机'];
const hours=[17.65,16.55,8.16,0,0.92,0,13.93,20.6,10.33,14.5,25.09,6.3,12.76,11.16,7.19,11.12,15.26,12.14,10.75,13.25];
const workInProgressHours=[9.59,1.43,0.53,0,0,0,7.53,5.97,0.22,2,5.24,1.01,1,0.67,2.96,0.54,0,0.46,0.63,1];
const deviceMachineCounts=[2,2,1,1,1,1,2,4,1,1,3,1,1,1,1,1,1,1,1,1];
type ColorGroup='浅'|'中'|'深'|'本白';
// Explicit demo colors; never infer a production color or depth category from a color number.
const orderColors:{name:string;hex:string;group:ColorGroup}[]=[
 {name:'雾蓝',hex:'#9bbfd8',group:'浅'},{name:'薄荷绿',hex:'#91c7a3',group:'浅'},{name:'浅灰',hex:'#b7bcc3',group:'浅'},{name:'米白',hex:'#eee9dc',group:'本白'},
 {name:'中灰',hex:'#7c838b',group:'中'},{name:'豆绿',hex:'#668c78',group:'中'},{name:'靛蓝',hex:'#3e5f9a',group:'中'},{name:'炭灰',hex:'#4d535b',group:'中'},
 {name:'藏青',hex:'#1f314d',group:'深'},{name:'深蓝',hex:'#203a72',group:'深'},{name:'墨绿',hex:'#214f45',group:'深'},{name:'酒红',hex:'#7c3147',group:'深'},
 {name:'咖啡',hex:'#604536',group:'深'},{name:'中黄',hex:'#c59531',group:'中'},{name:'粉红',hex:'#d58c9f',group:'浅'},{name:'紫色',hex:'#6b4f8f',group:'中'}
];
const vatColors=['雾蓝','雾蓝','薄荷绿','薄荷绿','浅灰','浅灰','米白','中灰','中灰','豆绿','靛蓝','炭灰','藏青','深蓝','墨绿','酒红'];
function ColorComparison({orders,vats}:{orders:string[];vats:string[]}){
 const [selectedColor,setSelectedColor]=useState<string>();
 const datasets=[{key:'orders',label:'订单',values:orders,unit:'缸'},{key:'vats',label:'染缸',values:vats,unit:'缸'}];
 const count=(values:string[],color:string)=>values.filter(value=>value===color).length;
 const percent=(values:string[],color:string)=>values.length?count(values,color)/values.length*100:0;
 const pieSlices=(values:string[])=>{let angle=-Math.PI/2;return orderColors.flatMap(color=>{const amount=count(values,color.name);if(!amount)return[];const start=angle,sweep=amount/values.length*Math.PI*2;angle+=sweep;const point=(value:number)=>[50+48*Math.cos(value),50+48*Math.sin(value)];const [x1,y1]=point(start),[x2,y2]=point(angle);return [{...color,amount,share:amount/values.length*100,path:`M 50 50 L ${x1} ${y1} A 48 48 0 ${sweep>Math.PI?1:0} 1 ${x2} ${y2} Z`}];})};
 const selectColor=(name:string)=>setSelectedColor(current=>current===name?undefined:name);
 return <div className="capacity-color-comparison">
  <div className="capacity-comparison-summary">
   <div className="capacity-comparison-legend">{orderColors.map(color=><button type="button" className={selectedColor===color.name?'is-selected':selectedColor?'is-muted':''} key={color.name} onClick={()=>selectColor(color.name)}><i style={{backgroundColor:color.hex}}/>{color.name}</button>)}</div>
   <div className="capacity-pie-grid">{datasets.map(dataset=><div className="capacity-pie-card" key={dataset.key}>
    <svg className="capacity-pie" viewBox="0 0 100 100" aria-label={`${dataset.label}颜色分布，共${dataset.values.length}${dataset.unit}`}>{pieSlices(dataset.values).map(slice=><path key={slice.name} d={slice.path} fill={slice.hex} className={`capacity-pie-slice${selectedColor===slice.name?' is-selected':selectedColor?' is-muted':''}`} role="button" tabIndex={0} aria-label={`${dataset.label} · ${slice.name}：${slice.amount}${dataset.unit}，${slice.share.toFixed(1)}%`} aria-pressed={selectedColor===slice.name} onClick={()=>selectColor(slice.name)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectColor(slice.name)}}}><title>{`${slice.name}：${slice.amount}${dataset.unit}，${slice.share.toFixed(1)}%`}</title></path>)}</svg>
    <div className="capacity-pie-label"><b>{dataset.label}</b><span>{dataset.values.length}{dataset.unit}</span>{selectedColor&&<em>{selectedColor} {count(dataset.values,selectedColor)}{dataset.unit}</em>}</div>
   </div>)}</div>
  </div>
  <div className="capacity-comparison-detail">
   <div className="capacity-comparison-note">按实际颜色对比订单与在机缸数分布</div>
   <div className="capacity-color-detail-grid">{orderColors.map(color=><button type="button" className={`capacity-color-detail${selectedColor===color.name?' is-selected':selectedColor?' is-muted':''}`} key={color.name} onClick={()=>selectColor(color.name)}><span><i style={{backgroundColor:color.hex}}/>{color.name}</span><small>订单 <b>{count(orders,color.name)}缸</b></small><small>染缸 <b>{count(vats,color.name)}缸</b></small></button>)}</div>
  </div>
 </div>
}
const baseReferenceOrders=[
 {order:'芹王AE',product:'短纤与棉',color:'薄荷绿'},
 {order:'芹王TEST',product:'短纤与棉',color:'暮蓝'},
 {order:'JS-908078',product:'阳粘纬弹',color:'1'},
 {order:'阿良剑气长城的阿良',product:'T/R',color:'测试勿动！！！！'},
 {order:'阳光1978-1',product:'T/R纬弹',color:'2#'},
 {order:'JS-908108',product:'阳粘纬弹',color:'泡泡芷青'},
 {order:'国华900-666',product:'T/R纬弹',color:'浅蓝'},
 {order:'国华900-696',product:'T/R纬弹',color:'浅蓝'},
 {order:'国华900-696',product:'T/R纬弹',color:'中灰'},
 {order:'国华900-235',product:'T/R纬弹',color:'浅兰'},
 {order:'国华900-235',product:'T/R纬弹',color:'中灰'},
 {order:'芹王AE',product:'短纤与棉',color:'石白'},
 {order:'芹王AE',product:'短纤与棉',color:'青梅绿'}
];
const referenceOrders=Array.from({length:60},(_,i)=>{
 const source=baseReferenceOrders[i%baseReferenceOrders.length];
 const batch=Math.floor(i/baseReferenceOrders.length);
 return {...source,order:batch===0?source.order:`${source.order}-${String(batch+1).padStart(2,'0')}`};
});
// Demo equipment routes list individual machines, not just process names.
const equipmentRoutes=[[0,8,25],[1,9,27],[2,8,10,26],[3,11,25],[0,12,27],[1,14,26],[2,15,25],[3,16,25],[1,17,26],[0,18,25],[2,21,26],[3,23,25],[1,24,25]];
export const items=referenceOrders.map((reference,i)=>{const demoColor=orderColors[i%orderColors.length],isBathMismatchDemo=reference.order==='国华900-696'&&reference.color==='中灰';return {key:String(i),rank:i+1,vats:i<10?i+1:1,pieces:[20,28,42,16,24,18][i%6],history:i%3===1?'-':`J${String(i%16+1).padStart(2,'0')}`,linked:['ok','加料','色不准'][i%3],...reference,equipment:equipmentRoutes[i%equipmentRoutes.length],colorName:demoColor.name,colorGroup:demoColor.group,colorHex:demoColor.hex,overdue:i%7===0,head:i===0?'头缸':'连缸',created:`2026-05-${String(12-i%10).padStart(2,'0')} 21:01:14`,due:`2026-06-${String(5+i*2%24).padStart(2,'0')}`,internalDue:null as string|null,type:'正常订单',bath:isBathMismatchDemo?'1:12':i%4===1?'配方未出':i===3||i===10?'1:12':`1:${[8,9,7,9,8,9][i%6]}`,formulaStatus:i%4===1?'配方未出':i%3===0?'未确认':'已确认',processStatus:i%2===0?'已确认':'未确认',weight:[300,279,299,310,228,205][i%6]+'g',width:[1.66,1.72,1.68,1.66,1.62,1.57][i%6]+'m',sales:sales[i%sales.length],process:productionProcesses[i%productionProcesses.length],card:`Y260630${5672+i*37}`}});
export type Item=typeof items[number];
type GroupMode='due'|'customer'|'color';
type GroupOption={key:string;label:string;swatch?:string;tone?:'danger'};
type GroupColumn={mode:GroupMode;title:string;options:GroupOption[]};
const customerGroup=(order:string)=>['国华','芹王','阳光','阿良','JS'].find(prefix=>order.startsWith(prefix))||'其他客户';
const dueGroup=(item:Item)=>{if(item.overdue)return 'overdue';const day=Number(item.due.slice(-2));return day<=11?'near':day<=18?'middle':'later'};
export function CapacityStatistics({scheduledCards}:{scheduledCards:string[]}){
 const [chartView,setChartView]=useState('capacity');
 const [showWorkInProgress,setShowWorkInProgress]=useState(false);
 const [device,setDevice]=useState<number|null>(null);
 const [collapsed,setCollapsed]=useState(false);
 const isWorkInProgressView=chartView==='work-in-progress';
 const overCapacityDeviceCount=hours.filter(hour=>hour>24).length;
 const chartValues=isWorkInProgressView?workInProgressHours:hours.map((hour,index)=>hour+(showWorkInProgress?workInProgressHours[index]:0));
 const chartMax=!isWorkInProgressView&&showWorkInProgress?Math.max(35,Math.ceil(Math.max(...chartValues)/5)*5):isWorkInProgressView?11:30;
 const chartTicks=isWorkInProgressView?[11,10,8,6,4,2,0]:Array.from({length:chartMax/5+1},(_,index)=>chartMax-index*5);
 const threshold=isWorkInProgressView?2:24;
 const formatHours=(value:number)=>Number.isInteger(value)?String(value):String(Number(value.toFixed(2)));
 return <div className={`capacity-chart-area${collapsed?' is-collapsed':''}`}>
  <div className="capacity-chart-heading">
   <Tabs className="capacity-chart-tabs" activeKey={chartView} onChange={setChartView} items={[{key:'capacity',label:<span className="capacity-tab-label">工段产能{overCapacityDeviceCount>0&&<Badge count={overCapacityDeviceCount} size="small" title={`${overCapacityDeviceCount} 台设备排产时间超过 24 小时`}/>}</span>},{key:'work-in-progress',label:'在制品产能'},{key:'color',label:'颜色统计'}]}/>
   <div className="capacity-chart-heading-actions">
    {chartView==='capacity'?<div className="capacity-chart-controls"><Checkbox checked={showWorkInProgress} onChange={event=>setShowWorkInProgress(event.target.checked)}>在制品</Checkbox><span className="capacity-chart-legend"><i className="is-total"/>排产时长</span>{showWorkInProgress&&<span className="capacity-chart-legend"><i className="is-wip"/>在制品时长</span>}<span>共 28 台设备</span></div>:isWorkInProgressView?<div className="capacity-chart-controls"><span className="capacity-chart-legend"><i className="is-wip"/>在制品时长</span><span>共 28 台设备</span></div>:<span>颜色缸数结构对比</span>}
    <Tooltip title={collapsed?'展开统计':'收起统计'}><Button className="capacity-chart-collapse" type="text" size="small" aria-label={collapsed?'展开统计':'收起统计'} icon={collapsed?<DownOutlined/>:<UpOutlined/>} onClick={()=>setCollapsed(value=>!value)}/></Tooltip>
   </div>
  </div>
  {!collapsed&&((chartView==='capacity'||isWorkInProgressView)?<div className="capacity-chart"><span className="capacity-axis-label">工时（小时）</span><div className="capacity-yaxis">{chartTicks.map(n=><span key={n}>{n}</span>)}</div><div className="capacity-plot"><div className="capacity-gridlines">{chartTicks.map(n=><i key={n}/>)}</div><div className="capacity-threshold" style={{bottom:`${threshold/chartMax*100}%`}}><span>{threshold} 小时</span></div>{devices.map((name,index)=>{const combined=chartValues[index],value=formatHours(combined),title=isWorkInProgressView?`${name}：在制品 ${value} 小时`:showWorkInProgress?`${name}：排产 ${formatHours(hours[index])} 小时 + 在制品 ${formatHours(workInProgressHours[index])} 小时 = ${value} 小时`:`${name}：排产 ${value} 小时`;return <Tooltip key={name} mouseEnterDelay={0.1} title={<div className="capacity-device-tooltip"><b>{name}</b><span>机器数量：{deviceMachineCounts[index]} 台</span><span>{isWorkInProgressView?'占用工时':'排产工时'}：<strong>{value}</strong> 小时</span></div>}><button className={'capacity-bar-column '+(device===index?'active':'')} onClick={()=>setDevice(device===index?null:index)} aria-pressed={device===index} aria-label={title}><em className="capacity-bar-value" style={{bottom:`${combined/chartMax*100}%`}}>{value}</em><div className={`capacity-bar${isWorkInProgressView?' is-work-in-progress':''}`} style={{height:`${combined/chartMax*100}%`}}>{!isWorkInProgressView&&showWorkInProgress&&combined>0&&<i className="capacity-bar-work-in-progress" style={{height:`${workInProgressHours[index]/combined*100}%`}}/>}</div><span>{name}</span></button></Tooltip>})}</div></div>:<ColorComparison orders={items.flatMap(item=>Array.from({length:item.vats},()=>item.colorName))} vats={vatColors}/>) }
 </div>
}
export default function CapacityDialog({open,onClose,onSchedule,onCancelSchedule,scheduledOrders,scheduledPieces,scheduledDetails}:{open:boolean;onClose:()=>void;onSchedule:(order:Item,rows:Allocation[])=>boolean;onCancelSchedule:(card:string,vat:string,slot:number)=>boolean;scheduledOrders:string[];scheduledPieces:Record<string,number>;scheduledDetails:ScheduledDetail[]}){
 const {message}=App.useApp();
 const [dueChanges,setDueChanges]=useState<Record<string,{date:string;reason:string}>>(()=>{try{return JSON.parse(localStorage.getItem('lab-capacity-internal-dates')||'{}')}catch{return {}}});
 const [editingDue,setEditingDue]=useState<Item|null>(null);
 const [dueForm]=Form.useForm();
 const editDue=(row:Item)=>{setEditingDue(row);dueForm.setFieldsValue({date:dayjs(dueChanges[row.card]?.date||row.due),reason:''})};
 const saveDue=async()=>{try{const values=await dueForm.validateFields();if(!editingDue)return;const next={...dueChanges,[editingDue.card]:{date:values.date.format('YYYY-MM-DD'),reason:values.reason.trim()}};try{localStorage.setItem('lab-capacity-internal-dates',JSON.stringify(next));setDueChanges(next);setEditingDue(null);message.success('内部交期已调整')}catch{message.error('保存失败，请检查浏览器存储后重试')}}catch{/* Form displays required field validation. */}};
 const currentItems=items;
 const [view,setView]=useState('order'),[keyword,setKeyword]=useState(''),[color,setColor]=useState(''),[type,setType]=useState<string>(),[excluded,setExcluded]=useState<string>(),[processMode,setProcessMode]=useState<'include'|'exclude'>('exclude'),[groupSelection,setGroupSelection]=useState<{mode:GroupMode;key:string}>(),[selected,setSelected]=useState<React.Key[]>([]),[scheduleItem,setScheduleItem]=useState<Item|null>(null),[detailItem,setDetailItem]=useState<Item|null>(null);
 const demoScheduledDetails=ensureScheduledDemo(currentItems,scheduledDetails);
 const scheduled=currentItems.flatMap(r=>demoScheduledDetails.filter(j=>j.card===r.card).map((j,i)=>({...r,key:`${r.key}-${j.vat}-${j.slot}-${i}`,pieces:j.pieces??Math.max(1,Math.ceil(r.pieces/r.vats)),vats:1,productionVat:j.vat,productionSlot:j.slot}))).map((r,i)=>({...r,rank:i+1,scheduleNo:`PD${String(i+1).padStart(6,'0')}`}));
 const available=currentItems.map(r=>{const assigned=scheduled.filter(item=>item.card===r.card),usedPieces=Math.max(scheduledPieces[r.card]??0,assigned.reduce((sum,item)=>sum+item.pieces,0));return {...r,pieces:Math.max(0,r.pieces-usedPieces),vats:Math.max(0,r.vats-assigned.length)}}).filter(r=>r.pieces>0&&r.vats>0);
 const availableVatCount=available.reduce((sum,item)=>sum+item.vats,0),scheduledVatCount=scheduled.reduce((sum,item)=>sum+item.vats,0);
 const groupKey=(item:Item,mode:GroupMode)=>mode==='due'?dueGroup(item):mode==='customer'?customerGroup(item.order):item.colorName;
 const groupColumnDefinitions:GroupColumn[]=[
  {mode:'due',title:'交期',options:[{key:'overdue',label:'已超时',tone:'danger'},{key:'near',label:'06-05 至 06-11'},{key:'middle',label:'06-12 至 06-18'},{key:'later',label:'06-19 以后'}]},
  {mode:'customer',title:'客户',options:Array.from(new Set(currentItems.map(item=>customerGroup(item.order)))).map(key=>({key,label:key}))},
  {mode:'color',title:'颜色',options:orderColors.map(colorOption=>({key:colorOption.name,label:colorOption.name,swatch:colorOption.hex}))}
 ];
 const groupColumns=groupColumnDefinitions.map(column=>({...column,options:column.options.map(option=>({...option,count:currentItems.filter(item=>groupKey(item,column.mode)===option.key).reduce((sum,item)=>sum+item.vats,0)}))}));
 const selectedGroup=groupSelection?groupColumns.find(column=>column.mode===groupSelection.mode)?.options.find(option=>option.key===groupSelection.key):undefined;
 const rows=available.filter(r=>r.order.includes(keyword)&&r.color.includes(color)&&(!type||r.type===type)&&(!excluded||(processMode==='include'?r.process===excluded:r.process!==excluded))&&(!groupSelection||groupKey(r,groupSelection.mode)===groupSelection.key));
 const cols=[{title:'序号',render:(_:unknown,__:Item,index:number)=>index+1},{title:'可用数量',dataIndex:'pieces',render:(value:number)=>`${Math.min(100,Math.max(10,value))}匹`},{title:'剩余缸数',dataIndex:'vats',render:(value:number)=>`${value}缸`},{title:'订字',dataIndex:'order',render:(v:string)=><b>{v}</b>},{title:'品名',dataIndex:'product'},{title:'色号',dataIndex:'color'},{title:'颜色',dataIndex:'colorName',render:(_:string,r:Item)=><Tooltip title={`${r.colorName} · ${r.colorHex}（演示色）`}><span className="capacity-color-cell"><i role="img" aria-label={`${r.colorName}色块`} className="capacity-order-swatch" style={{backgroundColor:r.colorHex}}/><span>{r.colorName}</span></span></Tooltip>},{title:'颜色深浅',dataIndex:'colorGroup',render:(v:ColorGroup)=>v==='本白'?'本白':`${v}色`},{title:'浴比',dataIndex:'bath',render:(v:string)=><span style={{color:v==='配方未出'?'#ff4d4f':undefined}}>{v}</span>},{title:'配方',dataIndex:'formulaStatus',render:(v:string)=><span style={{color:v==='已确认'?'#389e0d':'#cf1322',fontWeight:600}}>{v}</span>},{title:'工艺',dataIndex:'processStatus',render:(v:string)=><span style={{color:v==='已确认'?'#389e0d':'#cf1322',fontWeight:600}}>{v}</span>},{title:'订单日期',dataIndex:'created',render:(v:string)=>v.slice(5,10)},{title:'内部交期',render:(_:unknown,r:Item)=><Button type="link" aria-label={`修改${r.order} ${r.color}内部交期`} onClick={()=>editDue(r)}>{(dueChanges[r.card]?.date||r.due).slice(5,10)}</Button>},{title:'订单类型',dataIndex:'type',render:(v:string)=><Tag color="blue">{v}</Tag>},{title:'业务员',dataIndex:'sales'},{title:'操作',render:(_:unknown,r:Item)=><Button type="link" size="small" aria-label={`排产${r.order} ${r.color}`} onClick={event=>{event.stopPropagation();setScheduleItem(r)}}>排产</Button>}];
 const widths=[4,6,6,10,8,9,4,6,6,6,6,8,7,6,8,6];
 const sizedColumns=cols.map((column,index)=>({...column,width:widths[index]+'%'}));
 const displayColumns=view!=='card'?sizedColumns:[...sizedColumns.slice(0,4),{title:'流程卡号',dataIndex:'card',width:'8%',render:(value:string)=><span>{value}</span>},...sizedColumns.slice(4)];
 const detailState=detailItem?schedulingFormula(detailItem.card,detailItem.bath):null;
 const detailVat=detailItem?(detailItem.history==='-'?'J04#':`${detailItem.history.replace(/#$/,'')}#`):'—';
 const detailDepth=detailItem?.colorGroup==='本白'?'本白':detailItem?`${detailItem.colorGroup}色`:'—';
 const hasFilters=Boolean(groupSelection||keyword||color||type||excluded);
 const clearFilters=()=>{setGroupSelection(undefined);setKeyword('');setColor('');setType(undefined);setExcluded(undefined);setProcessMode('exclude');setSelected([])};
 return <><Modal className="capacity-modal" title={<div className="capacity-modal-title"><span>订单排产</span></div>} open={open} onCancel={onClose} footer={null} width="calc(100vw - 48px)" style={{top:16}} destroyOnHidden><div className="capacity-body">
  <section className="capacity-order-area">
   <div className="capacity-filter-panel"><div className="capacity-group-heading"><div><b>订单筛选</b><span>选择归类或输入条件筛选下方订单</span></div></div><div className="capacity-group-rows">{groupColumns.map(column=><section className={`capacity-group-row is-${column.mode}`} key={column.mode}><div className="capacity-group-row-title"><b>{column.title}：</b></div><div className="capacity-group-list">{column.options.map(group=>{const active=groupSelection?.mode===column.mode&&groupSelection.key===group.key;return <button className={`${active?'active':''}${group.tone==='danger'?' is-danger':''}`} key={group.key} aria-pressed={active} onClick={()=>{setGroupSelection(active?undefined:{mode:column.mode,key:group.key});setSelected([])}}><span className="capacity-group-name">{group.swatch&&<i style={{backgroundColor:group.swatch}}/>}<span>{group.label}</span></span><b>{group.count} 缸</b></button>})}</div></section>)}</div><div className="capacity-search-row"><span className="capacity-search-label">筛选条件</span>{groupSelection&&<Tag closable onClose={()=>setGroupSelection(undefined)}>{groupColumns.find(column=>column.mode===groupSelection.mode)?.title}：{selectedGroup?.label}</Tag>}<Input prefix={<SearchOutlined/>} aria-label="产能订字搜索" allowClear placeholder="请输入订字" value={keyword} onChange={e=>setKeyword(e.target.value)}/><Input prefix={<SearchOutlined/>} aria-label="产能色号搜索" allowClear placeholder="请输入色号" value={color} onChange={e=>setColor(e.target.value)}/><Select aria-label="产能订单类型" allowClear placeholder="全部订单类型" value={type} onChange={setType} options={['正常订单','厂外回修','试样布'].map(value=>({value,label:value}))}/><Space.Compact className="capacity-process-filter"><Select aria-label="工序筛选方式" value={processMode} onChange={setProcessMode} options={[{value:'include',label:'包含工序'},{value:'exclude',label:'不包含工序'}]}/><Select aria-label="选择筛选工序" allowClear placeholder="请选择工序" value={excluded} onChange={setExcluded} options={productionProcesses.map(value=>({value,label:value}))}/></Space.Compact><Tooltip title="清除筛选"><Button aria-label="清除筛选" icon={<ReloadOutlined/>} disabled={!hasFilters} onClick={clearFilters}/></Tooltip></div></div>
   <div className="capacity-status-row"><strong>可排订单 <span>{availableVatCount} 缸</span></strong><span>当前显示 <b>{rows.length}</b> 条</span></div>
   <div className="capacity-view-row"><Tabs className="capacity-view-tabs" activeKey={view} onChange={setView} items={[{key:'order',label:'订单'},{key:'card',label:'流程卡'}]}/>{selected.length>0&&<span className="capacity-selected-count">已选 {selected.length} 条</span>}</div>
   <Table rowKey="key" size="small" pagination={false} tableLayout="fixed" rowSelection={{columnWidth:'2.2%',selectedRowKeys:selected,onChange:setSelected}} columns={displayColumns} dataSource={rows} scroll={{y:'calc(100dvh - 506px)'}} onRow={record=>({onClick:event=>{if((event.target as HTMLElement).closest('button,a,input,.ant-checkbox,.ant-select'))return;setDetailItem(record)},style:{cursor:'pointer'},tabIndex:0,'aria-label':`查看${record.order} ${record.color}订单详情`,onKeyDown:event=>{if(event.target===event.currentTarget&&(event.key==='Enter'||event.key===' ')){event.preventDefault();setDetailItem(record)}}})} locale={{emptyText:<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无符合条件的订单"/>}}/>
  </section>
 </div></Modal>{scheduleItem&&<SchedulePopover showTrigger={false} open onOpenChange={open=>{if(!open)setScheduleItem(null)}} card={scheduleItem.card} history={scheduleItem.history} order={scheduleItem.order} pieces={scheduleItem.pieces} bath={scheduleItem.bath} onSchedule={allocations=>onSchedule(scheduleItem,allocations)}/>}<Modal title="调整内部交期" open={!!editingDue} onCancel={()=>setEditingDue(null)} onOk={saveDue} okText="保存调整" cancelText="取消" destroyOnHidden>
  {editingDue&&<p>{editingDue.order} · {editingDue.color}　客户交期：{editingDue.due.slice(5,10)}</p>}
 <Form form={dueForm} layout="vertical"><Form.Item name="date" label="内部交期" rules={[{required:true,message:'请选择内部交期'}]}><DatePicker aria-label="修改内部交期" format="MM-DD" style={{width:'100%'}}/></Form.Item><Form.Item name="reason" label="调整原因" rules={[{required:true,whitespace:true,message:'请填写调整原因'}]}><Input.TextArea aria-label="内部交期调整原因" placeholder="请填写本次交期调整原因" rows={3} maxLength={300} showCount/></Form.Item></Form>
 </Modal><Modal className="capacity-detail-modal" title={detailItem?`${detailItem.order} · ${detailItem.color}`:'订单详情'} open={!!detailItem} onCancel={()=>setDetailItem(null)} footer={null} width="calc(100vw - 40px)" style={{top:12}} destroyOnHidden>
  {detailItem&&detailState&&<div className="capacity-order-detail"><dl className="opening-card-details"><div><dt>基础信息：</dt><dd>{detailItem.order} | {detailItem.product}</dd></div><div><dt>颜色信息：</dt><dd>{detailItem.color} | {detailDepth} | {detailDepth}</dd></div><div><dt>白坯信息：</dt><dd>门幅{detailItem.width} | 克重{detailItem.weight}</dd></div><div><dt>不良信息：</dt><dd>— | — | —</dd></div><div><dt>米数信息：</dt><dd>预配{detailItem.pieces}匹 | 实配未发货匹 | 实配未发货米</dd></div><div><dt>成品要求：</dt><dd>门幅无要求 | 克重无要求</dd></div><div className="opening-card-requirements"><dt>加工要求：</dt><dd>烧毛 | 轻烧毛 | 酶油 | 轧光 | 罐蒸 | 罐头 | 打长卷 | 手感按标样 | 软 | 缩水率(纬向) 1 | 六样纤维牢度 1 | 做还原清洗 | 水洗牢度(棉-级) 1 | 拉开强力(经-N) 1 | 纬斜 1 | 成品手感：滑爽 | 成品光暗：一般 | 布面起皱风格：否 | 布面光洁：否 | 高牢度：否 | 预缩要求：否</dd></div></dl><div className="opening-plan-summary"><span>预排缸号：<b>{detailVat}</b></span><span>预计进缸布重：<b>{Math.round(detailItem.pieces*15.5)} kg</b></span><span>进缸浴比：<b>{detailState.approved.bath?`1:${detailState.approved.bath}`:'—'}</b></span></div><div className="opening-review-details"><section><div className="opening-section-heading"><h3><FileTextOutlined/> 配方详情</h3>{detailItem.formulaStatus!=='已确认'&&<Tag color="red">{detailItem.formulaStatus}</Tag>}</div><div className="opening-formula-number">{formulaNumber(detailState.approved.bath,detailItem.card,detailState.version)}</div><DyeFormulaTable compact fitWidth hideProcessCode formula={detailState.approved}/></section><section><div className="opening-section-heading"><h3><FileTextOutlined/> 工艺详情</h3>{detailItem.processStatus!=='已确认'&&<Tag color="red">{detailItem.processStatus}</Tag>}</div><div className="opening-formula-number">工艺号：G{detailItem.card.replace(/\D/g,'')}v0</div><OpeningProcessDetails/></section></div></div>}
 </Modal></>
}
