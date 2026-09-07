import React from 'react';
import {View,Text,Pressable,StyleSheet} from 'react-native';
import type {SavedPlan,Event} from './engine';
import {prettyDate,prettyTime,stageAmount} from './engine';
import MiniSyringe from './MiniSyringe';
import SwipeEvent from './SwipeEvent';
import {u} from './ui';
export default function TodayEventCard({plan,event:e,now,today,active,expanded,onExpand,onAction,onEdit,disabled,children,color}:{plan:SavedPlan;event:Event;now:Date;today:boolean;active:boolean;expanded:boolean;onExpand:()=>void;onAction:(a:'completed'|'skipped'|'later')=>void;onEdit:()=>void;disabled:boolean;children:React.ReactNode;color:string}){
 const canLog=active&&e.status==='pending'&&Date.parse(e.scheduledAt)<=now.getTime(),done=e.status!=='pending',snoozed=e.status==='pending'&&Date.parse(e.snoozedUntil||'')>now.getTime();
 const overdueMinutes=canLog&&!snoozed?Math.floor((now.getTime()-Date.parse(e.scheduledAt))/60000):0,urgent=overdueMinutes>=60;
 const status=done?e.status==='completed'?'Completed':'Skipped':snoozed?'Reminded':urgent?'! Needs attention':canLog?'Due now':today?'Later today':'Scheduled';
 const action=(label:string,name:string,fn:()=>void,primary=false)=><Pressable accessibilityRole="button" accessibilityLabel={name} disabled={disabled} onPress={fn} style={[s.action,primary&&s.primary]}><Text style={[s.actionText,primary&&{color:'#fff'}]}>{label}</Text></Pressable>;
 return <SwipeEvent enabled={today&&active} canLog={canLog} name={plan.compoundName} onComplete={()=>onAction('completed')} onSkip={()=>onAction('skipped')} onLater={()=>onAction('later')} onEdit={onEdit} disabled={disabled}><View testID={done?'completed-event-card':'pending-event-card'} style={[s.card,done&&s.done,urgent&&s.urgentCard]}>
 <View style={s.row}><View style={[s.dot,{backgroundColor:urgent?'#bd4352':color}]}/><Text style={s.name}>{plan.compoundName}</Text><Text style={[s.status,{color:done?'#178066':canLog?'#ac3545':'#61728f'}]}>{status}</Text></View>
 <Text style={s.meta}>{today?'':prettyDate(e.localDate)+' · '}{prettyTime(e.scheduledAt)} · Stage {e.stageIndex+1}{snoozed?' · reminder '+prettyTime(e.snoozedUntil!):urgent?' · '+overdueMinutes+' min overdue':''}</Text>
 <Text style={s.amount}>{stageAmount({amountMg:String(e.amountMg),amountUnit:e.amountUnit})} · {Number(e.calculation.units.toFixed(3))} units · {Number(e.calculation.volume.toFixed(5))} mL</Text>
 {urgent&&<Text accessibilityLiveRegion="polite" style={s.urgentText}>This event is still waiting. Mark Taken, Skip, or Remind Later.</Text>}
 {(!done||expanded)&&<MiniSyringe units={e.calculation.units} capacity={plan.syringeCapacityUnits??null}/>}
 <View style={s.actions}>{canLog&&<>{action('Taken','Complete '+plan.compoundName+' '+prettyTime(e.scheduledAt),()=>onAction('completed'),true)}{action('Skip','Skip '+plan.compoundName+' '+prettyTime(e.scheduledAt),()=>onAction('skipped'))}{action('Later','Remind later '+plan.compoundName+' '+prettyTime(e.scheduledAt),()=>onAction('later'))}</>}{active&&action('Edit','Edit event plan '+plan.compoundName+' '+e.id,onEdit)}{action(expanded?'Less':'Details','Event details '+plan.compoundName+' '+e.id,onExpand)}</View>
 {expanded&&<>{e.completedAt&&<Text style={u.small}>Completed {new Date(e.completedAt).toLocaleString()}</Text>}{e.skippedAt&&<Text style={u.small}>Skipped {new Date(e.skippedAt).toLocaleString()}</Text>}{children}</>}
 </View></SwipeEvent>;
}
const s=StyleSheet.create({card:{padding:10,marginTop:8,borderWidth:1,borderColor:'#dce7f5',borderRadius:16,backgroundColor:'#fff'},done:{backgroundColor:'#f7faf9'},urgentCard:{borderColor:'#e59aa5',backgroundColor:'#fff8f8'},row:{flexDirection:'row',alignItems:'center',gap:6},dot:{width:7,height:7,borderRadius:4},name:{fontSize:15,fontWeight:'800',color:'#10204a',flex:1},status:{fontSize:10,fontWeight:'800'},meta:{fontSize:11,lineHeight:16,color:'#61728f',marginTop:3},amount:{fontSize:14,lineHeight:20,fontWeight:'800',color:'#10204a',marginTop:4},urgentText:{fontSize:11,lineHeight:16,fontWeight:'700',color:'#9c2f3e',marginTop:3},actions:{flexDirection:'row',gap:4,marginTop:2},action:{minHeight:44,flex:1,alignItems:'center',justifyContent:'center',borderRadius:9,backgroundColor:'#eef8fc'},actionText:{fontSize:11,fontWeight:'800',color:'#067da7'},primary:{backgroundColor:'#13ace0'} });
