export type AmountUnit='mg'|'mcg';
export type Quantity={value:number;unit:AmountUnit};
export function toMg(amount:Quantity){if(!['mg','mcg'].includes(amount.unit)||!Number.isFinite(amount.value))throw Error('Choose a valid amount and unit.');return amount.unit==='mcg'?amount.value/1000:amount.value;}
export function quantityFromMg(amountMg:string|number|undefined,unit:AmountUnit='mg'):Quantity|null{
 if(amountMg==null||String(amountMg).trim()==='')return null;const mg=Number(amountMg);if(!Number.isFinite(mg)||mg<=0)return null;
 return {value:Number((mg*(unit==='mcg'?1000:1)).toPrecision(12)),unit};
}
export const quantityLabel=(q:Quantity|null)=>q?Number(q.value.toPrecision(12))+' '+q.unit:'Choose amount';
export function syringeScale(units:number|null,override:30|50|100|null=null){
 const valid=units!==null&&Number.isFinite(units)&&units>=0;
 const capacity=override??(valid&&units!<=30?30:valid&&units!<=50?50:100);
 const clamped=valid?Math.min(capacity,Math.max(0,units!)):0;
 return {capacity,x:30+clamped/capacity*270,exceeds:valid&&units!>capacity,minor:capacity===100?2:1,major:capacity===30?5:10};
}
