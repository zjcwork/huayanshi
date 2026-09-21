import {useState} from 'react';
import {App,Button,Image} from 'antd';
import {workflowNodes} from './workflow-guide-nodes';
import './workflow-guide.css';
const workflowImage=new URL('./assets/formula-workflow.jpg',import.meta.url).href;
export default function WorkflowGuide({onOpenTab}:{onOpenTab:(page:string)=>void}){
 const {message}=App.useApp();
 const [preview,setPreview]=useState(false);
 return <section className="panel workflow-guide"><div className="section-heading"><h3>流程说明</h3><Button onClick={()=>setPreview(true)}>放大查看原图</Button></div>
  <div className="workflow-diagram"><img src={workflowImage} alt="配方管理流程说明"/>{workflowNodes.map(node=><button key={node.id} className={`workflow-node ${node.shape??'rectangle'}`} style={{left:`${node.x/1993*100}%`,top:`${node.y/1248*100}%`,width:`${node.width/1993*100}%`,height:`${node.height/1248*100}%`}} aria-label={node.label} title={`${node.label}${node.targetPage?'：在新标签页打开':'：暂未配置跳转页面'}`} onClick={()=>{if(node.targetPage)onOpenTab(node.targetPage);else message.info(`${node.label}：暂未配置跳转页面`)}}/>)}</div>
  <Image src={workflowImage} style={{display:'none'}} preview={{visible:preview,onVisibleChange:setPreview}}/>
 </section>;
}
