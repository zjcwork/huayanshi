import {useEffect,useState,type ReactNode} from 'react';
import {App,Button,Empty,Input,Modal,Space,Table,Tabs,Tag} from 'antd';
import {loadFormulaState,saveFormulaState,submitFormula,sameFormula,type Formula,type FormulaState,type Change} from './dye-formula-model';
import {dyeReviewCards} from './dye-review-cards';
import {readScheduleJobs} from './schedule-model';
import {formulaUsage,queryVersions,type OpeningReview} from './formula-query-model';
import DyeFormulaTable from './DyeFormulaTable';

function readCatalog(){
 const saved=loadFormulaState(),jobs=readScheduleJobs();
 const cards=new Set([...dyeReviewCards.map(c=>c.card),...Object.keys(saved.cards??{}),...saved.changes.map(c=>c.card),...jobs.filter(j=>j.openingReview).map(j=>j.card)]);
 return {jobs,entries:[...cards].map(card=>{
  const state=loadFormulaState(card),info=dyeReviewCards.find(c=>c.card===card),change=state.changes.find(c=>c.card===card),job=jobs.find(j=>j.card===card);
  return {card,state,order:info?.order??change?.order??job?.order??'—',colorNo:info?.colorNo??change?.colorNo??job?.color??'—',product:info?.product??'—',pending:state.changes.some(c=>c.card===card&&c.status==='待工段长审核')};
 })};
}
const dateText=(date?:string)=>date?new Date(date).toLocaleString():'—';
export default function FormulaQuery({legacy,onChanges}:{legacy:ReactNode;onChanges:()=>void}){
 const {message}=App.useApp();
 const [data,setData]=useState(readCatalog),[card,setCard]=useState(''),[search,setSearch]=useState(''),[version,setVersion]=useState<number|null>(null);
 const [editor,setEditor]=useState<{card:string;state:FormulaState}|null>(null),[draft,setDraft]=useState<Formula|null>(null),[reason,setReason]=useState('');
 const [usage,setUsage]=useState<OpeningReview|null>(null),[changeDetail,setChangeDetail]=useState<Change|null>(null);
 const refresh=()=>setData(readCatalog());
 useEffect(()=>{window.addEventListener('storage',refresh);window.addEventListener('focus',refresh);return()=>{window.removeEventListener('storage',refresh);window.removeEventListener('focus',refresh)}},[]);
 const entries=data.entries.filter(row=>[row.card,row.order,row.colorNo,...queryVersions(row.state,row.card).map(v=>v.formulaNo)].join(' ').toLowerCase().includes(search.trim().toLowerCase()));
 const selected=entries.find(row=>row.card===card)??entries[0];
 const versions=selected?queryVersions(selected.state,selected.card):[];
 const current=versions.find(row=>row.version===version)??versions[0];
 const changes=selected?selected.state.changes.filter(c=>c.card===selected.card):[];
 const uses=selected?formulaUsage(data.jobs,selected.card):[];
 const submit=()=>{
  if(!editor||!draft)return;
  try{
   const fresh=loadFormulaState(editor.card);
   if(fresh.version!==editor.state.version||!sameFormula(fresh.approved,editor.state.approved))throw new Error('当前配方已变化，请取消编辑并刷新');
   const next=submitFormula(fresh,draft,reason,editor.state.version,'水木');
   const info=data.entries.find(row=>row.card===editor.card);
   Object.assign(next.changes[0],{source:'配方查询',order:info?.order??next.changes[0].order,colorNo:info?.colorNo});
   saveFormulaState(next);setEditor(null);setDraft(null);refresh();message.success('变更申请已提交，请到配方变更审核；当前生效配方保持不变');
  }catch(error){message.error((error as Error).message)}
 };
 return <>
 <Tabs defaultActiveKey="linked" items={[{key:'linked',label:'生效配方与版本',children:<>
  <section className="panel"><div className="section-heading"><h3>配方查询</h3><Space><Input.Search aria-label="配方查询搜索" placeholder="订字 / 色号 / 流程卡 / 配方号" allowClear value={search} onChange={e=>setSearch(e.target.value)} style={{width:300}}/><Button onClick={refresh}>刷新</Button><Button onClick={onChanges}>配方变更审核</Button></Space></div>
   <Table size="small" rowKey="card" pagination={{pageSize:8}} dataSource={entries} rowClassName={row=>row.card===selected?.card?'active-row':''} onRow={row=>({onClick:()=>{setCard(row.card);setVersion(null)},style:{cursor:'pointer'}})} columns={[
    {title:'流程卡',dataIndex:'card'},{title:'订字',dataIndex:'order'},{title:'色号',dataIndex:'colorNo'},{title:'品名',dataIndex:'product'},
    {title:'当前生效配方号',render:(_,row)=>queryVersions(row.state,row.card).find(v=>v.current)?.formulaNo},
    {title:'浴比',render:(_,row)=>`1:${row.state.approved.bath??'—'}`},
    {title:'变更状态',render:(_,row)=><Tag color={row.pending?'gold':'green'}>{row.pending?'有待审核申请':'已生效'}</Tag>},
   ]}/>
  </section>
  {selected&&current?<>
   <section className="panel"><div className="section-heading"><h3>配方版本 · {selected.order} / {selected.colorNo}</h3><Button disabled={selected.pending} onClick={()=>{setEditor({card:selected.card,state:structuredClone(selected.state)});setDraft(structuredClone(selected.state.approved));setReason('')}}>申请变更当前配方</Button></div>
    <Table size="small" rowKey="version" pagination={false} dataSource={versions} rowClassName={row=>row.version===current.version?'active-row':''} onRow={row=>({onClick:()=>setVersion(row.version),style:{cursor:'pointer'}})} columns={[
     {title:'配方号',dataIndex:'formulaNo'},{title:'状态',render:(_,row)=><Tag color={row.current?'blue':undefined}>{row.current?'当前生效':'历史版本'}</Tag>},
     {title:'生效时间',render:(_,row)=>dateText(row.date)},{title:'变更原因',dataIndex:'reason'},{title:'申请人',dataIndex:'applicant'},{title:'审核人',dataIndex:'reviewer'},
     {title:'对比',render:(_,row)=>row.change?<Button type="link" onClick={e=>{e.stopPropagation();setChangeDetail(row.change!)}}>查看变更</Button>:row.version===0?'初始配方':'无变更明细'},
    ]}/>
    <div className="section-heading" style={{marginTop:16}}><h3>配方详情 · {current.formulaNo}</h3><Tag>{current.current?'当前生效':'历史快照（只读）'}</Tag></div>
    <DyeFormulaTable compact fitWidth formula={current.formula}/>
   </section>
   <section className="panel"><h3>流程卡使用版本</h3><Table size="small" rowKey="key" pagination={false} dataSource={uses} locale={{emptyText:'尚无关联排产或开卡记录'}} columns={[
    {title:'流程卡',dataIndex:'card'},{title:'排缸号',dataIndex:'vat'},
    {title:'实际使用配方号',render:(_,row)=>row.snapshot?<a onClick={()=>setUsage(row.snapshot)}>{row.snapshot.formulaNo}</a>:row.converted?'未记录版本':'待开卡'},
    {title:'使用版本',render:(_,row)=>row.snapshot?`v${row.snapshot.version}`:'—'},
    {title:'开卡时间',render:(_,row)=>dateText(row.snapshot?.reviewedAt)},{title:'操作人',render:(_,row)=>row.snapshot?.operator??'—'},
   ]}/></section>
   <section className="panel"><h3>变更申请记录</h3><Table size="small" rowKey="id" pagination={{pageSize:5}} dataSource={changes} columns={[
    {title:'申请时间',render:(_,row)=>dateText(row.submittedAt)},{title:'原因',dataIndex:'reason'},{title:'申请人',dataIndex:'applicant'},
    {title:'审核结果',render:(_,row)=>row.status==='已通过'&&row.formulaChoice==='original'?'已处理 · 使用原配方':row.status},
    {title:'审核人',dataIndex:'reviewer'},{title:'审核时间',render:(_,row)=>dateText(row.reviewedAt)},
    {title:'详情',render:(_,row)=><Button type="link" onClick={()=>setChangeDetail(row)}>查看前后配方</Button>},
   ]}/></section>
  </>:<Empty description="暂无生效配方"/>}
 </>},{key:'legacy',label:'旧版查询（独立数据）',children:legacy}]}/>
 <Modal title="提交配方变更申请" open={!!editor} width="94vw" onCancel={()=>{setEditor(null);setDraft(null)}} onOk={submit} okText="提交审核">
  {draft&&<DyeFormulaTable compact formula={draft} editing onChange={setDraft}/>}
  <Input.TextArea aria-label="变更原因" style={{marginTop:16}} placeholder="变更原因（必填）" value={reason} onChange={e=>setReason(e.target.value)}/>
  <p>申请人：水木。审核通过后生成新版本，已开卡的使用版本保持不变。</p>
 </Modal>
 <Modal title={`流程卡实际使用配方 · ${usage?.formulaNo??''}`} open={!!usage} width="90vw" footer={null} onCancel={()=>setUsage(null)}>{usage&&<><p>开卡人：{usage.operator}　开卡时间：{dateText(usage.reviewedAt)}</p><DyeFormulaTable compact fitWidth formula={usage.formula}/></>}</Modal>
 <Modal title="配方变更详情" open={!!changeDetail} width="94vw" footer={null} onCancel={()=>setChangeDetail(null)}>{changeDetail&&<>
  <p>流程卡：{changeDetail.card}　原因：{changeDetail.reason}　申请人：{changeDetail.applicant??'—'}　状态：{changeDetail.status}</p>
  <p>审核人：{changeDetail.reviewer??'—'}　审核时间：{dateText(changeDetail.reviewedAt)}　审核意见：{changeDetail.reviewReason||'—'}</p>
  {changeDetail.formulaChoice==='original'&&<Tag>使用原配方，未生成新版本</Tag>}
  <h3>变更前配方 · v{changeDetail.version}</h3><DyeFormulaTable compact fitWidth formula={changeDetail.before}/>
  <h3>{changeDetail.status==='已通过'&&changeDetail.formulaChoice!=='original'?'审核生效配方':'申请配方'}</h3><DyeFormulaTable compact fitWidth formula={changeDetail.reviewedFormula??changeDetail.after} original={changeDetail.before}/>
 </>}</Modal>
 </>;
}
