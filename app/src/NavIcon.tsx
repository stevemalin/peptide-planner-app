import React from 'react';
import Svg,{Defs,G,LinearGradient,Line,Path,Rect,Stop} from 'react-native-svg';

export type NavGlyph='school'|'guide'|'tracker'|'plans'|'more';
export const navColors:Record<NavGlyph,string>={school:'#783ce0',guide:'#087feb',tracker:'#06aacc',plans:'#bd39bc',more:'#ac653c'};

/**
 * Approved EZPep Planner monogram.
 *
 * The beveled cyan-to-violet letterforms and crossing double-helix echo the
 * dimensional AURAPEP family identity while remaining legible at app-header
 * and launcher-icon sizes.
 */
export function EZPMark({size=40}:{size?:number}){
 return <Svg accessibilityLabel="EZPep Planner" width={size} height={size} viewBox="0 0 96 96">
  <Defs>
   <LinearGradient id="ezpFace" x1="0" y1="0" x2="1" y2="1">
    <Stop offset="0" stopColor="#67E8FF"/><Stop offset=".38" stopColor="#178DEB"/><Stop offset=".72" stopColor="#5B35D5"/><Stop offset="1" stopColor="#B12BEB"/>
   </LinearGradient>
   <LinearGradient id="ezpEdge" x1="0" y1="1" x2="1" y2="0">
    <Stop offset="0" stopColor="#071B63"/><Stop offset=".55" stopColor="#4932C8"/><Stop offset="1" stopColor="#E9A8FF"/>
   </LinearGradient>
   <LinearGradient id="ezpHelix" x1="0" y1="0" x2="1" y2="1">
    <Stop offset="0" stopColor="#92F4FF"/><Stop offset=".5" stopColor="#25B6F2"/><Stop offset="1" stopColor="#7B25E7"/>
   </LinearGradient>
  </Defs>
  <Rect x="3" y="3" width="90" height="90" rx="24" fill="#F1FAFF"/>
  <G opacity=".24" transform="translate(2 3)">
   <Path d="M18 22h27v10H29v9h14v10H29v12h17v11H18zM48 22h30L61 63h18v11H45l18-41H48z" fill="#061747"/>
   <Path d="M67 22h11c13 0 18 7 18 17S89 56 77 56h-3v18H62V33z" fill="#061747"/>
  </G>
  <Path d="M15 19h29v10H27v10h15v10H27v12h18v11H15zM47 19h31L60 61h19v11H43l19-42H47z" fill="url(#ezpFace)" stroke="url(#ezpEdge)" strokeWidth="1.4"/>
  <Path d="M66 19h12c12 0 17 7 17 17 0 11-7 18-18 18h-3v18H62V30h12v14h3c4 0 6-3 6-8 0-4-2-7-6-7H66z" fill="url(#ezpFace)" stroke="url(#ezpEdge)" strokeWidth="1.4"/>
  <Path d="M15 68C32 54 33 31 48 21c9-6 21-5 33 2" fill="none" stroke="url(#ezpHelix)" strokeWidth="5.5" strokeLinecap="round"/>
  <Path d="M19 24c14 6 21 18 26 31 4 11 13 17 29 19" fill="none" stroke="url(#ezpEdge)" strokeWidth="4.5" strokeLinecap="round"/>
  <G stroke="#D9F8FF" strokeWidth="2" opacity=".92">
   <Line x1="26" y1="30" x2="38" y2="35"/><Line x1="31" y1="43" x2="44" y2="43"/><Line x1="34" y1="56" x2="49" y2="52"/><Line x1="44" y1="66" x2="57" y2="60"/>
  </G>
  <Path d="M20 18h22M51 18h23M69 18h8" stroke="#DFFFFF" strokeWidth="2" strokeLinecap="round" opacity=".9"/>
 </Svg>;
}

export default function NavIcon({name,color,size=25}:{name:NavGlyph;color:string;size?:number}){
 return <Svg testID={'nav-icon-'+name} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
 {name==='school'&&<><Path d="M2 8 12 3 22 8 12 13Z"/><Path d="M6 10v6c4 3 8 3 12 0v-6M22 8v8"/><Line x1={22} y1={17} x2={22} y2={19}/></>}
 {name==='guide'&&<><Path d="M12 5C8 2 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-6-2-10 1Z"/><Path d="M12 5v15M5 8l4 1M15 9l4-1M5 12l4 1M15 13l4-1"/></>}
 {name==='tracker'&&<><Rect x={3} y={5} width={18} height={16} rx={3}/><Path d="M7 3v4M17 3v4M3 10h18M8 15l3 3 5-5"/></>}
 {name==='plans'&&<><Rect x={7} y={2} width={10} height={4} rx={1}/><Path d="M8 6v4l-2 3v6c0 2 2 3 6 3s6-1 6-3v-6l-2-3V6M6 14h12M9 17h6"/></>}
 {name==='more'&&<><Line x1={4} x2={20} y1={6} y2={6}/><Line x1={4} x2={20} y1={12} y2={12}/><Line x1={4} x2={20} y1={18} y2={18}/></>}
 </Svg>;
}
