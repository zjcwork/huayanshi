import {ensureFormulaChangeDemo} from './formula-change-demo';
import {formulaNumber} from './formula-number';
import {useState,useEffect} from 'react';
import {App,Button,Input,Empty,Space,Tag} from 'antd';
import {ReloadOutlined} from '@ant-design/icons';
import {dyeReviewCards} from './dye-review-cards';
import './card-opening-review.css';
import './formula-change-workspace.css';
import './formula-change-review.css';
import {changeFormulaNumber,loadFormulaState,saveFormulaState,reviewFormula,updateReviewFormula,requestFormulaRetry,type Formula,type Change} from './dye-formula-model';
import DyeFormulaTable from './DyeFormulaTable';
import FormulaCardDetails from './FormulaCardDetails';
type ScheduledVat={card:string;vat:string;entryWeight?:string|number};
function scheduledVats(card:string):ScheduledVat[]{
 try{const data=JSON.parse(localStorage.getItem('lab-dye-schedule')||'[]');return Array.isArray(data)?data.filter((row:ScheduledVat)=>row.card===card&&row.vat):[];}catch{return [];}
}
function VatSummary({card}:{card:string}){
 const rows=scheduledVats(card);
 return <span className="formula-vat-summary">{rows.length?rows.map((row,index)=><span key={`${row.vat}-${index}`}>排产缸号：{row.vat}　进缸布重：{row.entryWeight===undefined||row.entryWeight===null||row.entryWeight===''?'未记录':typeof row.entryWeight==='number'?`${row.entryWeight} kg`:row.entryWeight}</span>):<span>排产缸号：未排产　进缸布重：未记录</span>}</span>;
}
export default function FormulaChangeReview(){
 const [editing,setEditing]=useState(false),[draft,setDraft]=useState<Formula|null>(null);
 const {message}=App.useApp();const [state,setState]=useState(()=>loadFormulaState()),[query,setQuery]=useState(''),[selected,setSelected]=useState<Change|null>(null);
 const [searchQuery,setSearchQuery]=useState('');
 useEffect(()=>{setState(ensureFormulaChangeDemo())},[]);
 const search=()=>{setSearchQuery(query.trim().toLowerCase());setState(loadFormulaState())};
 const filtered=state.changes.filter(c=>c.status==='待工段长审核'&&[c.card,c.order,changeFormulaNumber(c),c.colorNo??'',c.dmNo??''].join(' ').toLowerCase().includes(searchQuery));
 const saveEdit=()=>{if(!selected||!draft)return;try{const next=updateReviewFormula(loadFormulaState(),selected.id,draft);saveFormulaState(next);setState(next);setSelected(next.changes.find(c=>c.id===selected.id)!);setEditing(false);message.success('变更后配方已保存，审核通过后生效');}catch(e){message.error((e as Error).message)}};
 const retry=()=>{if(!selected)return;try{const next=requestFormulaRetry(loadFormulaState(),selected.id,'水木',selected.reason);saveFormulaState(next);setState(next);setSelected(next.changes.find(c=>c.id===selected.id)!);message.success('已生成配方重打任务，请到打样页面的复样页签处理');}catch(e){message.error((e as Error).message)}};
 const review=(choice:'original'|'requested')=>{if(!selected)return;try{const next=reviewFormula(loadFormulaState(),selected.id,true,'水木','',choice);saveFormulaState(next);setState(next);setSelected(null);message.success(choice==='original'?'已使用原配方，申请已处理':'已使用申请配方，新配方已生效');}catch(e){message.error((e as Error).message)}};
 const selectChange=(change:Change)=>{setSelected(change);setEditing(false);setDraft(structuredClone(change.reviewedFormula??change.after))};
 useEffect(()=>{const next=filtered.find(change=>change.id===selected?.id)??filtered[0];if(next!==selected){if(next)selectChange(next);else {setSelected(null);setEditing(false)}}},[state,searchQuery,selected]);
 return <div className="opening-review change-review-workspace"><aside className="opening-plans"><div className="opening-list-heading"><b>配方变更</b><Tag color="blue">{filtered.length}</Tag><Button aria-label="刷新配方变更" icon={<ReloadOutlined/>} onClick={()=>setState(loadFormulaState())}/></div><div className="change-sidebar-filters"><Input.Search aria-label="订字搜索" placeholder="订字 / 流程卡号 / 配方号" value={query} onChange={event=>setQuery(event.target.value)} onSearch={search}/></div><div className="opening-plan-list">{filtered.map(change=>{const info=dyeReviewCards.find(item=>item.card===change.card||item.order===change.order);const color=info?.color??'';const hex=({'薄荷绿':'#98bf92','藏青':'#24316f','中灰':'#808080','浅蓝':'#a9cde5','暮蓝':'#263b69'} as Record<string,string>)[color]??'#c7cdd4';return <button key={change.id} className={'opening-plan '+(change.id===selected?.id?'active':'')} onClick={()=>selectChange(change)}><div><b><i style={{background:hex}}/>{change.order||'—'} · {change.colorNo||info?.colorNo||'—'}</b></div><p className="opening-plan-number">{change.card}</p></button>})}{!filtered.length&&<Empty description="暂无配方变更"/>}</div></aside><div className="opening-workspace">
 {selected?<>
 <section className="opening-summary"><FormulaCardDetails change={selected} compact warehouseStyle/></section>
 <div className="opening-formula-workspace"><section className="opening-formula-detail"><h3>原配方 <small>{formulaNumber(selected.before.bath,selected.card,selected.version)}</small><VatSummary card={selected.card}/></h3><DyeFormulaTable compact fitWidth formula={selected.before} ratioTitle="原比例"/></section><section className="opening-formula-detail"><h3>申请变更配方 <small>{changeFormulaNumber(selected)}</small><span style={{marginLeft:'auto'}}>{selected.status==='待工段长审核'&&(editing?<Space><Button onClick={()=>setEditing(false)}>取消编辑</Button><Button type="primary" onClick={saveEdit}>保存配方</Button></Space>:<Button danger disabled={!!selected.retry&&!selected.retry.completedAt} onClick={()=>{setDraft(structuredClone(selected.reviewedFormula??selected.after));setEditing(true)}}>编辑</Button>)}</span></h3><DyeFormulaTable compact fitWidth={!editing} ratioTitle="申请比例" original={selected.before} formula={editing&&draft?draft:selected.reviewedFormula??selected.after} editing={editing} onChange={setDraft}/></section></div>
 <section className="opening-formula-detail"><div className="opening-actions"><span>审核人：水木</span><Space wrap>{selected.status==='待工段长审核'&&<><Button disabled={editing||!!selected.retry&&!selected.retry.completedAt} onClick={retry}>{selected.retry&&!selected.retry.completedAt?'配方重打中':'配方重打'}</Button><Button disabled={editing||!!selected.retry&&!selected.retry.completedAt} onClick={()=>review('original')}>使用原配方</Button><Button disabled={editing||!!selected.retry&&!selected.retry.completedAt} type="primary" onClick={()=>review('requested')}>使用申请配方</Button></>}</Space></div></section>
 </>:<div className="opening-empty"><Empty description="暂无符合条件的配方变更"/></div>}
 </div></div>;
}
