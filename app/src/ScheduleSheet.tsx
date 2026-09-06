import React,{useState}from'react';
import{Modal,View,Text,ScrollView,Pressable,StyleSheet}from'react-native';
import{blankSchedule,scheduleError}from'./engine';
import type{Schedule}from'./engine';
import{Button,Field,u,C}from'./ui';
import TimeChoice from './TimeChoice';
export default function ScheduleSheet({initial,stageIndex,onClose,onSave}:{initial:Schedule|null;stageIndex:number|null;onClose:()=>void;onSave:(schedule:Schedule,all:boolean)=>void}){
 const [value,setValue]=useState<Schedule>({...JSON.parse(JSON.stringify(initial||blankSchedule())),times:initial?.times.length?initial.times:['09:00']}),[all,setAll]=useState(stageIndex===null),[advanced,setAdvanced]=useState(false),[error,setError]=useState(''),[newTime,setNewTime]=useState<number|null>(null);
 const change=(patch:Partial<Schedule>)=>{setValue(v=>({...v,...patch}));setError('');};
 const choose=(name:string)=>{
  if(name==='Daily'||name==='Multiple times per day')change({kind:'daily',days:[],interval:null,timesPerWeek:null});
  if(name==='Once weekly')change({kind:'weekly',days:[6],interval:null,timesPerWeek:1});
  if(name==='Mon / Wed / Fri')change({kind:'weekly',days:[1,3,5],interval:null,timesPerWeek:3});
  if(name==='Every other day')change({kind:'intervalDays',interval:2,timesPerWeek:null});
  if(name==='Specific days')change({kind:'weekly',days:[],timesPerWeek:null});
  if(name==='Every X days')change({kind:'intervalDays',interval:null,timesPerWeek:null});
  if(name==='X times per week')change({kind:'weekly',days:[],timesPerWeek:2,interval:null});
  if(name==='Custom interval')change({kind:'intervalHours',interval:null,times:value.times.slice(0,1),timesPerWeek:null});
 };
 return <Modal transparent animationType="slide" onRequestClose={onClose}><View style={s.shade}><View style={s.sheet}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={u.scroll}>
  <Text style={u.title}>Schedule</Text><Text style={u.body}>{stageIndex===null?'Plan default':`Stage ${stageIndex+1}`} · choose days and times</Text>
  <Text style={[u.label,{marginTop:20}]}>QUICK SCHEDULES</Text><View style={s.options}>{['Daily','Once weekly','Mon / Wed / Fri','Every other day','Specific days'].map(name=><Pressable accessibilityRole="button" accessibilityLabel={name} key={name} onPress={()=>choose(name)} style={s.option}><Text style={s.optionLabel}>{name}</Text></Pressable>)}</View>
  {value.kind==='weekly'&&<><Text style={[u.label,{marginTop:16}]}>SPECIFIC DAYS</Text><View style={s.days}>{[1,2,3,4,5,6,0].map((d,i)=><Pressable key={d} accessibilityRole="checkbox" accessibilityLabel={['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i]} accessibilityState={{checked:value.days.includes(d)}} onPress={()=>change({days:value.days.includes(d)?value.days.filter(n=>n!==d):[...value.days,d].sort()})} style={[s.day,value.days.includes(d)&&u.selected]}><Text style={u.heading}>{['M','T','W','T','F','S','S'][i]}</Text></Pressable>)}</View>{!!value.timesPerWeek&&<Text style={u.small}>Choose {value.timesPerWeek} day(s) each week.</Text>}</>}
  <Pressable accessibilityRole="button" accessibilityLabel="Advanced schedules" onPress={()=>setAdvanced(!advanced)}><Text style={u.link}>Advanced {advanced?'−':'+'}</Text></Pressable>
  {advanced&&<View style={s.options}>{['Every X days','X times per week','Multiple times per day','Custom interval'].map(name=><Pressable accessibilityRole="button" accessibilityLabel={name} key={name} onPress={()=>choose(name)} style={s.option}><Text style={s.optionLabel}>{name}</Text></Pressable>)}</View>}
  {value.kind==='intervalDays'&&<Field label="Every how many days" value={value.interval===null?'':String(value.interval)} onChange={v=>change({interval:v===''?null:Number(v)})} numeric/>}
  {value.kind==='intervalHours'&&<><Field label="Every how many hours" value={value.interval===null?'':String(value.interval)} onChange={v=>change({interval:v===''?null:Number(v)})} numeric/><Text style={u.small}>Repeats by elapsed hours from the starting time. Clock changes may shift local times.</Text></>}
  {value.kind==='weekly'&&advanced&&<Field label="Times per week (days)" value={value.timesPerWeek?String(value.timesPerWeek):''} onChange={v=>change({timesPerWeek:v===''?null:Number(v)})} numeric/>}
  <Text style={[u.label,{marginTop:16}]}>TIME</Text>
  {value.times.map((time,i)=><View key={i} style={{marginBottom:12}}><TimeChoice autoOpen={newTime===i} label={`Time ${i+1}`} value={time} onChange={t=>change({times:value.times.map((old,n)=>n===i?t:old)})}/>{value.times.length>1&&<Pressable accessibilityRole="button" accessibilityLabel={`Remove time ${i+1}`} onPress={()=>change({times:value.times.filter((_,n)=>n!==i)})}><Text style={u.link}>Remove</Text></Pressable>}</View>)}
  {value.kind!=='intervalHours'&&value.times.length<8&&<Button label="+ Add another time" secondary onPress={()=>{setNewTime(value.times.length);const used=new Set(value.times);let hour=9;while(used.has(String(hour).padStart(2,'0')+':00'))hour=(hour+1)%24;change({times:[...value.times,String(hour).padStart(2,'0')+':00']});}}/>}
  <Pressable accessibilityRole="checkbox" accessibilityLabel="Apply this schedule to all stages" accessibilityState={{checked:all}} onPress={()=>stageIndex!==null&&setAll(!all)} style={[u.evidence,all&&{borderLeftColor:C.blue}]}><Text style={u.body}>{all?'✓ ':'○ '}Apply this schedule to all stages</Text>{all&&<Text style={u.small}>Replaces existing stage overrides.</Text>}</Pressable>
  {!all&&<Text style={u.small}>Save for this stage only.</Text>}
  {error!==''&&<Text style={u.error}>{error}</Text>}
  <Button label="Save schedule" onPress={()=>{const err=scheduleError(value);if(err)setError(err);else onSave({...value,times:[...value.times].sort()},all);}}/>
  <Button label="Cancel" secondary onPress={onClose}/>
 </ScrollView></View></View></Modal>;
}
const s=StyleSheet.create({shade:{flex:1,backgroundColor:'#0e1c4a66',justifyContent:'flex-end'},sheet:{backgroundColor:'#fff',borderTopLeftRadius:28,borderTopRightRadius:28,maxHeight:'94%'},days:{flexDirection:'row',justifyContent:'space-between'},options:{gap:8,marginTop:8},option:{alignSelf:'stretch',padding:14,minHeight:50,borderRadius:14,backgroundColor:'#f2f6fc'},optionLabel:{fontSize:16,lineHeight:24,color:C.ink,flexShrink:1},day:{flex:1,marginHorizontal:2,minHeight:44,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:'#f1f5fa',marginTop:8}});
