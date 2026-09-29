import {Table} from 'antd';

type ProcessRow={key:number;step:string;process:string;value:string;finished:string;finishedValue:string};
const rows:ProcessRow[]=[
 ['白坯发货','','','',''],
 ['平蒸','温度(±3°C)','80','落布门幅','150'],
 ['平蒸','车速(±2m/min)','40','',''],
 ['白坯烧毛','汽油量(±1.5m³/h)','11','落布门幅',''],
 ['白坯烧毛','车速(±3m/min)','120','布面要求','光洁'],
 ['色坯转序','','','布面要求','浅色盖膜'],
 ['色坯转序','','','正反面','一致'],
 ['上油定型','温度(±2°C)','207','进布门幅',''],
 ['上油定型','车速(±2m/min)','20','落布门幅(±1.5cm)','153'],
 ['上油定型','硅油','','克重',''],
 ['上油定型','柔软','','',''],
 ['上油定型','浓度(±5g/L)','40','',''],
 ['罐蒸','卷布工艺号','82','进布门幅',''],
 ['罐蒸','蒸筒工艺号','82','落布门幅','152'],
 ['成品对样','','','送样时间',''],
 ['立检','车速','','',''],
 ['捆检','尺码','','',''],
 ['成品收货','收货匹数米数','','',''],
].map(([step,process,value,finished,finishedValue],key)=>({key,step,process,value,finished,finishedValue}));

export default function OpeningProcessDetails(){
 return <Table<ProcessRow> className="opening-process-details" bordered size="small" pagination={false} rowKey="key" tableLayout="fixed" dataSource={rows} rowClassName={row=>row.step==='平蒸'?'process-highlight':''} columns={[
  {title:'工序',dataIndex:'step',width:'18%',onCell:(row,index)=>{
   if(row.step==='色坯转序')return {};
   if(index!==undefined&&index>0&&rows[index-1].step===row.step)return {rowSpan:0};
   return {rowSpan:rows.filter(item=>item.step===row.step).length};
  }},
  {title:'工艺',dataIndex:'process',width:'27%'},
  {title:'设定值',dataIndex:'value',width:'16%'},
  {title:'完成品',dataIndex:'finished',width:'25%'},
  {title:'设定值',dataIndex:'finishedValue',width:'14%'},
 ]}/>;
}
