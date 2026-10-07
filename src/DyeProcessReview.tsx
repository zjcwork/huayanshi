import {formulaNumber} from './formula-number';
import {dyeReviewCards} from './dye-review-cards';
import {useState} from 'react';
import {App,Button,Checkbox,Descriptions,Drawer,Input,InputNumber,Modal,Popover,Popconfirm,Select,Space,Table,Tag,Tooltip} from 'antd';
import {BarcodeOutlined,DownOutlined,FileTextOutlined,InfoCircleOutlined} from '@ant-design/icons';
import './dye-process.css';
import './formula-change-review.css';
import DyeFormulaTable from './DyeFormulaTable';
import {loadFormulaState,sameFormula,saveFormulaState,submitFormula,type Formula} from './dye-formula-model';

type Step={key:string;name:string;start:number|null;target:number|null;rate:number|null;minutes:number;note:string};
type Stage={key:string;code:string;steps:Step[]};
type Process={key:string;name:string;approved:boolean;stages:Stage[]};
const templates=[{value:'0210B',label:'0210B - 漂白，直白'},{value:'0705',label:'0705 - 减量工艺'},{value:'2228',label:'2228 - 中和工艺'}];
const makeSteps=(code='0210B'):Step[]=> (code==='0210B'?[
 ['进料',null,null,null,10],['升温',45,90,3,15],['升温',90,120,3,10],['保温',120,120,null,5],['降温',120,70,3,17],['出水',null,null,null,20],['出水',null,null,null,15]
]:code==='0705'?[
 ['进料',null,null,null,10],['升温',40,95,2,28],['保温',95,95,null,30],['降温',95,60,2,18],['出水',null,null,null,10]
]:[['进料',null,null,null,8],['升温',40,60,2,10],['保温',60,60,null,15],['出水',null,null,null,10]]).map((r,i)=>({key:String(i),name:String(r[0]),start:r[1] as number|null,target:r[2] as number|null,rate:r[3] as number|null,minutes:Number(r[4]),note:''}));
const initial:Process[]=[{key:'0705',name:'0705减量',approved:true,stages:[{key:'s1',code:'0705',steps:makeSteps('0705')}]},{key:'2228',name:'2228中和',approved:false,stages:[{key:'s2',code:'2228',steps:makeSteps('2228')}]},{key:'1001',name:'1001染色',approved:false,stages:[{key:'s3',code:'0210B',steps:makeSteps()}]}];
const formulaChangeTypes=['减量调整','预定调整','前处理调整','pH值调整','浴比调整','助剂调整','前道工艺调整','后整理工艺调整','上油温度调整','原料调整','染料调整','配方调整','客户品质调整','其他调整'];

const histories=[{key:'h1',order:'阳光1978-1',card:'Y2606308404',code:'0210B',name:'漂白，直白',time:'2026-09-03 15:22',worker:'沈锋'},{key:'h2',order:'芹王AE',card:'Y2606303701',code:'0705',name:'减量工艺',time:'2026-09-01 10:40',worker:'钟伟祥'},{key:'h3',order:'国张711',card:'Y2606303704',code:'2228',name:'中和工艺',time:'2026-08-30 11:41',worker:'smcs'}];
export default function DyeProcessReview({onChanges:_onChanges}:{onChanges:()=>void}){
 const {message}=App.useApp();
 const [activeCard,setActiveCard]=useState(dyeReviewCards[0].card);
 const cardInfo=dyeReviewCards.find(c=>c.card===activeCard)!;
 const processKey=(card:string)=>card==='Y2606308404'?'lab-dye-process':`lab-dye-process-${card}`;
 const [detailOpen,setDetailOpen]=useState(false),[scanOpen,setScanOpen]=useState(false),[scanCard,setScanCard]=useState('');
 const [formulaState,setFormulaState]=useState(()=>loadFormulaState(activeCard));
 const [draft,setDraft]=useState<Formula>(()=>structuredClone(formulaState.approved)),[formulaEditing,setFormulaEditing]=useState(false),[changeOpen,setChangeOpen]=useState(false),[changeReason,setChangeReason]=useState('');
 const [changeTypes,setChangeTypes]=useState<string[]>(['浴比调整']);
 const pending=formulaState.changes.find(c=>c.card===activeCard&&(c.category??'change')==='change'&&c.status==='待工段长审核');
 const updateFormulaDraft=(next:Formula)=>{setDraft(next);setChangeTypes(types=>{const manuallySelected=types.filter(type=>type!=='浴比调整'&&type!=='配方调整'),bathChanged=next.bath!==formulaState.approved.bath,ratioChanged=next.rows.some(row=>formulaState.approved.rows.find(original=>original.key===row.key)?.ratio!==row.ratio)||next.rows.length!==formulaState.approved.rows.length;return [...manuallySelected,...(bathChanged?['浴比调整']:[]),...(ratioChanged?['配方调整']:[])]})};
 const beginFormulaEdit=()=>{const latest=loadFormulaState(activeCard);setFormulaState(latest);if(latest.changes.some(change=>change.card===activeCard&&change.status==='待工段长审核')){message.info('已有配方变更待审核');return}setDraft(structuredClone(latest.approved));setChangeTypes([]);setChangeReason('');setFormulaEditing(true)};
 const saveFormulaEdit=()=>{if(sameFormula(formulaState.approved,draft)){message.info('配方比例未发生变更');setFormulaEditing(false);return}setChangeOpen(true)};
 const submitChange=()=>{try{if(!changeTypes.length)throw new Error('请选择变更类型');if(!changeReason.trim())throw new Error('请填写变更原因');const latest=loadFormulaState(activeCard);if(sameFormula(latest.approved,draft))throw new Error('配方尚未修改');const requestType=changeTypes.includes('浴比调整')?'bath':'auxiliary';const next=submitFormula(latest,draft,`${changeTypes.join('、')}：${changeReason.trim()}`,formulaState.version,'水木',requestType,changeTypes);saveFormulaState(next);setFormulaState(next);setDraft(structuredClone(next.approved));setFormulaEditing(false);setChangeOpen(false);message.success('变更申请已提交，等待工段长审核');}catch(e){message.error((e as Error).message)}};

 const [processes,setProcesses]=useState<Process[]>(()=>{try{return JSON.parse(localStorage.getItem('lab-dye-process')||'null')||initial}catch{return initial}});
 const [current,setCurrent]=useState('1001'),[expanded,setExpanded]=useState(true),[historyOpen,setHistoryOpen]=useState(false),[historySearch,setHistorySearch]=useState(''),[historyCode,setHistoryCode]=useState('0210B'),[addOpen,setAddOpen]=useState(false),[newCode,setNewCode]=useState('0210B'),[auditOpen,setAuditOpen]=useState(false);
 const process=processes.find(p=>p.key===current)!;
 const total=process.stages.reduce((sum,s)=>sum+s.steps.reduce((n,r)=>n+r.minutes,0),0);
 const save=(next:Process[])=>{setProcesses(next);localStorage.setItem(processKey(activeCard),JSON.stringify(next))};
 const updateStages=(fn:(stages:Stage[])=>Stage[])=>save(processes.map(p=>p.key===current?{...p,approved:false,stages:fn(p.stages)}:p));
 const updateStep=(stage:string,row:string,field:keyof Step,value:string|number|null)=>updateStages(stages=>stages.map(s=>s.key===stage?{...s,steps:s.steps.map(r=>r.key===row?{...r,[field]:value}:r)}:s));
 const startReview=(requested?:string)=>{
  const card=requested??scanCard.trim();
  if(!card){message.warning('请扫描或输入流程卡号');return;}
  if(!dyeReviewCards.some(c=>c.card===card)){message.warning('未找到该流程卡，请核对卡号');return;}
  try{
   const latest=loadFormulaState(card);setActiveCard(card);setFormulaState(latest);setDraft(structuredClone(latest.approved));setFormulaEditing(false);setChangeOpen(false);
   setProcesses(JSON.parse(localStorage.getItem(processKey(card))||'null')||initial.map(p=>({...p,approved:p.key==='0705'||p.key==='2228'&&dyeReviewCards.findIndex(c=>c.card===card)%2===0})));
   setCurrent('1001');setExpanded(true);setScanOpen(false);setDetailOpen(true);
  }catch{message.error('读取流程卡失败，请重试');}
 };
 const reviewQueue=dyeReviewCards.filter(card=>!loadFormulaState(card.card).changes.some(change=>change.card===card.card&&(change.category??'change')==='change'&&change.status==='待工段长审核')).slice(0,8);
 if(!detailOpen)return <section className="panel dye-review-empty"><div className="dye-review-queue-heading"><div><i/><div><h2>待审核流程卡</h2><span>尚未提交配方变更</span></div></div><Button type="primary" icon={<BarcodeOutlined/>} onClick={()=>setScanOpen(true)}>扫描流程卡</Button></div><Table className="dye-review-queue" bordered size="small" rowKey="card" tableLayout="fixed" pagination={false} scroll={{x:1020}} dataSource={reviewQueue} columns={[
  {title:'序号',width:60,align:'center',render:(_:unknown,__:unknown,index:number)=>index+1},
  {title:'流程卡号',dataIndex:'card',width:160},
  {title:'订字',dataIndex:'order',width:150},
  {title:'品名',dataIndex:'product',width:150},
  {title:'色号',dataIndex:'colorNo',width:120},
  {title:'颜色',dataIndex:'color',width:100},
  {title:'浴比',width:80,align:'center',render:(_:unknown,row:(typeof dyeReviewCards)[number])=>`1:${row.bath}`},
  {title:'配方变更',width:110,align:'center',render:()=> <Tag>未提交</Tag>},
  {title:'操作',width:90,align:'center',render:(_:unknown,row:(typeof dyeReviewCards)[number])=><Button type="link" onClick={()=>startReview(row.card)}>去审核</Button>},
 ]}/><Modal title="扫描流程卡" open={scanOpen} onCancel={()=>setScanOpen(false)} onOk={()=>startReview()} okText="开始审核" cancelText="取消"><p>请扫描条码或输入流程卡号</p><Select aria-label="选择审核流程卡" showSearch optionFilterProp="label" style={{width:370}} value={activeCard} onChange={card=>startReview(card)} options={dyeReviewCards.map(c=>({value:c.card,label:`${c.card} | ${c.order} | ${c.colorNo}`}))}/><Input autoFocus aria-label="审核流程卡号" placeholder="请输入流程卡号" prefix={<BarcodeOutlined/>} value={scanCard} onChange={e=>setScanCard(e.target.value)} onPressEnter={()=>startReview()}/></Modal></section>;
 return <section className="dye-review panel">
 <div style={{padding:'8px 0'}}><Select aria-label="选择审核流程卡" showSearch optionFilterProp="label" style={{width:370}} value={activeCard} onChange={card=>startReview(card)} options={dyeReviewCards.map(c=>({value:c.card,label:`${c.card} | ${c.order} | ${c.colorNo}`}))}/></div>
 <div className="dye-title" onClick={()=>setExpanded(!expanded)}><h3>染色工艺审核　{activeCard} | {cardInfo.order} | {cardInfo.colorNo} | 正常转卡</h3><DownOutlined rotate={expanded?0:180}/></div>
 {expanded&&<Descriptions bordered size="small" column={6} className="dye-metadata" items={[{key:'1',label:'品名',children:<b>{cardInfo.product}</b>},{key:'2',label:'颜色',children:cardInfo.color},{key:'3',label:'浅中深',children:<b>{cardInfo.depth}</b>},{key:'4',label:'配方',children:<b>{cardInfo.kind}</b>},{key:'5',label:'预配匹米数',children:<b>5匹 / -米</b>},{key:'6',label:'实配匹米数',children:<b>{cardInfo.pieces}匹 / {cardInfo.meters}米</b>}]}/>}
 <div className="dye-scroll">
 <div className="dye-process-heading"><h3>工艺-染色</h3><div className="dye-process-tabs" role="tablist" aria-label="工艺类型">{processes.map(p=><button role="tab" aria-selected={p.key===current} className={p.key===current?'active':''} key={p.key} onClick={()=>setCurrent(p.key)}>{p.name}({p.approved?'已审':'待审'})</button>)}</div><strong>总时长：{total} <span className="dye-code">|　{process.stages.map(s=>s.code).join(' / ')}</span></strong><Space className="dye-heading-actions"><Button type="primary" onClick={()=>setHistoryOpen(true)}>历史配方工艺</Button><Button type="primary" onClick={()=>setAddOpen(true)}>新增阶段</Button></Space></div>
 {process.stages.map((stage,index)=><div className="dye-stage" key={stage.key}><div className="dye-stage-heading"><Space><strong>阶段{index+1}:</strong><Select aria-label={`阶段${index+1}工艺`} value={stage.code} options={templates} style={{width:195}} onChange={code=>{Modal.confirm({title:'切换阶段工艺',content:'将使用所选工艺模板替换该阶段的步骤。',okText:'替换',cancelText:'取消',onOk:()=>updateStages(stages=>stages.map(s=>s.key===stage.key?{...s,code,steps:makeSteps(code)}:s))})}}/><Tooltip title="查看工艺模板"><Button type="text" className="blue" icon={<FileTextOutlined/>} onClick={()=>{setHistoryCode(stage.code);setHistoryOpen(true)}}/></Tooltip></Space><Popconfirm title="删除这个工艺阶段？" description="该阶段所有步骤将被删除。" onConfirm={()=>updateStages(stages=>stages.filter(s=>s.key!==stage.key))} okText="删除" cancelText="取消"><Button danger size="small">删除</Button></Popconfirm></div>
 <Table className="dye-steps" size="small" bordered pagination={false} dataSource={stage.steps} columns={[
 {title:'序号',width:70,render:(_:unknown,__:Step,i:number)=>i+1},{title:'功能名称',dataIndex:'name',width:120},
 ...([{title:'起始温度',field:'start'},{title:'目标温度',field:'target'},{title:'速率',field:'rate'}] as const).map(c=>({title:c.title,width:125,render:(_:unknown,r:Step)=><InputNumber aria-label={`阶段${index+1}第${Number(r.key)+1}步${c.title}`} controls={false} min={0} max={c.field==='rate'?20:200} value={r[c.field]} onChange={v=>updateStep(stage.key,r.key,c.field,v)}/>})),
 {title:'产量时间',width:125,render:(_:unknown,r:Step)=><InputNumber aria-label={`阶段${index+1}第${Number(r.key)+1}步时间`} min={0} max={999} value={r.minutes} onChange={v=>updateStep(stage.key,r.key,'minutes',v??0)}/>},
 {title:'说明',width:180,render:(_:unknown,r:Step)=><Input aria-label={`阶段${index+1}第${Number(r.key)+1}步说明`} value={r.note} onChange={e=>updateStep(stage.key,r.key,'note',e.target.value)}/>}
 ]} summary={()=> <Table.Summary.Row><Table.Summary.Cell index={0} colSpan={5}>工艺工时总长</Table.Summary.Cell><Table.Summary.Cell index={5}>{stage.steps.reduce((n,r)=>n+r.minutes,0)}</Table.Summary.Cell><Table.Summary.Cell index={6}/></Table.Summary.Row>}/></div>)}
 {!process.stages.length&&<div className="dye-no-stage">暂无工艺阶段，请点击“新增阶段”添加。</div>}
 <div className="dye-formula-heading"><h3>配方-染色 <small>{formulaNumber(formulaState.approved.bath,activeCard,formulaState.version)}</small></h3>{formulaEditing&&<Tag color="blue">配方编辑中</Tag>}<Space className="dye-formula-actions"><Popover trigger="click" title="操作备注" content={<div className="dye-formula-note">点击“编辑”后可以对配方进行编辑；<br/>当配方变更在允许调整范围内时，可以直接调整；<br/>当调整超出范围时，需要提交变更。</div>}><Button type="text" style={{width:32,height:32,color:'#faad14',fontSize:20}} aria-label="查看配方编辑备注" icon={<InfoCircleOutlined/>}/></Popover>{pending?<Tag color="red">配方待确认</Tag>:formulaEditing?<><Button onClick={()=>{setDraft(structuredClone(formulaState.approved));setFormulaEditing(false)}}>取消</Button><Button type="primary" onClick={saveFormulaEdit}>保存</Button></>:<Button onClick={beginFormulaEdit}>编辑</Button>}</Space></div>
 <DyeFormulaTable showBath ratioTitle="大货配方比例" original={formulaState.approved} formula={formulaEditing?draft:pending?.before??formulaState.approved} proposed={formulaEditing?undefined:pending?.after} showChangeConfirmation={!formulaEditing&&!!pending} editing={formulaEditing} editRatioComparison={formulaEditing} ratioOnlyEditing={formulaEditing} onChange={updateFormulaDraft}/>
 </div><div className="dye-footer"><Button onClick={()=>{setDetailOpen(false);setScanCard('');setDraft(structuredClone(formulaState.approved));setFormulaEditing(false);setHistoryOpen(false);setAddOpen(false);setAuditOpen(false);setChangeOpen(false)}}>返 回</Button><Button type="primary" disabled={!!pending||formulaEditing||process.approved||!process.stages.length} onClick={()=>setAuditOpen(true)}>审 核</Button></div>
 <Modal className="formula-submit-modal" title="提交配方变更申请" width={680} open={changeOpen} onCancel={()=>setChangeOpen(false)} onOk={submitChange} okText="提交变更申请" cancelText="取消" okButtonProps={{disabled:!changeTypes.length||!changeReason.trim()}}><div className="formula-change-type-field"><strong>变更类型</strong><Checkbox.Group value={changeTypes} onChange={values=>setChangeTypes(values.map(String))}><div className="formula-change-type-grid">{formulaChangeTypes.map(type=><Checkbox key={type} value={type}>{type}</Checkbox>)}<Popover trigger="click" title="开发批注" content={<div className="dye-formula-note">变更类型采用配置化管理，由后端配置表维护并返回；<br/>前端根据用户实际修改的内容自动匹配并勾选对应变更类型。</div>}><Button type="text" style={{width:28,height:24,color:'#faad14',fontSize:18}} aria-label="查看变更类型开发批注" icon={<InfoCircleOutlined/>}/></Popover></div></Checkbox.Group></div><div className="formula-change-reason-field"><label htmlFor="formula-change-reason"><span className="red">*</span> 变更原因</label><Input.TextArea id="formula-change-reason" aria-label="配方变更原因" aria-required="true" placeholder="请填写变更原因（必填）" value={changeReason} onChange={e=>setChangeReason(e.target.value)} rows={3}/></div></Modal>

 <Modal title="新增工艺阶段" open={addOpen} onCancel={()=>setAddOpen(false)} okText="新增" onOk={()=>{updateStages(stages=>[...stages,{key:crypto.randomUUID(),code:newCode,steps:makeSteps(newCode)}]);setAddOpen(false);message.success('已新增工艺阶段')}}><div className="dye-modal-field"><span>工艺模板</span><Select value={newCode} onChange={setNewCode} options={templates} style={{width:280}}/></div></Modal>
 <Modal title="确认工艺审核" open={auditOpen} onCancel={()=>setAuditOpen(false)} okText="审核通过" onOk={()=>{save(processes.map(p=>p.key===current?{...p,approved:true}:p));setAuditOpen(false);message.success(`${process.name}审核通过，已保存到本地`)}}><Descriptions column={1} items={[{key:1,label:'流程卡',children:activeCard},{key:2,label:'工艺',children:process.name},{key:3,label:'阶段数量',children:process.stages.length},{key:4,label:'总时长',children:`${total} 分钟`}]}/></Modal>
 <Drawer title="历史配方工艺" open={historyOpen} width={900} onClose={()=>setHistoryOpen(false)} footer={<div className="drawer-footer"><Button onClick={()=>setHistoryOpen(false)}>取消</Button><Button type="primary" onClick={()=>{updateStages(stages=>[...stages,{key:crypto.randomUUID(),code:historyCode,steps:makeSteps(historyCode)}]);setHistoryOpen(false);message.success('历史工艺已引用为新阶段')}}>引用为新阶段</Button></div>}><Input.Search placeholder="搜索订字、流程卡或工艺代码" allowClear value={historySearch} onChange={e=>setHistorySearch(e.target.value)} style={{marginBottom:16}}/><Table bordered size="small" pagination={false} rowSelection={{type:'radio',selectedRowKeys:histories.filter(h=>h.code===historyCode).map(h=>h.key),onChange:(_,rows)=>setHistoryCode(rows[0].code)}} onRow={r=>({onClick:()=>setHistoryCode(r.code)})} dataSource={histories.filter(h=>(h.order+h.card+h.code).includes(historySearch))} columns={[{title:'订字',dataIndex:'order'},{title:'流程卡',dataIndex:'card'},{title:'工艺代码',dataIndex:'code'},{title:'工艺名',dataIndex:'name'},{title:'创建时间',dataIndex:'time'}]}/><h4>工艺步骤 · {historyCode}</h4><Table bordered size="small" pagination={false} dataSource={makeSteps(historyCode)} columns={[{title:'功能名称',dataIndex:'name'},{title:'起始温度',dataIndex:'start'},{title:'目标温度',dataIndex:'target'},{title:'速率',dataIndex:'rate'},{title:'产量时间',dataIndex:'minutes'}]}/></Drawer>
 </section>
}
