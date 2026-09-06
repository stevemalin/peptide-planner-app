import React from 'react';
import Svg,{Path,Rect,Line} from 'react-native-svg';
export type NavGlyph='school'|'guide'|'tracker'|'plans'|'more';
export const navColors:Record<NavGlyph,string>={school:'#783ce0',guide:'#087feb',tracker:'#06aacc',plans:'#bd39bc',more:'#ac653c'};
export default function NavIcon({name,color,size=25}:{name:NavGlyph;color:string;size?:number}){
 return <Svg testID={'nav-icon-'+name} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
 {name==='school'&&<><Path d="M2 8 12 3 22 8 12 13Z"/><Path d="M6 10v6c4 3 8 3 12 0v-6M22 8v8"/><Line x1={22} y1={17} x2={22} y2={19}/></>}
 {name==='guide'&&<><Path d="M12 5C8 2 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-6-2-10 1Z"/><Path d="M12 5v15M5 8l4 1M15 9l4-1M5 12l4 1M15 13l4-1"/></>}
 {name==='tracker'&&<><Rect x={3} y={5} width={18} height={16} rx={3}/><Path d="M7 3v4M17 3v4M3 10h18M8 15l3 3 5-5"/></>}
 {name==='plans'&&<><Rect x={7} y={2} width={10} height={4} rx={1}/><Path d="M8 6v4l-2 3v6c0 2 2 3 6 3s6-1 6-3v-6l-2-3V6M6 14h12M9 17h6"/></>}
 {name==='more'&&<><Line x1={4} x2={20} y1={6} y2={6}/><Line x1={4} x2={20} y1={12} y2={12}/><Line x1={4} x2={20} y1={18} y2={18}/></>}
 </Svg>;
}
