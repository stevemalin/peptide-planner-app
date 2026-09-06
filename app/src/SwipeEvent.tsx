import React,{useRef,useState} from 'react';
import {View,PanResponder,Text} from 'react-native';
import {Button,u} from './ui';
// A horizontal swipe reveals an action; scrolling never records an event.
export default function SwipeEvent({children,enabled,onComplete,disabled,name}:{children:React.ReactNode;enabled:boolean;onComplete:()=>void;disabled:boolean;name:string}){
 const [revealed,setRevealed]=useState(false);
 const current=useRef(enabled);current.current=enabled;
 const responder=useRef(PanResponder.create({onMoveShouldSetPanResponder:(_,g)=>current.current&&g.dx < -20&&Math.abs(g.dx)>Math.abs(g.dy)*2,onPanResponderRelease:(_,g)=>{if(current.current&&g.dx < -65&&Math.abs(g.dx)>Math.abs(g.dy)*2)setRevealed(true);}})).current;
 return <View {...responder.panHandlers}>{children}{enabled&&revealed&&<View style={{padding:12,backgroundColor:'#eaf8f1',borderRadius:14}}><Text style={u.small}>Mark {name} taken?</Text><Button label={'Confirm taken '+name} disabled={disabled} onPress={()=>{onComplete();setRevealed(false);}}/><Button label="Cancel swipe" secondary onPress={()=>setRevealed(false)}/></View>}</View>;
}
