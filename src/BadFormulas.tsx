import BadFormulaComparison from './BadFormulaComparison';
import {useState} from 'react';
import {Alert,App,Button,Checkbox,DatePicker,Descriptions,Empty,Form,Input,InputNumber,Modal,Pagination,Select,Space,Table,Tabs} from 'antd';
import {FullscreenOutlined,ReloadOutlined,DownOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import {matchingFormulaNumber,formulaProcess,formulaPh,changeFormulaScope,additionMaterials,displayMatchingText,completeResample,decide,defectStatus,isBadFormula,matchingFormula,readRecord,readRecords,storageKey,writeRecord,type DetailRow,type Decision,type MatchingRecord} from './matching-model';
import './bad-formulas.css';
import './formula-change-review.css';
type Item={card:string;record:MatchingRecord};
type MaterialItem=Item&{key:string;span:number;sequence:number;material:ReturnType<typeof additionMaterials>[number]};
const metadata=(item:Item)=>{
 const index=['DEMO-Y26091501','DEMO-Y26091502','DEMO-Y26091503','DEMO-Y26091504','DEMO-Y26091505'].indexOf(item.card);
 return index<0?{order:'—',color:'—',product:'—',remaining:'—',worker:'—',weight:'—',width:'—',pieces:'—',meters:'—'}:
 {order:['统忠宏20031竹','如果167','卫州175沈-312','阳光1978-1','国张711'][index],color:['灰色','出水干净元外','特殊绿色','浅蓝','浅黄'][index],product:'T/R纬弹',remaining:String(index+1),worker:'寿陈锡',weight:'280g',width:'150cm',pieces:'1',meters:'710'};
};
const when=(value?:string)=>value?dayjs(value).format('MM-DD HH:mm'):'—';
const waiting=(item:Item)=>{if(defectStatus(item.record)!=='待工段长处理')return '—';const minutes=Math.max(0,dayjs().diff(dayjs(item.record.additions[2].time),'minute'));return minutes<60?`${minutes}分`:minutes<1440?`${(minutes/60).toFixed(1)}时`:`${(minutes/1440).toFixed(1)}天`;};
export default function BadFormulas({tasks=false,onMatching}:{tasks?:boolean;onMatching:(card:string)=>void;onSample?:()=>void}){
 const {message}=App.useApp();
 const [detailsExpanded,setDetailsExpanded]=useState(true);
 const [bath,setBath]=useState<number|null>(8);
 const [page,setPage]=useState(1),[pageSize,setPageSize]=useState(20);
 const [,refresh]=useState(0),[query,setQuery]=useState(''),[order,setOrder]=useState(''),[status,setStatus]=useState('全部'),[dates,setDates]=useState<[string,string]>(['','']);
 const [applied,setApplied]=useState({query:'',order:'',status:'全部',dates:['','']}),[category,setCategory]=useState('加料'),[checked,setChecked]=useState<React.Key[]>([]),[full,setFull]=useState(false);
 const [selected,setSelected]=useState<Item|null>(null),[action,setAction]=useState<Decision['kind']|null>(null),[batch,setBatch]=useState(false),[reason,setReason]=useState(''),[operator,setOperator]=useState(''),[rows,setRows]=useState<DetailRow[]>([]);
 let items:Item[]=[];let error='';
 try{items=Object.entries(readRecords()).filter(([,r])=>isBadFormula(r)).map(([card,record])=>({card,record}));}catch{error='读取记录失败，请检查浏览器存储后刷新重试';}
 const show=(item:Item)=>{setDetailsExpanded(true);setSelected(item);setBath(item.record.bathRatio??(item.record.demo?8:9));setAction(null);setReason('');setOperator('');setRows((item.record.formula??matchingFormula).map(r=>({...r})));};
 const canEdit=!!selected&&(tasks?defectStatus(selected.record)==='待重新打样':defectStatus(selected.record)==='待工段长处理');
 const startAction=(kind:Decision['kind'])=>{setAction(kind);setReason('');setOperator('');};
 const editFormula=canEdit&&(tasks||action==='直接调整配方');
 const patchRow=(key:string,patch:Partial<DetailRow>)=>setRows(values=>values.map(r=>r.key===key?{...r,...patch}:r));
 const submit=(scope:'card'|'order'='card')=>{
  try{
   if(batch){
    const all=readRecords();
    for(const card of checked){const record=all[String(card)];if(!record)throw new Error('记录已变化，请刷新');all[String(card)]=decide(record,'无需变更',reason,operator);}
    localStorage.setItem(storageKey,JSON.stringify(all));setBatch(false);setChecked([]);
   }else{
    if(!selected)return;const latest=readRecord(selected.card);
    if(JSON.stringify(latest)!==JSON.stringify(selected.record))throw new Error('记录已更新，请关闭详情并刷新后重试');
    if(!tasks&&action==='直接调整配方'){const next=changeFormulaScope(readRecords(),selected.card,rows,bath??0,scope,reason,operator);localStorage.setItem(storageKey,JSON.stringify(next));}else{writeRecord(selected.card,tasks?completeResample(latest,rows):decide(latest,action!,reason,operator,rows));}setSelected(null);
   }
   refresh(n=>n+1);setAction(null);message.success(tasks?'打样结果已保存，等待对样':action==='重新打样'?'已创建复样，请在打样模块处理':'处理结果已保存');
  }catch(e){message.error(e instanceof Error?e.message:'保存失败，请重试');}
 };
 const filtered=items.filter(i=>{
  const m=metadata(i),time=dayjs(i.record.additions[2].time),s=defectStatus(i.record);
  return (tasks?s==='待重新打样':category==='加料')&&i.card.includes(applied.query.trim())&&`${m.order} ${m.color}`.includes(applied.order.trim())&&(tasks||applied.status==='全部'||(applied.status==='待确认'?s==='待工段长处理':applied.status==='已处理'?s!=='待工段长处理':s===applied.status))&&(!applied.dates[0]||!time.isBefore(dayjs(applied.dates[0]).startOf('day')))&&(!applied.dates[1]||!time.isAfter(dayjs(applied.dates[1]).endOf('day')));
 });
 const currentPage=Math.min(page,Math.max(1,Math.ceil(filtered.length/pageSize)));
 const pageItems=filtered.slice((currentPage-1)*pageSize,currentPage*pageSize);
 const materialItems:MaterialItem[]=pageItems.flatMap((item,index)=>{const materials=additionMaterials(item.record);return materials.map((material,j)=>({...item,key:`${item.card}:${j}`,span:j===0?materials.length:0,sequence:(currentPage-1)*pageSize+index+1,material}));});
 const mergeCard=(item:MaterialItem)=>({rowSpan:item.span});
 const selectable=pageItems.filter(i=>defectStatus(i.record)==='待工段长处理').map(i=>i.card);
 const toggleCard=(card:string,checkedValue:boolean)=>setChecked(values=>checkedValue?Array.from(new Set([...values,card])):values.filter(v=>v!==card));

 const info=selected?metadata(selected):null;

 return <div className={`bad-formulas${full?' bad-full':''}`}>
  <div className="filter-bar bad-filter"><Input aria-label="订字或色号" placeholder="订字/色号：请输入" value={order} onChange={e=>setOrder(e.target.value)}/><Input aria-label="流程卡号" placeholder="流程卡号：请输入" value={query} onChange={e=>setQuery(e.target.value)}/><DatePicker aria-label="开始日期" placeholder="开始日期" value={dates[0]?dayjs(dates[0]):null} onChange={d=>setDates([d?.format('YYYY-MM-DD')??'',dates[1]])}/><DatePicker aria-label="结束日期" placeholder="结束日期" value={dates[1]?dayjs(dates[1]):null} onChange={d=>setDates([dates[0],d?.format('YYYY-MM-DD')??''])}/><Select aria-label="处理状态" value={status} onChange={setStatus} options={['全部','待确认','待重新打样','已处理'].map(value=>({value,label:value}))}/><span className="filter-spacer"/><Button type="primary" onClick={()=>{if(dates[0]&&dates[1]&&dates[0]>dates[1]){message.warning('开始日期不能晚于结束日期');return;}setPage(1);setApplied({query,order,status,dates});setChecked([])}}>查询</Button><Button onClick={()=>{setQuery('');setOrder('');setStatus('全部');setDates(['','']);setApplied({query:'',order:'',status:'全部',dates:['','']});setChecked([])}}>重置</Button></div>
  <section className="panel bad-list"><div className="bad-list-heading"><h3>{tasks?'不良配方 · 重新打样':'不良配方'}</h3>{!tasks&&<Tabs activeKey={category} onChange={v=>{setCategory(v);setPage(1);setChecked([])}} items={[{key:'加料',label:`加料（${items.length}）`},{key:'回修',label:'回修（0）'}]}/>}<Space className="bad-tools">{!tasks&&<Button type="primary" disabled={!checked.length} onClick={()=>{setBatch(true);startAction('无需变更')}}>批量无需变更</Button>}<Button type="text" aria-label="全屏列表" icon={<FullscreenOutlined/>} onClick={()=>setFull(!full)}/><Button type="text" aria-label="刷新不良配方" icon={<ReloadOutlined/>} onClick={()=>refresh(n=>n+1)}/></Space></div>
   {error?<Alert type="error" message={error}/>:<><Table<MaterialItem> bordered size="small" rowKey="key" dataSource={materialItems} scroll={{x:1510}} pagination={false} locale={{emptyText:<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={category==='回修'?'暂无回修记录':'暂无符合条件的记录'}/>}} columns={[
    ...(!tasks?[{title:<Checkbox aria-label="选择本页流程卡" disabled={!selectable.length} checked={!!selectable.length&&selectable.every(card=>checked.includes(card))} indeterminate={selectable.some(card=>checked.includes(card))&&!selectable.every(card=>checked.includes(card))} onChange={e=>setChecked(values=>e.target.checked?Array.from(new Set([...values,...selectable])):values.filter(v=>!selectable.includes(String(v))))}/>,width:36,onCell:mergeCard,render:(_:unknown,i:MaterialItem)=><Checkbox aria-label={`选择流程卡${displayMatchingText(i.card)}`} checked={checked.includes(i.card)} disabled={defectStatus(i.record)!=='待工段长处理'} onChange={e=>toggleCard(i.card,e.target.checked)}/>}]:[]),
    {title:'序号',onCell:mergeCard,width:50,render:(_,i)=>i.sequence},{title:'流程卡号',onCell:mergeCard,width:155,render:(_,i)=><Button type="link" onClick={()=>onMatching(i.card)}>{displayMatchingText(i.card)}</Button>},
    {title:'订字',onCell:mergeCard,width:130,render:(_,i)=>metadata(i).order},{title:'色号',onCell:mergeCard,width:105,render:(_,i)=>metadata(i).color},{title:'剩余缸数',onCell:mergeCard,width:75,render:(_,i)=>metadata(i).remaining},
    {title:'加料原因',onCell:mergeCard,width:90,render:(_,i)=><>{i.record.additions.at(-1)?.direction||'—'}<br/>{i.record.additions.at(-1)?.depth||i.record.additions.at(-1)?.reason}</>},
    {title:'加料次数',onCell:mergeCard,width:80,render:(_,i)=>`${i.record.additions.length}次`},
    {title:'染助剂',width:80,render:(_,i)=>i.material.code},
    {title:'加料前',width:80,render:(_,i)=>i.material.ratio??'—'},
    {title:'加料后',width:80,render:(_,i)=>i.material.ratio!==null&&i.material.amount!==null?Number((i.material.ratio+i.material.amount).toFixed(4)):'—'},
    {title:'对样员',onCell:mergeCard,width:100,render:(_,i)=>metadata(i).worker},{title:'对样完成时间',onCell:mergeCard,width:115,render:(_,i)=>when(i.record.additions.at(-1)?.time)},
    {title:'等待时长',onCell:mergeCard,width:85,render:(_,i)=>waiting(i)},
    {title:'操作',onCell:mergeCard,fixed:'right',width:100,render:(_,i)=><Button type="link" onClick={()=>show(i)}>{tasks?'录入打样配方':defectStatus(i.record)==='待工段长处理'?'去处理':'查看详情'}</Button>}
   ]}/><Pagination className="bad-card-pagination" current={currentPage} pageSize={pageSize} total={filtered.length} showSizeChanger showQuickJumper showTotal={total=>`共 ${total} 张流程卡`} onChange={(p,size)=>{setPage(size===pageSize?p:1);setPageSize(size)}}/></>}</section>
  <Modal className="bad-detail-modal" title={selected?`${selected.record.order||info?.order||'—'} | 色号：${selected.record.colorNo||info?.color||'—'}`:'流程卡详情'} open={!!selected} width="calc(100vw - 40px)" style={{top:16}} onCancel={()=>{setSelected(null);setAction(null)}} footer={canEdit?<Space>{tasks?<Button type="primary" onClick={()=>submit()}>保存打样结果</Button>:action?<><Button onClick={()=>{setAction(null);if(selected)setRows((selected.record.formula??matchingFormula).map(r=>({...r})));if(selected)setBath(selected.record.bathRatio??(selected.record.demo?8:9))}}>取消</Button><Button type="primary" onClick={()=>submit()}>{action==='重新打样'?'确认重打配方':action==='无需变更'?'确认使用原配方':'变更配方'}</Button></>:<><Button onClick={()=>startAction('重新打样')}>重打配方</Button><Button type="primary" onClick={()=>startAction('无需变更')}>使用原配方</Button></>}</Space>:<Button onClick={()=>setSelected(null)}>关闭</Button>}>
   {selected&&info&&<><div className="formula-card-heading"><h4>流程卡详情</h4><Button type="text" aria-label={detailsExpanded?'收起流程卡详情':'展开流程卡详情'} icon={<DownOutlined rotate={detailsExpanded?180:0}/>} onClick={()=>setDetailsExpanded(!detailsExpanded)}/></div>{detailsExpanded&&<Descriptions className="formula-card-metadata" bordered size="small" column={3} items={[
 {key:'basic',label:'基础信息',children:`${displayMatchingText(selected.card)} | ${selected.record.order||info.order} | ${info.product}`},
 {key:'color',label:'颜色信息',children:selected.record.colorNo||info.color},
 {key:'fabric',label:'白坯信息',children:`门幅${info.width} | 克重${info.weight}`},
 {key:'defect',label:'不良信息',children:`对样 | 加料${selected.record.additions.length}次 | ${selected.record.result}`},
 {key:'quantity',label:'米数信息',children:`预配${selected.record.demo?'5':'—'}匹 | 实配${info.pieces}匹 | 实配${info.meters}米`},
 {key:'finished',label:'成品要求',children:'无要求'},
 {key:'request',label:'加工要求',children:'无要求',span:3},
 ]}/>}<div className="bad-formula-title"><h4>配方详情</h4><span style={{color:'#385477'}}>配方号：{matchingFormulaNumber(selected.card,selected.record)}</span></div>
   {action&&<Form className="bad-decision-form" layout="inline"><strong>{action==='重新打样'?'重打配方':action==='无需变更'?'使用原配方':action}</strong><Form.Item label="工段长" required><Input aria-label="工段长姓名" placeholder="请输入姓名" value={operator} onChange={e=>setOperator(e.target.value)}/></Form.Item><Form.Item label="处理原因" required><Input aria-label="处理原因" placeholder="请输入判断依据" value={reason} onChange={e=>setReason(e.target.value)}/></Form.Item></Form>}
   {!editFormula?<BadFormulaComparison bath={bath} formula={rows} batches={selected.record.additions}/>:<Table<DetailRow> className={`bad-formula-table${editFormula?' bad-formula-editing':''}`} bordered size="small" rowKey="key" pagination={false} dataSource={rows} locale={{emptyText:editFormula?<Button onClick={()=>setRows([{key:crypto.randomUUID(),stage:1,code:'CP1',ratio:1,algorithm:'布重',unit:'克/市斤'}])}>新增染助剂</Button>:undefined}} columns={[
    ...(editFormula?[{title:'操作',width:70,render:(_:unknown,r:DetailRow)=><Space><Button type="link" aria-label={`在${r.code}后新增`} onClick={()=>setRows(current=>{const next=[...current];next.splice(next.findIndex(x=>x.key===r.key)+1,0,{...r,key:crypto.randomUUID(),code:'',ratio:0,process:'',ph:''});return next})}>增</Button><Button type="link" danger aria-label={`删除${r.code}`} onClick={()=>setRows(current=>current.filter(x=>x.key!==r.key))}>删</Button></Space>}]:[]),
    {title:'浴比',width:70,render:()=>editFormula&&!tasks?<InputNumber aria-label="配方浴比" min={0.01} value={bath} onChange={setBath}/>: `1 : ${bath??'—'}`,onCell:(_,i)=>({rowSpan:i===0?rows.length:0})},
    {title:'阶段',width:60,render:(_,r)=>editFormula?<InputNumber aria-label={`${r.key}阶段`} min={1} precision={0} value={r.stage} onChange={stage=>patchRow(r.key,{stage:stage??0})}/>:r.stage},
    {title:'染助剂代码',width:110,render:(_,r)=>editFormula?<Select aria-label={`${r.key}染助剂代码`} showSearch value={r.code||undefined} placeholder="请选择" options={Array.from(new Set([...matchingFormula.map(x=>x.code),'A23','A35','A5','P103','P27','P48','B18','B2',...rows.map(x=>x.code).filter(Boolean)])).map(value=>({value,label:value}))} onChange={code=>patchRow(r.key,{code})}/>:r.code},
    {title:'比例',width:80,render:(_,r)=>editFormula?<InputNumber aria-label={`${r.code}新比例`} min={0} value={r.ratio} onChange={ratio=>patchRow(r.key,{ratio})}/>:r.ratio},
    {title:'算法',width:85,render:(_,r)=>editFormula?<Select aria-label={`${r.key}算法`} value={r.algorithm} options={['布重','水量'].map(value=>({value,label:value}))} onChange={algorithm=>patchRow(r.key,{algorithm,unit:algorithm==='布重'?'克/市斤':'克/升'})}/>:r.algorithm},
    {title:'单位',width:100,render:(_,r)=>editFormula?<Select aria-label={`${r.key}单位`} value={r.unit} options={['克/市斤','克/升'].map(value=>({value,label:value}))} onChange={unit=>patchRow(r.key,{unit,algorithm:unit==='克/升'?'水量':'布重'})}/>:r.unit},
    {title:'工艺',width:145,render:(_,r)=>editFormula?<Input aria-label={`${r.key}工艺`} value={formulaProcess(r)} onChange={e=>patchRow(r.key,{process:e.target.value})}/>:formulaProcess(r)},
    {title:'pH',width:95,render:(_,r)=>editFormula?<Input aria-label={`${r.key}pH`} value={formulaPh(r)} onChange={e=>patchRow(r.key,{ph:e.target.value})}/>:formulaPh(r)}
   ]}/>}

   </>}
  </Modal>
  <Modal title={`批量无需变更 · ${checked.length} 条`} open={batch} onCancel={()=>{setBatch(false);setAction(null)}} onOk={()=>submit()} okText="确认处理" cancelText="取消"><Form layout="vertical"><Form.Item label="工段长姓名" required><Input value={operator} onChange={e=>setOperator(e.target.value)}/></Form.Item><Form.Item label="处理原因" required><Input.TextArea value={reason} onChange={e=>setReason(e.target.value)}/></Form.Item></Form></Modal>
 </div>;
}
