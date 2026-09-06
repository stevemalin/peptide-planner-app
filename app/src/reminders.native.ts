import { isRunningInExpoGo } from 'expo';
// Type-only import: never evaluates the notification package during app startup.
import type * as NotificationAPI from 'expo-notifications';
import type { SavedPlan } from './engine';
import type { ReminderReport } from './reminders';
const owner='peptide-planner-v03',channelId='peptide-plan-reminders';
const expoGoMessage='OS notifications are paused in Expo Go. Your plan, schedule and reminder settings remain saved. A development build is needed to test local notification delivery.';
let unavailableMessage='Local notifications are unavailable in this runtime. Your plan, schedule and reminder settings remain saved.';
let api:typeof NotificationAPI|null=null;
let attempted=false;
function getLocalNotifications():typeof NotificationAPI|null {
 if(attempted)return api;
 attempted=true;
 try {
  // Guard before require: this SDK's package entry point also evaluates push-token
  // auto-registration, which throws in Android Expo Go even for local-only users.
  if(isRunningInExpoGo()){unavailableMessage=expoGoMessage;return null;}
  const loaded:typeof NotificationAPI=require('expo-notifications');
  loaded.setNotificationHandler({handleNotification:async()=>({shouldPlaySound:true,shouldSetBadge:false,shouldShowBanner:true,shouldShowList:true})});
  api=loaded;
 }catch{api=null;}
 return api;
}
function unavailable():ReminderReport{return {message:unavailableMessage,count:0,enabled:false};}
export async function enableReminders(){
 const Notifications=getLocalNotifications();if(!Notifications)return false;
 try {
 await Notifications.setNotificationChannelAsync(channelId,{name:'Plan reminders',importance:Notifications.AndroidImportance.HIGH,sound:'default'});
 const existing=await Notifications.getPermissionsAsync();if(existing.granted)return true;
 return (await Notifications.requestPermissionsAsync()).granted;
 }catch{return false;}
}
let serial=Promise.resolve();
export function reconcileReminders(input:SavedPlan|SavedPlan[]|null):Promise<ReminderReport>{
 const task=serial.catch(()=>{}).then(async()=>{
  const Notifications=getLocalNotifications();if(!Notifications)return unavailable();
  const plans=Array.isArray(input)?input:input?[input]:[];const plan=plans.find(p=>p.reminderEnabled&&!p.pausedAt);
  const now=Date.now();const permission=await Notifications.getPermissionsAsync();
  const upcoming=plan?.reminderEnabled&&permission.granted?plans.filter(p=>p.reminderEnabled&&!p.pausedAt).flatMap(p=>p.events.filter(e=>e.status==='pending').map(e=>({planId:p.id,event:e,at:e.snoozedUntil?new Date(e.snoozedUntil).getTime():new Date(e.scheduledAt).getTime()-p.reminderOffsetMinutes*60000}))).filter(e=>e.at>now).sort((a,b)=>a.at-b.at).slice(0,60):[];
  const desired=new Map(upcoming.map(item=>['pep04:'+item.planId+':'+item.event.id+':'+item.at,item]));
  const existing=await Notifications.getAllScheduledNotificationsAsync();
  for(const item of existing)if(item.content.data?.owner===owner&&!item.content.data?.test&&!desired.has(item.identifier))await Notifications.cancelScheduledNotificationAsync(item.identifier);
  const existingIds=new Set(existing.map(item=>item.identifier));
  for(const [id,item]of desired)if(!existingIds.has(id))await Notifications.scheduleNotificationAsync({identifier:id,content:{title:'Plan reminder',body:'A saved plan event is ready to review.',sound:'default',data:{owner,eventId:item.event.id,planId:item.planId}},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:new Date(item.at),channelId}});
  const through=upcoming.length?new Date(upcoming[upcoming.length-1].at).toISOString():undefined;
  return {message:!plan?.reminderEnabled?'Reminders are off.':!permission.granted?'Notifications are not permitted. Enable them to receive reminders.':upcoming.length+' local reminders prepared. Android controls delivery timing.',count:upcoming.length,through,enabled:!!permission.granted};
 }).catch(()=>({...unavailable(),message:'Local reminders could not be prepared. Your saved plan is unchanged. Check notification permissions or retry in a development build.'}));serial=task.then(()=>{});return task;
}
export async function testReminder(){const Notifications=getLocalNotifications();if(!Notifications)throw Error(unavailableMessage);if(!await enableReminders())throw Error('Notification permission is not enabled.');await Notifications.scheduleNotificationAsync({content:{title:'Peptide Planner test',body:'Local notifications are working.',data:{owner,test:true}},trigger:{type:Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,seconds:10,channelId}});}
export function listenForReminder(callback:()=>void){
 const Notifications=getLocalNotifications();if(!Notifications)return()=>{};
 try{const sub=Notifications.addNotificationResponseReceivedListener(response=>{if(response.notification.request.content.data?.owner===owner)callback();});return()=>{try{sub.remove();}catch{}};}catch{return()=>{};}
}
