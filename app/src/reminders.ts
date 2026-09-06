import type { SavedPlan } from './engine';
export type ReminderReport = {message:string;count:number;through?:string;enabled:boolean};
export async function enableReminders():Promise<boolean>{return false;}
export async function reconcileReminders(plan:SavedPlan|null):Promise<ReminderReport>{return {message:plan?.reminderEnabled?'Local reminders run on Android. Browser testing does not deliver notifications.':'Reminders are off.',count:0,enabled:false};}
export async function testReminder():Promise<void>{throw Error('Test notifications on the Android phone.');}
export function listenForReminder(callback:()=>void){return ()=>{};}
