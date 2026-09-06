import type{SavedPlan,Store}from'./engine';
import{getActivePlans,withActivePlans}from'./multiplan-v04';

export const STORAGE_VERSION_V04=4;
export type StoreV04=Store&{version:3|4;activePlans?:SavedPlan[]};

// The 0.4 review branch keeps the v0.3.3 shape readable. Migration is additive:
// the old `active` pointer remains a compatibility alias for the first active plan.
export function normalizeStoreV04(store:Store):StoreV04{
 const plans=getActivePlans(store);
 return {...withActivePlans(store,plans),version:4,activePlans:plans} as StoreV04;
}

export function serializeStoreV04(store:StoreV04){
 const plans=getActivePlans(store);
 return JSON.stringify({...store,version:4,activePlans:plans,active:plans[0]??null});
}

export function downgradeCompatibleV03(store:StoreV04):Store{
 const plans=getActivePlans(store);
 return {...store,version:3,active:plans[0]??null} as Store;
}
