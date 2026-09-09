import React,{useEffect,useRef,useState} from 'react';
import {Platform,Pressable,Share,StyleSheet,Text,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Store} from '../engine';
import {encodePlannerStore} from '../persistence-v04';
import {confirmMigration,reviewMigration,type MigrationReview} from './planner-migration';
import {eligibleUser,exportOwnAccount,readCloudPlannerSnapshot,setDeletionRequest,uploadInitialPlannerCopy} from './client';

export function CloudDataPanel({store,ready,userId}:{store:Store;ready:boolean;userId:string}){
 const [review,setReview]=useState<MigrationReview|null>(null),[confirmed,setConfirmed]=useState(false),[deletionConfirmed,setDeletionConfirmed]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const current=useRef(store);current.current=store;
 useEffect(()=>{setReview(null);setConfirmed(false);setDeletionConfirmed(false);setMessage('');},[userId]);
 const run=async(action:()=>Promise<string>)=>{if(busy)return;setBusy(true);try{setMessage(await action());}catch(error){setMessage(error instanceof Error?error.message:'The action could not finish. Your local data is unchanged.');}finally{setBusy(false);}};
 const button=(label:string,action:()=>void,disabled=false)=><Pressable accessibilityRole="button" accessibilityLabel={label} disabled={busy||disabled} accessibilityState={{disabled:busy||disabled}} onPress={action} style={[styles.button,(busy||disabled)&&{opacity:.5}]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
 const check=(label:string,value:boolean,change:()=>void)=><Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{checked:value,disabled:busy}} disabled={busy} onPress={change}><Text style={styles.text}>{value?'✓':'○'} {label}</Text></Pressable>;
 return <View style={styles.card}><Text style={styles.title}>Cloud copy & account data</Text>
 <Text style={styles.text}>Your planner still runs from this device. A cloud copy is optional and includes your saved plans, schedules, history and inventory. It is private account storage, not end-to-end encryption. Nothing is copied automatically.</Text>
 {button('Review an initial cloud copy',()=>void run(async()=>{
  setReview(null);setConfirmed(false);
  if(await eligibleUser()!==userId)throw Error('Account changed. Open your account again.');
  if(await readCloudPlannerSnapshot())throw Error('This account already has a cloud copy. This beta cannot replace it. Export your account data to recover that copy.');
  setReview(reviewMigration(userId,encodePlannerStore(current.current)));
  return 'Review the copy below. Keep a downloaded local backup as well.';
 }),!ready)}
 {review&&<><Text style={styles.text}>Copy {review.plans} active plans and {review.archives} archived plans to the account you just signed in to. This creates its first cloud snapshot only. Existing cloud data cannot be overwritten. Later local edits are not synchronized.</Text>
 {check('I explicitly agree to copy this device’s planner data to my signed-in beta account and retain my local copy.',confirmed,()=>setConfirmed(v=>!v))}
 {button('Confirm initial cloud copy',()=>void run(async()=>{
  await confirmMigration(review,()=>encodePlannerStore(current.current),confirmed,{
   userId:eligibleUser,cloudExists:async()=>Boolean(await readCloudPlannerSnapshot()),
   backup:async payload=>{const key='peptide-planner:pre-cloud:'+new Date().toISOString()+':'+Math.random().toString(36).slice(2);await AsyncStorage.setItem(key,payload);if(await AsyncStorage.getItem(key)!==payload)throw Error('Local safety copy could not be verified. No cloud upload was attempted.');},
   upload:uploadInitialPlannerCopy,
  });setReview(null);setConfirmed(false);return 'Initial cloud copy saved. Your local planner and safety copy are unchanged. Later edits stay on this device.';
 }),!confirmed||!ready)}
 {button('Cancel cloud copy',()=>{setReview(null);setConfirmed(false);setMessage('Cloud copy cancelled. Nothing was uploaded.');})}</>}
 {button('Export account data',()=>void run(async()=>{
  const payload=JSON.stringify(await exportOwnAccount(),null,2);
  if(Platform.OS==='web'){const web=globalThis as any,url=web.URL.createObjectURL(new web.Blob([payload],{type:'application/json'}));try{const link=web.document.createElement('a');link.href=url;link.download='ezpep-account-export-'+new Date().toISOString().slice(0,10)+'.json';link.click();}finally{web.URL.revokeObjectURL(url);}}
  else await Share.share({title:'EZPep Planner account export',message:payload});
  return 'Account export prepared. Keep it private. It contains cloud account records; use Export local backup for the latest device-only plans.';
 }))}
 <Text style={styles.text}>Account deletion requires organizer review and a separate identity check and final confirmation. Export your local and account data first. A request does not delete anything, and you can cancel it before processing. Completed deletion cannot be undone; cloud retention and backup handling must be explained before you confirm.</Text>
 {check('I want the beta organizer to review an account-deletion request. I understand no deletion happens now.',deletionConfirmed,()=>setDeletionConfirmed(v=>!v))}
 {button('Request deletion review',()=>void run(async()=>{await setDeletionRequest(false);setDeletionConfirmed(false);return 'Deletion review requested. Nothing was deleted. Contact the beta organizer for the separate confirmation step.';}),!deletionConfirmed)}
 {button('Cancel deletion request',()=>void run(async()=>{await setDeletionRequest(true);setDeletionConfirmed(false);return 'Deletion request cancelled. Your data is unchanged.';}))}
 {!!message&&<Text accessibilityLiveRegion="polite" style={styles.text}>{message}</Text>}
 </View>;
}
const styles=StyleSheet.create({card:{width:'100%',maxWidth:680,alignSelf:'center',padding:16,gap:12,borderRadius:18,backgroundColor:'#fff',borderWidth:1,borderColor:'#DDE8F6'},title:{fontSize:21,fontWeight:'700',color:'#0E1C4A'},text:{fontSize:15,lineHeight:23,color:'#334466',flexShrink:1},button:{padding:14,borderRadius:12,backgroundColor:'#0E1C4A'},buttonText:{color:'#fff',fontSize:15,fontWeight:'700',textAlign:'center'}});
