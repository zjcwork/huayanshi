import {useMemo,useState,type Key,type ReactNode} from 'react';
import {App,Button,DatePicker,Descriptions,Drawer,Input,Popconfirm,Select,Space,Table,Tabs,Tag,Tooltip} from 'antd';
import {ColumnHeightOutlined,EditOutlined,FullscreenOutlined,PrinterOutlined,ReloadOutlined,SettingOutlined} from '@ant-design/icons';
import dayjs,{type Dayjs} from 'dayjs';
import type {LabRecord} from './data';
import {filterFormulaAuditRows,formulaAuditCategory,type FormulaAuditCategory,type FormulaAuditFilters} from './formula-audit-model';
import './formula-audit-page.css';

type Props={records:LabRecord[];onAudit:(row:LabRecord,pass:boolean)=>void;renderFormula:(row:LabRecord)=>ReactNode;onEdit:(row:LabRecord)=>void};
type RangeValue=[Dayjs|null,Dayjs|null]|null;
type DetailTab='formula'|'process'|'basic';

const categories:{key:FormulaAuditCategory;label:string}[]=[
 {key:'sample',label:'打样'},{key:'copy',label:'抄样'},{key:'repair',label:'回修'},{key:'pre',label:'预打样'},
];
const emptyFilters:FormulaAuditFilters={order:'',colorNo:'',card:'',formula:'',status:'待审核'};
const displayFormulaType=(row:LabRecord)=>row.formulaType??(row.type==='回修'?'回修':'正常');

export default function FormulaAuditPage({records,onAudit,renderFormula,onEdit}:Props){
 const {message}=App.useApp();
 const [order,setOrder]=useState('');
 const [colorNo,setColorNo]=useState('');
 const [card,setCard]=useState('');
 const [formula,setFormula]=useState('');
 const [status,setStatus]=useState('待审核');
 const [dates,setDates]=useState<RangeValue>(null);
 const [filters,setFilters]=useState<FormulaAuditFilters>(emptyFilters);
 const [category,setCategory]=useState<FormulaAuditCategory>('sample');
 const [selected,setSelected]=useState<Key[]>([]);
 const [activeKey,setActiveKey]=useState<string|null>(null);
 const [detailTab,setDetailTab]=useState<DetailTab>('formula');
 const active=records.find(row=>row.key===activeKey)??null;
 const rows=useMemo(()=>filterFormulaAuditRows(records,category,filters),[records,category,filters]);
 const counts=useMemo(()=>Object.fromEntries(categories.map(item=>[item.key,records.filter(row=>formulaAuditCategory(row)===item.key).length])) as Record<FormulaAuditCategory,number>,[records]);
 const applyFilters=()=>setFilters({order:order.trim(),colorNo:colorNo.trim(),card:card.trim(),formula:formula.trim(),status,start:dates?.[0]?.format('YYYY-MM-DD'),end:dates?.[1]?.format('YYYY-MM-DD')});
 const reset=()=>{setOrder('');setColorNo('');setCard('');setFormula('');setStatus('待审核');setDates(null);setFilters(emptyFilters);setSelected([])};
 const openDetail=(row:LabRecord)=>{setActiveKey(row.key);setDetailTab('formula')};
 const decide=(pass:boolean,print=false)=>{
  if(!active||active.status!=='待审核')return;
  onAudit(active,pass);setActiveKey(null);setSelected(current=>current.filter(key=>key!==active.key));
  if(print)window.setTimeout(()=>window.print(),0);
 };
 const tableTools=<Space size={14} className="formula-audit-table-tools">
  <Tooltip title="全屏"><Button type="text" aria-label="全屏" icon={<FullscreenOutlined/>} onClick={()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}/></Tooltip>
  <Tooltip title="刷新"><Button type="text" aria-label="刷新" icon={<ReloadOutlined/>} onClick={()=>{reset();message.success('数据已刷新')}}/></Tooltip>
  <Tooltip title="表格密度"><Button type="text" aria-label="表格密度" icon={<ColumnHeightOutlined/>} onClick={()=>document.body.classList.toggle('comfortable')}/></Tooltip>
  <Tooltip title="显示设置"><Button type="text" aria-label="显示设置" icon={<SettingOutlined/>} onClick={()=>message.info('已恢复默认列显示')}/></Tooltip>
 </Space>;
 const pending=active?.status==='待审核';
 const formulaActions=active&&<Space size={8}>
  <Button type="primary" onClick={()=>setDetailTab('formula')}>查看配方</Button>
  <Button type="primary" onClick={()=>message.success('已引用当前配方的减量率')}>引用减量率</Button>
  <Button type="primary" icon={<EditOutlined/>} disabled={!pending} onClick={()=>onEdit(active)}>编辑配方</Button>
 </Space>;
 return <section className="panel formula-audit-page">
  <div className="formula-audit-filters">
   <label><span>订字：</span><Input aria-label="审核订字" placeholder="请输入订字" value={order} onChange={event=>setOrder(event.target.value)} onPressEnter={applyFilters}/></label>
   <label><span>色号：</span><Input aria-label="审核色号" placeholder="请输入色号" value={colorNo} onChange={event=>setColorNo(event.target.value)} onPressEnter={applyFilters}/></label>
   <label><span>流程卡号：</span><Input aria-label="审核流程卡号" placeholder="请输入流程卡号" value={card} onChange={event=>setCard(event.target.value)} onPressEnter={applyFilters}/></label>
   <label><span>配方号：</span><Input aria-label="审核配方号" placeholder="请输入配方号" value={formula} onChange={event=>setFormula(event.target.value)} onPressEnter={applyFilters}/></label>
   <label className="formula-audit-date"><span>创建时间：</span><DatePicker.RangePicker aria-label="审核创建时间" value={dates} onChange={value=>setDates(value as RangeValue)} format="YYYY-MM-DD"/></label>
   <label><span>审核状态：</span><Select aria-label="审核状态" value={status} onChange={setStatus} options={['全部','待审核','已通过','未通过'].map(value=>({value,label:value}))}/></label>
   <span className="formula-audit-filter-spacer"/><Button type="primary" onClick={applyFilters}>查 询</Button><Button onClick={reset}>重 置</Button>
  </div>
  <div className="formula-audit-list-heading"><Tabs activeKey={category} onChange={key=>{setCategory(key as FormulaAuditCategory);setSelected([])}} items={categories.map(item=>({key:item.key,label:`${item.label} (${counts[item.key]})`}))}/>{tableTools}</div>
  <Table<LabRecord> className="formula-audit-table" bordered size="small" rowKey="key" dataSource={rows} tableLayout="fixed" scroll={{x:1740,y:'calc(100vh - 250px)'}} rowSelection={{selectedRowKeys:selected,onChange:setSelected,columnWidth:42}} onRow={row=>({onClick:()=>openDetail(row)})} pagination={{defaultPageSize:20,showSizeChanger:true,pageSizeOptions:[10,20,100],showTotal:total=>`共 ${total} 条`,size:'small'}} columns={[
   {title:'序号',width:55,align:'center',render:(_,__,index)=>index+1},
   {title:'订字',dataIndex:'order',width:150,ellipsis:true},
   {title:'色号',dataIndex:'colorNo',width:140,ellipsis:true},
   {title:'配方号',dataIndex:'formula',width:145,ellipsis:true},
   {title:'配方类型',width:90,align:'center',render:(_,row)=>displayFormulaType(row)},
   {title:'品名',dataIndex:'product',width:160,ellipsis:true},
   {title:'染料类型',width:90,align:'center',render:(_,row)=>row.dyeCategory||'活性'},
   {title:'颜色',dataIndex:'color',width:110,render:(value,row)=><span className="formula-audit-color"><i style={{background:row.hex}}/>{value}</span>},
   {title:'对色光源',dataIndex:'colorLight',width:90,align:'center',render:value=>value||'-'},
   {title:'分配时间',dataIndex:'created',width:155},
   {title:'打样完成时间',width:165,render:(_,row)=>dayjs(row.created).add(1,'hour').format('YYYY-MM-DD HH:mm:ss')},
   {title:'打样员',dataIndex:'worker',width:95},
   {title:'操作',fixed:'right',width:180,render:(_,row)=><Space size={5} onClick={event=>event.stopPropagation()}><Popconfirm title="确认该配方未通过？" okText="确认" cancelText="取消" onConfirm={()=>onAudit(row,false)}><Button type="link" danger disabled={row.status!=='待审核'}>未通过</Button></Popconfirm><Button type="link" icon={<PrinterOutlined/>} onClick={()=>window.print()}>打印</Button><Button type="link" disabled={row.status!=='待审核'} onClick={()=>onAudit(row,true)}>通过</Button></Space>},
  ]}/>
  <Drawer rootClassName="formula-audit-drawer" open={!!active} width="calc(100vw - 176px)" title={active?<span>{active.order}<b>{active.colorNo}</b></span>:null} onClose={()=>setActiveKey(null)} footer={active&&<div className="formula-audit-drawer-footer"><Popconfirm title="确认该配方未通过？" description="审核结果将记录为未通过。" okText="确认" cancelText="取消" onConfirm={()=>decide(false)}><Button danger type="primary" disabled={!pending}>未通过</Button></Popconfirm><Button type="primary" icon={<PrinterOutlined/>} onClick={()=>window.print()}>打 印</Button><Button type="primary" disabled={!pending} onClick={()=>decide(true,true)}>通过并打印</Button></div>}>
   {active&&<Tabs className="formula-audit-detail-tabs" activeKey={detailTab} onChange={key=>setDetailTab(key as DetailTab)} tabBarExtraContent={detailTab==='formula'?formulaActions:null} items={[
    {key:'formula',label:'大样配方',children:<div className="formula-audit-formula">{renderFormula(active)}</div>},
    {key:'process',label:'打样过程',children:<Table size="small" bordered pagination={false} rowKey="key" dataSource={[1,2,3,4].map(round=>({key:round,round:`第${round}枪`,time:dayjs(active.created).add(round*9,'minute').format('YYYY-MM-DD HH:mm:ss'),worker:active.worker,result:round===4?'完成':'调整中'}))} columns={[{title:'枪次',dataIndex:'round'},{title:'操作时间',dataIndex:'time'},{title:'打样员',dataIndex:'worker'},{title:'结果',dataIndex:'result',render:value=><Tag color={value==='完成'?'green':'blue'}>{value}</Tag>}]}/>},
    {key:'basic',label:'基础信息',children:<Descriptions bordered size="small" column={4} items={[
     {key:'order',label:'订字',children:active.order},{key:'colorNo',label:'色号',children:active.colorNo},{key:'product',label:'品名',children:active.product},{key:'color',label:'颜色',children:active.color},
     {key:'formula',label:'配方号',children:active.formula},{key:'card',label:'流程卡号',children:active.processCard||'-'},{key:'bath',label:'浴比',children:`1:${active.ratio}`},{key:'worker',label:'打样员',children:active.worker},
     {key:'created',label:'分配时间',children:active.created,span:2},{key:'status',label:'审核状态',children:<Tag color={active.status==='已通过'?'green':active.status==='未通过'?'red':'orange'}>{active.status}</Tag>,span:2},
    ]}/>},
   ]}/>}
  </Drawer>
 </section>;
}
