import React from 'react';
import {View,Text} from 'react-native';
import Svg,{Rect,Line,Text as SvgText} from 'react-native-svg';
import {syringeScale} from './quantities';
import {u} from './ui';
export default function MiniSyringe({units,capacity:override}:{units:number;capacity:30|50|100|null}){
 const {capacity,x,exceeds,major}=syringeScale(units,override);
 return <View accessible accessibilityLabel={'U-100 draw '+Number(units.toFixed(3))+' units; '+capacity+' unit syringe'+(exceeds?'; exceeds capacity':'')}><Svg width="100%" height={65} viewBox="0 0 360 65">
 <Line x1={8} y1={26} x2={30} y2={26} stroke="#61728f"/><Rect x={30} y={12} width={270} height={28} rx={4} fill="#f2f8fc" stroke="#8d9fb2"/><Rect x={31} y={13} width={Math.max(0,x-31)} height={26} fill="#80d9fa"/>
 {Array.from({length:capacity/major+1},(_,i)=>i*major).map(n=><React.Fragment key={n}><Line x1={30+n/capacity*270} x2={30+n/capacity*270} y1={12} y2={21} stroke="#405573"/><SvgText x={30+n/capacity*270} y={57} textAnchor="middle" fontSize={11} fill="#405573">{n}</SvgText></React.Fragment>)}
 <Line x1={x} x2={330} y1={29} y2={29} stroke="#8d9fb2" strokeWidth={4}/><Line x1={330} x2={330} y1={16} y2={40} stroke="#8d9fb2" strokeWidth={5}/><Line testID="mini-syringe-mark" x1={x} x2={x} y1={7} y2={43} stroke={exceeds?'#bd4352':'#007ba6'} strokeWidth={3}/></Svg><Text style={[u.small,{marginTop:0}]}>U-100 · draw {Number(units.toFixed(3))} units{exceeds?' · exceeds '+capacity+' unit capacity; marker capped':''}</Text></View>;
}
