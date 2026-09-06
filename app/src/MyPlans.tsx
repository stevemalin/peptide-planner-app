import React,{useState} from 'react';
import {ScrollView,Text,Pressable} from 'react-native';
import type {Store} from './engine';
import {prettyDate,prettyTime} from './engine';
import {getActivePlans,planDashboard,inventorySummary} from './multiplan-v04';
import {archivePlan} from './plan-actions-v04';
import {Button,Card,u} from './ui';
export default function MyPlans({store,update,onOpen,onDraft,onGuide,inventory=false}:{store:Store;update:(f:(s:Store)=>Store)=>Promise<void>;onOpen:(id:string)=>void;onDraft:()=>void;onGuide:()=>void;inventory?:boolean}){
 const [confirm,setConfirm]=useState<string|null>(null),[error,setError]=useState('');
 const plans=getActivePlans(store);
 return <ScrollView contentContainerStyle={u.scroll}><Text style={u.title}>{inventory?'Inventory':'My Plans'}</Text><Text style={u.body}>{plans.length} active {plans.length===1?'plan':'plans'} · each with its own schedule and progress.</Text>
 {inventory&&<Text style={u.small}>Enter individual vials, not kits. 1 kit containing 10 vials = 10 individual vials. Supply can be added later.</Text>}
 {!!error&&<Text style={u.error}>{error}</Text>}
 {store.draft&&<Card><Text style={u.heading}>Continue your draft</Text><Text style={u.body}>{store.draft.compoundName} · not started</Text><Button label="Continue draft" onPress={onDraft}/></Card>}
 {planDashboard(plans).map(({plan,progress,next})=>{const supply=inventorySummary(plan);return <Card key={plan.id}><Text style={u.heading}>{plan.compoundName}</Text><Text style={u.body}>{!progress.started?'Starts '+prettyDate(plan.startDate):progress.inBreak?'Planned break':progress.ended?'Scheduled stages complete':'Week '+progress.week+' of '+progress.totalWeeks}</Text><Text style={u.body}>{progress.completed} completed · {progress.total} scheduled events</Text><Text style={u.small}>{next?'Next: '+prettyDate(next.localDate)+' · '+prettyTime(next.scheduledAt):'No upcoming events'}</Text>
 <Text style={u.small}>{supply.coverage.supply===null?'Supply not entered':Number(supply.coverage.supply.toFixed(3))+' mg remaining · '+Number(supply.coverage.vials!.toFixed(2))+' vial equivalents'}</Text>
 <Button label={'Open '+plan.compoundName+' plan'} onPress={()=>onOpen(plan.id)}/>
 {confirm===plan.id?<><Text style={u.small}>Archive this plan? It will leave Today and Calendar. Its saved history is retained.</Text><Button label={'Confirm archive '+plan.compoundName} secondary onPress={()=>update(s=>archivePlan(s,plan.id)).then(()=>setConfirm(null)).catch(e=>setError(String(e)))}/><Button label="Keep active" secondary onPress={()=>setConfirm(null)}/></>:<Pressable accessibilityRole="button" accessibilityLabel={'Archive '+plan.compoundName} onPress={()=>setConfirm(plan.id)}><Text style={[u.link,{textAlign:'center'}]}>Archive plan</Text></Pressable>}</Card>})}
 {!plans.length&&<Card><Text style={u.body}>Your active plans will appear here. Learn in Pep School, then build a plan in Guide.</Text></Card>}
 <Button label="Add another plan" onPress={onGuide}/>
 </ScrollView>;
}
