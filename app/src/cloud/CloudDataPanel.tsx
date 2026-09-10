import React,{useEffect,useRef,useState} from 'react';
import {Platform,Pressable,Share,StyleSheet,Text,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Store} from '../engine';
import {encodePlannerStore} from '../persistence-v04';
import {confirmMigration,reviewMigration,type MigrationReview} from './planner-migration';
import {downloadReviewed,reviewSync,uploadReviewed,type SyncReview} from './planner-sync';
import {eligibleUser,exportOwnAccount,readCloudPlannerSnapshot,saveCloudPlannerSnapshot,setDeletionRequest,uploadInitialPlannerCopy} from './client';

export function CloudDataPanel({store,ready,userId,replaceStore}:{store:Store;ready:boolean;userId:string;replaceStore:(next:Store)=>Promise<void>}){
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
 const syncPort=()=>({
   userId:eligibleUser,
   read:async()=>await readCloudPlannerSnapshot(),
   backup:(payload:string)=>backup(payload,'pre-sync'),
   upload:saveCloudPlannerSnapshot,
   apply:replaceStore,
 });
 const button=(label:string,action:()=>void,disabled=false)=><Pressable accessibilityRole="button" accessibilityLabel={label} disabled={busy||disabled} accessibilityState={{disabled:busy||disabled}} onPress={action} style={[styles.button,(busy||disabled)&&{opacity:.5}]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
 const check=(label:string,value:boolean,change:()=>void)=><Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{checked:value,disabled:busy}} disabled={busy} onPress={change}><Text style={styles.text}>{value?'✓':'○'} {label}</Text></Pressable>;
 return <View style={styles.card}><Text style={styles.title}>Cloud sync & account data</Text>
 <Text style={styles.text}>Cloud sync lets the same invited account move its planner between phone and desktop. Each operation verifies the account and revision and saves a local recovery copy first. Another device can never silently overwrite a newer cloud revision.</Text>
 {button('Check cloud sync status',()=>void run(refreshSync),!ready)}
 {!syncReview&&button('Review an initial cloud copy',()=>void run(async()=>{
  setReview(null);setConfirmed(false);
  if(await eligibleUser()!==userId)throw Error('Account changed. Open your account again.');
  if(await readCloudPlannerSnapshot())return refreshSync();
  setReview(reviewMigration(userId,encodePlannerStore(current.current)));
  return 'Review the first cloud copy below. A verified local safety copy will be retained.';
 }),!ready)}
 {review&&<><Text style={styles.text}>Copy {review.plans} active plans and {review.archives} archived plans from this device. This creates cloud revision 1 without deleting the local planner.</Text>
 {check('I explicitly agree to create this account’s first private cloud planner copy.',confirmed,()=>setConfirmed(v=>!v))}
 {button('Confirm initial cloud copy',()=>void run(async()=>{
  await confirmMigration(review,()=>encodePlannerStore(current.current),confirmed,{
   userId:eligibleUser,cloudExists:async()=>Boolean(await readCloudPlannerSnapshot()),
   backup:payload=>backup(payload,'pre-cloud'),
   upload:uploadInitialPlannerCopy,
  });setReview(null);setConfirmed(false);return refreshSync();
 }),!confirmed||!ready)}
 {button('Cancel cloud copy',()=>{setReview(null);setConfirmed(false);setMessage('Cloud copy cancelled. Nothing was uploaded.');})}</>}
 {syncReview&&<><View style={styles.summary}><Text style={styles.text}>This device: {syncReview.localPlans} saved peptide record(s)</Text><Text style={styles.text}>Cloud: {syncReview.cloudPlans} saved peptide record(s) · revision {syncReview.cloudRevision}</Text></View>
 {syncReview.identical?<Text style={styles.good}>This device and the cloud copy match.</Text>:<>
 <Text style={styles.warning}>These copies differ. Choose one direction. EZPep does not merge two different schedules automatically.</Text>
 {check('I reviewed the direction below and understand the replaced copy will remain available in a local safety backup.',confirmed,()=>setConfirmed(v=>!v))}
 {button('Save this device to cloud',()=>void run(async()=>{const revision=await uploadReviewed(syncReview,()=>current.current,confirmed,syncPort());setConfirmed(false);setSyncReview(null);return 'Cloud planner updated to revision '+revision+'. Other devices can now load it.';}),!confirmed||!ready)}
 {button('Load cloud copy on this device',()=>void run(async()=>{await downloadReviewed(syncReview,()=>current.current,confirmed,syncPort());setConfirmed(false);setSyncReview(null);return 'Cloud revision '+syncReview.cloudRevision+' is now active on this device. The previous local copy was preserved.';}),!confirmed||!ready)}
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
const styles=StyleSheet.create({card:{width:'100%',maxWidth:680,alignSelf:'center',padding:16,gap:12,borderRadius:18,backgroundColor:'#fff',borderWidth:1,borderColor:'#DDE8F6'},title:{fontSize:21,fontWeight:'700',color:'#0E1C4A'},text:{fontSize:15,lineHeight:23,color:'#334466',flexShrink:1},summary:{padding:12,gap:4,borderRadius:12,backgroundColor:'#F7FBFF'},good:{fontSize:15,lineHeight:23,color:'#176B45',fontWeight:'700'},warning:{fontSize:15,lineHeight:23,color:'#8A4B08',fontWeight:'700'},button:{padding:14,borderRadius:12,backgroundColor:'#0E1C4A'},buttonText:{color:'#fff',fontSize:15,fontWeight:'700',textAlign:'center'}});
