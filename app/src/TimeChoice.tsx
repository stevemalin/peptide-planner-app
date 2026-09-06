import React,{useState}from'react';import{View,Pressable,Text}from'react-native';import{timeLabel}from'./engine';import{u}from'./ui';
export default function TimeChoice({value,onChange,label,autoOpen=false}:{autoOpen?:boolean;value:string;onChange:(v:string)=>void;label:string}){
 const [open,setOpen]=useState(autoOpen);const [h,m]=(value||'09:00').split(':').map(Number);
 const change=(hour:number,minute:number,pm:boolean)=>onChange(String(hour%12+(pm?12:0)).padStart(2,'0')+':'+String(minute).padStart(2,'0'));
 return <View><Pressable accessibilityRole="button" accessibilityLabel={label} onPress={()=>setOpen(!open)} style={u.input}><Text style={u.heading}>{timeLabel(value||'09:00')} ›</Text></Pressable>{open&&<View style={u.row}>
 {React.createElement('select',{'aria-label':label+' hour',value:h%12||12,onChange:(e:any)=>change(+e.target.value,m,h>=12),style:{fontSize:18,padding:10}},Array.from({length:12},(_,i)=>React.createElement('option',{key:i,value:i+1},i+1)))}
 {React.createElement('select',{'aria-label':label+' minute',value:m,onChange:(e:any)=>change(h%12||12,+e.target.value,h>=12),style:{fontSize:18,padding:10}},Array.from({length:60},(_,i)=>React.createElement('option',{key:i,value:i},String(i).padStart(2,'0'))))}
 {React.createElement('select',{'aria-label':label+' period',value:h>=12?'PM':'AM',onChange:(e:any)=>change(h%12||12,m,e.target.value==='PM'),style:{fontSize:18,padding:10}},['AM','PM'].map(v=>React.createElement('option',{key:v},v)))}
 </View>}</View>;
}
