import React,{useEffect,useMemo,useState} from 'react';
import {AppState,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {AuthController} from './auth-controller';
import {acknowledgeCloudConsent,authPort,cloudConfig} from './client';
import type {AccountState} from './contracts';
export function useBetaAccount(){
  const [state,setState]=useState<AccountState>({status:cloudConfig.status==='ready'?'loading':cloudConfig.status});
  const controller=useMemo(()=>cloudConfig.status==='ready'?new AuthController(authPort,setState):null,[]);
  useEffect(()=>{void controller?.start();const listener=AppState.addEventListener('change',value=>{if(value==='active')void controller?.refresh();});return()=>{controller?.stop();listener.remove();};},[controller]);
  return {state,controller};
}
export function BetaAccountPanel({account}:{account:ReturnType<typeof useBetaAccount>}){
  const [email,setEmail]=useState(''),[code,setCode]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[consent,setConsent]=useState(false),[nextRequest,setNextRequest]=useState(0);
  const {state,controller}=account;
  useEffect(()=>{setCode('');setConsent(false);setMessage('');},[state.userId]);
  const run=async(action:()=>Promise<string|void>)=>{if(busy)return;setBusy(true);try{setMessage((await action())||'');}catch{setMessage('The account action could not finish. Please retry.');}finally{setBusy(false);}};
  const button=(label:string,action:()=>void,disabled=false)=><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled:disabled||busy}} disabled={disabled||busy} onPress={action} style={[s.button,(disabled||busy)&&{opacity:.5}]}><Text style={s.buttonText}>{label}</Text></Pressable>;
  return <View style={s.card}><Text style={s.title}>Private beta account</Text><Text style={s.text}>Plans and history stay on this device. Signing in or out does not upload, replace or delete them. Keep your local backups.</Text>
    {state.status==='unconfigured'&&<Text style={s.text}>Cloud accounts are not configured. You can continue using the local planner.</Text>}
    {state.status==='invalid'&&<Text style={s.text}>Cloud account configuration needs administrator attention. Local data is unchanged.</Text>}
    {state.status==='loading'&&<Text accessibilityLiveRegion="polite" style={s.text}>Checking beta access…</Text>}
    {state.status==='eligible'?<><Text style={s.text}>Your beta invitation is active. Your local planner stays on this device unless you explicitly confirm an initial cloud copy.</Text><Pressable accessibilityRole="checkbox" accessibilityState={{checked:consent}} onPress={()=>setConsent(value=>!value)}><Text style={s.text}>{consent?'✓':'○'} I agree to store this account consent and any feedback I choose to submit privately for beta review. Optional peptide names are sent only when I select them on the feedback form. This is not end-to-end encrypted storage.</Text></Pressable>{button('Save account consent',()=>void run(async()=>{await acknowledgeCloudConsent();return 'Account consent saved.';}),!consent)}</>:null}
    {state.status==='denied'&&<Text style={s.text}>This session does not have active beta access. Contact the beta organizer or sign out.</Text>}
    {state.status==='error'&&<><Text style={s.text}>Beta access could not be checked. Please retry.</Text>{button('Retry account check',()=>void run(()=>controller!.refresh()))}</>}
    {state.status==='signedOut'&&<><Text style={s.text}>Use the email address invited by the beta organizer. No password is needed.</Text><TextInput accessibilityLabel="Invited email address" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" placeholder="Email address" style={s.input}/>{button('Send six-digit code',()=>void run(async()=>{if(Date.now()<nextRequest)return 'Wait 60 seconds before requesting another code.';const result=await controller!.request(email);setNextRequest(Date.now()+60000);return result;}))}<TextInput accessibilityLabel="Six-digit email code" value={code} onChangeText={setCode} maxLength={6} keyboardType="number-pad" autoComplete="one-time-code" placeholder="Six-digit code" style={s.input}/>{button('Verify code',()=>void run(()=>controller!.verify(email,code)))}</>}
    {controller&&state.status!=='signedOut'&&state.status!=='loading'&&button('Sign out',()=>void run(()=>controller.signOut()))}
    {!!message&&<Text accessibilityLiveRegion="polite" style={s.text}>{message}</Text>}
  </View>;
}
const s=StyleSheet.create({card:{width:'100%',maxWidth:680,alignSelf:'center',padding:16,gap:12,borderRadius:18,backgroundColor:'#fff',borderWidth:1,borderColor:'#DDE8F6'},title:{fontSize:22,fontWeight:'700',color:'#0E1C4A'},text:{fontSize:15,lineHeight:23,color:'#334466',flexShrink:1},input:{width:'100%',minHeight:48,borderWidth:1,borderColor:'#667597',borderRadius:10,padding:12,color:'#0E1C4A'},button:{padding:14,borderRadius:12,backgroundColor:'#0E1C4A'},buttonText:{color:'#fff',fontSize:15,fontWeight:'700',textAlign:'center'}});
