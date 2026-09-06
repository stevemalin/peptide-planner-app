import React,{useRef,useState}from'react';
import{Text,View,Pressable,StyleSheet}from'react-native';
import type{SavedPlan,Event,Store}from'./engine';
import{actualProgress,localDate,parseDate,prettyDate,prettyTime,eventStatus,logEvent,addDays,stageAmount}from'./engine';
import{Button,Card,u}from'./ui';
import Syringe from'./Syringe';
import SetupSummary from './SetupSummary';
import{quantityFromMg}from'./quantities';
export default function Tracker({plan,archives,now,update,initialTab='Today'}:{plan:SavedPlan;archives:SavedPlan[];now:Date;update:(fn:(s:Store)=>Store)=>Promise<void>;initialTab?:string}){
 const [tab,setTab]=useState(initialTab),[selected,setSelected]=useState(localDate(now)),[month,setMonth]=useState(localDate(now).slice(0,7)+'-01'),[error,setError]=useState(''),[message,setMessage]=useState('');
 const actionLock=useRef(false);const [logging,setLogging]=useState(false);
 const p=actualProgress(plan,now),pending=plan.events.filter(e=>e.status==='pending'),due=pending.filter(e=>new Date(e.scheduledAt)<=now),future=pending.find(e=>new Date(e.scheduledAt)>now);
 const candidate=due.find(e=>e.localDate===localDate(now))||due[due.length-1]||future;
 const action=async(e:Event,value:'completed'|'skipped'|'later')=>{if(actionLock.current)return;actionLock.current=true;setLogging(true);try{await update(s=>s.active?.id!==plan.id?s:{...s,active:logEvent(s.active,e.id,value,new Date())});setMessage(value==='later'?'Reminder moved 15 minutes later. The scheduled event time is unchanged.':'Event saved.');setError('');}catch(err){setError(String(err));}finally{setTimeout(()=>{actionLock.current=false;setLogging(false);},700);}};
 const eventCard=(e:Event,owner=plan,actions=false)=><Card key={e.id}><Text style={u.heading}>{owner.compoundName} · Stage {e.stageIndex+1}</Text><Text style={u.body}>{prettyDate(e.localDate)} · {prettyTime(e.scheduledAt)}</Text><Text style={[u.label,{color:colors[eventStatus(e,now)],marginTop:8}]}>{eventStatus(e,now)}</Text><Text style={u.body}>{stageAmount({amountMg:String(e.amountMg),amountUnit:e.amountUnit})} · {Number(e.calculation.units.toFixed(3))} units · {Number(e.calculation.volume.toFixed(4))} mL</Text>{e.completedAt&&<Text style={u.small}>Completed {new Date(e.completedAt).toLocaleString()}</Text>}{e.skippedAt&&<Text style={u.small}>Skipped {new Date(e.skippedAt).toLocaleString()}</Text>}{e.snoozedUntil&&e.status==='pending'&&<Text style={u.small}>Reminder: {new Date(e.snoozedUntil).toLocaleString()}</Text>}{actions&&e.status==='pending'&&new Date(e.scheduledAt)<=now&&<><Button label="Completed" disabled={logging} onPress={()=>action(e,'completed')}/><View style={u.row}><View style={{flex:1}}><Button label="Skip" disabled={logging} secondary onPress={()=>action(e,'skipped')}/></View><View style={{flex:2}}><Button label="Remind me later" disabled={logging} secondary onPress={()=>action(e,'later')}/></View></View></>}</Card>;
 const monthDate=parseDate(month)!,daysInMonth=new Date(monthDate.getFullYear(),monthDate.getMonth()+1,0).getDate(),leading=(monthDate.getDay()+6)%7;
 const moveMonth=(n:number)=>{const d=parseDate(month)!;d.setMonth(d.getMonth()+n);setMonth(localDate(d));};
 const history=[...archives,plan].flatMap(owner=>owner.events.filter(e=>e.status!=='pending'||new Date(e.scheduledAt)<now).map(e=>({e,owner}))).sort((a,b)=>b.e.scheduledAt.localeCompare(a.e.scheduledAt));
 const [historyLimit,setHistoryLimit]=useState(30);
 return <>
  <View style={u.row}>{['Today','Calendar','History'].map(name=><Pressable key={name} accessibilityRole="tab" accessibilityLabel={name} accessibilityState={{selected:tab===name}} onPress={()=>setTab(name)} style={[u.pill,tab===name&&u.selected]}><Text style={u.heading}>{name}</Text></Pressable>)}</View>
  {!!error&&<Text style={u.error}>{error}</Text>}{!!message&&<Text accessibilityLiveRegion="polite" style={u.small}>{message}</Text>}
  {tab==='Today'&&<>
   <Card><Text style={u.title}>{plan.compoundName}</Text><Text style={u.heading}>{!p.started?'Starts '+prettyDate(plan.startDate):p.inBreak?'Planned break':p.ended?'End of modelled plan':`Week ${p.week} of ${p.totalWeeks}`}</Text>
    {p.stageIndex>=0&&<Text style={u.body}>Stage {p.stageIndex+1} · Week {p.stageWeek} of {plan.stages[p.stageIndex].weeks}</Text>}
    <Text style={u.body}>{p.daysRemaining} days remaining in the stages</Text><Text style={u.body}>{p.completed} of {p.due} scheduled events completed</Text><Text style={u.small}>{p.total} events in the full plan. Calendar progress is independent of completions.</Text>
    {p.nextTransition&&<Text style={u.body}>Next: {p.stageIndex<plan.stages.length-1?'Stage '+(p.stageIndex+2):Number(plan.breakWeeks)>0?'Planned break':'End of plan stages'} · {prettyDate(p.nextTransition)}</Text>}
    <Text style={u.small}>Planned break: {Number(plan.breakWeeks)>0?prettyDate(p.breakStart)+' to '+prettyDate(addDays(p.breakEnd,-1)):'None selected'}</Text>
    <SetupSummary plan={plan}/>{plan.origin&&<Text style={u.small}>{plan.customized?'Customized from: ':'Modelled from: '}{plan.origin.sourceTitle}</Text>}
    {p.ended&&plan.origin&&<Text style={u.small}>This is the end of encoded stages, not a treatment-stop instruction. Refer to the original source context in My Plan.</Text>}
   </Card>
   <Card><Text style={u.heading}>Next scheduled event</Text><Text style={u.body}>{future?prettyDate(future.localDate)+' · '+prettyTime(future.scheduledAt):'No future events in this model.'}</Text>{due.length>0&&<Text style={u.small}>{due.length} past event(s) awaiting a log. Review them in Calendar or History.</Text>}</Card>
   {candidate?<>{eventCard(candidate,plan,true)}<Syringe capacityOverride={plan.syringeCapacityUnits??null} onCapacityChange={size=>update(s=>s.active?.id===plan.id?{...s,active:{...s.active,syringeCapacityUnits:size,setupOrigin:s.active.setupOrigin?{...s.active.setupOrigin,customized:s.active.setupOrigin.customized||size!==s.active.setupOrigin.original.defaultSyringeCapacityUnits}:undefined}}:s).catch(e=>setError(String(e)))} result={candidate.calculation} amount={quantityFromMg(candidate.amountMg,candidate.amountUnit)} glow={plan.compoundId==='glow-70'}/></>:<Text style={u.body}>All generated events have been logged.</Text>}
  </>}
  {tab==='Calendar'&&<>
   <View style={[u.row,{justifyContent:'space-between',marginTop:18}]}><Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={()=>moveMonth(-1)}><Text style={u.link}>‹</Text></Pressable><Text style={u.heading}>{monthDate.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={()=>moveMonth(1)}><Text style={u.link}>›</Text></Pressable></View>
   <View style={s.grid}>{['M','T','W','T','F','S','S'].map((day,i)=><Text key={i} style={s.weekday}>{day}</Text>)}{Array.from({length:leading},(_,i)=><View key={'blank'+i} style={s.cell}/>)}{Array.from({length:daysInMonth},(_,i)=>{
    const day=month.slice(0,8)+String(i+1).padStart(2,'0'),events=plan.events.filter(e=>e.localDate===day),statuses=[...new Set(events.map(e=>eventStatus(e,now)))];
    let offset=0;const stageStart=plan.stages.some(stage=>{const hit=addDays(plan.startDate,offset)===day;offset+=Number(stage.weeks)*7;return hit;});const isBreak=day===p.breakStart&&Number(plan.breakWeeks)>0,isBreakEnd=day===p.breakEnd&&Number(plan.breakWeeks)>0;
    return <Pressable key={day} accessibilityRole="button" accessibilityLabel={'Calendar '+day} onPress={()=>setSelected(day)} style={[s.cell,day===selected&&s.daySelected]}><Text style={s.dayText}>{i+1}</Text><View style={{flexDirection:'row',gap:2}}>{statuses.map(status=><View key={status} style={[s.dot,{backgroundColor:colors[status]}]}/>)}</View>{(stageStart||isBreak||isBreakEnd)&&<Text style={s.marker}>{isBreak?'B':isBreakEnd?'E':'S'}</Text>}</Pressable>;
   })}</View>
   <View style={u.row}>{Object.entries(colors).map(([status,color])=><Text key={status} style={[u.small,{color}]}>● {status}</Text>)}</View><Text style={u.small}>S = stage begins · B = break begins · E = break ends</Text>
   <Text style={[u.heading,{marginTop:18}]}>{prettyDate(selected)}</Text>
   {(()=>{let offset=0;return plan.stages.map((stage,i)=>{const date=addDays(plan.startDate,offset);offset+=Number(stage.weeks)*7;return date===selected?<Text key={stage.id} style={u.body}>Stage {i+1} begins</Text>:null;});})()}
   {Number(plan.breakWeeks)>0&&selected===p.breakStart&&<Text style={u.body}>Planned break begins</Text>}{Number(plan.breakWeeks)>0&&selected===p.breakEnd&&<Text style={u.body}>Planned break ends</Text>}
   {plan.events.filter(e=>e.localDate===selected).map(e=>eventCard(e,plan,true))}
   {!plan.events.some(e=>e.localDate===selected)&&<Text style={u.body}>No events on this day.</Text>}
  </>}
  {tab==='History'&&<><Text style={[u.small,{marginTop:12}]}>Saved timestamps and original event calculations. Future events are in Calendar.</Text>{history.slice(0,historyLimit).map(({e,owner})=>eventCard(e,owner,owner.id===plan.id))}{!history.length&&<Text style={u.body}>No past activity yet.</Text>}{history.length>historyLimit&&<Button label="Show more history" secondary onPress={()=>setHistoryLimit(n=>n+30)}/>}</>}
 </>;
}
const colors={Completed:'#178066',Scheduled:'#076eac',Missed:'#bd4352',Future:'#7a65b2',Skipped:'#737b87'};
const s=StyleSheet.create({grid:{flexDirection:'row',flexWrap:'wrap',marginTop:12},weekday:{width:'14.2857%',textAlign:'center',fontWeight:'700',color:'#667896',padding:6},cell:{width:'14.2857%',height:59,alignItems:'center',justifyContent:'center',borderRadius:10},daySelected:{backgroundColor:'#dff6ff',borderWidth:1,borderColor:'#19b3e3'},dayText:{fontSize:16,color:'#18305c',marginBottom:4},dot:{width:5,height:5,borderRadius:3},marker:{fontSize:8,color:'#0b7192'}});


