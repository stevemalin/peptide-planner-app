import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient} from '@supabase/supabase-js';
import {validateCloudConfig} from './config';
import {AUTH_STORAGE_KEY,CONSENT_VERSION,feedbackRow,type AuthPort,type FeedbackInput} from './contracts';
import type {Database} from './database';
export const cloudConfig = validateCloudConfig(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
const client = cloudConfig.status === 'ready' ? createClient<Database>(cloudConfig.url,cloudConfig.key,{auth:{storage:AsyncStorage,storageKey:AUTH_STORAGE_KEY,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}) : null;
function configured() { if (!client) throw new Error('Cloud accounts are unavailable.'); return client; }
export const authPort: AuthPort = {
  async restore(){const {data,error}=await configured().auth.getSession();if(error)throw error;return data.session?{userId:data.session.user.id}:null;},
  async requestCode(email){const {error}=await configured().auth.signInWithOtp({email,options:{shouldCreateUser:false}});if(error)throw error;},
  async verifyCode(email,token){const {data,error}=await configured().auth.verifyOtp({email,token,type:'email'});if(error)throw error;return data.session?{userId:data.session.user.id}:null;},
  async eligible(){const {data,error}=await configured().rpc('accept_beta_invite');if(error)throw error;return data===true;},
  async signOut(){const {error}=await configured().auth.signOut({scope:'local'});if(error)throw error;},
  subscribe(listener){const {data}=configured().auth.onAuthStateChange((_event,session)=>{setTimeout(()=>listener(session?{userId:session.user.id}:null),0);});return()=>data.subscription.unsubscribe();},
};
async function eligibleUser() {
  const api=configured();
  const {data:user,error:userError}=await api.auth.getUser();
  if(userError||!user.user)throw new Error('Sign in with an active beta invitation.');
  const {data,error}=await api.rpc('beta_access');
  if(error||data!==true)throw new Error('An active beta invitation is required.');
  return user.user.id;
}
export async function acknowledgeCloudConsent() {
  const userId=await eligibleUser();
  const {data,error:readError}=await configured().from('consent_records').select('id').eq('user_id',userId).eq('consent_version',CONSENT_VERSION).maybeSingle();
  if(readError)throw new Error('Consent could not be checked. Please retry.');
  if(data)return;
  const {error}=await configured().from('consent_records').insert({user_id:userId,consent_version:CONSENT_VERSION});
  if(error&&error.code!=='23505')throw new Error('Consent could not be saved. Please retry.');
}
export async function submitBetaFeedback(input:FeedbackInput) {
  const userId=await eligibleUser();
  const {error}=await configured().from('beta_feedback').insert(feedbackRow(userId,input));
  if(error)throw new Error('Feedback was not submitted. Confirm account consent and your invitation, then retry. Your report remains on this device.');
}
// Read-only boundary for a later explicit migration flow. Never invoked during auth or startup.
export async function readCloudPlannerSnapshot() {
  const userId=await eligibleUser();
  const {data,error}=await configured().from('planner_state').select('*').eq('user_id',userId).maybeSingle();
  if(error)throw new Error('Cloud snapshot could not be read. Local data is unchanged.');
  return data;
}
