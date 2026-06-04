import { useState, useEffect, useRef, useCallback } from "react";

// ── TJ DB 검색 ──────────────────────────────────────────────────
let TJ_DB = null;

const loadDB = async () => {
  if (TJ_DB) return TJ_DB;
  try {
    const res = await fetch("/tj_namu.json");
    TJ_DB = await res.json();
  } catch(e) {
    TJ_DB = [];
  }
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
  ).slice(0, 20).map(s => ({
    ...s,
    id: "tj_" + s.tj,
    genre: "발라드",
    difficulty: 2,
    energy: 2,
    minNote: 48,
    maxNote: 67,
  }));
};
// ─────────────────────────────────────────────────────────────────
// ⚙️  API 베이스 URL — Vercel 배포 후 여기만 바꾸면 됩니다
// ─────────────────────────────────────────────────────────────────
const API_BASE = "https://bouleon-api.vercel.app";
// 로컬 테스트: const API_BASE = "http://localhost:3000";

// ─────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────
const C = {
  bg:"#060010", card:"#0e0e20", card2:"#141430",
  glass:"rgba(255,255,255,0.04)", border:"rgba(255,255,255,0.07)",
  borderHi:"rgba(124,106,247,0.5)",
  accent:"#7c6af7", accentDim:"rgba(124,106,247,0.18)",
  cyan:"#22d3ee", cyanDim:"rgba(34,211,238,0.12)",
  rose:"#f43f5e", roseDim:"rgba(244,63,94,0.12)",
  amber:"#f59e0b", green:"#10b981",
  text:"#f1f5f9", mid:"#94a3b8", dim:"#475569",
  grad:"linear-gradient(135deg,#7c6af7,#22d3ee)",
  gradWarm:"linear-gradient(135deg,#f43f5e,#f59e0b)",
};
const glow = (c,s=20) => `0 0 ${s}px ${c}`;
const focusIn  = e => { e.target.style.borderColor=C.accent; e.target.style.boxShadow=glow("rgba(124,106,247,0.3)",14); };
const focusOut = e => { e.target.style.borderColor=C.border;  e.target.style.boxShadow="none"; };

const S = {
  app:{ minHeight:"100vh", background:C.bg, color:C.text,
    fontFamily:"'Pretendard Variable','Pretendard',system-ui,sans-serif", overflowX:"hidden" },
  wrap:{ maxWidth:520, margin:"0 auto", padding:"0 16px", position:"relative", zIndex:1 },
  card:{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:"18px" },
  inp:{ width:"100%", background:C.card2, border:`1px solid ${C.border}`,
    borderRadius:12, padding:"12px 16px", color:C.text, fontSize:14,
    outline:"none", boxSizing:"border-box", transition:"border-color .2s" },
  bigBtn:(on=true,col=null)=>({
    width:"100%", padding:"15px", borderRadius:14, border:"none",
    background:col||(on?C.grad:C.glass), color:on?"#fff":C.mid,
    border:on&&!col?"none":`1px solid ${C.border}`,
    fontSize:15, fontWeight:700, cursor:"pointer",
    boxShadow:on?`0 4px 28px rgba(124,106,247,0.35)`:"none",
  }),
  chip:(on,col=C.accent)=>({
    padding:"8px 14px", borderRadius:20,
    border:`1px solid ${on?col:C.border}`,
    background:on?`${col}22`:C.glass,
    color:on?"#fff":C.mid,
    fontSize:13, fontWeight:600, cursor:"pointer", transition:"all .18s", whiteSpace:"nowrap",
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
  { id:"friend", emoji:"👫", label:"친구들이랑", color:C.accent,
    roles:["분위기 풀기","안정적인 곡","오늘의 필살기","쉬어가는 곡","마무리 곡"] },
  { id:"date",   emoji:"💕", label:"썸/데이트",  color:C.rose,
    roles:["부담 없는 시작","감성 곡","필살기 곡","상대가 아는 곡","분위기 유지"] },
  { id:"work",   emoji:"🥂", label:"회식",       color:C.amber,
    roles:["모두 아는 곡","짧고 안전한 곡","분위기 띄우기","무리 안 하기","마무리 곡"] },
  { id:"solo",   emoji:"🎤", label:"혼자 연습",  color:C.cyan,
    roles:["워밍업 곡","연습 목표곡","약점 보완 곡","자신감 충전","도전 곡"] },
  { id:"wedding",emoji:"💍", label:"축가",       color:C.green,
    roles:["오프닝 곡","축가 메인","앙코르 대비"] },
];
const CONDITIONS = [
  { id:"great",  emoji:"🔥", label:"목 상태 최고",   maxDiff:5 },
  { id:"good",   emoji:"😊", label:"컨디션 좋음",     maxDiff:4 },
  { id:"normal", emoji:"😐", label:"보통",             maxDiff:3 },
  { id:"bad",    emoji:"😤", label:"목이 좀 안좋음",  maxDiff:2 },
  { id:"sick",   emoji:"🤒", label:"오늘 최악",       maxDiff:1 },
];
const REPO_TAGS = [
  { id:"safe",   emoji:"🛡",  label:"안전곡",   color:C.green  },
  { id:"killer", emoji:"⚡",  label:"필살기",   color:C.amber  },
  { id:"vibe",   emoji:"🎉",  label:"분위기UP", color:C.accent },
  { id:"ballad", emoji:"🫶",  label:"감성곡",   color:C.rose   },
  { id:"date",   emoji:"💕",  label:"썸/데이트",color:"#ec4899" },
  { id:"work",   emoji:"🥂",  label:"회식용",   color:C.amber  },
  { id:"prac",   emoji:"📖",  label:"연습중",   color:C.mid    },
  { id:"high",   emoji:"⚠️",  label:"고음주의", color:C.rose   },
  { id:"opener", emoji:"🎵",  label:"첫 곡",    color:C.cyan   },
  { id:"closer", emoji:"🌙",  label:"마무리곡", color:"#818cf8" },
];
const EVAL_OPTIONS = [
  { id:"great",  emoji:"😄", label:"편하게 불렀어요",   color:C.green },
  { id:"high",   emoji:"😅", label:"고음이 어려웠어요", color:C.amber },
  { id:"breath", emoji:"💨", label:"호흡이 부족했어요", color:C.amber },
  { id:"vibe",   emoji:"🎉", label:"분위기가 좋았어요", color:C.accent},
  { id:"again",  emoji:"🔄", label:"다시 부르고 싶어요",color:C.cyan  },
  { id:"skip",   emoji:"🚫", label:"다시 안 부를래요",  color:C.rose  },
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
// TJ 검색 API 호출
// ─────────────────────────────────────────────────────────────────
const searchTJ = async (query, searchType="1") => {
  try {
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}&type=${searchType}`);
    if (!res.ok) throw new Error("API 오류");
    const data = await res.json();
    return (data.songs || []).map(s => ({
      ...s,
      id: `tj_${s.tj}`,
      genre: guessGenre(s.title, s.artist),
      difficulty: 2,
      energy: 2,
      minNote: 48,
      maxNote: 67,
    }));
  } catch(e) {
    console.error("TJ 검색 실패:", e);
    return [];
  }
};

// 장르 추측 (TJ에서 장르 정보를 제공하지 않아서)
const guessGenre = (title, artist) => {
  const kpopArtists = ["BTS","블랙핑크","TWICE","아이유","NewJeans","IVE","aespa","BLACKPINK","트와이스","방탄"];
  const trotArtists = ["임영웅","영탁","이찬원","정동원","장윤정","박상철","나훈아","주현미","이미자"];
  const a = artist || "";
  if (kpopArtists.some(x => a.includes(x))) return "K-POP";
  if (trotArtists.some(x => a.includes(x))) return "트로트";
  return "발라드";
};

// Claude API 호출
const callClaude = async (prompt) => {
  const res = await fetch("https://bouleon-api.vercel.app/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "API 오류");
  return data.text;
};

const parseJSON = text => {
  try{ return JSON.parse(text.replace(/```json|```/g,"").trim()); }
  catch{ return null; }
};

// ─────────────────────────────────────────────────────────────────
// BACKGROUND BLOBS
// ─────────────────────────────────────────────────────────────────
function BgBlobs() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {[
        {x:"-15%",y:"-10%",s:"65vw",c:"rgba(124,106,247,0.12)"},
        {x:"55%", y:"25%", s:"50vw",c:"rgba(34,211,238,0.07)"},
        {x:"5%",  y:"58%", s:"40vw",c:"rgba(244,63,94,0.05)"},
      ].map((b,i)=>(
        <div key={i} style={{position:"absolute",left:b.x,top:b.y,
          width:b.s,height:b.s,borderRadius:"50%",filter:"blur(52px)",
          background:`radial-gradient(circle,${b.c} 0%,transparent 70%)`}}/>
      ))}
    </div>
  );
}

function LogoMark({size=56}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <div style={{width:size,height:size,borderRadius:size*0.26,
        background:C.grad,display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:size*0.42,boxShadow:`0 0 ${size*0.5}px rgba(124,106,247,0.45)`}}>🎤</div>
      <div style={{fontWeight:900,fontSize:size*0.45,letterSpacing:"-0.5px",
        background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>부를레옹</div>
      <div style={{fontSize:10,color:C.dim,letterSpacing:"1.5px"}}>AI 노래방 코치</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SONG SEARCH INPUT — TJ 실제 API 호출
// ─────────────────────────────────────────────────────────────────
// ✅ MainApp 밖에 선언 → 리렌더돼도 새로 만들어지지 않음
const SongSearchInput = ({ label, value, onChange, placeholder }) => {
  const [q, setQ]             = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen]       = useState(false);
  const [status, setStatus]   = useState("idle"); // idle | searching | done | error
  const ref   = useRef(null);
  const timer = useRef(null);

  // 외부 value가 바뀔 때만 q 동기화
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
    if (!query.trim()) { setResults([]); setOpen(false); setStatus("idle"); return; }

    setStatus("searching");
    setOpen(true);

    // 300ms 디바운스 (TJ API는 빠르니까 짧게)
timer.current = setTimeout(async () => {
  try {
    const res = await searchDB(query);
    setResults(res);
    setStatus(res.length > 0 ? "done" : "empty");
  } catch(e) {
    setStatus("error");
  }
}, 300);
  }, []);

  const pick = (s) => {
    onChange(s);
    setOpen(false);
    setResults([]);
    setStatus("idle");
  };

  return (
    <div ref={ref} style={{position:"relative",marginBottom:12}}>
      {label && <label style={{fontSize:12,color:C.mid,marginBottom:5,display:"block"}}>{label}</label>}
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",
          fontSize:14,zIndex:1,
          color: value ? C.green : status==="searching" ? C.accent : C.dim}}>
          {value ? "✓" : status==="searching" ? "⟳" : "🔍"}
        </span>
        <input
          style={{...S.inp, paddingLeft:38}}
          placeholder={placeholder||"곡명 또는 가수명 검색..."}
          value={q}
          onChange={e => search(e.target.value)}
          onFocus={e => { focusIn(e); if(results.length>0) setOpen(true); }}
          onBlur={focusOut}
        />
      </div>

      {open && (
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:300,
          background:C.card2,border:`1px solid ${C.border}`,
          borderRadius:14,marginTop:4,overflow:"hidden",
          boxShadow:`0 24px 60px rgba(0,0,0,0.7)`}}>

          {status==="searching" && (
            <div style={{padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:12,color:C.mid}}>🔍 TJ미디어에서 검색 중...</div>
            </div>
          )}

          {status==="empty" && (
            <div style={{padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:12,color:C.dim,marginBottom:6}}>검색 결과가 없어요</div>
              <div style={{fontSize:11,color:C.dim}}>다른 검색어를 입력해보세요</div>
            </div>
          )}

          {status==="error" && (
            <div style={{padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:12,color:C.rose,marginBottom:4}}>⚠️ API 서버에 연결할 수 없어요</div>
              <div style={{fontSize:11,color:C.dim}}>Vercel 배포 후 사용 가능합니다</div>
            </div>
          )}

          {status==="done" && results.map((s,i) => (
            <div key={s.id||i} onClick={() => pick(s)}
              style={{padding:"10px 14px",cursor:"pointer",
                borderBottom:i<results.length-1?`1px solid ${C.border}`:"none",
                transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.glass}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,overflow:"hidden",
                    textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</div>
                  <div style={{fontSize:11,color:C.mid,marginTop:1}}>{s.artist}</div>
                  {s.lyricist && <div style={{fontSize:10,color:C.dim,marginTop:1}}>작사: {s.lyricist}</div>}
                </div>
                <div style={{marginLeft:10,flexShrink:0,textAlign:"right"}}>
                  <div style={{fontSize:11,color:C.accent,fontWeight:700,
                    background:C.accentDim,padding:"2px 7px",borderRadius:6}}>
                    TJ {s.tj}
                  </div>
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
// AUTH SCREENS
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
      <BgBlobs/>
      <div style={{...S.wrap,paddingTop:72,paddingBottom:48}}>
        <div style={{textAlign:"center",marginBottom:44}}><LogoMark size={64}/></div>
        <div style={{...S.card,backdropFilter:"blur(24px)"}}>
          <h2 style={{margin:"0 0 20px",fontSize:18,fontWeight:800}}>로그인</h2>
          {[{label:"이메일",val:email,set:setEmail,type:"email",ph:"hello@bouleon.ai"},
            {label:"비밀번호",val:pw,set:setPw,type:"password",ph:"••••••••"}
          ].map(f=>(
            <div key={f.label} style={{marginBottom:12}}>
              <label style={{fontSize:12,color:C.mid,marginBottom:5,display:"block"}}>{f.label}</label>
              <input style={S.inp} type={f.type} placeholder={f.ph}
                value={f.val} onChange={e=>f.set(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&doLogin()}
                onFocus={focusIn} onBlur={focusOut}/>
            </div>
          ))}
          {err&&<p style={{color:C.rose,fontSize:12,margin:"6px 0 0"}}>{err}</p>}
          <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16}}>
            <button style={{...S.bigBtn(true),opacity:loading?.7:1}} onClick={doLogin} disabled={loading}>
              {loading?"확인 중...":"로그인"}
            </button>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,height:"1px",background:C.border}}/>
              <span style={{fontSize:11,color:C.dim}}>소셜 로그인</span>
              <div style={{flex:1,height:"1px",background:C.border}}/>
            </div>
            {[
              {bg:"#FEE500",color:"#000",label:"💬 카카오로 시작하기",name:"kakao"},
              {bg:"#fff",color:"#222",label:"🌐 Google로 시작하기",name:"google"},
              {bg:"#000",color:"#fff",label:"🍎 Apple로 시작하기",name:"apple"},
            ].map(s=>(
              <button key={s.name} onClick={()=>social(s.name)}
                style={{width:"100%",padding:"13px",borderRadius:12,border:"none",
                  background:s.bg,color:s.color,fontWeight:700,fontSize:14,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {s.label}
              </button>
            ))}
            <button onClick={()=>{const u={email:"guest@bouleon.ai",name:"게스트",isGuest:true};ls.set("bl_sess",u);onLogin(u);}}
              style={{...S.bigBtn(false),boxShadow:"none"}}>
              👤 게스트로 둘러보기
            </button>
          </div>
        </div>
        <p style={{textAlign:"center",marginTop:20,color:C.mid,fontSize:13}}>
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
      <BgBlobs/>
      <div style={{...S.wrap,paddingTop:52,paddingBottom:48}}>
        <div style={{textAlign:"center",marginBottom:32}}><LogoMark size={52}/></div>
        <div style={{...S.card,backdropFilter:"blur(24px)"}}>
          <h2 style={{margin:"0 0 20px",fontSize:18,fontWeight:800}}>회원가입</h2>
          {[{k:"name",type:"text",label:"닉네임",ph:"예) 노래왕"},
            {k:"email",type:"email",label:"이메일",ph:"hello@bouleon.ai"},
            {k:"pw",type:"password",label:"비밀번호 (6자 이상)",ph:"••••••••"},
            {k:"pw2",type:"password",label:"비밀번호 확인",ph:"••••••••"},
          ].map(fi=>(
            <div key={fi.k} style={{marginBottom:12}}>
              <label style={{fontSize:12,color:C.mid,marginBottom:5,display:"block"}}>{fi.label}</label>
              <input style={S.inp} type={fi.type} placeholder={fi.ph}
                value={f[fi.k]} onChange={e=>setF(p=>({...p,[fi.k]:e.target.value}))}
                onFocus={focusIn} onBlur={focusOut}/>
            </div>
          ))}
          {err&&<p style={{color:C.rose,fontSize:12,margin:"6px 0 0"}}>{err}</p>}
          <button style={{...S.bigBtn(true),marginTop:16,opacity:loading?.7:1}} onClick={doReg} disabled={loading}>
            {loading?"가입 중...":"🎵 부를레옹 시작하기"}
          </button>
        </div>
        <p style={{textAlign:"center",marginTop:20,color:C.mid,fontSize:13}}>
          계정이 있으신가요?{" "}
          <span onClick={onBack} style={{color:C.accent,cursor:"pointer",fontWeight:700}}>로그인</span>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// HOME TAB — MainApp 밖으로 분리 (화면 리셋 버그 수정)
// ─────────────────────────────────────────────────────────────────
const HomeTab = ({
  comfSongs, setComfSongs, targetSong, setTargetSong,
  situation, setSituation, condition, setCondition,
  extraNote, setExtraNote, quickMode, setQuickMode,
  loading, loadStep, onRun
}) => {
  const LOAD_MSGS=["🎵 목소리 패턴 분석 중...","🎹 최적 키 계산하는 중...","🎭 상황별 전략 수립 중...","✨ 나만의 가이드 작성 중..."];

  return (
    <div>
      {/* Hero */}
      <div style={{background:"linear-gradient(140deg,rgba(124,106,247,0.18),rgba(34,211,238,0.08))",
        border:`1px solid ${C.borderHi}`,borderRadius:24,padding:"22px 20px",
        marginBottom:20,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(124,106,247,0.25) 0%,transparent 70%)"}}/>
        <div style={{fontSize:22,fontWeight:900,lineHeight:1.3,marginBottom:6,
          background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          오늘 노래방 가세요?
        </div>
        <div style={{fontSize:14,color:C.mid,lineHeight:1.6}}>
          안 망할 곡 골라드릴게요.<br/>
          <span style={{color:"#fff",fontWeight:600}}>편한 곡 1곡</span>만 알려줘도 바로 분석!
        </div>
        {/* TJ 뱃지 */}
        <div style={{marginTop:12,display:"inline-flex",alignItems:"center",gap:6,
          padding:"5px 12px",borderRadius:20,
          background:"rgba(124,106,247,0.2)",border:`1px solid ${C.borderHi}`}}>
          <span style={{fontSize:11,color:C.accent,fontWeight:600}}>🎵 TJ미디어 실제 DB 연동</span>
        </div>
        {/* 빠른/정밀 토글 */}
        <div style={{display:"flex",gap:8,marginTop:12}}>
          {[{v:true,l:"⚡ 빠른 추천"},{v:false,l:"🎯 정밀 추천"}].map(m=>(
            <button key={String(m.v)} onClick={()=>setQuickMode(m.v)}
              style={{...S.chip(quickMode===m.v),fontSize:12,padding:"6px 14px"}}>
              {m.l}
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1 */}
      <div style={{...S.card,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:C.grad,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:11,fontWeight:800,color:"#fff",flexShrink:0}}>1</div>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>평소 편하게 부르는 곡</div>
            <div style={{fontSize:11,color:C.dim}}>{quickMode?"1곡이면 충분해요":"2~3곡으로 더 정밀하게 분석"}</div>
          </div>
        </div>
        {[0,...(quickMode?[]:[1,2])].map(i=>(
          <SongSearchInput key={i}
            label={`기준곡 ${i+1}${i===0?" *필수":"(선택)"}`}
            value={comfSongs[i]||null}
            onChange={s=>{ const c=[...comfSongs]; c[i]=s; setComfSongs(c); }}
            placeholder={i===0?"편하게 부르는 곡 검색...":i===1?"두 번째 기준곡...":"세 번째 기준곡..."}
          />
        ))}
      </div>

      {/* STEP 2 */}
      <div style={{...S.card,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:C.gradWarm,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:11,fontWeight:800,color:"#fff",flexShrink:0}}>2</div>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>부르고 싶은 목표곡 *</div>
            <div style={{fontSize:11,color:C.dim}}>TJ미디어 전곡 검색 가능</div>
          </div>
        </div>
        <SongSearchInput value={targetSong} onChange={setTargetSong}
          placeholder="목표곡 검색 (예: 야생화, 좋은날, 사랑했지만...)"/>
        {targetSong && (
          <div style={{background:C.glass,borderRadius:12,padding:"10px 12px",
            border:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:13,fontWeight:700}}>{targetSong.title}</div>
              <div style={{fontSize:11,color:C.mid,marginTop:1}}>{targetSong.artist}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
              {targetSong.tj && <span style={S.tag(C.accent)}>TJ {targetSong.tj}</span>}
            </div>
          </div>
        )}
      </div>

      {/* STEP 3 상황 */}
      <div style={{...S.card,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <div style={{width:24,height:24,borderRadius:"50%",
            background:"rgba(34,211,238,0.2)",border:`1px solid ${C.cyan}`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:11,fontWeight:800,color:C.cyan,flexShrink:0}}>3</div>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>오늘 상황 <span style={{fontSize:11,color:C.dim}}>(선택)</span></div>
            <div style={{fontSize:11,color:C.dim}}>상황별 5곡 세트리스트를 만들어드려요</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {SITUATIONS.map(s=>(
            <div key={s.id} onClick={()=>setSituation(situation===s.id?null:s.id)}
              style={{...S.chip(situation===s.id,s.color),
                display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                padding:"10px 6px",borderRadius:14,textAlign:"center"}}>
              <span style={{fontSize:20}}>{s.emoji}</span>
              <span style={{fontSize:11}}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 4 컨디션 */}
      <div style={{...S.card,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <div style={{width:24,height:24,borderRadius:"50%",
            background:"rgba(244,63,94,0.2)",border:`1px solid ${C.rose}`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:11,fontWeight:800,color:C.rose,flexShrink:0}}>4</div>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>오늘 목 컨디션 <span style={{fontSize:11,color:C.dim}}>(선택)</span></div>
            <div style={{fontSize:11,color:C.dim}}>컨디션에 맞는 난이도를 추천해드려요</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {CONDITIONS.map(c=>(
            <div key={c.id} onClick={()=>setCondition(condition===c.id?null:c.id)}
              style={{...S.chip(condition===c.id,C.rose),
                display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"10px 14px",borderRadius:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>{c.emoji}</span>
                <span style={{fontSize:13,fontWeight:600}}>{c.label}</span>
              </div>
              <div style={{display:"flex",gap:3}}>
                {[1,2,3,4,5].map(n=>(
                  <div key={n} style={{width:8,height:8,borderRadius:2,
                    background:n<=c.maxDiff?C.rose:"rgba(255,255,255,0.1)"}}/>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 메모 */}
      <div style={{...S.card,marginBottom:20}}>
        <label style={{fontSize:12,color:C.mid,marginBottom:8,display:"block"}}>
          💬 AI에게 더 알려줄 것 <span style={{color:C.dim}}>(선택)</span>
        </label>
        <textarea value={extraNote} onChange={e=>setExtraNote(e.target.value)}
          placeholder="예: 고음이 약해요 / 첫 소절이 불안해요 / 술 한 잔 했어요..."
          style={{...S.inp,resize:"none",minHeight:70,lineHeight:1.6}}
          onFocus={focusIn} onBlur={focusOut}/>
      </div>

      {/* CTA */}
      {loading ? (
        <div style={{...S.card,textAlign:"center",padding:"28px 20px"}}>
          <div style={{fontSize:30,marginBottom:10,display:"inline-block",
            animation:"spin 1s linear infinite"}}>⚡</div>
          <div style={{fontSize:15,fontWeight:700,marginBottom:4,
            background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            {LOAD_MSGS[loadStep]}
          </div>
          <div style={{fontSize:12,color:C.dim}}>곧 결과가 나와요!</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <button style={S.bigBtn(true)} onClick={onRun}>✨ AI 키 분석 &amp; 추천 받기</button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// RESULT TAB — 분리
// ─────────────────────────────────────────────────────────────────
const ResultTab = ({ result, targetSong, situation, uid, repo, saveRepo, setTab }) => {
  const [saved,   setSaved]   = useState(false);
  const [showEval,setShowEval]= useState(false);
  const [evalSel, setEvalSel] = useState([]);

  if (!result) return (
    <div style={{...S.card,textAlign:"center",padding:48}}>
      <div style={{fontSize:40,marginBottom:12}}>🎵</div>
      <p style={{color:C.mid,margin:0,lineHeight:1.7}}>
        아직 분석 결과가 없어요.<br/>홈에서 먼저 분석을 시작해보세요!
      </p>
      <button onClick={()=>setTab("home")}
        style={{...S.bigBtn(true),marginTop:20,width:"auto",padding:"12px 28px"}}>
        분석 시작하기
      </button>
    </div>
  );

  const r = result;
  const feasColor = r.feasibility?.includes("쉬움")?C.green:r.feasibility?.includes("도전")?C.amber:C.rose;

  const saveToRepo = () => {
    if (!targetSong) return;
    const key = targetSong.id || `tj_${targetSong.tj}`;
    if (repo.find(x=>x.id===key)){alert("이미 레파토리에 있어요!"); return;}
    const tag = REPO_TAGS.find(t=>t.id===r.repoTag)||REPO_TAGS[6];
    saveRepo([{id:key,song:targetSong,tags:[tag.id],myKey:null,addedAt:Date.now()},...repo]);
    setSaved(true);
  };

  const submitEval = () => {
    if(!evalSel.length) return;
    const evals=ls.get(`bl_eval_${uid}`,[]);
    ls.set(`bl_eval_${uid}`,[{id:Date.now(),songTitle:targetSong?.title,evals:evalSel,date:new Date().toLocaleDateString("ko-KR")},...evals].slice(0,100));
    setShowEval(false);
    alert("📝 평가 저장됐어요! 다음 추천에 반영됩니다.");
  };

  return (
    <div>
      <button onClick={()=>setTab("home")}
        style={{background:"transparent",border:"none",color:C.mid,cursor:"pointer",
          fontSize:13,padding:"0 0 14px",display:"flex",alignItems:"center",gap:5}}>
        ← 다시 분석하기
      </button>

      {/* 핵심 카드 */}
      <div style={{background:"linear-gradient(140deg,rgba(124,106,247,0.2),rgba(34,211,238,0.08))",
        border:`1px solid ${C.borderHi}`,borderRadius:24,padding:"20px",
        marginBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(124,106,247,0.3) 0%,transparent 70%)"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,color:C.mid,marginBottom:3}}>🎯 분석 결과</div>
            <div style={{fontSize:17,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {targetSong?.title}
            </div>
            <div style={{fontSize:12,color:C.mid,marginTop:1}}>{targetSong?.artist}</div>
            {targetSong?.tj && (
              <span style={{...S.tag(C.accent),marginTop:5,display:"inline-flex"}}>TJ {targetSong.tj}</span>
            )}
          </div>
          <div style={{textAlign:"center",marginLeft:16,flexShrink:0}}>
            <div style={{fontSize:42,fontWeight:900,lineHeight:1,
              background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              {r.confidence}
            </div>
            <div style={{fontSize:10,color:C.dim}}>/ 10 확신도</div>
          </div>
        </div>
        <p style={{margin:0,fontSize:12,lineHeight:1.7,color:C.text,opacity:0.85}}>{r.voiceSummary}</p>
        <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
          <span style={S.tag(feasColor)}>{r.feasibility}</span>
          {r.vibes?.map(v=><span key={v} style={S.tag(C.dim)}>#{v}</span>)}
        </div>
      </div>

      {/* 추천 키 */}
      <div style={{...S.card,marginBottom:14,textAlign:"center",
        background:"linear-gradient(135deg,rgba(124,106,247,0.15),rgba(34,211,238,0.06))",
        borderColor:C.borderHi}}>
        <div style={{fontSize:11,color:C.mid,marginBottom:6}}>🎹 추천 시작 키</div>
        <div style={{fontSize:60,fontWeight:900,lineHeight:1,
          background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          {r.recommendedKey}
        </div>
        <p style={{margin:"10px 0 0",fontSize:12,color:C.mid,lineHeight:1.6}}>{r.keyLogic}</p>
      </div>

      {/* 컨디션 + 상황 */}
      {(r.conditionTip||r.situationStrategy)&&(
        <div style={{display:"grid",
          gridTemplateColumns:r.conditionTip&&r.situationStrategy?"1fr 1fr":"1fr",
          gap:10,marginBottom:14}}>
          {r.conditionTip&&(
            <div style={{...S.card,borderColor:"rgba(244,63,94,0.3)",background:C.roseDim}}>
              <div style={{fontSize:11,color:C.rose,fontWeight:700,marginBottom:5}}>🩺 컨디션 팁</div>
              <p style={{margin:0,fontSize:12,lineHeight:1.6,color:C.mid}}>{r.conditionTip}</p>
            </div>
          )}
          {r.situationStrategy&&(
            <div style={{...S.card,borderColor:"rgba(34,211,238,0.3)",background:C.cyanDim}}>
              <div style={{fontSize:11,color:C.cyan,fontWeight:700,marginBottom:5}}>🎭 상황 전략</div>
              <p style={{margin:0,fontSize:12,lineHeight:1.6,color:C.mid}}>{r.situationStrategy}</p>
            </div>
          )}
        </div>
      )}

      {/* 세트리스트 */}
      {r.setlist&&situation&&(()=>{
        const sit=SITUATIONS.find(s=>s.id===situation);
        return (
          <div style={{...S.card,marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <span style={{fontSize:20}}>{sit?.emoji}</span>
              <div style={{fontSize:14,fontWeight:800}}>{sit?.label} 세트리스트</div>
            </div>
            {r.setlist.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
                <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,
                  background:i===2?C.grad:C.glass,
                  border:`1px solid ${i===2?C.accent:C.border}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,fontWeight:800,color:i===2?"#fff":C.mid}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <div style={{fontSize:13,fontWeight:700}}>{item.title}</div>
                    <span style={{fontSize:10,background:"rgba(124,106,247,0.2)",color:C.accent,
                      padding:"2px 7px",borderRadius:8,fontWeight:600}}>{item.role}</span>
                  </div>
                  <div style={{fontSize:11,color:C.mid,marginTop:1}}>{item.artist}</div>
                  {item.tj&&<span style={{...S.tag(C.accent),marginTop:4}}>TJ {item.tj}</span>}
                  <div style={{fontSize:11,color:i===2?C.accent:C.dim,marginTop:3}}>{item.reason}</div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* 보컬 팁 */}
      <div style={{...S.card,marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>💡 보컬 핵심 팁</div>
        {r.vocalTips?.map((tip,i)=>(
          <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
            <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,
              background:C.accentDim,border:`1px solid ${C.borderHi}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:10,fontWeight:700,color:C.accent}}>{i+1}</div>
            <p style={{margin:0,fontSize:13,lineHeight:1.6,color:C.mid,paddingTop:2}}>{tip}</p>
          </div>
        ))}
      </div>

      {/* 연습 가이드 */}
      <div style={{...S.card,marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>📋 단계별 연습 가이드</div>
        {r.practiceSteps?.map((step,i)=>(
          <div key={i} style={{display:"flex",gap:12,marginBottom:10,
            padding:"11px 14px",borderRadius:12,
            background:i===0?C.accentDim:C.glass,
            border:`1px solid ${i===0?C.borderHi:C.border}`}}>
            <span style={{fontSize:20,flexShrink:0}}>{["🎵","🎹","🎤","🌟"][i]||"✅"}</span>
            <div>
              <div style={{fontSize:11,color:C.accent,fontWeight:700,marginBottom:3}}>
                STEP {step.step}. {step.title}
              </div>
              <div style={{fontSize:13,lineHeight:1.6,color:C.text}}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 대체곡 */}
      <div style={{...S.card,marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>🎤 대체 추천곡</div>
        {r.alternatives?.map((alt,i)=>(
          <div key={i} style={{padding:"11px 14px",borderRadius:12,marginBottom:8,
            background:C.card2,border:`1px solid ${C.border}`,
            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700}}>{alt.title}</div>
              <div style={{fontSize:11,color:C.mid,marginTop:1}}>{alt.artist}</div>
              {alt.tj&&<span style={{...S.tag(C.accent),marginTop:4}}>TJ {alt.tj}</span>}
              <div style={{fontSize:11,color:C.accent,marginTop:3}}>✓ {alt.reason}</div>
            </div>
            <div style={{marginLeft:10,flexShrink:0}}>
              <span style={{fontSize:13,fontWeight:800,
                color:alt.matchScore>=8?C.green:alt.matchScore>=6?C.amber:C.mid}}>
                {alt.matchScore}/10
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 저장 + 평가 */}
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
        {!saved?(
          <button onClick={saveToRepo}
            style={{...S.bigBtn(true,`linear-gradient(135deg,${C.green},#059669)`),
              boxShadow:`0 4px 20px rgba(16,185,129,0.3)`}}>
            🗂 레파토리에 저장하기
          </button>
        ):(
          <div style={{...S.card,textAlign:"center",borderColor:"rgba(16,185,129,0.4)",
            background:"rgba(16,185,129,0.08)",padding:"12px"}}>
            ✅ 저장됐어요!{" "}
            <span onClick={()=>setTab("library")}
              style={{color:C.green,cursor:"pointer",textDecoration:"underline"}}>확인</span>
          </div>
        )}
        {!showEval?(
          <button onClick={()=>setShowEval(true)} style={{...S.bigBtn(false),boxShadow:"none"}}>
            📝 불러본 뒤 평가 남기기
          </button>
        ):(
          <div style={{...S.card,borderColor:`${C.accent}44`}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>어떻게 불렀나요?</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
              {EVAL_OPTIONS.map(opt=>(
                <button key={opt.id}
                  onClick={()=>setEvalSel(p=>p.includes(opt.id)?p.filter(x=>x!==opt.id):[...p,opt.id])}
                  style={{...S.chip(evalSel.includes(opt.id),opt.color),fontSize:12,padding:"7px 12px"}}>
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
            <button onClick={submitEval} disabled={!evalSel.length}
              style={{...S.bigBtn(evalSel.length>0),opacity:evalSel.length?1:0.4}}>
              평가 저장하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────
function MainApp({ user, onLogout }) {
  const uid = user.email;
  const [tab, setTab] = useState("home");

  // ✅ 모든 상태를 MainApp 최상위에 선언 (탭 분리해도 유지됨)
  const [quickMode,  setQuickMode]  = useState(true);
  const [comfSongs,  setComfSongs]  = useState([null,null,null]);
  const [targetSong, setTargetSong] = useState(null);
  const [situation,  setSituation]  = useState(null);
  const [condition,  setCondition]  = useState(null);
  const [extraNote,  setExtraNote]  = useState("");
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [loadStep,   setLoadStep]   = useState(0);

  const [repo,    setRepo]    = useState(()=>ls.get(`bl_repo_${uid}`   ,[]));
  const [history, setHistory] = useState(()=>ls.get(`bl_hist_${uid}`   ,[]));

  const saveRepo    = r=>{ setRepo(r);    ls.set(`bl_repo_${uid}`,r);    };
  const saveHistory = h=>{ setHistory(h); ls.set(`bl_hist_${uid}`,h); };

  // AI 분석 실행
  const runAnalysis = async () => {
  const valid = comfSongs.filter(Boolean);
  if (!valid.length) { alert("편하게 부르는 곡을 1개 이상 입력해주세요!"); return; }
  if (!targetSong)   { alert("목표곡을 입력해주세요!"); return; }

  setLoading(true); setResult(null); setLoadStep(0);
  const iv = setInterval(()=>setLoadStep(p=>(p+1)%4), 1400);

  const sit  = situation ? SITUATIONS.find(s=>s.id===situation) : null;
  const cond = condition ? CONDITIONS.find(c=>c.id===condition) : null;

  // 과거 키 추천 피드백 추출
  const keyFeedback = history.slice(0, 20)
    .filter(h => h.rating && h.target?.title && h.result?.recommendedKey)
    .map(h => `- "${h.target.title}"(${h.target.artist}) → ${h.result.recommendedKey} 추천했을 때 평가: "${h.rating}"`)
    .join("\n") || "없음";

  // 과거 평가 데이터
  const pastEvals = ls.get(`bl_eval_${uid}`, []);
  const evalSummary = pastEvals.slice(0, 10)
    .map(e => `- "${e.songTitle}": ${e.evals.join(", ")} (${e.date})`)
    .join("\n") || "없음";

  // 이 목표곡에 대한 이전 추천 기록
  const prevRec = history.find(h => h.target?.title === targetSong.title);
  const prevNote = prevRec
    ? `이전에 "${prevRec.result?.recommendedKey}"로 추천했고 평가는 "${prevRec.rating || "미평가"}"였음`
    : "이전 기록 없음";

  const prompt = `당신은 대한민국 최고의 노래방 AI 코치 "부를레옹"입니다.
사용자의 과거 피드백을 철저히 반영해서 개인화된 키를 추천해주세요.

[⚠️ 과거 키 추천 피드백 - 반드시 반영!]
${keyFeedback}

규칙:
- "대참사", "고음이 어려웠어요", "힘들었어요" → 이전 추천보다 1~2키 더 낮게
- "호흡이 부족했어요" → 이전 추천보다 1키 더 낮게  
- "편하게 불렀어요" → 현재 키 유지 또는 +1키
- "다시 부르고 싶어요" → 현재 키 유지
- "분위기가 좋았어요" → 현재 키 유지

[이 목표곡 이전 기록]
${prevNote}

[과거 부른 곡 평가]
${evalSummary}

[현재 입력]
- 기준곡: ${valid.map(s=>`"${s.title}"(${s.artist}), TJ:${s.tj||"미확인"}`).join(", ")}
- 목표곡: "${targetSong.title}"(${targetSong.artist}), TJ:${targetSong.tj||"미확인"}
- 상황: ${sit?sit.emoji+sit.label:"미선택"}
- 목 컨디션: ${cond?cond.emoji+cond.label:"미선택"}
- 메모: ${extraNote||"없음"}

[곡 음역 참고 지식]
기준곡과 목표곡의 실제 음역대, 전조 여부, 고음 구간을 정확히 분석하세요.
예) 야생화(박효신): Ab장조 시작, 후반 C장조까지 4키 전조, 최고음 C5
예) 좋은날(아이유): 3단 고음, 최고음 E5, 일반인 -3~-4키 권장
예) 잘 지내자 우리(거미): 중저음 발라드, 최고음 B4, 편안한 음역

대체곡 추천 시 반드시:
1. 기준곡과 비슷한 음역대의 곡
2. 비슷한 분위기/장르
3. 실제 TJ 노래방 번호 포함
4. 목표곡보다 약간 쉬운 곡 위주

JSON만 반환 (마크다운 없이):
{
  "voiceSummary": "기준곡 분석 기반 음역 설명 2문장 (친근하게, 구체적으로)",
  "feasibility": "부르기 쉬움 또는 도전적 또는 키 조절 필수",
  "recommendedKey": "0키 또는 -2키 형식 (과거 피드백 반영)",
  "keyLogic": "왜 이 키인지 과거 피드백 반영해서 구체적으로",
  "conditionTip": ${cond?'"컨디션 기반 한 문장 팁"':"null"},
  "situationStrategy": ${sit?'"상황 기반 두 문장 전략"':"null"},
  "vocalTips": ["구체적 팁1","구체적 팁2","구체적 팁3"],
  "practiceSteps": [
    {"step":1,"title":"단계명","desc":"구체적 연습법"},
    {"step":2,"title":"단계명","desc":"구체적 연습법"},
    {"step":3,"title":"단계명","desc":"구체적 연습법"}
  ],
  ${sit?`"setlist": [${sit.roles.map(r=>`{"role":"${r}","title":"실제곡명","artist":"실제가수","tj":"실제TJ번호","reason":"선택이유"}`).join(",")}],`:`"setlist": null,`}
  "alternatives": [
    {"title":"실제곡명","artist":"실제가수","tj":"실제TJ번호","reason":"음역/분위기 비교 이유","matchScore":9},
    {"title":"실제곡명","artist":"실제가수","tj":"실제TJ번호","reason":"음역/분위기 비교 이유","matchScore":8},
    {"title":"실제곡명","artist":"실제가수","tj":"실제TJ번호","reason":"음역/분위기 비교 이유","matchScore":7}
  ],
  "repoTag": "safe 또는 killer 또는 prac 또는 high",
  "confidence": 8,
  "vibes": ["키워드1","키워드2","키워드3"]
}`;

  try {
    const text = await callClaude(prompt);
    const parsed = parseJSON(text);
    const r = parsed || {
      voiceSummary:"분석 중 오류가 발생했어요. 다시 시도해주세요.",
      feasibility:"키 조절 필수",
      recommendedKey:"-2키",
      keyLogic:"기준곡 음역 대비 추천값입니다.",
      conditionTip:null, situationStrategy:null,
      vocalTips:["후렴 전 깊게 숨 들이쉬기","고음 구간에서 힘 빼기","끝 음절 부드럽게"],
      practiceSteps:[
        {step:1,title:"원곡 청취",desc:"원곡 3번 들으며 멜로디 파악"},
        {step:2,title:"허밍 연습",desc:"추천 키로 전체 허밍"},
        {step:3,title:"반복 연습",desc:"후렴구 위주 반복 후 전체 연결"},
      ],
      setlist:null,
      alternatives:[
        {title:"취중고백",artist:"김민석",tj:"23012",reason:"비슷한 음역의 감성 발라드",matchScore:9},
        {title:"걱정말아요 그대",artist:"이적",tj:"25080",reason:"따뜻하고 편안한 중저음",matchScore:8},
        {title:"거리에서",artist:"성시경",tj:"16040",reason:"안정적인 중저음 발라드",matchScore:7},
      ],
      repoTag:"prac", confidence:7, vibes:["감성","밤","발라드"],
    };

    const entry = {
      id:Date.now(), target:targetSong, comfSongs:valid,
      situation, condition, result:r,
      date:new Date().toLocaleDateString("ko-KR"), rating:null
    };
    setResult(r);
    saveHistory([entry,...history].slice(0,40));
    setTab("result");
  } catch(e) {
    alert("AI 연결 오류. 잠시 후 다시 시도해주세요.");
  }
  clearInterval(iv);
  setLoading(false);
};

  // ── 라이브러리 탭 ─────────────────────────────────────────────
  const LibraryTab = () => {
    const [filter,  setFilter]  = useState(null);
    const [editId,  setEditId]  = useState(null);
    const tagCounts = {};
    REPO_TAGS.forEach(t=>{ tagCounts[t.id]=repo.filter(r=>r.tags?.includes(t.id)).length; });
    const missing  = REPO_TAGS.filter(t=>tagCounts[t.id]===0).slice(0,3);
    const filtered = filter ? repo.filter(r=>r.tags?.includes(filter)) : repo;

    const toggleTag=(rid,tid)=>saveRepo(repo.map(r=>r.id!==rid?r
      :{...r,tags:r.tags?.includes(tid)?r.tags.filter(t=>t!==tid):[...(r.tags||[]),tid]}));
    const setMyKey =(rid,k)=>saveRepo(repo.map(r=>r.id===rid?{...r,myKey:k}:r));
    const remove   =(rid)=>{ if(window.confirm("삭제할까요?")) saveRepo(repo.filter(r=>r.id!==rid)); };

    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h2 style={{fontSize:18,fontWeight:800,margin:0}}>🗂 내 레파토리</h2>
          <span style={{...S.tag(C.accent),fontSize:12,padding:"3px 10px"}}>{repo.length}곡</span>
        </div>

        {repo.length>0&&(
          <div style={{...S.card,marginBottom:14,
            background:"linear-gradient(140deg,rgba(124,106,247,0.12),rgba(34,211,238,0.06))",
            borderColor:C.borderHi}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>📊 레파토리 현황</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
              {REPO_TAGS.slice(0,5).map(t=>(
                <div key={t.id} style={{textAlign:"center",padding:"8px 4px",borderRadius:10,
                  background:tagCounts[t.id]>0?`${t.color}18`:C.glass,
                  border:`1px solid ${tagCounts[t.id]>0?t.color+"44":C.border}`}}>
                  <div style={{fontSize:16}}>{t.emoji}</div>
                  <div style={{fontSize:18,fontWeight:800,color:tagCounts[t.id]>0?t.color:C.dim}}>
                    {tagCounts[t.id]}
                  </div>
                  <div style={{fontSize:9,color:C.dim,marginTop:1}}>{t.label}</div>
                </div>
              ))}
            </div>
            {missing.length>0&&(
              <div style={{marginTop:10,padding:"8px 12px",borderRadius:10,
                background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)"}}>
                <div style={{fontSize:11,color:C.amber,fontWeight:600}}>
                  💡 부족한 유형: {missing.map(t=>`${t.emoji}${t.label}`).join(", ")}
                </div>
                <div style={{fontSize:10,color:C.dim,marginTop:2}}>AI 추천으로 레파토리를 채워보세요!</div>
              </div>
            )}
          </div>
        )}

        {repo.length>0&&(
          <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}}>
            <button onClick={()=>setFilter(null)} style={{...S.chip(!filter,C.accent),fontSize:11,padding:"5px 12px",flexShrink:0}}>
              전체 {repo.length}
            </button>
            {REPO_TAGS.filter(t=>tagCounts[t.id]>0).map(t=>(
              <button key={t.id} onClick={()=>setFilter(filter===t.id?null:t.id)}
                style={{...S.chip(filter===t.id,t.color),fontSize:11,padding:"5px 12px",flexShrink:0}}>
                {t.emoji} {t.label} {tagCounts[t.id]}
              </button>
            ))}
          </div>
        )}

        {repo.length===0&&(
          <div style={{...S.card,textAlign:"center",padding:48}}>
            <div style={{fontSize:40,marginBottom:12}}>🎵</div>
            <p style={{color:C.mid,margin:0,lineHeight:1.7}}>
              아직 레파토리가 없어요.<br/>AI 분석 후 결과를 저장해보세요!
            </p>
            <button onClick={()=>setTab("home")}
              style={{...S.bigBtn(true),marginTop:20,width:"auto",padding:"12px 28px"}}>분석 시작하기</button>
          </div>
        )}

        {filtered.map(entry=>{
          const s=entry.song;
          const isEditing=editId===entry.id;
          return (
            <div key={entry.id} style={{...S.card,marginBottom:10,
              borderColor:isEditing?C.borderHi:C.border,transition:"border-color .2s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s?.title}</div>
                  <div style={{fontSize:11,color:C.mid,marginTop:1}}>{s?.artist}</div>
                  <div style={{display:"flex",gap:5,marginTop:4}}>
                    {s?.tj&&<span style={S.tag(C.accent)}>TJ {s.tj}</span>}
                    {entry.myKey&&<span style={S.tag(C.green)}>🎹 {entry.myKey}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,marginLeft:8,flexShrink:0}}>
                  <button onClick={()=>setEditId(isEditing?null:entry.id)}
                    style={{width:28,height:28,borderRadius:8,border:`1px solid ${C.border}`,background:C.glass,color:C.mid,cursor:"pointer",fontSize:13}}>✏️</button>
                  <button onClick={()=>remove(entry.id)}
                    style={{width:28,height:28,borderRadius:8,border:"1px solid rgba(244,63,94,0.3)",background:"rgba(244,63,94,0.08)",color:C.rose,cursor:"pointer",fontSize:13}}>✕</button>
                </div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>
                {REPO_TAGS.map(t=>(
                  <button key={t.id} onClick={()=>toggleTag(entry.id,t.id)}
                    style={{...S.chip(entry.tags?.includes(t.id),t.color),padding:"3px 8px",fontSize:10,borderRadius:12,opacity:entry.tags?.includes(t.id)?1:0.4}}>
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
              {isEditing&&(
                <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
                  <label style={{fontSize:11,color:C.mid,marginBottom:5,display:"block"}}>🎹 내 추천 키</label>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {["-3키","-2키","-1키","원키","+1키","+2키"].map(k=>(
                      <button key={k} onClick={()=>setMyKey(entry.id,k)}
                        style={{...S.chip(entry.myKey===k,C.accent),padding:"5px 10px",fontSize:11}}>{k}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── 기록 탭 ───────────────────────────────────────────────────
  const HistoryTab = () => {
    const [evalOpen,setEvalOpen]=useState(null);
    return (
      <div>
        <h2 style={{fontSize:18,fontWeight:800,margin:"0 0 16px"}}>📝 분석 & 평가 기록</h2>
        {history.length===0?(
          <div style={{...S.card,textAlign:"center",padding:48}}>
            <div style={{fontSize:40,marginBottom:12}}>📝</div>
            <p style={{color:C.mid,margin:0,lineHeight:1.7}}>기록이 없어요.<br/>첫 번째 곡을 분석해보세요!</p>
          </div>
        ):history.map((h,i)=>{
          const sit =h.situation?SITUATIONS.find(s=>s.id===h.situation):null;
          const cond=h.condition?CONDITIONS.find(c=>c.id===h.condition):null;
          const isOpen=evalOpen===h.id;
          return (
            <div key={h.id||i} style={{...S.card,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.target?.title}</div>
                  <div style={{fontSize:11,color:C.mid}}>{h.target?.artist}</div>
                </div>
                <span style={{fontSize:10,color:C.dim,flexShrink:0,marginLeft:8}}>{h.date}</span>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                <span style={S.tag(C.accent)}>키 {h.result?.recommendedKey}</span>
                {h.target?.tj&&<span style={S.tag(C.accent)}>TJ {h.target.tj}</span>}
                {sit&&<span style={S.tag(sit.color)}>{sit.emoji}{sit.label}</span>}
                {cond&&<span style={S.tag(C.rose)}>{cond.emoji}</span>}
                {h.rating&&<span style={S.tag(C.green)}>✅ {h.rating}</span>}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setResult(h.result);setTargetSong(h.target);setSituation(h.situation);setTab("result");}}
                  style={{...S.chip(false),flex:1,fontSize:12,padding:"7px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  📋 결과 보기
                </button>
                <button onClick={()=>setEvalOpen(isOpen?null:h.id)}
                  style={{...S.chip(isOpen,C.rose),flex:1,fontSize:12,padding:"7px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  ⭐ 평가
                </button>
              </div>
              {isOpen&&(
                <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {EVAL_OPTIONS.map(opt=>(
                      <button key={opt.id}
                        onClick={()=>{
                          saveHistory(history.map(x=>x.id===h.id?{...x,rating:opt.label}:x));
                          setEvalOpen(null);
                        }}
                        style={{...S.chip(false,opt.color),fontSize:11,padding:"6px 11px"}}>
                        {opt.emoji} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── 프로필 탭 ─────────────────────────────────────────────────
  const ProfileTab = () => {
    const avgConf=history.length?Math.round(history.reduce((a,h)=>a+(h.result?.confidence||7),0)/history.length):0;
    const evalCount=ls.get(`bl_eval_${uid}`,[]).length;
    return (
      <div>
        <div style={{...S.card,textAlign:"center",marginBottom:14,
          background:"linear-gradient(140deg,rgba(124,106,247,0.15),rgba(34,211,238,0.06))",borderColor:C.borderHi}}>
          <div style={{width:70,height:70,borderRadius:"50%",margin:"0 auto 12px",
            background:C.grad,display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:26,fontWeight:900,boxShadow:glow("rgba(124,106,247,0.5)",20)}}>
            {(user.name||"U")[0].toUpperCase()}
          </div>
          <div style={{fontSize:18,fontWeight:800}}>{user.name||"사용자"}</div>
          <div style={{fontSize:12,color:C.mid,marginTop:3}}>{user.email}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
          {[{icon:"🎯",label:"분석 횟수",val:history.length},
            {icon:"⭐",label:"평균 확신도",val:avgConf?`${avgConf}/10`:"-"},
            {icon:"📝",label:"평가 횟수",val:evalCount},
          ].map(s=>(
            <div key={s.label} style={{...S.card,textAlign:"center",padding:"14px 8px"}}>
              <div style={{fontSize:22}}>{s.icon}</div>
              <div style={{fontSize:22,fontWeight:800,color:C.accent,margin:"4px 0"}}>{s.val}</div>
              <div style={{fontSize:10,color:C.dim}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{...S.card,marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>💎 요금제</div>
          {[
            {name:"Free",price:"무료",desc:"AI 분석 + TJ 검색 + 레파토리",current:true,col:C.mid},
            {name:"Basic",price:"₩4,900/월",desc:"무제한 + 광고 없음 + 세트리스트",col:C.accent},
            {name:"Premium",price:"₩15,900/월",desc:"노래방 기기 연동 + AI 보컬 생성",col:C.cyan},
          ].map((p,i)=>(
            <div key={i} style={{padding:"12px 14px",borderRadius:12,marginBottom:8,
              background:p.current?C.accentDim:C.glass,
              border:`1px solid ${p.current?C.borderHi:C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:13,fontWeight:700}}>{p.name}</span>
                    {p.current&&<span style={{...S.tag(C.accent),fontSize:10}}>현재</span>}
                  </div>
                  <div style={{fontSize:11,color:C.dim,marginTop:2}}>{p.desc}</div>
                </div>
                <div style={{fontSize:13,fontWeight:800,color:p.col}}>{p.price}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onLogout}
          style={{...S.bigBtn(false),background:C.glass,border:`1px solid ${C.border}`,color:C.mid,boxShadow:"none"}}>
          로그아웃
        </button>
      </div>
    );
  };

  const TABS=[
    {id:"home",   icon:"🏠",label:"홈"},
    {id:"result", icon:"✨",label:"결과"},
    {id:"library",icon:"🗂",label:"레파토리"},
    {id:"history",icon:"📝",label:"기록"},
    {id:"profile",icon:"👤",label:"프로필"},
  ];

  return (
    <div style={S.app}>
      <BgBlobs/>
      <div style={{...S.wrap,paddingTop:0,paddingBottom:90}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"18px 0 12px",position:"sticky",top:0,zIndex:50,
          background:`linear-gradient(to bottom,${C.bg} 80%,transparent)`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:C.grad,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:16,boxShadow:`0 0 18px rgba(124,106,247,0.5)`}}>🎤</div>
            <div>
              <div style={{fontSize:16,fontWeight:900,letterSpacing:"-0.3px",
                background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                부를레옹
              </div>
              <div style={{fontSize:9,color:C.dim}}>AI 노래방 코치 · TJ 전곡 검색 · {user.name}</div>
            </div>
          </div>
          {repo.length>0&&<span style={{...S.tag(C.accent),fontSize:10}}>🗂 {repo.length}곡</span>}
        </div>

        {/* ✅ 탭 컴포넌트들 — 분리된 컴포넌트로 props 전달 */}
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
          />
        )}
        {tab==="result"&&(
          <ResultTab
            result={result} targetSong={targetSong}
            situation={situation} uid={uid}
            repo={repo} saveRepo={saveRepo}
            setTab={setTab}
          />
        )}
        {tab==="library"&&<LibraryTab/>}
        {tab==="history"&&<HistoryTab/>}
        {tab==="profile"&&<ProfileTab/>}
      </div>

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:520,
        background:`${C.card}f4`,backdropFilter:"blur(24px)",
        borderTop:`1px solid ${C.border}`,
        display:"flex",zIndex:100}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:"10px 0 8px",background:"transparent",border:"none",
              cursor:"pointer",display:"flex",flexDirection:"column",
              alignItems:"center",gap:2,position:"relative",
              color:tab===t.id?C.accent:C.dim,transition:"color .2s"}}>
            {tab===t.id&&(
              <div style={{position:"absolute",top:0,left:"18%",right:"18%",
                height:2,background:C.grad,borderRadius:"0 0 3px 3px"}}/>
            )}
            <span style={{fontSize:18}}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:tab===t.id?700:400}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────
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
