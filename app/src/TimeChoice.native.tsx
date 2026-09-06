import React,{useState,useEffect}from'react';
import{Platform,Pressable,Text,View}from'react-native';
import DateTimePicker,{DateTimePickerAndroid}from'@react-native-community/datetimepicker';
import{timeLabel}from'./engine';import{u}from'./ui';
export default function TimeChoice({value,onChange,label,autoOpen=false}:{autoOpen?:boolean;value:string;onChange:(v:string)=>void;label:string}){
 const [open,setOpen]=useState(false);const date=new Date();const [h,m]=(value||'09:00').split(':').map(Number);date.setHours(h,m,0,0);
 const selected=(event:any,next?:Date)=>{setOpen(false);if(event.type==='set'&&next)onChange(String(next.getHours()).padStart(2,'0')+':'+String(next.getMinutes()).padStart(2,'0'));};
 const show=()=>Platform.OS==='android'?DateTimePickerAndroid.open({value:date,mode:'time',is24Hour:false,display:'spinner',onChange:selected}):setOpen(true);
 useEffect(()=>{if(autoOpen)show();},[]);
 return <View><Pressable accessibilityRole="button" accessibilityLabel={label} onPress={show} style={u.input}><Text style={u.heading}>{timeLabel(value||'09:00')}  ›</Text></Pressable>{open&&<DateTimePicker value={date} mode="time" is24Hour={false} onChange={selected}/>}</View>;
}
