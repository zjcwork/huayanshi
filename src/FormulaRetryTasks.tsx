import {useState} from 'react';
import {App,Button,InputNumber,Modal,Space,Table} from 'antd';
import DyeFormulaTable from './DyeFormulaTable';
import {loadFormulaState,saveFormulaState,completeFormulaRetry,type Change,type Formula} from './dye-formula-model';
export default function FormulaRetryTasks({onUpdate}:{onUpdate:()=>void}){
 const {message}=App.useApp();const [state,setState]=useState(()=>loadFormulaState()),[selected,setSelected]=useState<Change|null>(null),[draft,setDraft]=useState<Formula|null>(null);
 const rows=state.changes.filter(c=>c.status==='待工段长审核'&&c.retry&&!c.retry.completedAt);
 const save=()=>{if(!selected||!draft)return;try{const next=completeFormulaRetry(loadFormulaState(),selected.id,draft);saveFormulaState(next);setState(next);setSelected(null);onUpdate();message.success('重打结果已保存，请返回配方变更审核');}catch(e){message.error((e as Error).message)}};
 return <section className="panel"><h3>配方重打任务</h3><Table rowKey="id" size="small" dataSource={rows} columns={[{title:'流程卡',dataIndex:'card'},{title:'订字',dataIndex:'order'},{title:'重打原因',render:(_,r)=>r.retry?.reason},{title:'发起人',render:(_,r)=>r.retry?.operator},{title:'操作',render:(_,r)=><Button type="link" onClick={()=>{setSelected(r);setDraft(structuredClone(r.retry!.formula))}}>录入重打结果</Button>}]}/><Modal title="录入重打配方" width={1200} open={!!selected} onCancel={()=>setSelected(null)} onOk={save} okText="保存重打结果" cancelText="取消">{draft&&<><Space style={{marginBottom:12}}>浴比：1:<InputNumber min={0.01} value={draft.bath} onChange={bath=>setDraft({...draft,bath})}/></Space><DyeFormulaTable formula={draft} editing onChange={setDraft}/></>}</Modal></section>;
}
