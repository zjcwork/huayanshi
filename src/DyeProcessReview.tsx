import {formulaNumber} from './formula-number';
import {dyeReviewCards} from './dye-review-cards';
import {useState} from 'react';
import {App,Button,Descriptions,Drawer,Input,InputNumber,Modal,Popconfirm,Select,Space,Table,Tag,Tooltip} from 'antd';
import {BarcodeOutlined,DownOutlined,FileTextOutlined} from '@ant-design/icons';
import './dye-process.css';
import './formula-change-review.css';
import DyeFormulaTable from './DyeFormulaTable';
import {loadFormulaState,saveFormulaState,submitFormula,sameFormula,type Formula} from './dye-formula-model';

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

const histories=[{key:'h1',order:'阳光1978-1',card:'Y2606308404',code:'0210B',name:'漂白，直白',time:'2026-09-03 15:22',worker:'沈锋'},{key:'h2',order:'芹王AE',card:'Y2606303701',code:'0705',name:'减量工艺',time:'2026-09-01 10:40',worker:'钟伟祥'},{key:'h3',order:'国张711',card:'Y2606303704',code:'2228',name:'中和工艺',time:'2026-08-30 11:41',worker:'smcs'}];
export default function DyeProcessReview({onChanges}:{onChanges:()=>void}){
 const {message}=App.useApp();
 const [activeCard,setActiveCard]=useState(dyeReviewCards[0].card);
 const cardInfo=dyeReviewCards.find(c=>c.card===activeCard)!;
 const processKey=(card:string)=>card==='Y2606308404'?'lab-dye-process':`lab-dye-process-${card}`;
 const [changeDetailsOpen,setChangeDetailsOpen]=useState(true);
 const [detailOpen,setDetailOpen]=useState(true),[scanOpen,setScanOpen]=useState(false),[scanCard,setScanCard]=useState('');
 const [formulaState,setFormulaState]=useState(()=>loadFormulaState(activeCard));
 const [draft,setDraft]=useState<Formula>(()=>structuredClone(formulaState.approved)),[formulaEditing,setFormulaEditing]=useState(false),[changeOpen,setChangeOpen]=useState(false),[changeReason,setChangeReason]=useState('');
 const pending=formulaState.changes.find(c=>c.card===activeCard&&c.status==='待工段长审核');
 const dirty=!sameFormula(draft,formulaState.approved);
 const submitChange=()=>{try{const next=submitFormula(loadFormulaState(activeCard),draft,changeReason,formulaState.version,'水木');saveFormulaState(next);setFormulaState(next);setDraft(structuredClone(next.approved));setFormulaEditing(false);setChangeOpen(false);message.success('配方变更已提交，等待工段长审核');onChanges();}catch(e){message.error((e as Error).message)}};

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
   const latest=loadFormulaState(card);setActiveCard(card);setFormulaState(latest);setDraft(structuredClone(latest.approved));
   setProcesses(JSON.parse(localStorage.getItem(processKey(card))||'null')||initial.map(p=>({...p,approved:p.key==='0705'||p.key==='2228'&&dyeReviewCards.findIndex(c=>c.card===card)%2===0})));
   setCurrent('1001');setExpanded(true);setFormulaEditing(false);setScanOpen(false);setDetailOpen(true);
  }catch{message.error('读取流程卡失败，请重试');}
 };
 if(!detailOpen)return <section className="panel dye-review-empty"><button className="scan-prompt" onClick={()=>setScanOpen(true)}><BarcodeOutlined/>请扫描流程卡开始审核</button><Modal title="扫描流程卡" open={scanOpen} onCancel={()=>setScanOpen(false)} onOk={()=>startReview()} okText="开始审核" cancelText="取消"><p>请扫描条码或输入流程卡号</p><Select aria-label="选择审核流程卡" showSearch optionFilterProp="label" style={{width:370}} value={activeCard} onChange={card=>startReview(card)} options={dyeReviewCards.map(c=>({value:c.card,label:`${c.card} | ${c.order} | ${c.colorNo}`}))}/><Input autoFocus aria-label="审核流程卡号" placeholder="请输入流程卡号" prefix={<BarcodeOutlined/>} value={scanCard} onChange={e=>setScanCard(e.target.value)} onPressEnter={()=>startReview()}/></Modal></section>;
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
 <div className="dye-formula-heading"><h3>配方-染色 <small>{formulaNumber(formulaState.approved.bath,activeCard,formulaState.version)}</small></h3>{pending?<Space><span>原浴比：1:{pending.before.bath}</span><span style={{color:pending.before.bath!==pending.after.bath?'#e58016':undefined}}>申请变更浴比：1:{pending.after.bath}</span></Space>:<span><span className="red">*</span>浴比：1: <InputNumber aria-label="染色配方浴比" disabled={!formulaEditing} min={0.01} value={draft.bath} onChange={bath=>setDraft(d=>({...d,bath}))}/></span>}{pending?<Space><Tag color="orange">待工段长审核</Tag><Button onClick={onChanges}>查看变更</Button></Space>:formulaEditing?<Button onClick={()=>{setDraft(structuredClone(formulaState.approved));setFormulaEditing(false)}}>取消编辑</Button>:<Button onClick={()=>{const latest=loadFormulaState(activeCard);setFormulaState(latest);setDraft(structuredClone(latest.approved));setFormulaEditing(true)}}>编辑</Button>}</div>
 <DyeFormulaTable original={formulaState.approved} formula={pending?.before??draft} proposed={pending?.after} editing={formulaEditing&&!pending} onChange={setDraft}/>
 </div><div className="dye-footer">{pending&&<Tag color="orange">配方变更待工段长审核</Tag>}{process.approved&&<Tag color="success">{process.name}已审核</Tag>}<Button onClick={()=>{setDetailOpen(false);setScanCard('');setFormulaEditing(false);setDraft(structuredClone(formulaState.approved));setHistoryOpen(false);setAddOpen(false);setAuditOpen(false);setChangeOpen(false)}}>返 回</Button><Button type="primary" disabled={!!pending||(!dirty&&(process.approved||!process.stages.length))} onClick={()=>{if(dirty){setChangeReason('');setChangeDetailsOpen(true);setChangeOpen(true)}else setAuditOpen(true)}}>{dirty?'提交变更':pending?'变更待审核':'审 核'}</Button></div>
 <Modal className="formula-submit-modal" title="审核配方变更" width="94vw" open={changeOpen} onCancel={()=>setChangeOpen(false)} onOk={submitChange} okText="提交变更" cancelText="取消" okButtonProps={{disabled:!changeReason.trim()}}><div className="formula-card-heading"><h3>流程卡详情</h3><Button type="text" aria-label={changeDetailsOpen?'收起流程卡详情':'展开流程卡详情'} icon={<DownOutlined rotate={changeDetailsOpen?180:0}/>} onClick={()=>setChangeDetailsOpen(!changeDetailsOpen)}/></div>{changeDetailsOpen&&<Descriptions bordered size="small" column={3} className="formula-card-metadata" items={[
 {key:'basic',label:'基础信息',children:`${activeCard} | ${cardInfo.order} | ${cardInfo.product}`},
 {key:'color',label:'颜色信息',children:`${cardInfo.color} | ${cardInfo.depth} | ${cardInfo.kind}`},
 {key:'fabric',label:'白坯信息',children:'—'},
 {key:'defect',label:'不良信息',children:'—'},
 {key:'quantity',label:'米数信息',children:`预配5匹 | 实配${cardInfo.pieces}匹 | 实配${cardInfo.meters}米`},
 {key:'finished',label:'成品要求',children:'—'},
 {key:'requirements',label:'加工要求',children:'无要求',span:3},
 ]}/>}<div className="formula-compare-grid formula-application-grid"><section><h3>原配方</h3><DyeFormulaTable compact formula={formulaState.approved} ratioTitle="原比例"/></section><section><h3>申请变更配方</h3><DyeFormulaTable compact formula={draft} original={formulaState.approved} ratioTitle="申请比例"/></section></div><div style={{marginTop:16}}><label htmlFor="formula-change-reason"><span className="red">*</span> 变更原因</label><Input.TextArea id="formula-change-reason" aria-label="配方变更原因" aria-required="true" placeholder="请填写变更原因（必填）" value={changeReason} onChange={e=>setChangeReason(e.target.value)} rows={3} style={{marginTop:8}}/></div></Modal>

 <Modal title="新增工艺阶段" open={addOpen} onCancel={()=>setAddOpen(false)} okText="新增" onOk={()=>{updateStages(stages=>[...stages,{key:crypto.randomUUID(),code:newCode,steps:makeSteps(newCode)}]);setAddOpen(false);message.success('已新增工艺阶段')}}><div className="dye-modal-field"><span>工艺模板</span><Select value={newCode} onChange={setNewCode} options={templates} style={{width:280}}/></div></Modal>
 <Modal title="确认工艺审核" open={auditOpen} onCancel={()=>setAuditOpen(false)} okText="审核通过" onOk={()=>{save(processes.map(p=>p.key===current?{...p,approved:true}:p));setAuditOpen(false);message.success(`${process.name}审核通过，已保存到本地`)}}><Descriptions column={1} items={[{key:1,label:'流程卡',children:activeCard},{key:2,label:'工艺',children:process.name},{key:3,label:'阶段数量',children:process.stages.length},{key:4,label:'总时长',children:`${total} 分钟`}]}/></Modal>
 <Drawer title="历史配方工艺" open={historyOpen} width={900} onClose={()=>setHistoryOpen(false)} footer={<div className="drawer-footer"><Button onClick={()=>setHistoryOpen(false)}>取消</Button><Button type="primary" onClick={()=>{updateStages(stages=>[...stages,{key:crypto.randomUUID(),code:historyCode,steps:makeSteps(historyCode)}]);setHistoryOpen(false);message.success('历史工艺已引用为新阶段')}}>引用为新阶段</Button></div>}><Input.Search placeholder="搜索订字、流程卡或工艺代码" allowClear value={historySearch} onChange={e=>setHistorySearch(e.target.value)} style={{marginBottom:16}}/><Table bordered size="small" pagination={false} rowSelection={{type:'radio',selectedRowKeys:histories.filter(h=>h.code===historyCode).map(h=>h.key),onChange:(_,rows)=>setHistoryCode(rows[0].code)}} onRow={r=>({onClick:()=>setHistoryCode(r.code)})} dataSource={histories.filter(h=>(h.order+h.card+h.code).includes(historySearch))} columns={[{title:'订字',dataIndex:'order'},{title:'流程卡',dataIndex:'card'},{title:'工艺代码',dataIndex:'code'},{title:'工艺名',dataIndex:'name'},{title:'创建时间',dataIndex:'time'}]}/><h4>工艺步骤 · {historyCode}</h4><Table bordered size="small" pagination={false} dataSource={makeSteps(historyCode)} columns={[{title:'功能名称',dataIndex:'name'},{title:'起始温度',dataIndex:'start'},{title:'目标温度',dataIndex:'target'},{title:'速率',dataIndex:'rate'},{title:'产量时间',dataIndex:'minutes'}]}/></Drawer>
 </section>
}
