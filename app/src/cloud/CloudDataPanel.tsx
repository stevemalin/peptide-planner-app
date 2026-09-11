import React,{useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Platform,Pressable,Share,StyleSheet,Text,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Store} from '../engine';
import {decodePlannerStore,encodePlannerStore} from '../persistence-v04';
import {confirmMigration,reviewMigration,type MigrationReview} from './planner-migration';
import {decideAutomaticSync,downloadReviewed,reviewSync,uploadReviewed,type AutomaticSyncBaseline,type SyncReview} from './planner-sync';
import {eligibleUser,exportOwnAccount,readCloudPlannerSnapshot,saveCloudPlannerSnapshot,setDeletionRequest,uploadInitialPlannerCopy} from './client';

export type AutomaticCloudSyncState={
 kind:'local'|'checking'|'syncing'|'upToDate'|'setup'|'needsAttention'|'retry';
 label:string;detail:string;
};
const initialAutomaticState:AutomaticCloudSyncState={kind:'local',label:'Saved on this device',detail:'Sign in to use cloud sync.'};
const automaticBaselineKey=(userId:string)=>'pepplan.cloud-sync.baseline.v1:'+userId;
function readAutomaticBaseline(raw:string|null):AutomaticSyncBaseline|null{
 if(!raw)return null;
 try{const value=JSON.parse(raw);return Number.isSafeInteger(value?.revision)&&value.revision>0&&typeof value?.payload==='string'?value:null;}catch{return null;}
}
async function saveAutomaticBaseline(userId:string,baseline:AutomaticSyncBaseline){
 await AsyncStorage.setItem(automaticBaselineKey(userId),JSON.stringify(baseline));
}
export function useAutomaticCloudSync({eligible,userId,store,ready,saving,replaceStore,onNeedsAttention}:{eligible:boolean;userId:string|null;store:Store;ready:boolean;saving:boolean;replaceStore:(next:Store)=>Promise<void>;onNeedsAttention:()=>void;}){
 const [state,setState]=useState<AutomaticCloudSyncState>(initialAutomaticState);
 const current=useRef(store),replace=useRef(replaceStore),attention=useRef(onNeedsAttention),busy=useRef(false),mounted=useRef(true);
 current.current=store;replace.current=replaceStore;attention.current=onNeedsAttention;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const set=(next:AutomaticCloudSyncState)=>{if(mounted.current)setState(next);};
 const syncNow=useCallback(async()=>{
  if(!eligible||!userId||!ready||saving||busy.current)return;
  busy.current=true;set({kind:'checking',label:'Checking cloud…',detail:'Comparing this device with your private cloud copy.'});
  try{
   const localPayload=encodePlannerStore(current.current),row=await readCloudPlannerSnapshot();
   if(!row){set({kind:'setup',label:'Set up cloud sync',detail:'Create the first cloud copy before automatic sync begins.'});return;}
   const review=reviewSync(userId,current.current,row);
   const baseline=readAutomaticBaseline(await AsyncStorage.getItem(automaticBaselineKey(userId)));
   const decision=decideAutomaticSync(review.localPayload,review.cloudPayload,row.revision,baseline);
   if(decision==='bind'){
    await saveAutomaticBaseline(userId,{revision:row.revision,payload:review.cloudPayload});
    set({kind:'upToDate',label:'Cloud up to date',detail:'This device matches cloud revision '+row.revision+'.'});return;
   }
   if(decision==='attention'){
    set({kind:'needsAttention',label:'Sync needs attention',detail:'Both copies may contain changes. Review them before choosing which planner to keep.'});return;
   }
   set({kind:'syncing',label:'Syncing…',detail:decision==='upload'?'Saving this device’s newer changes to the cloud.':'Loading newer cloud changes on this device.'});
   await AsyncStorage.setItem('peptide-planner:auto-sync-backup:'+new Date().toISOString(),localPayload);
   if(encodePlannerStore(current.current)!==localPayload)throw Error('Local data changed during synchronization. Try again.');
   if(decision==='upload'){
    const revision=await saveCloudPlannerSnapshot(review.localPayload,row.revision,userId);
    const verified=await readCloudPlannerSnapshot();
    if(!verified||verified.revision!==revision)throw Error('Cloud update could not be verified.');
    const verifiedReview=reviewSync(userId,current.current,verified);
    if(verifiedReview.localPayload!==verifiedReview.cloudPayload)throw Error('Cloud update could not be verified.');
    await saveAutomaticBaseline(userId,{revision,payload:verifiedReview.cloudPayload});
    set({kind:'upToDate',label:'Cloud up to date',detail:'Your changes are available on your other signed-in devices.'});
   }else{
    const verified=await readCloudPlannerSnapshot();
    if(!verified||verified.revision!==row.revision)throw Error('Cloud data changed again. Review sync before continuing.');
    const verifiedReview=reviewSync(userId,current.current,verified);
    if(verifiedReview.cloudPayload!==review.cloudPayload)throw Error('Cloud data changed again. Review sync before continuing.');
    await replace.current(decodePlannerStore(review.cloudPayload));
    await saveAutomaticBaseline(userId,{revision:row.revision,payload:review.cloudPayload});
    set({kind:'upToDate',label:'Cloud up to date',detail:'Newer changes from another device are now on this device.'});
   }
  }catch(error){
   const detail=String(error).replace(/^Error:\s*/,'');
   set(/changed|review|account/i.test(detail)?{kind:'needsAttention',label:'Sync needs attention',detail}:{kind:'retry',label:'Sync paused',detail:'Your device copy is safe. '+detail});
  }finally{busy.current=false;}
 },[eligible,userId,ready,saving]);
 const localPayload=ready?encodePlannerStore(store):'';
 useEffect(()=>{if(!eligible||!userId||!ready||saving)return;const timer=setTimeout(()=>{void syncNow();},1800);return()=>clearTimeout(timer);},[eligible,userId,ready,saving,localPayload,syncNow]);
 useEffect(()=>{if(!eligible)return;const subscription=AppState.addEventListener('change',next=>{if(next==='active')void syncNow();});return()=>subscription.remove();},[eligible,syncNow]);
 useEffect(()=>{if(!eligible)setState(initialAutomaticState);},[eligible,userId]);
 const activate=()=>state.kind==='needsAttention'||state.kind==='setup'?attention.current():void syncNow();
 return {state,syncNow,activate};
}

export function CloudDataPanel({store,ready,userId,replaceStore,guided=false,onCloudChanged}:{store:Store;ready:boolean;userId:string;replaceStore:(next:Store)=>Promise<void>;guided?:boolean;onCloudChanged?:()=>void}){
 const [review,setReview]=useState<MigrationReview|null>(null),[syncReview,setSyncReview]=useState<SyncReview|null>(null),[confirmed,setConfirmed]=useState(false),[deletionConfirmed,setDeletionConfirmed]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const current=useRef(store);current.current=store;
 useEffect(()=>{setReview(null);setSyncReview(null);setConfirmed(false);setDeletionConfirmed(false);setMessage('');},[userId]);
 const run=async(action:()=>Promise<string>)=>{if(busy)return;setBusy(true);try{setMessage(await action());}catch(error){setMessage(error instanceof Error?error.message:'The action could not finish. Your local data is unchanged.');}finally{setBusy(false);}};
 const backup=async(payload:string,label:string)=>{const key='peptide-planner:'+label+':'+new Date().toISOString()+':'+Math.random().toString(36).slice(2);await AsyncStorage.setItem(key,payload);if(await AsyncStorage.getItem(key)!==payload)throw Error('Local safety copy could not be verified. No planner data was changed.');};
 const refreshSync=async()=>{
   const row=await readCloudPlannerSnapshot();
   setReview(null);setConfirmed(false);
   if(!row){setSyncReview(null);return 'No cloud planner exists yet. Review an initial cloud copy to begin.';}
   const next=reviewSync(userId,current.current,row);setSyncReview(next);
   return next.identical?'This device matches cloud revision '+next.cloudRevision+'.':'Cloud revision '+next.cloudRevision+' is available. Review both copies before choosing a direction.';
 };
 useEffect(()=>{if(ready)void run(refreshSync);},[ready,userId]);
 const syncPort=()=>({
   userId:eligibleUser,
   read:async()=>await readCloudPlannerSnapshot(),
   backup:(payload:string)=>backup(payload,'pre-sync'),
   upload:saveCloudPlannerSnapshot,
   apply:replaceStore,
 });
 const button=(label:string,action:()=>void,disabled=false)=><Pressable accessibilityRole="button" accessibilityLabel={label} disabled={busy||disabled} accessibilityState={{disabled:busy||disabled}} onPress={action} style={[styles.button,(busy||disabled)&&{opacity:.5}]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
 const check=(label:string,value:boolean,change:()=>void)=><Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{checked:value,disabled:busy}} disabled={busy} onPress={change}><Text style={styles.text}>{value?'✓':'○'} {label}</Text></Pressable>;
 return <View style={styles.card}><Text style={styles.title}>{guided?'Use EZPep on another device':'Cloud copy & account data'}</Text>
 <Text style={styles.text}>{guided?'EZPep saves your planner on each device. Start here to safely copy this device’s planner to your private cloud, or load an existing cloud copy onto this device.':'Move a verified planner copy between devices using the same invited account. EZPep checks the account and revision and saves a local recovery copy before replacing anything.'}</Text>
 <Text style={styles.step}><Text style={styles.stepNumber}>1</Text> On the device containing the planner you want to keep, copy it to your private cloud.</Text>
 <Text style={styles.step}><Text style={styles.stepNumber}>2</Text> Sign in on the other device with the same email and choose “Load my cloud planner.”</Text>
 <Text style={styles.note}>After the first cloud copy is established, EZPep automatically checks on sign-in, app open and resume, and shortly after saved changes. Use the Sync control anytime for an immediate check.</Text>
 {button('Refresh cloud-copy status',()=>void run(refreshSync),!ready)}
 {!syncReview&&button('Review this planner for cloud copy',()=>void run(async()=>{
  setReview(null);setConfirmed(false);
  if(await eligibleUser()!==userId)throw Error('Account changed. Open your account again.');
  if(await readCloudPlannerSnapshot())return refreshSync();
  setReview(reviewMigration(userId,encodePlannerStore(current.current)));
  return 'Review this device’s planner below. A verified local safety copy will be retained.';
 }),!ready)}
 {review&&<><Text style={styles.text}>Copy {review.plans} active plans and {review.archives} archived plans from this device. This creates cloud revision 1 without deleting the local planner.</Text>
 {check('I explicitly agree to create this account’s first private cloud planner copy.',confirmed,()=>setConfirmed(v=>!v))}
 {button('Copy this planner to the cloud',()=>void run(async()=>{
  await confirmMigration(review,()=>encodePlannerStore(current.current),confirmed,{
   userId:eligibleUser,cloudExists:async()=>Boolean(await readCloudPlannerSnapshot()),
   backup:payload=>backup(payload,'pre-cloud'),
   upload:uploadInitialPlannerCopy,
  });setReview(null);setConfirmed(false);await refreshSync();onCloudChanged?.();return 'Your planner is ready in the cloud. Sign in on your other device with the same email. Automatic sync will begin after it matches this cloud copy.';
 }),!confirmed||!ready)}
 {button('Cancel cloud copy',()=>{setReview(null);setConfirmed(false);setMessage('Cloud copy cancelled. Nothing was uploaded.');})}</>}
 {syncReview&&<><View style={styles.summary}><Text style={styles.text}>This device: {syncReview.localPlans} saved peptide record(s)</Text><Text style={styles.text}>Cloud: {syncReview.cloudPlans} saved peptide record(s) · revision {syncReview.cloudRevision}</Text></View>
 {syncReview.identical?<Text style={styles.good}>This device and the cloud copy match.</Text>:<>
 <Text style={styles.warning}>These copies differ. Choose one direction. EZPep does not merge two different schedules automatically.</Text>
 {check('I reviewed the direction below and understand the replaced copy will remain available in a local safety backup.',confirmed,()=>setConfirmed(v=>!v))}
 {button('Keep this device’s planner and copy it to cloud',()=>void run(async()=>{const revision=await uploadReviewed(syncReview,()=>current.current,confirmed,syncPort());setConfirmed(false);setSyncReview(null);onCloudChanged?.();return 'Cloud planner updated to revision '+revision+'. Other devices can now load it.';}),!confirmed||!ready)}
 {button('Load my cloud planner on this device',()=>void run(async()=>{await downloadReviewed(syncReview,()=>current.current,confirmed,syncPort());setConfirmed(false);setSyncReview(null);onCloudChanged?.();return 'Cloud revision '+syncReview.cloudRevision+' is now active on this device. The previous local copy was preserved as a recovery copy.';}),!confirmed||!ready)}
 </>}</>}
 {button('Export account data',()=>void run(async()=>{
  const payload=JSON.stringify(await exportOwnAccount(),null,2);
  if(Platform.OS==='web'){const web=globalThis as any,url=web.URL.createObjectURL(new web.Blob([payload],{type:'application/json'}));try{const link=web.document.createElement('a');link.href=url;link.download='ezpep-account-export-'+new Date().toISOString().slice(0,10)+'.json';link.click();}finally{web.URL.revokeObjectURL(url);}}
  else await Share.share({title:'EZPep Planner account export',message:payload});
  return 'Account export prepared. Keep it private.';
 }))}
 <Text style={styles.text}>Account deletion requires organizer review, identity checking and a separate final confirmation. A request does not delete anything.</Text>
 {check('I want the beta organizer to review an account-deletion request. I understand no deletion happens now.',deletionConfirmed,()=>setDeletionConfirmed(v=>!v))}
 {button('Request deletion review',()=>void run(async()=>{await setDeletionRequest(false);setDeletionConfirmed(false);return 'Deletion review requested. Nothing was deleted.';}),!deletionConfirmed)}
 {button('Cancel deletion request',()=>void run(async()=>{await setDeletionRequest(true);setDeletionConfirmed(false);return 'Deletion request cancelled. Your data is unchanged.';}))}
 {!!message&&<Text accessibilityLiveRegion="polite" style={styles.text}>{message}</Text>}
 </View>;
}
const styles=StyleSheet.create({card:{width:'100%',maxWidth:680,alignSelf:'center',padding:16,gap:12,borderRadius:18,backgroundColor:'#fff',borderWidth:1,borderColor:'#DDE8F6'},title:{fontSize:21,fontWeight:'700',color:'#0E1C4A'},text:{fontSize:15,lineHeight:23,color:'#334466',flexShrink:1},step:{fontSize:15,lineHeight:23,color:'#0E1C4A',fontWeight:'600'},stepNumber:{color:'#7557F6',fontWeight:'800'},note:{fontSize:13,lineHeight:19,color:'#52627F',backgroundColor:'#F2EDFF',borderRadius:12,padding:12},summary:{padding:12,gap:4,borderRadius:12,backgroundColor:'#F7FBFF'},good:{fontSize:15,lineHeight:23,color:'#176B45',fontWeight:'700'},warning:{fontSize:15,lineHeight:23,color:'#8A4B08',fontWeight:'700'},button:{padding:14,borderRadius:12,backgroundColor:'#0E1C4A'},buttonText:{color:'#fff',fontSize:15,fontWeight:'700',textAlign:'center'}});
