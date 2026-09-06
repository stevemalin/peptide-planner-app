import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { blankStore, decodeStore } from './engine';
import type { Store } from './engine';
export const STORAGE_KEY='peptide-planner:local:v03';
export function usePlannerStore(){
 const [store,setStore]=useState<Store>(blankStore),[ready,setReady]=useState(false),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 const current=useRef(store),queue=useRef(Promise.resolve()),loadFailed=useRef(false),revision=useRef(0);
 useEffect(()=>{let mounted=true;(async()=>{try{const raw=await AsyncStorage.getItem(STORAGE_KEY);const loaded=raw?decodeStore(raw):blankStore();if(mounted){current.current=loaded;setStore(loaded);}}catch(e){loadFailed.current=true;if(mounted)setError(String(e));}finally{if(mounted)setReady(true);}})();return()=>{mounted=false;};},[]);
 const update=(change:(old:Store)=>Store)=>{
  if(!ready||loadFailed.current)return Promise.reject(Error('Saved data is not available.'));
  const next=change(current.current);current.current=next;setStore(next);setSaving(true);const rev=++revision.current;
  const write=queue.current.catch(()=>{}).then(()=>AsyncStorage.setItem(STORAGE_KEY,JSON.stringify(next)));
  queue.current=write;write.then(()=>{if(rev===revision.current){setSaving(false);setError('');}},()=>{if(rev===revision.current){setSaving(false);setError('Could not save on this device. Keep the app open and tap Retry save.');}});
  return write;
 };
 return {store,ready,error,saving,update,loadFailed:loadFailed.current,retry:()=>update(old=>({...old}))};
}
