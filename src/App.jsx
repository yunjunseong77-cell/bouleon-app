import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────
const C = {
  bg:"#04000f", card:"#0d0d1f", card2:"#121228",
  glass:"rgba(255,255,255,0.04)", glassMid:"rgba(255,255,255,0.08)",
  border:"rgba(255,255,255,0.07)", borderHi:"rgba(124,106,247,0.5)",
  accent:"#7c6af7", accentDim:"rgba(124,106,247,0.15)",
  cyan:"#22d3ee", cyanDim:"rgba(34,211,238,0.12)",
  rose:"#f43f5e", roseDim:"rgba(244,63,94,0.12)",
  amber:"#f59e0b", amberDim:"rgba(245,158,11,0.12)",
  green:"#10b981", greenDim:"rgba(16,185,129,0.12)",
  purple:"#a855f7", pink:"#ec4899",
  text:"#f1f5f9", mid:"#94a3b8", dim:"#475569",
  grad:"linear-gradient(135deg,#7c6af7,#22d3ee)",
  gradWarm:"linear-gradient(135deg,#f43f5e,#f59e0b)",
  gradPurple:"linear-gradient(135deg,#a855f7,#7c6af7)",
  gradGreen:"linear-gradient(135deg,#10b981,#22d3ee)",
};
const glow = (c,s=20) => `0 0 ${s}px ${c}`;
const focusIn  = e => { e.target.style.borderColor=C.accent; e.target.style.boxShadow=glow("rgba(124,106,247,0.3)",14); };
const focusOut = e => { e.target.style.borderColor=C.border; e.target.style.boxShadow="none"; };

// 글로벌 애니메이션 스타일
const GLOBAL_CSS = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  @keyframes bounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
  @keyframes ripple { 0% { transform:scale(0); opacity:0.6; } 100% { transform:scale(2.5); opacity:0; } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes keyPop { 0% { transform:scale(0.5); opacity:0; } 60% { transform:scale(1.15); } 100% { transform:scale(1); opacity:1; } }
  .fade-up { animation: fadeUp 0.35s ease forwards; }
  .scale-in { animation: scaleIn 0.25s ease forwards; }
  .key-pop { animation: keyPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
  * { -webkit-tap-highlight-color: transparent; }
  ::-webkit-scrollbar { display:none; }
`;

const S = {
  app:{ minHeight:"100vh", background:C.bg, color:C.text,
    fontFamily:"'Pretendard Variable','Pretendard',system-ui,sans-serif", overflowX:"hidden" },
  wrap:{ maxWidth:520, margin:"0 auto", padding:"0 16px", position:"relative", zIndex:1 },
  card:{ background:C.card, border:`1px solid ${C.border}`, borderRadius:24, padding:"18px",
    transition:"all 0.2s ease" },
  inp:{ width:"100%", background:C.card2, border:`1px solid ${C.border}`,
    borderRadius:14, padding:"13px 16px", color:C.text, fontSize:14,
    outline:"none", boxSizing:"border-box", transition:"all .2s" },
  bigBtn:(on=true,col=null)=>({
    width:"100%", padding:"16px", borderRadius:16, border:"none",
    background:col||(on?C.grad:C.glassMid), color:on?"#fff":C.mid,
    borderWidth: on&&!col?"0":"1px", borderStyle:"solid", borderColor:C.border,
    fontSize:15, fontWeight:700, cursor:"pointer",
    boxShadow:on?`0 8px 32px rgba(124,106,247,0.4)`:"none",
    transition:"all 0.2s ease",
    letterSpacing:"0.3px",
  }),
  chip:(on,col=C.accent)=>({
    padding:"8px 14px", borderRadius:20,
    border:`1px solid ${on?col:C.border}`,
    background:on?`${col}22`:C.glass,
    color:on?"#fff":C.mid,
    fontSize:13, fontWeight:600, cursor:"pointer",
    transition:"all .18s cubic-bezier(0.175,0.885,0.32,1.275)",
    whiteSpace:"nowrap",
    transform:"scale(1)",
  }),
  tag:(col)=>({
    display:"inline-flex", alignItems:"center", gap:3,
    padding:"2px 8px", borderRadius:12, fontSize:11, fontWeight:600,
    background:`${col}20`, color:col, border:`1px solid ${col}35`, flexShrink:0,
  }),
};

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────
const SITUATIONS = [
  { id:"friend",  emoji:"👫", label:"친구들이랑", color:C.accent, keyAdj:0,
    roles:["분위기 풀기","안정적인 곡","오늘의 필살기","쉬어가는 곡","마무리 곡"] },
  { id:"date",    emoji:"💕", label:"썸/데이트",  color:C.rose,   keyAdj:-1,
    roles:["부담 없는 시작","감성 곡","필살기 곡","상대가 아는 곡","분위기 유지"] },
  { id:"work",    emoji:"🥂", label:"회식",       color:C.amber,  keyAdj:-1,
    roles:["모두 아는 곡","짧고 안전한 곡","분위기 띄우기","무리 안 하기","마무리 곡"] },
  { id:"solo",    emoji:"🎤", label:"혼자 연습",  color:C.cyan,   keyAdj:+1,
    roles:["워밍업 곡","연습 목표곡","약점 보완 곡","자신감 충전","도전 곡"] },
  { id:"wedding", emoji:"💍", label:"축가",       color:C.green,  keyAdj:-2,
    roles:["오프닝 곡","축가 메인","앙코르 대비"] },
];
const CONDITIONS = [
  { id:"great",  emoji:"🔥", label:"목 상태 최고",   keyAdj:+1 },
  { id:"good",   emoji:"😊", label:"컨디션 좋음",     keyAdj:0  },
  { id:"normal", emoji:"😐", label:"보통",             keyAdj:0  },
  { id:"bad",    emoji:"😤", label:"목이 좀 안좋음",  keyAdj:-1 },
  { id:"sick",   emoji:"🤒", label:"오늘 최악",       keyAdj:-2 },
];
const REPO_TAGS = [
  { id:"safe",   emoji:"🛡",  label:"안전곡",    color:C.green  },
  { id:"killer", emoji:"⚡",  label:"필살기",    color:C.amber  },
  { id:"vibe",   emoji:"🎉",  label:"분위기UP",  color:C.accent },
  { id:"ballad", emoji:"🫶",  label:"감성곡",    color:C.rose   },
  { id:"date",   emoji:"💕",  label:"썸/데이트", color:"#ec4899"},
  { id:"work",   emoji:"🥂",  label:"회식용",    color:C.amber  },
  { id:"prac",   emoji:"📖",  label:"연습중",    color:C.mid    },
  { id:"high",   emoji:"⚠️",  label:"고음주의",  color:C.rose   },
  { id:"opener", emoji:"🎵",  label:"첫 곡",     color:C.cyan   },
  { id:"closer", emoji:"🌙",  label:"마무리곡",  color:"#818cf8"},
];
const EVAL_OPTIONS = [
  { id:"great",  emoji:"😄", label:"편하게 불렀어요",   color:C.green  },
  { id:"high",   emoji:"😅", label:"고음이 어려웠어요", color:C.amber  },
  { id:"breath", emoji:"💨", label:"호흡이 부족했어요", color:C.amber  },
  { id:"vibe",   emoji:"🎉", label:"분위기가 좋았어요", color:C.accent },
  { id:"again",  emoji:"🔄", label:"다시 부르고 싶어요", color:C.cyan  },
  { id:"skip",   emoji:"🚫", label:"다시 안 부를래요",  color:C.rose   },
];
const VOICE_TYPES = [
  { id:"male_low",   label:"남성 저음",  emoji:"🎸", desc:"낮고 묵직한 목소리" },
  { id:"male_mid",   label:"남성 중음",  emoji:"🎤", desc:"평균적인 남성 음역" },
  { id:"male_high",  label:"남성 고음",  emoji:"🚀", desc:"고음이 잘 나오는 남성" },
  { id:"female_low", label:"여성 저음",  emoji:"🎵", desc:"낮고 허스키한 목소리" },
  { id:"female_mid", label:"여성 중음",  emoji:"🌸", desc:"평균적인 여성 음역" },
  { id:"female_high",label:"여성 고음",  emoji:"⭐", desc:"고음이 잘 나오는 여성" },
];

// ─────────────────────────────────────────────────────────────────
// LOCAL STORAGE
// ─────────────────────────────────────────────────────────────────
const ls = {
  get:(k,fb)=>{ try{ return JSON.parse(localStorage.getItem(k))??fb; }catch{ return fb; } },
  set:(k,v)=>localStorage.setItem(k,JSON.stringify(v)),
  del:(k)=>localStorage.removeItem(k),
};

// ─────────────────────────────────────────────────────────────────
// SONGS DB
// ─────────────────────────────────────────────────────────────────
let SONGS_DB = null;
const loadSongsDB = async () => {
  if (SONGS_DB) return SONGS_DB;
  try { const res = await fetch("/songs_db.json"); SONGS_DB = await res.json(); }
  catch(e) { SONGS_DB = {}; }
  return SONGS_DB;
};
const findSongData = async (title) => {
  const db = await loadSongsDB();
  if (!title || !db) return null;
  const t = title.replace(/\s+/g,"").toLowerCase();
  return Object.values(db).find(s =>
    s.title.replace(/\s+/g,"").toLowerCase().includes(t) ||
    t.includes(s.title.replace(/\s+/g,"").toLowerCase())
  ) || null;
};

// ─────────────────────────────────────────────────────────────────
// TJ DB 검색
// ─────────────────────────────────────────────────────────────────
let TJ_DB = null;
const loadDB = async () => {
  if (TJ_DB) return TJ_DB;
  try { const r = await fetch("/tj_namu.json"); TJ_DB = await r.json(); }
  catch { TJ_DB = []; }
  return TJ_DB;
};
const searchDB = async (query) => {
  const db = await loadDB();
  if (!query || !db.length) return [];
  const q = query.toLowerCase().trim();
  return db.filter(s =>
    s.title?.toLowerCase().includes(q) ||
    s.artist?.toLowerCase().includes(q) ||
    s.tj === q
  ).slice(0, 20).map(s => ({...s, id:"tj_"+s.tj}));
};

// ─────────────────────────────────────────────────────────────────
// AI 호출
// ─────────────────────────────────────────────────────────────────
const callAI = async (prompt) => {
  const res = await fetch("https://bouleon-api.vercel.app/api/analyze", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "AI 오류");
  return data.text;
};
const parseJSON = t => {
  try { return JSON.parse(t.replace(/```json|```/g,"").trim()); }
  catch { return null; }
};

// ─────────────────────────────────────────────────────────────────
// 개인 학습 엔진
// ─────────────────────────────────────────────────────────────────
const getPersonalAdj = (uid) => {
  const evals = ls.get(`bl_eval_${uid}`, []);
  if (evals.length < 3) return 0;
  // 추천키와 실제 편한 키의 차이 평균
  const diffs = evals
    .filter(e => e.actualKey !== null && e.actualKey !== undefined && e.recommendedKey !== null)
    .map(e => e.actualKey - e.recommendedKey);
  if (!diffs.length) return 0;
  const avg = diffs.reduce((a,b)=>a+b,0) / diffs.length;
  return Math.round(avg); // 정수로 반올림
};

// ─────────────────────────────────────────────────────────────────
// 키 계산 엔진 (코드가 직접 결정)
// ─────────────────────────────────────────────────────────────────
const VOICE_COMFORTABLE = {
  male_low:62, male_mid:69, male_high:71,
  female_low:67, female_mid:72, female_high:76,
};
const calcKey = async ({ voiceType, targetSong, situation, condition, history, uid }) => {
  const songData = await findSongData(targetSong?.title);
  const breakdown = [];
  let total = 0;

  // 1. 음역 기반
  if (songData && voiceType) {
    let base;
    if (songData.safeKeyRange?.[voiceType]?.recommended !== undefined) {
      base = songData.safeKeyRange[voiceType].recommended;
    } else {
      const cm = VOICE_COMFORTABLE[voiceType] || 69;
      base = cm - songData.maxNote;
      if (voiceType.includes("male")   && songData.gender==="female") base = Math.min(base,-3);
      if (voiceType.includes("female") && songData.gender==="male")   base = Math.max(base, 3);
    }
    base = Math.max(-7, Math.min(7, base));
    total += base;
    breakdown.push({ label:"음역 기반", value:base });
  } else {
    breakdown.push({ label:"음역 기반", value:0, note:"DB 미수록" });
  }

  // 2. 상황 보정
  const sit = SITUATIONS.find(s=>s.id===situation);
  if (sit?.keyAdj) {
    total += sit.keyAdj;
    breakdown.push({ label:`상황(${sit.label})`, value:sit.keyAdj });
  }

  // 3. 컨디션 보정
  const cond = CONDITIONS.find(c=>c.id===condition);
  if (cond?.keyAdj) {
    total += cond.keyAdj;
    breakdown.push({ label:`컨디션(${cond.label})`, value:cond.keyAdj });
  }

  // 4. 이전 피드백 보정
  const prev = history?.find(h=>h.target?.title===targetSong?.title&&h.rating);
  if (prev?.rating?.includes("고음이 어려웠어요")) {
    total -= 2; breakdown.push({ label:"이전 피드백", value:-2 });
  } else if (prev?.rating?.includes("호흡이 부족했어요")) {
    total -= 1; breakdown.push({ label:"이전 피드백", value:-1 });
  }

  // 5. 개인 학습 보정
  const personalAdj = getPersonalAdj(uid);
  if (personalAdj !== 0) {
    total += personalAdj;
    breakdown.push({ label:"내 학습 보정", value:personalAdj });
  }

  total = Math.max(-7, Math.min(7, total));
  const keyStr = total===0?"원키":total>0?`+${total}키`:`${total}키`;
  return { keyStr, keyNum:total, breakdown, songData };
};

// ─────────────────────────────────────────────────────────────────
// ANIMATED COMPONENTS
// ─────────────────────────────────────────────────────────────────
function FadeUp({ children, delay=0, style={} }) {
  return (
    <div style={{
      animation:`fadeUp 0.35s ease ${delay}ms both`,
      ...style
    }}>
      {children}
    </div>
  );
}

function PressButton({ onClick, style, children, disabled }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={()=>setPressed(true)}
      onMouseUp={()=>setPressed(false)}
      onMouseLeave={()=>setPressed(false)}
      onTouchStart={()=>setPressed(true)}
      onTouchEnd={()=>setPressed(false)}
      style={{
        ...style,
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "all 0.15s cubic-bezier(0.175,0.885,0.32,1.275)",
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// BACKGROUND
// ─────────────────────────────────────────────────────────────────
function BgBlobs() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      <div style={{position:"absolute",left:"-20%",top:"-15%",width:"70vw",height:"70vw",
        borderRadius:"50%",filter:"blur(60px)",
        background:"radial-gradient(circle,rgba(124,106,247,0.15) 0%,transparent 70%)",
        animation:"pulse 8s ease-in-out infinite"}}/>
      <div style={{position:"absolute",right:"-10%",top:"30%",width:"50vw",height:"50vw",
        borderRadius:"50%",filter:"blur(60px)",
        background:"radial-gradient(circle,rgba(34,211,238,0.08) 0%,transparent 70%)",
        animation:"pulse 10s ease-in-out infinite 2s"}}/>
      <div style={{position:"absolute",left:"10%",bottom:"10%",width:"40vw",height:"40vw",
        borderRadius:"50%",filter:"blur(60px)",
        background:"radial-gradient(circle,rgba(244,63,94,0.06) 0%,transparent 70%)",
        animation:"pulse 7s ease-in-out infinite 4s"}}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SONG SEARCH INPUT
// ─────────────────────────────────────────────────────────────────
const SongSearchInput = ({ label, value, onChange, placeholder }) => {
  const [q, setQ]       = useState("");
  const [results, setR] = useState([]);
  const [open, setOpen] = useState(false);
  const [status, setSt] = useState("idle");
  const ref   = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    setQ(value ? `${value.title} - ${value.artist}` : "");
  }, [value?.title, value?.artist]);

  useEffect(() => {
    const fn = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",fn);
    return () => document.removeEventListener("mousedown",fn);
  }, []);

  const search = useCallback((query) => {
    setQ(query);
    clearTimeout(timer.current);
    if (!query.trim()) { setR([]); setOpen(false); setSt("idle"); return; }
    setSt("searching"); setOpen(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await searchDB(query);
        setR(res); setSt(res.length > 0 ? "done" : "empty");
      } catch { setSt("error"); }
    }, 200);
  }, []);

  const pick = s => { onChange(s); setOpen(false); setR([]); setSt("idle"); };

  return (
    <div ref={ref} style={{position:"relative",marginBottom:12}}>
      {label && <label style={{fontSize:12,color:C.mid,marginBottom:6,display:"block",fontWeight:600}}>{label}</label>}
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",
          fontSize:14,zIndex:1,color:value?C.green:status==="searching"?C.accent:C.dim,
          transition:"color 0.2s"}}>
          {value?"✓":status==="searching"?"⟳":"🔍"}
        </span>
        <input style={{...S.inp,paddingLeft:42,
          borderColor:value?`${C.green}66`:C.border,
          boxShadow:value?`0 0 0 3px ${C.green}15`:"none"}}
          placeholder={placeholder||"곡명 또는 가수명 검색..."}
          value={q}
          onChange={e=>search(e.target.value)}
          onFocus={e=>{focusIn(e);if(results.length>0)setOpen(true);}}
          onBlur={focusOut}/>
      </div>
      {open && (
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,zIndex:300,
          background:`${C.card2}f8`,backdropFilter:"blur(20px)",
          border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden",
          boxShadow:`0 20px 60px rgba(0,0,0,0.8)`,
          animation:"slideDown 0.15s ease forwards"}}>
          {status==="searching" && (
            <div style={{padding:14,textAlign:"center",fontSize:12,color:C.mid}}>
              <span style={{display:"inline-block",animation:"spin 0.8s linear infinite"}}>⟳</span>
              {" "}48,225곡 검색 중...
            </div>
          )}
          {status==="empty" && <div style={{padding:14,textAlign:"center",fontSize:12,color:C.dim}}>검색 결과가 없어요</div>}
          {status==="done" && results.map((s,i)=>(
            <div key={s.id||i} onClick={()=>pick(s)}
              style={{padding:"11px 16px",cursor:"pointer",
                borderBottom:i<results.length-1?`1px solid ${C.border}`:"none",
                transition:"background 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.glassMid}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</div>
                  <div style={{fontSize:11,color:C.mid,marginTop:1}}>{s.artist}</div>
                </div>
                <div style={{fontSize:11,color:C.accent,fontWeight:700,
                  background:C.accentDim,padding:"3px 8px",borderRadius:8,marginLeft:10,flexShrink:0}}>
                  TJ {s.tj}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, onRegister }) {
  const [email,setEmail]=useState(""); const [pw,setPw]=useState("");
  const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);

  const doLogin = () => {
    setErr(""); if(!email||!pw){setErr("이메일과 비밀번호를 입력해주세요.");return;}
    setLoading(true);
    setTimeout(()=>{
      const users=ls.get("bl_users",[]);
      const u=users.find(x=>x.email===email&&x.pw===pw);
      if(u){ls.set("bl_sess",u);onLogin(u);}
      else{setErr("이메일 또는 비밀번호가 올바르지 않습니다.");setLoading(false);}
    },500);
  };
  const social=(name)=>{
    const u={email:`${name}@bouleon.ai`,name:`${name==="kakao"?"카카오":name==="google"?"Google":"Apple"} 사용자`};
    const users=ls.get("bl_users",[]);
    if(!users.find(x=>x.email===u.email)){users.push(u);ls.set("bl_users",users);}
    ls.set("bl_sess",u);onLogin(u);
  };

  return (
    <div style={{position:"relative",zIndex:1}}>
      <style>{GLOBAL_CSS}</style>
      <BgBlobs/>
      <div style={{...S.wrap,paddingTop:80,paddingBottom:48}}>
        <FadeUp>
          <div style={{textAlign:"center",marginBottom:48}}>
            <div style={{width:72,height:72,borderRadius:22,background:C.grad,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:32,margin:"0 auto 16px",
              boxShadow:`0 0 40px rgba(124,106,247,0.5),0 8px 32px rgba(0,0,0,0.3)`}}>🎤</div>
            <div style={{fontWeight:900,fontSize:28,letterSpacing:"-1px",
              background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              부를레옹
            </div>
            <div style={{fontSize:13,color:C.dim,marginTop:4,letterSpacing:"1px"}}>AI 노래방 코치</div>
          </div>
        </FadeUp>

        <FadeUp delay={100}>
          <div style={{...S.card,backdropFilter:"blur(20px)",background:`${C.card}cc`}}>
            <h2 style={{margin:"0 0 20px",fontSize:18,fontWeight:800}}>로그인</h2>
            {[{label:"이메일",val:email,set:setEmail,type:"email",ph:"hello@bouleon.ai"},
              {label:"비밀번호",val:pw,set:setPw,type:"password",ph:"••••••••"}
            ].map(f=>(
              <div key={f.label} style={{marginBottom:12}}>
                <label style={{fontSize:12,color:C.mid,marginBottom:6,display:"block",fontWeight:600}}>{f.label}</label>
                <input style={S.inp} type={f.type} placeholder={f.ph}
                  value={f.val} onChange={e=>f.set(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&doLogin()}
                  onFocus={focusIn} onBlur={focusOut}/>
              </div>
            ))}
            {err&&<p style={{color:C.rose,fontSize:12,margin:"8px 0 0",
              padding:"8px 12px",background:C.roseDim,borderRadius:10}}>{err}</p>}
            <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:20}}>
              <PressButton style={{...S.bigBtn(true),opacity:loading?0.7:1}} onClick={doLogin} disabled={loading}>
                {loading?"확인 중...":"로그인 →"}
              </PressButton>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1,height:"1px",background:C.border}}/>
                <span style={{fontSize:11,color:C.dim}}>소셜 로그인</span>
                <div style={{flex:1,height:"1px",background:C.border}}/>
              </div>
              {[
                {bg:"#FEE500",color:"#000",label:"💬 카카오",name:"kakao"},
                {bg:"#fff",color:"#222",label:"🌐 Google",name:"google"},
                {bg:"#1a1a1a",color:"#fff",label:"🍎 Apple",name:"apple"},
              ].map(s=>(
                <PressButton key={s.name} onClick={()=>social(s.name)}
                  style={{width:"100%",padding:"13px",borderRadius:14,border:"none",
                    background:s.bg,color:s.color,fontWeight:700,fontSize:14,cursor:"pointer"}}>
                  {s.label}
                </PressButton>
              ))}
              <PressButton onClick={()=>{const u={email:"guest@bouleon.ai",name:"게스트",isGuest:true};ls.set("bl_sess",u);onLogin(u);}}
                style={{...S.bigBtn(false),boxShadow:"none"}}>
                👤 게스트로 둘러보기
              </PressButton>
            </div>
          </div>
        </FadeUp>

        <p style={{textAlign:"center",marginTop:24,color:C.mid,fontSize:13}}>
          계정이 없으신가요?{" "}
          <span onClick={onRegister} style={{color:C.accent,cursor:"pointer",fontWeight:700}}>회원가입</span>
        </p>
      </div>
    </div>
  );
}

function RegisterScreen({onLogin,onBack}) {
  const [f,setF]=useState({name:"",email:"",pw:"",pw2:""});
  const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const doReg=()=>{
    setErr("");
    if(!f.name||!f.email||!f.pw||!f.pw2){setErr("모든 항목을 입력해주세요.");return;}
    if(f.pw!==f.pw2){setErr("비밀번호가 일치하지 않습니다.");return;}
    if(f.pw.length<6){setErr("비밀번호는 6자리 이상이어야 합니다.");return;}
    setLoading(true);
    setTimeout(()=>{
      const users=ls.get("bl_users",[]);
      if(users.find(u=>u.email===f.email)){setErr("이미 가입된 이메일입니다.");setLoading(false);return;}
      const u={name:f.name,email:f.email,pw:f.pw};
      users.push(u);ls.set("bl_users",users);ls.set("bl_sess",u);onLogin(u);
    },500);
  };
  return (
    <div style={{position:"relative",zIndex:1}}>
      <style>{GLOBAL_CSS}</style>
      <BgBlobs/>
      <div style={{...S.wrap,paddingTop:60,paddingBottom:48}}>
        <FadeUp>
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{width:56,height:56,borderRadius:18,background:C.grad,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:24,margin:"0 auto 12px",
              boxShadow:`0 0 30px rgba(124,106,247,0.5)`}}>🎤</div>
            <div style={{fontWeight:900,fontSize:22,background:C.grad,
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>부를레옹</div>
          </div>
        </FadeUp>
        <FadeUp delay={100}>
          <div style={{...S.card,backdropFilter:"blur(20px)"}}>
            <h2 style={{margin:"0 0 20px",fontSize:18,fontWeight:800}}>회원가입</h2>
            {[{k:"name",type:"text",label:"닉네임",ph:"예) 노래왕"},
              {k:"email",type:"email",label:"이메일",ph:"hello@bouleon.ai"},
              {k:"pw",type:"password",label:"비밀번호 (6자 이상)",ph:"••••••••"},
              {k:"pw2",type:"password",label:"비밀번호 확인",ph:"••••••••"},
            ].map(fi=>(
              <div key={fi.k} style={{marginBottom:12}}>
                <label style={{fontSize:12,color:C.mid,marginBottom:6,display:"block",fontWeight:600}}>{fi.label}</label>
                <input style={S.inp} type={fi.type} placeholder={fi.ph}
                  value={f[fi.k]} onChange={e=>setF(p=>({...p,[fi.k]:e.target.value}))}
                  onFocus={focusIn} onBlur={focusOut}/>
              </div>
            ))}
            {err&&<p style={{color:C.rose,fontSize:12,margin:"8px 0 0",
              padding:"8px 12px",background:C.roseDim,borderRadius:10}}>{err}</p>}
            <PressButton style={{...S.bigBtn(true),marginTop:20,opacity:loading?0.7:1}} onClick={doReg} disabled={loading}>
              {loading?"가입 중...":"🎵 부를레옹 시작하기"}
            </PressButton>
          </div>
        </FadeUp>
        <p style={{textAlign:"center",marginTop:24,color:C.mid,fontSize:13}}>
          계정이 있으신가요?{" "}
          <span onClick={onBack} style={{color:C.accent,cursor:"pointer",fontWeight:700}}>로그인</span>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// HOME TAB
// ─────────────────────────────────────────────────────────────────
const HomeTab = ({
  comfSongs, setComfSongs, targetSong, setTargetSong,
  situation, setSituation, condition, setCondition,
  extraNote, setExtraNote, quickMode, setQuickMode,
  loading, loadStep, onRun, voiceType, onGoProfile
}) => {
  const LOAD_MSGS = ["🎵 음역 패턴 분석 중...","🎹 최적 키 계산 중...","🎭 상황별 전략 수립 중...","✨ 맞춤 가이드 완성 중..."];
  const voice = VOICE_TYPES.find(v=>v.id===voiceType);

  return (
    <div>
      {/* Hero */}
      <FadeUp>
        <div style={{background:"linear-gradient(140deg,rgba(124,106,247,0.2),rgba(34,211,238,0.08))",
          border:`1px solid ${C.borderHi}`,borderRadius:28,padding:"24px 20px",
          marginBottom:20,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",
            background:"radial-gradient(circle,rgba(124,106,247,0.3) 0%,transparent 70%)"}}/>
          <div style={{position:"absolute",bottom:-20,left:-20,width:100,height:100,borderRadius:"50%",
            background:"radial-gradient(circle,rgba(34,211,238,0.15) 0%,transparent 70%)"}}/>
          <div style={{fontSize:24,fontWeight:900,lineHeight:1.3,marginBottom:8,
            background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            오늘 노래방 가세요?
          </div>
          <div style={{fontSize:14,color:C.mid,lineHeight:1.7}}>
            편한 곡 1곡만 알려주면<br/>
            <span style={{color:"#fff",fontWeight:700}}>내 음역에 맞는 키를 정확히 계산</span>해드려요
          </div>

          {!voiceType ? (
            <div onClick={onGoProfile}
              style={{marginTop:12,padding:"10px 14px",borderRadius:12,cursor:"pointer",
                background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.3)",
                fontSize:12,color:C.amber,display:"flex",alignItems:"center",
                justifyContent:"space-between",transition:"all 0.2s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(245,158,11,0.2)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(245,158,11,0.12)"}>
              <span>⚠️ 음역대 미설정 — 키 추천 정확도가 낮아요</span>
              <span style={{fontWeight:700}}>설정 →</span>
            </div>
          ) : (
            <div style={{marginTop:12,padding:"8px 14px",borderRadius:12,
              background:"rgba(124,106,247,0.15)",border:`1px solid ${C.borderHi}`,
              fontSize:12,color:C.accent,display:"flex",alignItems:"center",gap:8}}>
              <span>{voice.emoji}</span>
              <span style={{fontWeight:600}}>{voice.label} 음역으로 분석합니다</span>
              <span style={{marginLeft:"auto",fontSize:10,color:C.dim,cursor:"pointer"}}
                onClick={onGoProfile}>변경</span>
            </div>
          )}

          <div style={{display:"flex",gap:8,marginTop:12}}>
            {[{v:true,l:"⚡ 빠른"},{v:false,l:"🎯 정밀"}].map(m=>(
              <PressButton key={String(m.v)} onClick={()=>setQuickMode(m.v)}
                style={{...S.chip(quickMode===m.v),fontSize:12,padding:"7px 16px"}}>
                {m.l}
              </PressButton>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* STEP 1 */}
      <FadeUp delay={50}>
        <div style={{...S.card,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:C.grad,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:12,fontWeight:800,color:"#fff",flexShrink:0,
              boxShadow:`0 0 12px rgba(124,106,247,0.5)`}}>1</div>
            <div>
              <div style={{fontSize:14,fontWeight:700}}>평소 편하게 부르는 곡</div>
              <div style={{fontSize:11,color:C.dim}}>{quickMode?"1곡이면 충분해요":"2~3곡으로 더 정밀하게"}</div>
            </div>
          </div>
          {[0,...(quickMode?[]:[1,2])].map(i=>(
            <SongSearchInput key={i}
              label={`기준곡 ${i+1}${i===0?" *필수":" (선택)"}`}
              value={comfSongs[i]||null}
              onChange={s=>{ const c=[...comfSongs]; c[i]=s; setComfSongs(c); }}
              placeholder={i===0?"편하게 부르는 곡 검색...":i===1?"두 번째 기준곡...":"세 번째 기준곡..."}
            />
          ))}
        </div>
      </FadeUp>

      {/* STEP 2 */}
      <FadeUp delay={100}>
        <div style={{...S.card,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:C.gradWarm,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:12,fontWeight:800,color:"#fff",flexShrink:0,
              boxShadow:`0 0 12px rgba(244,63,94,0.4)`}}>2</div>
            <div>
              <div style={{fontSize:14,fontWeight:700}}>부르고 싶은 목표곡 *</div>
              <div style={{fontSize:11,color:C.dim}}>TJ 48,225곡 검색 가능</div>
            </div>
          </div>
          <SongSearchInput value={targetSong} onChange={setTargetSong}
            placeholder="목표곡 검색 (예: 야생화, 좋은날...)"/>
          {targetSong && (
            <div style={{background:`linear-gradient(135deg,${C.accentDim},${C.cyanDim})`,
              borderRadius:14,padding:"12px 14px",
              border:`1px solid ${C.borderHi}`,
              display:"flex",justifyContent:"space-between",alignItems:"center",
              animation:"fadeIn 0.2s ease forwards"}}>
              <div>
                <div style={{fontSize:14,fontWeight:700}}>{targetSong.title}</div>
                <div style={{fontSize:11,color:C.mid,marginTop:2}}>{targetSong.artist}</div>
              </div>
              {targetSong.tj && <span style={S.tag(C.accent)}>TJ {targetSong.tj}</span>}
            </div>
          )}
        </div>
      </FadeUp>

      {/* STEP 3 상황 */}
      <FadeUp delay={150}>
        <div style={{...S.card,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{width:26,height:26,borderRadius:"50%",
              background:"rgba(34,211,238,0.2)",border:`1px solid ${C.cyan}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:12,fontWeight:800,color:C.cyan,flexShrink:0}}>3</div>
            <div>
              <div style={{fontSize:14,fontWeight:700}}>오늘 상황 <span style={{fontSize:11,color:C.dim,fontWeight:400}}>(선택)</span></div>
              <div style={{fontSize:11,color:C.dim}}>상황에 따라 키가 달라져요</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {SITUATIONS.map(s=>(
              <PressButton key={s.id} onClick={()=>setSituation(situation===s.id?null:s.id)}
                style={{...S.chip(situation===s.id,s.color),
                  display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                  padding:"12px 6px",borderRadius:16,textAlign:"center",
                  boxShadow:situation===s.id?`0 4px 16px ${s.color}40`:"none"}}>
                <span style={{fontSize:22}}>{s.emoji}</span>
                <span style={{fontSize:11,fontWeight:700}}>{s.label}</span>
                {s.keyAdj !== 0 && (
                  <span style={{fontSize:9,opacity:0.7}}>
                    {s.keyAdj > 0 ? `+${s.keyAdj}키` : `${s.keyAdj}키`}
                  </span>
                )}
              </PressButton>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* STEP 4 컨디션 */}
      <FadeUp delay={200}>
        <div style={{...S.card,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{width:26,height:26,borderRadius:"50%",
              background:"rgba(244,63,94,0.2)",border:`1px solid ${C.rose}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:12,fontWeight:800,color:C.rose,flexShrink:0}}>4</div>
            <div>
              <div style={{fontSize:14,fontWeight:700}}>오늘 목 컨디션 <span style={{fontSize:11,color:C.dim,fontWeight:400}}>(선택)</span></div>
              <div style={{fontSize:11,color:C.dim}}>컨디션에 따라 키가 조절돼요</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {CONDITIONS.map(c=>(
              <PressButton key={c.id} onClick={()=>setCondition(condition===c.id?null:c.id)}
                style={{...S.chip(condition===c.id,C.rose),
                  display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"12px 16px",borderRadius:14,
                  boxShadow:condition===c.id?`0 4px 16px ${C.rose}30`:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:18}}>{c.emoji}</span>
                  <span style={{fontSize:13,fontWeight:600}}>{c.label}</span>
                </div>
                <span style={{fontSize:12,fontWeight:700,
                  color:condition===c.id?"#fff":c.keyAdj<0?C.rose:c.keyAdj>0?C.green:C.dim}}>
                  {c.keyAdj>0?`+${c.keyAdj}키`:c.keyAdj<0?`${c.keyAdj}키`:"±0"}
                </span>
              </PressButton>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* 메모 */}
      <FadeUp delay={250}>
        <div style={{...S.card,marginBottom:24}}>
          <label style={{fontSize:12,color:C.mid,marginBottom:8,display:"block",fontWeight:600}}>
            💬 AI에게 더 알려줄 것 <span style={{color:C.dim,fontWeight:400}}>(선택)</span>
          </label>
          <textarea value={extraNote} onChange={e=>setExtraNote(e.target.value)}
            placeholder="예: 고음이 약해요 / 술 한 잔 했어요 / 첫 도전이에요..."
            style={{...S.inp,resize:"none",minHeight:72,lineHeight:1.7}}
            onFocus={focusIn} onBlur={focusOut}/>
        </div>
      </FadeUp>

      {/* CTA */}
      {loading ? (
        <div style={{...S.card,textAlign:"center",padding:"32px 20px",
          background:"linear-gradient(140deg,rgba(124,106,247,0.12),rgba(34,211,238,0.06))"}}>
          <div style={{fontSize:36,marginBottom:12,display:"inline-block",animation:"bounce 1s ease-in-out infinite"}}>🎵</div>
          <div style={{fontSize:16,fontWeight:800,marginBottom:6,
            background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            {LOAD_MSGS[loadStep]}
          </div>
          <div style={{fontSize:12,color:C.dim}}>잠깐만요...</div>
          <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:16}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.accent,
                animation:`pulse 1.2s ease-in-out infinite ${i*0.2}s`}}/>
            ))}
          </div>
        </div>
      ) : (
        <FadeUp delay={300}>
          <PressButton style={S.bigBtn(true)} onClick={onRun}>
            ✨ AI 키 분석 받기
          </PressButton>
        </FadeUp>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// RESULT TAB
// ─────────────────────────────────────────────────────────────────
const ResultTab = ({ result, targetSong, situation, uid, repo, saveRepo, setTab }) => {
  const [saved,    setSaved]    = useState(false);
  const [showEval, setShowEval] = useState(false);
  const [evalSel,  setEvalSel]  = useState([]);
  const [actualKey,setActualKey]= useState(null);
  const [evalDone, setEvalDone] = useState(false);

  if (!result) return (
    <div style={{...S.card,textAlign:"center",padding:56}}>
      <div style={{fontSize:48,marginBottom:16}}>🎵</div>
      <p style={{color:C.mid,margin:0,lineHeight:1.8,fontSize:14}}>
        아직 분석 결과가 없어요.<br/>홈에서 먼저 분석을 시작해보세요!
      </p>
      <PressButton onClick={()=>setTab("home")}
        style={{...S.bigBtn(true),marginTop:24,width:"auto",padding:"12px 32px"}}>
        분석 시작하기
      </PressButton>
    </div>
  );

  const r = result;
  const feasColor = r.feasibility?.includes("쉬움")?C.green:r.feasibility?.includes("도전")?C.amber:C.rose;
  const sit = SITUATIONS.find(s=>s.id===situation);

  const saveToRepo = () => {
    if (!targetSong) return;
    const key = targetSong.id || `tj_${targetSong.tj}`;
    if (repo.find(x=>x.id===key)){alert("이미 레파토리에 있어요!"); return;}
    const tag = REPO_TAGS.find(t=>t.id===r.repoTag)||REPO_TAGS[6];
    saveRepo([{
      id:key, song:targetSong, tags:[tag.id],
      myKey:r.recommendedKey,
      myKeyNum: r.keyNum || 0,
      addedAt:Date.now()
    },...repo]);
    setSaved(true);
  };

  const submitEval = () => {
    if(!evalSel.length) return;
    const evals = ls.get(`bl_eval_${uid}`,[]);
    const keyNum = r.keyNum ?? (r.recommendedKey==="원키"?0:parseInt(r.recommendedKey)||0);
    ls.set(`bl_eval_${uid}`,[{
      id: Date.now(),
      songTitle: targetSong?.title,
      artist: targetSong?.artist,
      tj: targetSong?.tj,
      voiceType: ls.get(`bl_voice_${uid}`,null),
      situation,
      condition: null,
      recommendedKey: keyNum,
      actualKey: actualKey,
      evals: evalSel,
      date: new Date().toLocaleDateString("ko-KR")
    },...evals].slice(0,200));
    setShowEval(false);
    setEvalDone(true);
  };

  return (
    <div>
      <button onClick={()=>setTab("home")}
        style={{background:"transparent",border:"none",color:C.mid,cursor:"pointer",
          fontSize:13,padding:"0 0 16px",display:"flex",alignItems:"center",gap:6,
          transition:"color 0.2s"}}
        onMouseEnter={e=>e.currentTarget.style.color=C.text}
        onMouseLeave={e=>e.currentTarget.style.color=C.mid}>
        ← 다시 분석하기
      </button>

      {/* 핵심 카드 */}
      <FadeUp>
        <div style={{background:"linear-gradient(140deg,rgba(124,106,247,0.22),rgba(34,211,238,0.08))",
          border:`1px solid ${C.borderHi}`,borderRadius:28,padding:"22px",
          marginBottom:14,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",
            background:"radial-gradient(circle,rgba(124,106,247,0.35) 0%,transparent 70%)"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:10,color:C.mid,marginBottom:4,letterSpacing:"1px",textTransform:"uppercase"}}>분석 결과</div>
              <div style={{fontSize:18,fontWeight:900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {targetSong?.title}
              </div>
              <div style={{fontSize:12,color:C.mid,marginTop:2}}>{targetSong?.artist}</div>
              {targetSong?.tj && <span style={{...S.tag(C.accent),marginTop:6,display:"inline-flex"}}>TJ {targetSong.tj}</span>}
            </div>
            <div style={{textAlign:"center",marginLeft:16,flexShrink:0}}>
              <div style={{fontSize:11,color:C.dim,marginBottom:2}}>확신도</div>
              <div style={{fontSize:40,fontWeight:900,lineHeight:1,
                background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                {r.confidence}
              </div>
              <div style={{fontSize:10,color:C.dim}}>/ 10</div>
            </div>
          </div>
          <p style={{margin:0,fontSize:13,lineHeight:1.7,color:"rgba(241,245,249,0.85)"}}>{r.voiceSummary}</p>
          <div style={{display:"flex",gap:6,marginTop:12,flexWrap:"wrap"}}>
            <span style={S.tag(feasColor)}>{r.feasibility}</span>
            {r.vibes?.map(v=><span key={v} style={S.tag(C.dim)}>#{v}</span>)}
          </div>
        </div>
      </FadeUp>

      {/* 추천 키 — 핵심 */}
      <FadeUp delay={80}>
        <div style={{...S.card,marginBottom:14,textAlign:"center",
          background:"linear-gradient(135deg,rgba(124,106,247,0.18),rgba(34,211,238,0.08))",
          borderColor:C.borderHi,padding:"28px 20px"}}>
          <div style={{fontSize:11,color:C.mid,marginBottom:8,letterSpacing:"2px",textTransform:"uppercase"}}>
            🎹 추천 시작 키
          </div>
          <div className="key-pop" style={{fontSize:72,fontWeight:900,lineHeight:1,
            background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            letterSpacing:"-2px"}}>
            {r.recommendedKey}
          </div>
          <p style={{margin:"12px 0 0",fontSize:13,color:C.mid,lineHeight:1.7}}>{r.keyLogic}</p>

          {/* 키 계산 내역 */}
          {r.keyBreakdown?.length > 0 && (
            <div style={{marginTop:16,padding:"12px 14px",borderRadius:14,
              background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,textAlign:"left"}}>
              <div style={{fontSize:10,color:C.dim,marginBottom:8,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase"}}>
                📊 키 계산 내역
              </div>
              {r.keyBreakdown.map((b,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",
                  padding:"4px 0",borderBottom:i<r.keyBreakdown.length-1?`1px solid ${C.border}`:"none",
                  fontSize:12}}>
                  <span style={{color:C.mid}}>{b.label}{b.note?` (${b.note})`:""}</span>
                  <span style={{fontWeight:700,
                    color:b.value>0?C.green:b.value<0?C.rose:C.dim}}>
                    {b.value>0?`+${b.value}키`:b.value<0?`${b.value}키`:"±0"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </FadeUp>

      {/* 컨디션 + 상황 */}
      {(r.conditionTip||r.situationStrategy)&&(
        <FadeUp delay={120}>
          <div style={{display:"grid",
            gridTemplateColumns:r.conditionTip&&r.situationStrategy?"1fr 1fr":"1fr",
            gap:10,marginBottom:14}}>
            {r.conditionTip&&(
              <div style={{...S.card,borderColor:"rgba(244,63,94,0.3)",background:C.roseDim}}>
                <div style={{fontSize:11,color:C.rose,fontWeight:700,marginBottom:6}}>🩺 컨디션 팁</div>
                <p style={{margin:0,fontSize:12,lineHeight:1.7,color:C.mid}}>{r.conditionTip}</p>
              </div>
            )}
            {r.situationStrategy&&(
              <div style={{...S.card,borderColor:"rgba(34,211,238,0.3)",background:C.cyanDim}}>
                <div style={{fontSize:11,color:C.cyan,fontWeight:700,marginBottom:6}}>🎭 상황 전략</div>
                <p style={{margin:0,fontSize:12,lineHeight:1.7,color:C.mid}}>{r.situationStrategy}</p>
              </div>
            )}
          </div>
        </FadeUp>
      )}

      {/* 세트리스트 */}
      {r.setlist&&situation&&sit&&(
        <FadeUp delay={140}>
          <div style={{...S.card,marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <span style={{fontSize:22}}>{sit.emoji}</span>
              <div style={{fontSize:15,fontWeight:800}}>{sit.label} 세트리스트</div>
            </div>
            {r.setlist.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start"}}>
                <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,
                  background:i===2?C.grad:C.glass,border:`1px solid ${i===2?C.accent:C.border}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:13,fontWeight:800,color:i===2?"#fff":C.mid,
                  boxShadow:i===2?`0 0 12px rgba(124,106,247,0.4)`:"none"}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <div style={{fontSize:14,fontWeight:700}}>{item.title}</div>
                    <span style={{fontSize:10,background:`${C.accent}25`,color:C.accent,
                      padding:"2px 8px",borderRadius:8,fontWeight:700}}>{item.role}</span>
                  </div>
                  <div style={{fontSize:12,color:C.mid,marginTop:2}}>{item.artist}</div>
                  {item.tj&&<span style={{...S.tag(C.accent),marginTop:4}}>TJ {item.tj}</span>}
                  <div style={{fontSize:12,color:i===2?C.accent:C.dim,marginTop:4,lineHeight:1.5}}>{item.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </FadeUp>
      )}

      {/* 보컬 팁 */}
      <FadeUp delay={160}>
        <div style={{...S.card,marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:800,marginBottom:12}}>💡 보컬 핵심 팁</div>
          {r.vocalTips?.map((tip,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
              <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,
                background:C.accentDim,border:`1px solid ${C.borderHi}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,fontWeight:700,color:C.accent}}>{i+1}</div>
              <p style={{margin:0,fontSize:13,lineHeight:1.7,color:C.mid,paddingTop:2}}>{tip}</p>
            </div>
          ))}
        </div>
      </FadeUp>

      {/* 연습 가이드 */}
      <FadeUp delay={180}>
        <div style={{...S.card,marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:800,marginBottom:14}}>📋 단계별 연습 가이드</div>
          {r.practiceSteps?.map((step,i)=>(
            <div key={i} style={{display:"flex",gap:14,marginBottom:12,
              padding:"13px 16px",borderRadius:16,
              background:i===0?"linear-gradient(135deg,rgba(124,106,247,0.15),rgba(34,211,238,0.06))":C.glass,
              border:`1px solid ${i===0?C.borderHi:C.border}`}}>
              <span style={{fontSize:22,flexShrink:0}}>{["🎵","🎹","🎤","🌟"][i]||"✅"}</span>
              <div>
                <div style={{fontSize:11,color:C.accent,fontWeight:700,marginBottom:4,letterSpacing:"0.5px"}}>
                  STEP {step.step}. {step.title}
                </div>
                <div style={{fontSize:13,lineHeight:1.7,color:C.text}}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </FadeUp>

      {/* 대체 추천곡 */}
      <FadeUp delay={200}>
        <div style={{...S.card,marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:800,marginBottom:14}}>🎤 대체 추천곡</div>
          {r.alternatives?.map((alt,i)=>(
            <div key={i} style={{padding:"13px 16px",borderRadius:16,marginBottom:10,
              background:C.card2,border:`1px solid ${C.border}`,
              display:"flex",justifyContent:"space-between",alignItems:"center",
              transition:"all 0.2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderHi}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700}}>{alt.title}</div>
                <div style={{fontSize:12,color:C.mid,marginTop:2}}>{alt.artist}</div>
                {alt.tj&&<span style={{...S.tag(C.accent),marginTop:5}}>TJ {alt.tj}</span>}
                <div style={{fontSize:12,color:C.accent,marginTop:4,lineHeight:1.5}}>✓ {alt.reason}</div>
              </div>
              <div style={{marginLeft:12,flexShrink:0,textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:900,
                  color:alt.matchScore>=8?C.green:alt.matchScore>=6?C.amber:C.mid}}>
                  {alt.matchScore}
                </div>
                <div style={{fontSize:9,color:C.dim}}>/ 10</div>
              </div>
            </div>
          ))}
        </div>
      </FadeUp>

      {/* 저장 + 평가 */}
      <FadeUp delay={220}>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:24}}>
          {!saved?(
            <PressButton onClick={saveToRepo}
              style={{...S.bigBtn(true,`linear-gradient(135deg,${C.green},#059669)`),
                boxShadow:`0 8px 32px rgba(16,185,129,0.4)`}}>
              🗂 레파토리에 저장하기
            </PressButton>
          ):(
            <div style={{...S.card,textAlign:"center",
              borderColor:"rgba(16,185,129,0.4)",background:C.greenDim,padding:"14px",
              animation:"scaleIn 0.25s ease forwards"}}>
              ✅ 레파토리에 저장됐어요!{" "}
              <span onClick={()=>setTab("library")}
                style={{color:C.green,cursor:"pointer",fontWeight:700,textDecoration:"underline"}}>
                확인하기
              </span>
            </div>
          )}

          {evalDone ? (
            <div style={{...S.card,textAlign:"center",borderColor:`${C.accent}44`,
              background:C.accentDim,padding:"14px",
              animation:"scaleIn 0.25s ease forwards"}}>
              🎯 평가 저장! 다음 분석에 자동 반영돼요
            </div>
          ) : !showEval?(
            <PressButton onClick={()=>setShowEval(true)}
              style={{...S.bigBtn(false),boxShadow:"none"}}>
              📝 불러본 뒤 평가 남기기
            </PressButton>
          ):(
            <div style={{...S.card,borderColor:`${C.accent}44`,
              animation:"fadeUp 0.25s ease forwards"}}>
              <div style={{fontSize:14,fontWeight:800,marginBottom:4}}>어떻게 불렀나요?</div>
              <div style={{fontSize:12,color:C.dim,marginBottom:14}}>
                평가는 다음 키 추천에 자동 반영돼요!
              </div>

              {/* 평가 선택 */}
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                {EVAL_OPTIONS.map(opt=>(
                  <PressButton key={opt.id}
                    onClick={()=>setEvalSel(p=>p.includes(opt.id)?p.filter(x=>x!==opt.id):[...p,opt.id])}
                    style={{...S.chip(evalSel.includes(opt.id),opt.color),fontSize:12,padding:"8px 12px",
                      boxShadow:evalSel.includes(opt.id)?`0 4px 12px ${opt.color}40`:"none"}}>
                    {opt.emoji} {opt.label}
                  </PressButton>
                ))}
              </div>

              {/* 실제 부른 키 선택 — 개인 학습 핵심 */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,color:C.mid,marginBottom:8,fontWeight:600}}>
                  🎹 실제로 몇 키로 부르셨나요?
                  <span style={{fontSize:10,color:C.dim,fontWeight:400,marginLeft:6}}>
                    (개인 키 학습에 활용)
                  </span>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[-3,-2,-1,0,1,2,3].map(k=>(
                    <PressButton key={k} onClick={()=>setActualKey(actualKey===k?null:k)}
                      style={{...S.chip(actualKey===k,C.cyan),
                        padding:"7px 12px",fontSize:12,borderRadius:12,
                        boxShadow:actualKey===k?`0 4px 12px ${C.cyan}40`:"none"}}>
                      {k===0?"원키":k>0?`+${k}키`:`${k}키`}
                    </PressButton>
                  ))}
                </div>
                {actualKey !== null && r.keyNum !== undefined && actualKey !== r.keyNum && (
                  <div style={{marginTop:8,fontSize:11,color:C.cyan,
                    padding:"6px 10px",background:C.cyanDim,borderRadius:8}}>
                    💡 추천키({r.recommendedKey})와 {actualKey > (r.keyNum||0) ? "더 높게" : "더 낮게"} 부르셨군요!
                    다음 추천에 반영할게요.
                  </div>
                )}
              </div>

              <PressButton onClick={submitEval} disabled={!evalSel.length}
                style={{...S.bigBtn(evalSel.length>0),opacity:evalSel.length?1:0.4}}>
                평가 저장하기
              </PressButton>
            </div>
          )}
        </div>
      </FadeUp>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────
function MainApp({ user, onLogout }) {
  const uid = user.email;
  const [tab,        setTab]        = useState("home");
  const [prevTab,    setPrevTab]    = useState("home");
  const [quickMode,  setQuickMode]  = useState(true);
  const [comfSongs,  setComfSongs]  = useState([null,null,null]);
  const [targetSong, setTargetSong] = useState(null);
  const [situation,  setSituation]  = useState(null);
  const [condition,  setCondition]  = useState(null);
  const [extraNote,  setExtraNote]  = useState("");
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [loadStep,   setLoadStep]   = useState(0);
  const [repo,       setRepo]       = useState(()=>ls.get(`bl_repo_${uid}`,[]));
  const [history,    setHistory]    = useState(()=>ls.get(`bl_hist_${uid}`,[]));
  const [voiceType,  setVoiceType]  = useState(()=>ls.get(`bl_voice_${uid}`,null));

  const saveRepo      = r=>{ setRepo(r);      ls.set(`bl_repo_${uid}`,r);  };
  const saveHistory   = h=>{ setHistory(h);   ls.set(`bl_hist_${uid}`,h);  };
  const saveVoiceType = v=>{ setVoiceType(v); ls.set(`bl_voice_${uid}`,v); };

  const changeTab = (t) => { setPrevTab(tab); setTab(t); };

  // ── AI 분석 실행 ────────────────────────────────────────────────
  const runAnalysis = async () => {
    const valid = comfSongs.filter(Boolean);
    if (!valid.length) { alert("편하게 부르는 곡을 1개 이상 입력해주세요!"); return; }
    if (!targetSong)   { alert("목표곡을 입력해주세요!"); return; }

    setLoading(true); setResult(null); setLoadStep(0);
    const iv = setInterval(()=>setLoadStep(p=>(p+1)%4), 1400);

    const sit  = SITUATIONS.find(s=>s.id===situation);
    const cond = CONDITIONS.find(c=>c.id===condition);
    const voice = VOICE_TYPES.find(v=>v.id===voiceType);

    // 키 계산 (코드가 직접)
    const { keyStr, keyNum, breakdown, songData } = await calcKey({
      voiceType, targetSong, situation, condition, history, uid
    });

    // 과거 피드백
    const keyFeedback = history.slice(0,15)
      .filter(h=>h.rating&&h.target?.title&&h.result?.recommendedKey)
      .map(h=>`"${h.target.title}" → ${h.result.recommendedKey} 추천, 평가: "${h.rating}"`)
      .join("\n") || "없음";

    const prevRec = history.find(h=>h.target?.title===targetSong.title);
    const personalAdj = getPersonalAdj(uid);

    const prompt = `당신은 노래방 AI 코치 "부를레옹"입니다.
키는 이미 계산 완료됐습니다. 설명과 팁만 작성하세요.

[확정된 추천 키: ${keyStr}]
계산 내역: ${breakdown.map(b=>`${b.label}(${b.value>0?"+"+b.value:b.value}키)`).join(" + ")}
${personalAdj!==0?`개인 학습 보정 ${personalAdj>0?"+"+personalAdj:personalAdj}키 반영됨`:""}

[사용자]
음역: ${voice?voice.label:"미설정"}
기준곡: ${valid.map(s=>`"${s.title}"(${s.artist})`).join(", ")}
목표곡: "${targetSong.title}"(${targetSong.artist})
상황: ${sit?sit.emoji+sit.label:"미선택"}
컨디션: ${cond?cond.emoji+cond.label:"미선택"}
메모: ${extraNote||"없음"}
${songData?`DB: 최고음 ${songData.maxNote}, 난이도 ${songData.difficulty}, ${songData.gender}곡`:"DB 미수록"}
이전 기록: ${prevRec?`"${prevRec.result?.recommendedKey}" 추천, 평가 "${prevRec.rating||"미평가"}"` : "없음"}
과거 피드백: ${keyFeedback}

대체곡은 사용자 음역에 맞는 실제 존재하는 곡으로 TJ 번호 포함해서 추천해주세요.

JSON만 반환:
{
  "voiceSummary": "음역 분석 2문장 (친근하게)",
  "feasibility": "부르기 쉬움 또는 도전적 또는 키 조절 필수",
  "recommendedKey": "${keyStr}",
  "keyLogic": "이 키인 이유 구체적으로",
  "conditionTip": ${cond?'"컨디션 팁 1문장"':"null"},
  "situationStrategy": ${sit?'"상황 전략 2문장"':"null"},
  "vocalTips": ["팁1","팁2","팁3"],
  "practiceSteps": [
    {"step":1,"title":"단계","desc":"설명"},
    {"step":2,"title":"단계","desc":"설명"},
    {"step":3,"title":"단계","desc":"설명"}
  ],
  ${sit?`"setlist": [${sit.roles.map(r=>`{"role":"${r}","title":"곡명","artist":"가수","tj":"번호","reason":"이유"}`).join(",")}],`:`"setlist": null,`}
  "alternatives": [
    {"title":"곡명","artist":"가수","tj":"번호","reason":"이유","matchScore":9},
    {"title":"곡명","artist":"가수","tj":"번호","reason":"이유","matchScore":8},
    {"title":"곡명","artist":"가수","tj":"번호","reason":"이유","matchScore":7}
  ],
  "repoTag": "safe 또는 killer 또는 prac 또는 high",
  "confidence": 8,
  "vibes": ["키워드1","키워드2","키워드3"]
}`;

    try {
      const text = await callAI(prompt);
      const parsed = parseJSON(text);
      const r = parsed || {
        voiceSummary:"기준곡 분석 완료! 음역에 맞는 키를 계산했어요.",
        feasibility:"키 조절 필수",
        recommendedKey: keyStr,
        keyLogic:`음역 기반 계산 결과 ${keyStr}이 적합해요.`,
        conditionTip:null, situationStrategy:null,
                conditionTip:null, situationStrategy:null,
        vocalTips:["후렴 전 깊게 숨 들이쉬기","고음에서 힘 빼기","끝 음절 부드럽게"],
        practiceSteps:[
          {step:1,title:"원곡 청취",desc:"원곡 3번 들으며 멜로디 파악"},
          {step:2,title:"허밍 연습",desc:"추천 키로 전체 허밍"},
          {step:3,title:"반복 연습",desc:"후렴구 위주 반복"},
        ],
        setlist:null,
        alternatives:[
          {title:"취중고백",artist:"김민석",tj:"62994",reason:"비슷한 음역",matchScore:9},
          {title:"걱정말아요 그대",artist:"이적",tj:"45592",reason:"편안한 중저음",matchScore:8},
          {title:"거리에서",artist:"성시경",tj:"16503",reason:"안정적인 중저음",matchScore:7},
        ],
        repoTag:"prac", confidence:6, vibes:["감성","발라드"],
      };
      const entry = {
        id:Date.now(), target:targetSong, comfSongs:valid,
        situation, condition, result:r,
        date:new Date().toLocaleDateString("ko-KR"), rating:null
      };
      setResult(r);
      saveHistory([entry,...history].slice(0,40));
      changeTab("result");
    }
    clearInterval(iv);
    setLoading(false);
  };

  // ── 라이브러리 탭 ────────────────────────────────────────────────
  const LibraryTab = () => {
    const [filter, setFilter] = useState(null);
    const [editId, setEditId] = useState(null);
    const tagCounts = {};
    REPO_TAGS.forEach(t=>{ tagCounts[t.id]=repo.filter(r=>r.tags?.includes(t.id)).length; });
    const missing  = REPO_TAGS.filter(t=>tagCounts[t.id]===0).slice(0,3);
    const filtered = filter ? repo.filter(r=>r.tags?.includes(filter)) : repo;

    const toggleTag=(rid,tid)=>saveRepo(repo.map(r=>r.id!==rid?r
      :{...r,tags:r.tags?.includes(tid)?r.tags.filter(t=>t!==tid):[...(r.tags||[]),tid]}));
    const setMyKey=(rid,k,kn)=>saveRepo(repo.map(r=>r.id===rid?{...r,myKey:k,myKeyNum:kn}:r));
    const remove=(rid)=>{ if(window.confirm("삭제할까요?")) saveRepo(repo.filter(r=>r.id!==rid)); };

    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h2 style={{fontSize:20,fontWeight:900,margin:0}}>🗂 내 레파토리</h2>
          <span style={{...S.tag(C.accent),fontSize:12,padding:"4px 12px"}}>{repo.length}곡</span>
        </div>

        {repo.length>0&&(
          <FadeUp>
            <div style={{...S.card,marginBottom:16,
              background:"linear-gradient(140deg,rgba(124,106,247,0.12),rgba(34,211,238,0.06))",
              borderColor:C.borderHi}}>
              <div style={{fontSize:13,fontWeight:800,marginBottom:12}}>📊 레파토리 현황</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                {REPO_TAGS.slice(0,5).map(t=>(
                  <div key={t.id} style={{textAlign:"center",padding:"10px 4px",borderRadius:14,
                    background:tagCounts[t.id]>0?`${t.color}18`:C.glass,
                    border:`1px solid ${tagCounts[t.id]>0?t.color+"44":C.border}`,
                    transition:"all 0.2s",cursor:"pointer"}}
                    onClick={()=>setFilter(filter===t.id?null:t.id)}>
                    <div style={{fontSize:18}}>{t.emoji}</div>
                    <div style={{fontSize:20,fontWeight:900,color:tagCounts[t.id]>0?t.color:C.dim,margin:"2px 0"}}>
                      {tagCounts[t.id]}
                    </div>
                    <div style={{fontSize:9,color:C.dim}}>{t.label}</div>
                  </div>
                ))}
              </div>
              {missing.length>0&&(
                <div style={{marginTop:12,padding:"10px 14px",borderRadius:12,
                  background:C.amberDim,border:"1px solid rgba(245,158,11,0.3)"}}>
                  <div style={{fontSize:11,color:C.amber,fontWeight:700}}>
                    💡 부족한 유형: {missing.map(t=>`${t.emoji}${t.label}`).join(", ")}
                  </div>
                </div>
              )}
            </div>
          </FadeUp>
        )}

        {repo.length>0&&(
          <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}}>
            <PressButton onClick={()=>setFilter(null)}
              style={{...S.chip(!filter,C.accent),fontSize:11,padding:"6px 14px",flexShrink:0}}>
              전체 {repo.length}
            </PressButton>
            {REPO_TAGS.filter(t=>tagCounts[t.id]>0).map(t=>(
              <PressButton key={t.id} onClick={()=>setFilter(filter===t.id?null:t.id)}
                style={{...S.chip(filter===t.id,t.color),fontSize:11,padding:"6px 14px",flexShrink:0}}>
                {t.emoji} {t.label} {tagCounts[t.id]}
              </PressButton>
            ))}
          </div>
        )}

        {repo.length===0&&(
          <div style={{...S.card,textAlign:"center",padding:56}}>
            <div style={{fontSize:48,marginBottom:16}}>🎵</div>
            <p style={{color:C.mid,margin:0,lineHeight:1.8}}>아직 레파토리가 없어요.<br/>AI 분석 후 저장해보세요!</p>
            <PressButton onClick={()=>changeTab("home")}
              style={{...S.bigBtn(true),marginTop:24,width:"auto",padding:"12px 32px"}}>
              분석 시작하기
            </PressButton>
          </div>
        )}

        {filtered.map((entry,idx)=>{
          const s=entry.song;
          const isEditing=editId===entry.id;
          return (
            <FadeUp key={entry.id} delay={idx*30}>
              <div style={{...S.card,marginBottom:12,borderColor:isEditing?C.borderHi:C.border,transition:"all 0.2s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s?.title}</div>
                    <div style={{fontSize:12,color:C.mid,marginTop:2}}>{s?.artist}</div>
                    <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap",alignItems:"center"}}>
                      {s?.tj&&<span style={S.tag(C.accent)}>TJ {s.tj}</span>}
                      {entry.myKey&&(
                        <span style={{...S.tag(C.green),fontWeight:800,fontSize:12,padding:"3px 10px"}}>
                          🎹 내 키: {entry.myKey}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,marginLeft:10,flexShrink:0}}>
                    <PressButton onClick={()=>setEditId(isEditing?null:entry.id)}
                      style={{width:32,height:32,borderRadius:10,border:`1px solid ${C.border}`,
                        background:isEditing?C.accentDim:C.glass,color:isEditing?C.accent:C.mid,cursor:"pointer",fontSize:14}}>
                      ✏️
                    </PressButton>
                    <PressButton onClick={()=>remove(entry.id)}
                      style={{width:32,height:32,borderRadius:10,
                        border:"1px solid rgba(244,63,94,0.3)",
                        background:"rgba(244,63,94,0.08)",color:C.rose,cursor:"pointer",fontSize:14}}>
                      ✕
                    </PressButton>
                  </div>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:10}}>
                  {REPO_TAGS.map(t=>(
                    <PressButton key={t.id} onClick={()=>toggleTag(entry.id,t.id)}
                      style={{...S.chip(entry.tags?.includes(t.id),t.color),
                        padding:"4px 10px",fontSize:10,borderRadius:12,
                        opacity:entry.tags?.includes(t.id)?1:0.4}}>
                      {t.emoji} {t.label}
                    </PressButton>
                  ))}
                </div>
                {isEditing&&(
                  <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`,animation:"fadeUp 0.2s ease forwards"}}>
                    <label style={{fontSize:12,color:C.mid,marginBottom:8,display:"block",fontWeight:600}}>
                      🎹 내 최적 키 설정
                    </label>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {[[-3,"-3키"],[-2,"-2키"],[-1,"-1키"],[0,"원키"],[1,"+1키"],[2,"+2키"],[3,"+3키"]].map(([n,l])=>(
                        <PressButton key={n} onClick={()=>setMyKey(entry.id,l,n)}
                          style={{...S.chip(entry.myKey===l,C.green),padding:"6px 12px",fontSize:12,
                            boxShadow:entry.myKey===l?`0 4px 12px ${C.green}40`:"none"}}>
                          {l}
                        </PressButton>
                      ))}
                    </div>
                    {entry.myKey&&(
                      <div style={{marginTop:10,padding:"8px 12px",borderRadius:10,
                        background:C.greenDim,border:"1px solid rgba(16,185,129,0.3)",
                        fontSize:12,color:C.green}}>
                        ✅ {s?.title} → 내 키: <strong>{entry.myKey}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FadeUp>
          );
        })}
      </div>
    );
  };

  const HistoryTab = () => {
    const [evalOpen, setEvalOpen] = useState(null);
    return (
      <div>
        <h2 style={{fontSize:20,fontWeight:900,margin:"0 0 16px"}}>📝 분석 & 평가 기록</h2>
        {history.length===0?(
          <div style={{...S.card,textAlign:"center",padding:56}}>
            <div style={{fontSize:48,marginBottom:16}}>📝</div>
            <p style={{color:C.mid,margin:0}}>기록이 없어요. 첫 곡을 분석해보세요!</p>
          </div>
        ):history.map((h,idx)=>{
          const sit=h.situation?SITUATIONS.find(s=>s.id===h.situation):null;
          const isOpen=evalOpen===h.id;
          return (
            <FadeUp key={h.id||idx} delay={idx*20}>
              <div style={{...S.card,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.target?.title}</div>
                    <div style={{fontSize:12,color:C.mid,marginTop:1}}>{h.target?.artist}</div>
                  </div>
                  <span style={{fontSize:10,color:C.dim,flexShrink:0,marginLeft:8}}>{h.date}</span>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                  <span style={{...S.tag(C.accent),fontWeight:800}}>🎹 {h.result?.recommendedKey}</span>
                  {h.target?.tj&&<span style={S.tag(C.dim)}>TJ {h.target.tj}</span>}
                  {sit&&<span style={S.tag(sit.color)}>{sit.emoji}{sit.label}</span>}
                  {h.rating&&<span style={S.tag(C.green)}>✅ {h.rating}</span>}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <PressButton onClick={()=>{setResult(h.result);setTargetSong(h.target);setSituation(h.situation);changeTab("result");}}
                    style={{...S.chip(false),flex:1,fontSize:12,padding:"8px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    📋 결과 보기
                  </PressButton>
                  <PressButton onClick={()=>setEvalOpen(isOpen?null:h.id)}
                    style={{...S.chip(isOpen,C.rose),flex:1,fontSize:12,padding:"8px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    ⭐ 평가
                  </PressButton>
                </div>
                {isOpen&&(
                  <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`,animation:"fadeUp 0.2s ease forwards"}}>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {EVAL_OPTIONS.map(opt=>(
                        <PressButton key={opt.id}
                          onClick={()=>{saveHistory(history.map(x=>x.id===h.id?{...x,rating:opt.label}:x));setEvalOpen(null);}}
                          style={{...S.chip(false,opt.color),fontSize:11,padding:"7px 12px"}}>
                          {opt.emoji} {opt.label}
                        </PressButton>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </FadeUp>
          );
        })}
      </div>
    );
  };

  const ProfileTab = () => {
    const evals = ls.get(`bl_eval_${uid}`,[]);
    const avgConf = history.length?Math.round(history.reduce((a,h)=>a+(h.result?.confidence||7),0)/history.length):0;
    const personalAdj = getPersonalAdj(uid);
    const learnedCount = evals.filter(e=>e.actualKey!==null&&e.actualKey!==undefined).length;

    return (
      <div>
        <FadeUp>
          <div style={{...S.card,textAlign:"center",marginBottom:16,
            background:"linear-gradient(140deg,rgba(124,106,247,0.15),rgba(34,211,238,0.06))",
            borderColor:C.borderHi,padding:"28px 20px"}}>
            <div style={{width:72,height:72,borderRadius:"50%",margin:"0 auto 14px",
              background:C.grad,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:28,fontWeight:900,boxShadow:`0 0 30px rgba(124,106,247,0.5)`}}>
              {(user.name||"U")[0].toUpperCase()}
            </div>
            <div style={{fontSize:20,fontWeight:900}}>{user.name||"사용자"}</div>
            <div style={{fontSize:12,color:C.mid,marginTop:4}}>{user.email}</div>
            {learnedCount>0&&(
              <div style={{marginTop:16,padding:"12px 16px",borderRadius:14,
                background:personalAdj!==0?"rgba(34,211,238,0.1)":"rgba(124,106,247,0.1)",
                border:`1px solid ${personalAdj!==0?C.cyan:C.accent}44`,fontSize:13}}>
                {personalAdj!==0?(
                  <>
                    <div style={{color:C.cyan,fontWeight:700}}>🧠 개인 학습 완료!</div>
                    <div style={{color:C.mid,marginTop:4,fontSize:12}}>
                      추천키보다 {personalAdj>0?`+${personalAdj}키 높게`:`${Math.abs(personalAdj)}키 낮게`} 부르는 걸 선호해요
                    </div>
                  </>
                ):(
                  <>
                    <div style={{color:C.accent,fontWeight:700}}>📊 학습 데이터 수집 중</div>
                    <div style={{color:C.mid,marginTop:4,fontSize:12}}>{learnedCount}건 수집됨</div>
                  </>
                )}
              </div>
            )}
          </div>
        </FadeUp>
        <FadeUp delay={50}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
            {[{icon:"🎯",label:"분석",val:history.length},{icon:"⭐",label:"확신도",val:avgConf?`${avgConf}/10`:"-"},{icon:"🧠",label:"학습",val:learnedCount}].map(s=>(
              <div key={s.label} style={{...S.card,textAlign:"center",padding:"16px 8px"}}>
                <div style={{fontSize:24}}>{s.icon}</div>
                <div style={{fontSize:22,fontWeight:900,color:C.accent,margin:"6px 0"}}>{s.val}</div>
                <div style={{fontSize:10,color:C.dim}}>{s.label}</div>
              </div>
            ))}
          </div>
        </FadeUp>
        <FadeUp delay={100}>
          <div style={{...S.card,marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>🎤 내 음역대</div>
            <div style={{fontSize:12,color:C.dim,marginBottom:14}}>정확한 키 계산의 핵심이에요!</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {VOICE_TYPES.map(v=>(
                <PressButton key={v.id} onClick={()=>saveVoiceType(v.id)}
                  style={{...S.chip(voiceType===v.id,C.accent),
                    display:"flex",flexDirection:"column",alignItems:"center",
                    gap:5,padding:"14px 6px",borderRadius:16,textAlign:"center",
                    boxShadow:voiceType===v.id?`0 4px 20px rgba(124,106,247,0.4)`:"none"}}>
                  <span style={{fontSize:24}}>{v.emoji}</span>
                  <span style={{fontSize:12,fontWeight:700}}>{v.label}</span>
                  <span style={{fontSize:9,color:voiceType===v.id?"rgba(255,255,255,0.6)":C.dim}}>{v.desc}</span>
                </PressButton>
              ))}
            </div>
            {voiceType?(
              <div style={{marginTop:12,padding:"10px 14px",borderRadius:12,background:C.accentDim,border:`1px solid ${C.borderHi}`,fontSize:12,color:C.accent,textAlign:"center",fontWeight:600}}>
                ✅ {VOICE_TYPES.find(v=>v.id===voiceType)?.label} 설정됨
              </div>
            ):(
              <div style={{marginTop:12,padding:"10px 14px",borderRadius:12,background:C.amberDim,border:"1px solid rgba(245,158,11,0.3)",fontSize:12,color:C.amber,textAlign:"center"}}>
                ⚠️ 설정하지 않으면 키 추천이 부정확해요!
              </div>
            )}
          </div>
        </FadeUp>
        <PressButton onClick={onLogout}
          style={{...S.bigBtn(false),background:C.glass,border:`1px solid ${C.border}`,color:C.mid,boxShadow:"none"}}>
          로그아웃
        </PressButton>
      </div>
    );
  };

  const TABS = [
    {id:"home",   icon:"🏠", label:"홈"},
    {id:"result", icon:"✨", label:"결과"},
    {id:"library",icon:"🗂", label:"레파토리"},
    {id:"history",icon:"📝", label:"기록"},
    {id:"profile",icon:"👤", label:"프로필"},
  ];

  return (
    <div style={S.app}>
      <style>{GLOBAL_CSS}</style>
      <BgBlobs/>
      <div style={{...S.wrap,paddingTop:0,paddingBottom:96}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"20px 0 14px",position:"sticky",top:0,zIndex:50,
          background:`linear-gradient(to bottom,${C.bg} 75%,transparent)`,
          backdropFilter:"blur(8px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,borderRadius:12,background:C.grad,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:18,boxShadow:`0 0 20px rgba(124,106,247,0.5)`}}>🎤</div>
            <div>
              <div style={{fontSize:17,fontWeight:900,letterSpacing:"-0.5px",
                background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                부를레옹
              </div>
              <div style={{fontSize:9,color:C.dim}}>{user.name} · AI 노래방 코치</div>
            </div>
          </div>
          {repo.length>0&&<span style={{...S.tag(C.accent),fontSize:10,padding:"3px 10px"}}>🗂 {repo.length}</span>}
        </div>

        <div key={tab} style={{animation:"fadeUp 0.25s ease forwards"}}>
          {tab==="home"&&(
            <HomeTab
              comfSongs={comfSongs} setComfSongs={setComfSongs}
              targetSong={targetSong} setTargetSong={setTargetSong}
              situation={situation} setSituation={setSituation}
              condition={condition} setCondition={setCondition}
              extraNote={extraNote} setExtraNote={setExtraNote}
              quickMode={quickMode} setQuickMode={setQuickMode}
              loading={loading} loadStep={loadStep}
              onRun={runAnalysis}
              voiceType={voiceType}
              onGoProfile={()=>changeTab("profile")}
            />
          )}
          {tab==="result"&&(
            <ResultTab
              result={result} targetSong={targetSong}
              situation={situation} uid={uid}
              repo={repo} saveRepo={saveRepo}
              setTab={changeTab}
            />
          )}
          {tab==="library"&&<LibraryTab/>}
          {tab==="history"&&<HistoryTab/>}
          {tab==="profile"&&<ProfileTab/>}
        </div>
      </div>

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:520,zIndex:100}}>
        <div style={{background:`${C.card}ee`,backdropFilter:"blur(24px)",borderTop:`1px solid ${C.border}`,display:"flex",paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
          {TABS.map(t=>(
            <PressButton key={t.id} onClick={()=>changeTab(t.id)}
              style={{flex:1,padding:"12px 0 10px",background:"transparent",border:"none",
                cursor:"pointer",display:"flex",flexDirection:"column",
                alignItems:"center",gap:3,position:"relative",
                color:tab===t.id?C.accent:C.dim,transition:"color 0.2s"}}>
              {tab===t.id&&(
                <div style={{position:"absolute",top:0,left:"20%",right:"20%",
                  height:2,background:C.grad,borderRadius:"0 0 3px 3px",
                  animation:"scaleIn 0.2s ease forwards"}}/>
              )}
              <span style={{fontSize:20,transition:"transform 0.2s",transform:tab===t.id?"scale(1.15)":"scale(1)"}}>{t.icon}</span>
              <span style={{fontSize:10,fontWeight:tab===t.id?700:400}}>{t.label}</span>
            </PressButton>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen,setScreen]=useState(()=>ls.get("bl_sess",null)?"app":"login");
  const [user,  setUser  ]=useState(()=>ls.get("bl_sess",null));
  const login =(u)=>{ setUser(u); setScreen("app"); };
  const logout=()=>{ ls.del("bl_sess"); setUser(null); setScreen("login"); };
  if(screen==="register") return <RegisterScreen onLogin={login} onBack={()=>setScreen("login")}/>;
  if(screen==="login")    return <LoginScreen onLogin={login} onRegister={()=>setScreen("register")}/>;
  if(user)                return <MainApp user={user} onLogout={logout}/>;
  return null;
}
