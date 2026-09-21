import {Table} from 'antd';
import {formulaProcess,formulaPh,type DetailRow,type AdditionBatch} from './matching-model';
export default function BadFormulaComparison({formula,batches,bath}:{formula:DetailRow[];batches:AdditionBatch[];bath:number|null}){
 const rows=formula.map(r=>({...r}));
 for(const batch of batches)for(const r of batch.rows??[]){if(!rows.some(x=>x.stage===r.stage&&x.code===r.code))rows.push({...r,key:`addition-${r.stage}-${r.code}`,ratio:null});}
 rows.sort((a,b)=>a.stage-b.stage);
 const stages=[...new Set(rows.map(r=>r.stage))];
 const material=(batch:AdditionBatch,row:DetailRow)=>batch.rows?.find(r=>r.stage===row.stage&&r.code===row.code);
 const added=(batch:AdditionBatch,row:DetailRow)=>{const r=material(batch,row);if(r)return r.amount;return !batch.rows?.length&&batch.code===row.code&&rows.filter(x=>x.code===row.code).length===1?batch.amount:null;};
 const process=(batch:AdditionBatch,row:DetailRow)=>material(batch,row)?.process||'';
 const merge=(index:number|undefined,value:(r:DetailRow)=>unknown)=>{if(index===undefined)return {};const row=rows[index];if(index>0&&rows[index-1].stage===row.stage&&value(rows[index-1])===value(row))return {rowSpan:0};let end=index+1;while(end<rows.length&&rows[end].stage===row.stage&&value(rows[end])===value(row))end++;return {rowSpan:end-index};};
 return <Table<DetailRow> className="bad-formula-comparison" size="small" bordered pagination={false} rowKey="key" dataSource={rows} scroll={{x:805+batches.length*210}} rowClassName={r=>stages.indexOf(r.stage)%2===0?'formula-stage-green':'formula-stage-gray'} columns={[
 {title:'浴比',width:65,render:()=>bath?`1:${bath}`:'—',onCell:(_,i)=>({rowSpan:i===0?rows.length:0})},
 {title:'阶段',width:55,dataIndex:'stage',onCell:(_,i)=>merge(i,r=>r.stage)},
 {title:'染助剂代码',width:100,dataIndex:'code'},
 {title:'比例',width:85,render:(_,r)=>r.ratio??'—'},
 {title:'算法',width:80,dataIndex:'algorithm'},
 {title:'单位',width:90,dataIndex:'unit'},
 {title:'工艺',width:130,render:(_,r)=>formulaProcess(r),onCell:(_,i)=>merge(i,formulaProcess)},
 {title:'PH值',width:95,render:(_,r)=>formulaPh(r),onCell:(_,i)=>merge(i,formulaPh)},
 ...batches.flatMap((batch,i)=>[
 {title:<div>加料{i+1}<small>{batch.mode||'加料'}<br/>{[batch.depth,batch.direction].filter(Boolean).join('；')||batch.reason||'—'}</small></div>,width:115,render:(_:unknown,r:DetailRow)=>added(batch,r)??''},
 {title:`加料${i+1}工艺`,width:120,render:(_:unknown,r:DetailRow)=>process(batch,r),onCell:(_:DetailRow,index?:number)=>merge(index,r=>process(batch,r))}
 ])
 ]}/>;
}
