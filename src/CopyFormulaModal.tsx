import {Modal} from 'antd';
import type {LabRecord} from './data';
import DyeFormulaTable from './DyeFormulaTable';
import {initialDyes} from './dye-formula-model';

export default function CopyFormulaModal({record,onClose}:{record:LabRecord|null;onClose:()=>void}){
 const version=Number(record?.formula.split('v').at(-1)??0);
 const formula={bath:record?.ratio??8,rows:initialDyes.map(row=>({...row,ratio:row.code==='B28'&&version>0?Number((0.563+version*0.01).toFixed(3)):row.ratio}))};
 return <Modal className="copy-formula-modal" title={`当前配方 ${record?.formula??''}　${record?.order??''} / ${record?.colorNo??''}`} open={!!record} width={1000} onCancel={onClose} footer={null}>
  {record&&<DyeFormulaTable compact fitWidth formula={formula} ratioTitle="比例"/>}
 </Modal>;
}
