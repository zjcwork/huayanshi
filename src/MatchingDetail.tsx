import {useState} from 'react';
import {App,Button,Descriptions,Form,Input,InputNumber,Modal,Radio,Select,Space,Table,Tag,Tooltip} from 'antd';
import type {ColumnsType} from 'antd/es/table';
import {DownOutlined,FullscreenExitOutlined,FullscreenOutlined,ReloadOutlined} from '@ant-design/icons';
import './matching-detail.css';

import {matchingFormulaNumber,formulaProcess,formulaPh,displayMatchingText,readRecord,writeRecord,matchingFormula as baseFormula,defectStatus,type AdditionRow,type AdditionBatch,type DetailRow,type MatchingRecord} from './matching-model';

export default function MatchingDetail({processCard,onBack,onDefects}:{processCard:string;onBack:()=>void;onDefects:()=>void}){
 const {message}=App.useApp();
 const [record,setRecord]=useState(()=>readRecord(processCard));
 const matchingFormula=record.formula??baseFormula;
 const [expanded,setExpanded]=useState(true),[fullscreen,setFullscreen]=useState(false);
 const [dialog,setDialog]=useState<'resample'|'vat'|'addition'|'reject'|null>(null);
 const [reason,setReason]=useState(''),[vat,setVat]=useState(''),[depth,setDepth]=useState(''),[direction,setDirection]=useState(''),[mode,setMode]=useState('');
 const [adding,setAdding]=useState(false),[additionRows,setAdditionRows]=useState<AdditionRow[]>([]),[historyOpen,setHistoryOpen]=useState(false);
 const updateRow=(key:string,patch:Partial<AdditionRow>)=>setAdditionRows(rows=>rows.map(r=>r.key===key?{...r,...patch}:r));
 const saveAddition=()=>{
  const filled=additionRows.filter(r=>r.amount!==null);
  if(!filled.length||filled.some(r=>!r.code.trim()||!r.amount||r.amount<=0)){message.warning('请至少填写一项大于 0 的加料比例，并填写染助剂代码');return;}
  const batch:AdditionBatch={code:filled.map(r=>r.code).join('、'),amount:filled[0].amount!,reason:`${direction}；${depth}；${mode}`,time:new Date().toISOString(),depth,direction,mode,rows:filled.map(r=>({...r}))};
  if(save({...record,result:'待对样',additions:[...record.additions,batch]})){setAdding(false);setAdditionRows([]);message.success(record.additions.length+1>=3?'加料已保存，已归入不良配方':'加料已保存');}
 };
 const save=(next:MatchingRecord)=>{
  try {writeRecord(processCard,next);setRecord(next);return true;}
  catch {message.error('保存失败，请检查浏览器存储后重试');return false;}
 };
 const open=(kind:typeof dialog)=>{setReason('');setVat(displayMatchingText(record.linkedVat));setDepth('');setDirection('');setMode('');setDialog(kind)};
 const submit=()=>{
  if(dialog==='addition'){if(!depth||!direction||!mode){message.warning('请选择颜色深浅、颜色偏向和加料状态');return;}setAdditionRows(matchingFormula.map(r=>({...r,amount:null,process:''})));setAdding(true);setDialog(null);return;}
  if(dialog==='vat'){
   if(!vat.trim()){message.warning('请填写连缸号');return;}
   if(!save({...record,linkedVat:vat.trim()}))return;
   message.success('连缸号已保存');
  }else{
   if(!reason.trim()){message.warning('请填写原因');return;}
   const time=new Date().toISOString();
   if(dialog==='resample'){
    if(!save({...record,resamples:[...record.resamples,{reason:reason.trim(),time}]}))return;
    message.success('复样申请已记录');
   }else{
    if(!save({...record,result:'未通过',reason:reason.trim()}))return;
    message.success('已记录对样未通过');
   }
  }
  setDialog(null);
 };
 const approve=(direct:boolean)=>{
  if(save({...record,result:direct?'通过并直送':'通过',reason:''}))message.success(direct?'已记录对样通过并直送':'对样通过，结果已保存');
 };
 const mergeStage=(_:unknown,index?:number)=>({rowSpan:record.formula?1:index===0?2:index===2?6:index!==undefined&&index>=8?1:0});
 const savedBatches=record.additions.map(batch=>({...batch,rows:batch.rows??[{key:batch.code,stage:matchingFormula.find(r=>r.code===batch.code)?.stage??1,code:batch.code,ratio:null,algorithm:matchingFormula.find(r=>r.code===batch.code)?.algorithm??'未记录',unit:matchingFormula.find(r=>r.code===batch.code)?.unit??'未记录',amount:batch.amount,process:''}]}));
 const detailRows:DetailRow[]=matchingFormula.map(r=>({...r}));
 for(const batch of savedBatches)for(const row of batch.rows){if(!detailRows.some(r=>r.key===row.key))detailRows.push({key:row.key,stage:row.stage,code:row.code,ratio:null,algorithm:'—',unit:'—',added:true});}
 const savedColumns:ColumnsType<DetailRow>=savedBatches.map((batch,index)=>({
  title:<div className="matching-saved-title">加料{index+1} · {batch.mode||'加料'}<small>{batch.reason}</small><small>{new Date(batch.time).toLocaleString()}</small></div>,
  children:[{title:'比例',width:90,render:(_,row)=>batch.rows.find(r=>r.key===row.key)?.amount??'—'},
   {title:'工艺',width:120,render:(_,row)=>batch.rows.find(r=>r.key===row.key)?.process||'—'},
   {title:'算法',width:85,render:(_,row)=>batch.rows.find(r=>r.key===row.key)?.algorithm||'—'},
   {title:'单位',width:95,render:(_,row)=>batch.rows.find(r=>r.key===row.key)?.unit||'—'}]
 }));

 return <section className={`panel matching-detail${fullscreen?' matching-detail-fullscreen':''}`}>
  <div className="matching-detail-top">
   <h3>染色对样　<span>{displayMatchingText(processCard)} | 阳光1978-1 | 2# | 正常转卡 | 连缸号：{displayMatchingText(record.linkedVat)||'未填写'}</span></h3>
   <div className="matching-detail-tools"><Tooltip title={fullscreen?'退出全屏':'全屏显示'}><Button type="text" aria-label={fullscreen?'退出对样全屏':'对样全屏显示'} icon={fullscreen?<FullscreenExitOutlined/>:<FullscreenOutlined/>} onClick={()=>setFullscreen(!fullscreen)}/></Tooltip><Tooltip title={expanded?'收起基础信息':'展开基础信息'}><Button type="text" aria-label={expanded?'收起基础信息':'展开基础信息'} icon={<DownOutlined rotate={expanded?180:0}/>} onClick={()=>setExpanded(!expanded)}/></Tooltip></div>
  </div>
  <div className="matching-detail-scroll">{record.additions.length>=3&&<div style={{padding:12,background:'#fff7e6',marginBottom:12}}>累计加料 {record.additions.length} 次，已归入不良配方 · {defectStatus(record)} <Button type="link" onClick={onDefects}>查看不良配方</Button></div>}
   {expanded&&<Descriptions className="matching-metadata" size="small" bordered column={6} items={[
    {key:'product',label:'品名',children:'T/R纬弹'},
    {key:'light',label:'对色光源',children:'\u00a0'},
    {key:'length',label:'实配匹/米',children:'10匹 / 1501米'},
    {key:'weight',label:'进缸布重',children:'-'},
    {key:'ratio',label:'配方与实际浴比',children:`1:${record.bathRatio??(record.demo?8:9)} | -`},
    {key:'defect',label:'不良',children:record.result==='未通过'?record.reason:'-'},
    {key:'request',label:'加工要求',children:'无要求',span:6}
   ]}/>}
   <div className="matching-formula-heading"><h3>配方详情 <span>{matchingFormulaNumber(processCard,record)}</span></h3>{adding?<Space><Button type="primary" onClick={()=>setHistoryOpen(true)}>历史配方查询</Button><Button onClick={()=>{setAdding(false);setAdditionRows([])}}>取消加料</Button><Button type="primary" onClick={saveAddition}>保存加料</Button></Space>:<Tooltip title="刷新配方信息"><Button type="text" aria-label="刷新对样配方" icon={<ReloadOutlined/>} onClick={()=>{setRecord(readRecord(processCard));message.success('配方信息已刷新')}}/></Tooltip>}</div>
   {adding?<Table className="matching-addition-table" bordered size="small" rowKey="key" pagination={false} scroll={{x:1210}} dataSource={additionRows} columns={[
    {title:'阶段',dataIndex:'stage',width:60},
    {title:'染助剂代码',dataIndex:'code',width:100,render:(v:string,r:AdditionRow)=>r.added?<Input aria-label={`${r.key}染助剂代码`} value={v} onChange={e=>updateRow(r.key,{code:e.target.value})}/>:v},
    {title:'比例',dataIndex:'ratio',width:80,render:(v:number|null)=>v??'—'},
    {title:'算法',width:80,render:(_,r)=>matchingFormula.find(x=>x.key===r.key)?.algorithm||'—'},{title:'单位',width:90,render:(_,r)=>matchingFormula.find(x=>x.key===r.key)?.unit||'—'},
    {title:'工艺',width:110,render:(_,r)=>r.code==='CP1'?"130°C*10′":r.code==='B28'?"60°C*50′ / 75°C*10′":''},
    {title:'PH值',width:90,render:(_,r)=>r.code==='CP1'?'3.4-5.6':r.code==='B28'?'10.8-11.8':''},
    {title:<>加料{record.additions.length+1}<br/>({mode})<br/>{direction};{depth}</>,width:115,render:(_,r)=><InputNumber aria-label={`${r.key}加料比例`} min={0} placeholder="请输入" value={r.amount} onChange={v=>updateRow(r.key,{amount:v})}/>},
    {title:`加料${record.additions.length+1}工艺`,width:115,render:(_,r)=><Input aria-label={`${r.key}加料工艺`} placeholder="请输入" value={r.process} onChange={e=>updateRow(r.key,{process:e.target.value})}/>},
    {title:'加料算法',width:100,render:(_,r)=><Select aria-label={`${r.key}加料算法`} value={r.algorithm} options={['布重','水量'].map(value=>({value,label:value}))} onChange={v=>updateRow(r.key,{algorithm:v,unit:v==='布重'?'克/市斤':'克/升'})}/>},
    {title:'加料单位',width:105,render:(_,r)=><Select aria-label={`${r.key}加料单位`} value={r.unit} options={['克/市斤','克/升'].map(value=>({value,label:value}))} onChange={v=>updateRow(r.key,{unit:v})}/>},
    {title:'操作',width:130,render:(_,r)=><Space><Button type="link" onClick={()=>setAdditionRows(rows=>{const index=rows.findIndex(x=>x.key===r.key);const next=[...rows];next.splice(index+1,0,{...r,key:crypto.randomUUID(),code:'',ratio:null,amount:null,process:'',added:true});return next})}>新增</Button><Button type="link" disabled={!r.added} onClick={()=>setAdditionRows(rows=>rows.filter(x=>x.key!==r.key))}>删除</Button></Space>}
   ]}/>:<Table<DetailRow> className={`matching-formula${savedBatches.length?' matching-formula-saved':''}`} style={savedBatches.length?{width:645+390*savedBatches.length}:undefined} size="small" bordered rowKey="key" pagination={false} scroll={savedBatches.length?{x:645+390*savedBatches.length}:undefined} dataSource={detailRows} columns={[
    {title:'阶段',dataIndex:'stage',width:62,onCell:mergeStage},
    {title:'染助剂代码',dataIndex:'code',width:102},
    {title:'比例',dataIndex:'ratio',width:82,render:(value:number|null)=>value??'—'},
    {title:'算法',dataIndex:'algorithm',width:93},
    {title:'单位',dataIndex:'unit',width:92},
    {title:'工艺',width:122,onCell:mergeStage,render:(_,row)=>row.added?'—':formulaProcess(row)},
    {title:'PH值',width:92,onCell:mergeStage,render:(_,row)=>row.added?'—':formulaPh(row)},
    ...savedColumns
   ]}/>}
  </div>
  {!adding&&<div className="matching-detail-footer">
   <div className="matching-result" aria-live="polite">{record.result!=='待对样'&&<Tag color={record.result==='未通过'?'red':'green'}>{record.result}</Tag>}{record.additions.length>0&&<Tag color="blue">加料 {record.additions.length} 次</Tag>}{record.resamples.length>0&&<Tag color="blue">已发起复样</Tag>}</div>
   <Space size={12} wrap><Button onClick={onBack}>返 回</Button><Button type="primary" onClick={()=>open('resample')}>发起复样</Button><Button type="primary" onClick={()=>open('vat')}>连缸号</Button><Button disabled>编 辑</Button><Button type="primary" onClick={()=>open('addition')}>加 料</Button><Button type="primary" danger onClick={()=>open('reject')}>未通过</Button><Button type="primary" className="matching-pass" onClick={()=>approve(false)}>通 过</Button><Button type="primary" className="matching-pass" onClick={()=>approve(true)}>通过并直送</Button></Space>
  </div>}
  <Modal title={dialog==='vat'?'填写连缸号':dialog==='addition'?'请选择加料原因':dialog==='resample'?'发起复样':'对样未通过'} open={!!dialog} onCancel={()=>setDialog(null)} onOk={submit} okText={dialog==='addition'?'确定':dialog==='resample'?'发起复样':'保存'} cancelText="取消" destroyOnHidden>
   {dialog!=='addition'&&<p className="matching-modal-card">流程卡：{displayMatchingText(processCard)}　|　阳光1978-1 · 2#</p>}
   {dialog==='addition'?<Form className="matching-reason-form" layout="horizontal">
    <Form.Item required label="请选择颜色深浅"><Radio.Group value={depth} onChange={e=>setDepth(e.target.value)}>{['偏深','偏浅','正常'].map(v=><Radio.Button key={v} value={v}>{v}</Radio.Button>)}</Radio.Group></Form.Item>
    <Form.Item required label="请选择颜色偏向"><Radio.Group value={direction} onChange={e=>setDirection(e.target.value)}>{['偏红','偏蓝','偏绿','偏黄'].map(v=><Radio.Button key={v} value={v}>{v}</Radio.Button>)}</Radio.Group></Form.Item>
    <Form.Item required label="请选择加料状态"><Radio.Group value={mode} onChange={e=>setMode(e.target.value)}>{['正常加料','保温','回加分散','出水加料'].map(v=><Radio.Button key={v} value={v}>{v}</Radio.Button>)}</Radio.Group></Form.Item>
   </Form>:<Form layout="vertical">
    {dialog==='vat'?<Form.Item label="连缸号" required><Input aria-label="连缸号" placeholder="请输入连缸号" value={vat} onChange={e=>setVat(e.target.value)} onPressEnter={submit}/></Form.Item>:<>
     <Form.Item label={dialog==='resample'?'复样原因':'未通过原因'} required><Input.TextArea aria-label="对样处理原因" rows={3} value={reason} onChange={e=>setReason(e.target.value)} placeholder="请填写原因"/></Form.Item>
    </>}
   </Form>}
  </Modal>
  <Modal title="历史配方查询" open={historyOpen} onCancel={()=>setHistoryOpen(false)} footer={null} width={900}>
   <h4>原始配方 · {displayMatchingText(processCard)}</h4><Table size="small" rowKey="key" pagination={false} dataSource={matchingFormula} columns={[{title:'阶段',dataIndex:'stage'},{title:'染助剂',dataIndex:'code'},{title:'比例',dataIndex:'ratio'},{title:'算法',dataIndex:'algorithm'},{title:'单位',dataIndex:'unit'}]}/>
   <h4>已保存加料记录</h4><Table size="small" rowKey="time" dataSource={record.additions} pagination={false} columns={[{title:'时间',dataIndex:'time',render:(v:string)=>new Date(v).toLocaleString()},{title:'加料原因',dataIndex:'reason'},{title:'加料明细',render:(_,r:AdditionBatch)=>r.rows?r.rows.map(x=>`${x.code}：${x.amount} ${x.unit}${x.process?'（'+x.process+'）':''}`).join('；'):`${r.code}：${r.amount}`} ]}/>
  </Modal>
 </section>;
}
