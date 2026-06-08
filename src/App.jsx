import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// DESIGN SYSTEM — Premium Dark Gold
// ─────────────────────────────────────────────────────────────────
const T = {
  // 배경
  bg:      "#080808",
  bg1:     "#0f0f0f",
  bg2:     "#161616",
  bg3:     "#1e1e1e",
  // 골드
  gold:    "#c9a84c",
  goldLt:  "#e2c47a",
  goldDim: "rgba(201,168,76,0.12)",
  goldBdr: "rgba(201,168,76,0.25)",
  // 텍스트
  text:    "#f5f0e8",
  textMid: "#9a8f7a",
  textDim: "#4a4540",
  // 포인트
  rose:    "#e85d75",
  roseDim: "rgba(232,93,117,0.12)",
  teal:    "#4ecdc4",
  tealDim: "rgba(78,205,196,0.12)",
  // 경계
  bdr:     "rgba(255,255,255,0.06)",
  bdrHi:   "rgba(201,168,76,0.35)",
};

const F = {
  display: "'Cormorant Garamond', 'Georgia', serif",
  body:    "'Pretendard Variable', 'Pretendard', system-ui, sans-serif",
};

// 글로벌 CSS
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; margin:0; padding:0; }
  body { background: #080808; }
  ::-webkit-scrollbar { display: none; }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes scaleIn  { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
  @keyframes slideDown{ from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes goldPulse{ 0%,100%{ box-shadow:0 0 20px rgba(201,168,76,0.2); } 50%{ box-shadow:0 0 40px rgba(201,168,76,0.4); } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes keyReveal{ 0%{ opacity:0; transform:scale(0.6) translateY(10px); } 60%{ transform:scale(1.08) translateY(-2px); } 100%{ opacity:1; transform:scale(1) translateY(0); } }
  @keyframes dotPulse { 0%,80%,100%{ transform:scale(0); opacity:0.3; } 40%{ transform:scale(1); opacity:1; } }
`;

const S = {
  app: {
    minHeight: "100vh",
    background: T.bg,
    color: T.text,
    fontFamily: F.body,
    overflowX: "hidden",
  },
  wrap: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "0 20px",
    position: "relative",
    zIndex: 1,
  },
  card: {
    background: T.bg1,
    border: `1px solid ${T.bdr}`,
    borderRadius: 20,
    padding: "20px",
    position: "relative",
  },
  inp: {
    width: "100%",
    background: T.bg2,
    border: `1px solid ${T.bdr}`,
    borderRadius: 14,
    padding: "14px 18px",
    color: T.text,
    fontSize: 15,
    fontFamily: F.body,
    outline: "none",
    transition: "all 0.2s",
  },
  tag: (col) => ({
    display: "inline-flex", alignItems: "center",
    padding: "3px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 600, letterSpacing: "0.3px",
    background: `${col}18`, color: col,
    border: `1px solid ${col}30`,
    flexShrink: 0,
  }),
};

// ─────────────────────────────────────────────────────────────────
// LOCAL STORAGE
// ─────────────────────────────────────────────────────────────────
const ls = {
  get: (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: (k) => localStorage.removeItem(k),
};

// ─────────────────────────────────────────────────────────────────
// TJ DB 검색
// ─────────────────────────────────────────────────────────────────
let TJ_DB = null;
const loadTJ = async () => {
  if (TJ_DB) return TJ_DB;
  try { const r = await fetch("/tj_namu.json"); TJ_DB = await r.json(); }
  catch { TJ_DB = []; }
  return TJ_DB;
};
const searchTJ = async (query) => {
  const db = await loadTJ();
  if (!query.trim() || !db.length) return [];
  const q = query.toLowerCase().trim();
  return db.filter(s =>
    s.title?.toLowerCase().includes(q) ||
    s.artist?.toLowerCase().includes(q) ||
    s.tj === q
  ).slice(0, 20).map(s => ({ ...s, id: "tj_" + s.tj }));
};

// ─────────────────────────────────────────────────────────────────
// SONGS DB
// ─────────────────────────────────────────────────────────────────
let SONGS_DB = null;
const loadSongs = async () => {
  if (SONGS_DB) return SONGS_DB;
  try { const r = await fetch("/songs_db.json"); SONGS_DB = await r.json(); }
  catch { SONGS_DB = {}; }
  return SONGS_DB;
};
const findSong = async (title) => {
  const db = await loadSongs();
  if (!title) return null;
  const t = title.replace(/\s/g, "").toLowerCase();
  return Object.values(db).find(s =>
    s.title.replace(/\s/g, "").toLowerCase().includes(t) ||
    t.includes(s.title.replace(/\s/g, "").toLowerCase())
  ) || null;
};

// ─────────────────────────────────────────────────────────────────
// AI 호출
// ─────────────────────────────────────────────────────────────────
const callAI = async (prompt) => {
  const res = await fetch("https://bouleon-api.vercel.app/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.text;
};
const parseJSON = t => {
  try { return JSON.parse(t.replace(/```json|```/g, "").trim()); }
  catch { return null; }
};

// ─────────────────────────────────────────────────────────────────
// 키 계산 엔진
// ─────────────────────────────────────────────────────────────────
const VOICE_TYPES = [
  { id: "male_low",   label: "남성 저음",  emoji: "🎸", comfMax: 62 },
  { id: "male_mid",   label: "남성 중음",  emoji: "🎤", comfMax: 67 },
  { id: "male_high",  label: "남성 고음",  emoji: "🚀", comfMax: 71 },
  { id: "female_low", label: "여성 저음",  emoji: "🎵", comfMax: 67 },
  { id: "female_mid", label: "여성 중음",  emoji: "🌸", comfMax: 72 },
  { id: "female_high",label: "여성 고음",  emoji: "⭐", comfMax: 76 },
];

const SITUATIONS = [
  { id: "friend",  emoji: "👫", label: "친구들이랑", keyAdj: 0,  color: "#7c6af7",
    roles: ["분위기 풀기", "안정적인 곡", "오늘의 필살기", "쉬어가는 곡", "마무리 곡"] },
  { id: "date",    emoji: "💕", label: "썸/데이트",  keyAdj: -1, color: T.rose,
    roles: ["부담 없는 시작", "감성 곡", "필살기 곡", "상대가 아는 곡", "분위기 유지"] },
  { id: "work",    emoji: "🥂", label: "회식",        keyAdj: -1, color: T.gold,
    roles: ["모두 아는 곡", "짧고 안전한 곡", "분위기 띄우기", "무리 안 하기", "마무리 곡"] },
  { id: "solo",    emoji: "🎤", label: "혼자 연습",   keyAdj: +1, color: T.teal,
    roles: ["워밍업 곡", "연습 목표곡", "약점 보완 곡", "자신감 충전", "도전 곡"] },
  { id: "wedding", emoji: "💍", label: "축가",         keyAdj: -2, color: "#10b981",
    roles: ["오프닝 곡", "축가 메인", "앙코르 대비"] },
];

const CONDITIONS = [
  { id: "great",  emoji: "🔥", label: "목 최상",    keyAdj: +1 },
  { id: "good",   emoji: "😊", label: "컨디션 좋음", keyAdj: 0  },
  { id: "normal", emoji: "😐", label: "보통",         keyAdj: 0  },
  { id: "bad",    emoji: "😤", label: "목이 안좋음", keyAdj: -1 },
  { id: "sick",   emoji: "🤒", label: "오늘 최악",   keyAdj: -2 },
];

const EVAL_OPTIONS = [
  { id: "great",  emoji: "😄", label: "편하게 불렀어요" },
  { id: "high",   emoji: "😅", label: "고음이 어려웠어요" },
  { id: "breath", emoji: "💨", label: "호흡이 부족했어요" },
  { id: "vibe",   emoji: "🎉", label: "분위기가 좋았어요" },
  { id: "again",  emoji: "🔄", label: "다시 부르고 싶어요" },
  { id: "skip",   emoji: "🚫", label: "다시 안 부를래요" },
];

const REPO_TAGS = [
  { id: "safe",   emoji: "🛡", label: "안전곡",    color: "#10b981" },
  { id: "killer", emoji: "⚡", label: "필살기",    color: T.gold    },
  { id: "ballad", emoji: "🫶", label: "감성곡",    color: T.rose    },
  { id: "date",   emoji: "💕", label: "썸/데이트", color: "#ec4899" },
  { id: "work",   emoji: "🥂", label: "회식용",    color: T.gold    },
  { id: "prac",   emoji: "📖", label: "연습중",    color: T.textMid },
  { id: "high",   emoji: "⚠️", label: "고음주의",  color: T.rose    },
];

// 개인 보정값 계산
const getPersonalAdj = (uid) => {
  const evals = ls.get(`bl_eval_${uid}`, []);
  const diffs = evals
    .filter(e => e.actualKey != null && e.recommendedKey != null)
    .map(e => e.actualKey - e.recommendedKey);
  if (diffs.length < 3) return 0;
  return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
};

// 핵심 키 계산 함수
const calcKey = async ({ voiceType, targetSong, situation, condition, history, uid }) => {
  const voice = VOICE_TYPES.find(v => v.id === voiceType);
  const sit   = SITUATIONS.find(s => s.id === situation);
  const cond  = CONDITIONS.find(c => c.id === condition);
  const songData = await findSong(targetSong?.title);
  const breakdown = [];
  let total = 0;

  // 1. 음역 기반 (songs_db 우선, 없으면 직접 계산)
  if (songData && voice) {
    let base;
    if (songData.safeKeyRange?.[voiceType]?.recommended !== undefined) {
      base = songData.safeKeyRange[voiceType].recommended;
    } else {
      base = voice.comfMax - songData.maxNote;
      if (voiceType.includes("male")   && songData.gender === "female") base = Math.min(base, -3);
      if (voiceType.includes("female") && songData.gender === "male")   base = Math.max(base, +3);
    }
    base = Math.max(-7, Math.min(7, base));
    total += base;
    breakdown.push({ label: "음역 기반", value: base });
  } else {
    breakdown.push({ label: "음역 기반", value: 0, note: "DB 미수록" });
  }

  // 2. 상황 보정
  if (sit?.keyAdj) {
    total += sit.keyAdj;
    breakdown.push({ label: `상황 (${sit.label})`, value: sit.keyAdj });
  }

  // 3. 컨디션 보정
  if (cond?.keyAdj) {
    total += cond.keyAdj;
    breakdown.push({ label: `컨디션 (${cond.label})`, value: cond.keyAdj });
  }

  // 4. 이전 피드백 보정
  const prev = history?.find(h => h.target?.title === targetSong?.title && h.rating);
  if (prev?.rating?.includes("고음이 어려웠어요")) {
    total -= 2; breakdown.push({ label: "이전 피드백", value: -2 });
  } else if (prev?.rating?.includes("호흡이 부족했어요")) {
    total -= 1; breakdown.push({ label: "이전 피드백", value: -1 });
  }

  // 5. 개인 학습 보정
  const personalAdj = getPersonalAdj(uid);
  if (personalAdj !== 0) {
    total += personalAdj;
    breakdown.push({ label: "개인 학습", value: personalAdj });
  }

  total = Math.max(-7, Math.min(7, total));
  const keyStr = total === 0 ? "원키" : total > 0 ? `+${total}키` : `${total}키`;
  return { keyStr, keyNum: total, breakdown, songData };
};

// ─────────────────────────────────────────────────────────────────
// UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────
function Btn({ onClick, children, variant = "primary", style = {}, disabled }) {
  const [pressed, setPressed] = useState(false);
  const base = {
    border: "none", cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: F.body, fontWeight: 700, letterSpacing: "0.3px",
    transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
    transform: pressed ? "scale(0.96)" : "scale(1)",
    opacity: disabled ? 0.45 : 1,
    userSelect: "none",
  };
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${T.gold}, ${T.goldLt})`,
      color: "#080808", padding: "16px 24px", borderRadius: 16,
      fontSize: 15, width: "100%",
      boxShadow: pressed ? "0 2px 12px rgba(201,168,76,0.3)" : "0 8px 32px rgba(201,168,76,0.35)",
    },
    secondary: {
      background: T.bg2, color: T.textMid, padding: "14px 24px",
      borderRadius: 14, fontSize: 14, width: "100%",
      border: `1px solid ${T.bdr}`,
      boxShadow: "none",
    },
    chip: {
      background: "transparent", color: T.textMid, padding: "8px 16px",
      borderRadius: 24, fontSize: 13,
      border: `1px solid ${T.bdr}`,
    },
    chipOn: {
      background: T.goldDim, color: T.gold, padding: "8px 16px",
      borderRadius: 24, fontSize: 13,
      border: `1px solid ${T.goldBdr}`,
    },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: T.bdr }} />
      {label && <span style={{ fontSize: 11, color: T.textDim, letterSpacing: "1px" }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: T.bdr }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SONG SEARCH
// ─────────────────────────────────────────────────────────────────
const SongSearch = ({ label, value, onChange, placeholder }) => {
  const [q, setQ]       = useState("");
  const [res, setRes]   = useState([]);
  const [open, setOpen] = useState(false);
  const [st, setSt]     = useState("idle");
  const ref   = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    setQ(value ? `${value.title}  —  ${value.artist}` : "");
  }, [value?.title, value?.artist]);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const search = useCallback((query) => {
    setQ(query);
    clearTimeout(timer.current);
    if (!query.trim()) { setRes([]); setOpen(false); setSt("idle"); return; }
    setSt("searching"); setOpen(true);
    timer.current = setTimeout(async () => {
      try {
        const r = await searchTJ(query);
        setRes(r); setSt(r.length > 0 ? "done" : "empty");
      } catch { setSt("error"); }
    }, 200);
  }, []);

  const pick = s => { onChange(s); setOpen(false); setRes([]); setSt("idle"); };

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: 12 }}>
      {label && (
        <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>
          {label}
        </div>
      )}
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
          fontSize: 14, color: value ? T.gold : T.textDim, transition: "color 0.2s",
        }}>
          {value ? "✓" : st === "searching" ? "⟳" : "♪"}
        </span>
        <input
          style={{
            ...S.inp, paddingLeft: 44,
            borderColor: value ? T.goldBdr : T.bdr,
            boxShadow: value ? `0 0 0 3px ${T.goldDim}` : "none",
          }}
          placeholder={placeholder || "곡명 또는 가수명..."}
          value={q}
          onChange={e => search(e.target.value)}
          onFocus={e => {
            e.target.style.borderColor = T.goldBdr;
            e.target.style.boxShadow = `0 0 0 3px ${T.goldDim}`;
            if (res.length > 0) setOpen(true);
          }}
          onBlur={e => {
            if (!value) {
              e.target.style.borderColor = T.bdr;
              e.target.style.boxShadow = "none";
            }
          }}
        />
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 500,
          background: T.bg2, border: `1px solid ${T.bdr}`, borderRadius: 16,
          overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.9)",
          animation: "slideDown 0.15s ease forwards",
        }}>
          {st === "searching" && (
            <div style={{ padding: 16, textAlign: "center", color: T.textDim, fontSize: 13 }}>
              검색 중...
            </div>
          )}
          {st === "empty" && (
            <div style={{ padding: 16, textAlign: "center", color: T.textDim, fontSize: 13 }}>
              검색 결과가 없어요
            </div>
          )}
          {st === "done" && res.map((s, i) => (
            <div key={s.id || i} onClick={() => pick(s)}
              style={{
                padding: "12px 18px", cursor: "pointer",
                borderBottom: i < res.length - 1 ? `1px solid ${T.bdr}` : "none",
                transition: "background 0.15s",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.bg3}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{s.artist}</div>
              </div>
              <div style={{
                fontSize: 11, color: T.gold, fontWeight: 700,
                background: T.goldDim, padding: "3px 10px", borderRadius: 20, marginLeft: 10, flexShrink: 0,
              }}>
                {s.tj}
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
  const [email, setEmail] = useState("");
  const [pw, setPw]       = useState("");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const doLogin = () => {
    setErr("");
    if (!email || !pw) { setErr("이메일과 비밀번호를 입력해주세요."); return; }
    setLoading(true);
    setTimeout(() => {
      const users = ls.get("bl_users", []);
      const u = users.find(x => x.email === email && x.pw === pw);
      if (u) { ls.set("bl_sess", u); onLogin(u); }
      else { setErr("이메일 또는 비밀번호가 올바르지 않습니다."); setLoading(false); }
    }, 500);
  };
  const social = (name) => {
    const u = { email: `${name}@bouleon.ai`, name: `${name === "kakao" ? "카카오" : name === "google" ? "Google" : "Apple"} 사용자` };
    const users = ls.get("bl_users", []);
    if (!users.find(x => x.email === u.email)) { users.push(u); ls.set("bl_users", users); }
    ls.set("bl_sess", u); onLogin(u);
  };

  return (
    <div style={{ ...S.app, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <style>{G}</style>
      {/* 배경 장식 */}
      <div style={{
        position: "fixed", top: "-30%", right: "-20%",
        width: "60vw", height: "60vw", borderRadius: "50%",
        background: `radial-gradient(circle, ${T.goldDim} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ ...S.wrap, paddingTop: 80, paddingBottom: 48, flex: 1 }}>
        {/* 로고 */}
        <div style={{ textAlign: "center", marginBottom: 52, animation: "fadeUp 0.5s ease forwards" }}>
          <div style={{
            fontFamily: F.display, fontSize: 48, fontWeight: 300,
            color: T.gold, letterSpacing: "4px", lineHeight: 1,
            marginBottom: 8,
          }}>
            부를레옹
          </div>
          <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "4px", textTransform: "uppercase" }}>
            AI Vocal Coach
          </div>
        </div>

        {/* 로그인 폼 */}
        <div style={{ animation: "fadeUp 0.5s 0.1s ease both" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>
              이메일
            </div>
            <input style={S.inp} type="email" placeholder="hello@bouleon.ai"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doLogin()}
              onFocus={e => { e.target.style.borderColor = T.goldBdr; e.target.style.boxShadow = `0 0 0 3px ${T.goldDim}`; }}
              onBlur={e => { e.target.style.borderColor = T.bdr; e.target.style.boxShadow = "none"; }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>
              비밀번호
            </div>
            <input style={S.inp} type="password" placeholder="••••••••"
              value={pw} onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doLogin()}
              onFocus={e => { e.target.style.borderColor = T.goldBdr; e.target.style.boxShadow = `0 0 0 3px ${T.goldDim}`; }}
              onBlur={e => { e.target.style.borderColor = T.bdr; e.target.style.boxShadow = "none"; }} />
          </div>
          {err && (
            <div style={{ fontSize: 12, color: T.rose, padding: "10px 14px", background: T.roseDim, borderRadius: 10, marginBottom: 16 }}>
              {err}
            </div>
          )}
          <Btn onClick={doLogin} disabled={loading} style={{ marginBottom: 16, opacity: loading ? 0.7 : 1 }}>
            {loading ? "확인 중..." : "로그인"}
          </Btn>
          <Divider label="또는" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
            {[
              { bg: "#FEE500", color: "#000", label: "카카오로 시작하기", name: "kakao" },
              { bg: "#fff",    color: "#333", label: "Google로 시작하기", name: "google" },
              { bg: "#1c1c1e", color: "#fff", label: "Apple로 시작하기",  name: "apple", border: `1px solid ${T.bdr}` },
            ].map(s => (
              <Btn key={s.name} variant="secondary" onClick={() => social(s.name)}
                style={{ background: s.bg, color: s.color, border: s.border || "none", fontWeight: 700 }}>
                {s.label}
              </Btn>
            ))}
            <Btn variant="secondary" onClick={() => { const u = { email: "guest@bouleon.ai", name: "게스트" }; ls.set("bl_sess", u); onLogin(u); }}>
              게스트로 시작
            </Btn>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 32, color: T.textDim, fontSize: 13 }}>
          계정이 없으신가요?{" "}
          <span onClick={onRegister} style={{ color: T.gold, cursor: "pointer", fontWeight: 600 }}>
            회원가입
          </span>
        </p>
      </div>
    </div>
  );
}

function RegisterScreen({ onLogin, onBack }) {
  const [f, setF] = useState({ name: "", email: "", pw: "", pw2: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const doReg = () => {
    setErr("");
    if (!f.name || !f.email || !f.pw || !f.pw2) { setErr("모든 항목을 입력해주세요."); return; }
    if (f.pw !== f.pw2) { setErr("비밀번호가 일치하지 않습니다."); return; }
    if (f.pw.length < 6) { setErr("비밀번호는 6자 이상이어야 합니다."); return; }
    setLoading(true);
    setTimeout(() => {
      const users = ls.get("bl_users", []);
      if (users.find(u => u.email === f.email)) { setErr("이미 가입된 이메일입니다."); setLoading(false); return; }
      const u = { name: f.name, email: f.email, pw: f.pw };
      users.push(u); ls.set("bl_users", users); ls.set("bl_sess", u); onLogin(u);
    }, 500);
  };

  return (
    <div style={{ ...S.app, minHeight: "100vh" }}>
      <style>{G}</style>
      <div style={{ ...S.wrap, paddingTop: 60, paddingBottom: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 40, animation: "fadeUp 0.4s ease forwards" }}>
          <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 300, color: T.gold, letterSpacing: "3px" }}>
            부를레옹
          </div>
          <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "3px", marginTop: 4, textTransform: "uppercase" }}>
            회원가입
          </div>
        </div>
        <div style={{ animation: "fadeUp 0.4s 0.1s ease both" }}>
          {[
            { k: "name",  type: "text",     label: "닉네임",          ph: "예) 노래왕" },
            { k: "email", type: "email",    label: "이메일",          ph: "hello@bouleon.ai" },
            { k: "pw",    type: "password", label: "비밀번호 (6자+)", ph: "••••••••" },
            { k: "pw2",   type: "password", label: "비밀번호 확인",   ph: "••••••••" },
          ].map(fi => (
            <div key={fi.k} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>
                {fi.label}
              </div>
              <input style={S.inp} type={fi.type} placeholder={fi.ph}
                value={f[fi.k]} onChange={e => setF(p => ({ ...p, [fi.k]: e.target.value }))}
                onFocus={e => { e.target.style.borderColor = T.goldBdr; e.target.style.boxShadow = `0 0 0 3px ${T.goldDim}`; }}
                onBlur={e => { e.target.style.borderColor = T.bdr; e.target.style.boxShadow = "none"; }} />
            </div>
          ))}
          {err && (
            <div style={{ fontSize: 12, color: T.rose, padding: "10px 14px", background: T.roseDim, borderRadius: 10, marginBottom: 16 }}>
              {err}
            </div>
          )}
          <Btn onClick={doReg} disabled={loading} style={{ marginTop: 8, opacity: loading ? 0.7 : 1 }}>
            {loading ? "가입 중..." : "시작하기"}
          </Btn>
        </div>
        <p style={{ textAlign: "center", marginTop: 24, color: T.textDim, fontSize: 13 }}>
          이미 계정이 있으신가요?{" "}
          <span onClick={onBack} style={{ color: T.gold, cursor: "pointer", fontWeight: 600 }}>로그인</span>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// HOME TAB
// ─────────────────────────────────────────────────────────────────
const HomeTab = ({ comfSongs, setComfSongs, targetSong, setTargetSong,
  situation, setSituation, condition, setCondition,
  extraNote, setExtraNote, quickMode, setQuickMode,
  loading, loadStep, onRun, voiceType, onGoProfile }) => {

  const voice = VOICE_TYPES.find(v => v.id === voiceType);
  const LOAD_MSGS = ["음역 분석 중", "키 계산 중", "전략 수립 중", "가이드 작성 중"];

  return (
    <div>
      {/* 히어로 */}
      <div style={{
        padding: "32px 0 24px",
        animation: "fadeUp 0.4s ease forwards",
      }}>
        <div style={{
          fontFamily: F.display, fontSize: 34, fontWeight: 300,
          color: T.text, lineHeight: 1.3, letterSpacing: "-0.5px",
          marginBottom: 10,
        }}>
          오늘 어떤 곡을<br />
          <span style={{ color: T.gold, fontStyle: "italic" }}>부르고 싶으세요?</span>
        </div>
        <div style={{ fontSize: 14, color: T.textMid, lineHeight: 1.7 }}>
          편한 곡 1곡만 알려주세요.<br />
          내 음역에 맞는 키를 정확히 계산해드릴게요.
        </div>

        {/* 음역 배지 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
          {voice ? (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 14px", borderRadius: 24,
              background: T.goldDim, border: `1px solid ${T.goldBdr}`,
              fontSize: 13, color: T.gold, fontWeight: 600,
            }}>
              {voice.emoji} {voice.label}
              <span onClick={onGoProfile} style={{ color: T.textDim, fontSize: 11, cursor: "pointer" }}>변경</span>
            </div>
          ) : (
            <div onClick={onGoProfile} style={{
              display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
              padding: "8px 14px", borderRadius: 24,
              background: "rgba(232,93,117,0.08)", border: `1px solid ${T.rose}44`,
              fontSize: 12, color: T.rose,
            }}>
              ⚠ 음역대 설정 필요 →
            </div>
          )}

          <div style={{ display: "flex", gap: 6 }}>
            {[{ v: true, l: "빠른" }, { v: false, l: "정밀" }].map(m => (
              <Btn key={String(m.v)} variant={quickMode === m.v ? "chipOn" : "chip"}
                onClick={() => setQuickMode(m.v)}
                style={{ fontSize: 12, padding: "6px 14px" }}>
                {m.l}
              </Btn>
            ))}
          </div>
        </div>
      </div>

      {/* 스텝 카드들 */}
      {[
        {
          step: "01", label: "편하게 부르는 곡",
          sub: quickMode ? "1곡이면 충분해요" : "2~3곡으로 더 정밀하게",
          content: (
            <div>
              {[0, ...(quickMode ? [] : [1, 2])].map(i => (
                <SongSearch key={i}
                  label={i === 0 ? "필수" : `선택 ${i}`}
                  value={comfSongs[i] || null}
                  onChange={s => { const c = [...comfSongs]; c[i] = s; setComfSongs(c); }}
                  placeholder={i === 0 ? "편하게 부르는 곡..." : "추가 기준곡..."}
                />
              ))}
            </div>
          ),
        },
        {
          step: "02", label: "부르고 싶은 곡",
          sub: "TJ 48,225곡 전체 검색",
          content: (
            <div>
              <SongSearch value={targetSong} onChange={setTargetSong}
                placeholder="목표곡을 검색해보세요..." />
              {targetSong && (
                <div style={{
                  padding: "12px 16px", borderRadius: 14,
                  background: T.goldDim, border: `1px solid ${T.goldBdr}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  animation: "fadeIn 0.2s ease forwards",
                }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{targetSong.title}</div>
                    <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{targetSong.artist}</div>
                  </div>
                  <div style={{ fontSize: 12, color: T.gold, fontWeight: 700 }}>TJ {targetSong.tj}</div>
                </div>
              )}
            </div>
          ),
        },
        {
          step: "03", label: "오늘 상황",
          sub: "상황에 따라 키가 달라져요",
          content: (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {SITUATIONS.map(s => (
                <div key={s.id}
                  onClick={() => setSituation(situation === s.id ? null : s.id)}
                  style={{
                    padding: "14px 8px", borderRadius: 16, textAlign: "center", cursor: "pointer",
                    background: situation === s.id ? `${s.color}15` : T.bg2,
                    border: `1px solid ${situation === s.id ? s.color + "60" : T.bdr}`,
                    transition: "all 0.2s",
                  }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: situation === s.id ? s.color : T.textMid }}>
                    {s.label}
                  </div>
                  {s.keyAdj !== 0 && (
                    <div style={{ fontSize: 10, color: situation === s.id ? s.color : T.textDim, marginTop: 3 }}>
                      {s.keyAdj > 0 ? `+${s.keyAdj}키` : `${s.keyAdj}키`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ),
        },
        {
          step: "04", label: "목 컨디션",
          sub: "컨디션에 따라 키가 조절돼요",
          content: (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CONDITIONS.map(c => (
                <div key={c.id}
                  onClick={() => setCondition(condition === c.id ? null : c.id)}
                  style={{
                    padding: "12px 16px", borderRadius: 14, cursor: "pointer",
                    background: condition === c.id ? T.goldDim : T.bg2,
                    border: `1px solid ${condition === c.id ? T.goldBdr : T.bdr}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "all 0.2s",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{c.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: condition === c.id ? T.gold : T.text }}>
                      {c.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: c.keyAdj < 0 ? T.rose : c.keyAdj > 0 ? "#10b981" : T.textDim,
                  }}>
                    {c.keyAdj > 0 ? `+${c.keyAdj}키` : c.keyAdj < 0 ? `${c.keyAdj}키` : "±0"}
                  </span>
                </div>
              ))}
            </div>
          ),
        },
      ].map((block, idx) => (
        <div key={block.step}
          style={{
            ...S.card,
            marginBottom: 12,
            animation: `fadeUp 0.4s ${idx * 0.06}s ease both`,
            overflow: "visible",
          }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
            <div style={{
              fontFamily: F.display, fontSize: 28, fontWeight: 300,
              color: T.goldDim, lineHeight: 1, flexShrink: 0,
              letterSpacing: "-1px",
            }}>
              {block.step}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{block.label}</div>
              <div style={{ fontSize: 12, color: T.textDim }}>{block.sub}</div>
            </div>
          </div>
          {block.content}
        </div>
      ))}

      {/* 메모 */}
      <div style={{ ...S.card, marginBottom: 16, animation: "fadeUp 0.4s 0.25s ease both" }}>
        <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>
          추가 메모 (선택)
        </div>
        <textarea value={extraNote} onChange={e => setExtraNote(e.target.value)}
          placeholder="고음이 약해요 / 술 한 잔 했어요 / 처음 도전이에요..."
          style={{
            ...S.inp, resize: "none", minHeight: 72, lineHeight: 1.7,
            fontSize: 14,
          }}
          onFocus={e => { e.target.style.borderColor = T.goldBdr; e.target.style.boxShadow = `0 0 0 3px ${T.goldDim}`; }}
          onBlur={e => { e.target.style.borderColor = T.bdr; e.target.style.boxShadow = "none"; }} />
      </div>

      {/* CTA */}
      {loading ? (
        <div style={{
          ...S.card, textAlign: "center", padding: "32px 20px",
          animation: "fadeIn 0.3s ease forwards",
        }}>
          <div style={{
            fontFamily: F.display, fontSize: 22, fontWeight: 300,
            color: T.gold, marginBottom: 12, letterSpacing: "1px",
          }}>
            {LOAD_MSGS[loadStep]}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: "50%", background: T.gold,
                animation: `dotPulse 1.4s ${i * 0.2}s ease-in-out infinite`,
              }} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ animation: "fadeUp 0.4s 0.3s ease both" }}>
          <Btn onClick={onRun}>키 분석 받기</Btn>
        </div>
      )}

      <div style={{ height: 32 }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// RESULT TAB
// ─────────────────────────────────────────────────────────────────
const ResultTab = ({ result, targetSong, situation, uid, repo, saveRepo, setTab }) => {
  const [saved,     setSaved]     = useState(false);
  const [showEval,  setShowEval]  = useState(false);
  const [evalSel,   setEvalSel]   = useState([]);
  const [actualKey, setActualKey] = useState(null);
  const [evalDone,  setEvalDone]  = useState(false);

  if (!result) return (
    <div style={{ ...S.card, textAlign: "center", padding: 56, marginTop: 40 }}>
      <div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 300, color: T.gold, marginBottom: 16 }}>
        결과 없음
      </div>
      <p style={{ color: T.textMid, marginBottom: 24, lineHeight: 1.7 }}>
        홈에서 분석을 먼저 시작해보세요
      </p>
      <Btn onClick={() => setTab("home")}>분석 시작하기</Btn>
    </div>
  );

  const r = result;
  const sit = SITUATIONS.find(s => s.id === situation);

  const saveToRepo = () => {
    if (!targetSong) return;
    const key = targetSong.id || `tj_${targetSong.tj}`;
    if (repo.find(x => x.id === key)) { alert("이미 레파토리에 있어요!"); return; }
    const tag = REPO_TAGS.find(t => t.id === r.repoTag) || REPO_TAGS[5];
    saveRepo([{
      id: key, song: targetSong, tags: [tag.id],
      myKey: r.recommendedKey, myKeyNum: r.keyNum || 0,
      addedAt: Date.now(),
    }, ...repo]);
    setSaved(true);
  };

  const submitEval = () => {
    if (!evalSel.length) return;
    const evals = ls.get(`bl_eval_${uid}`, []);
    const keyNum = r.keyNum ?? (r.recommendedKey === "원키" ? 0 : parseInt(r.recommendedKey) || 0);
    ls.set(`bl_eval_${uid}`, [{
      id: Date.now(),
      songTitle: targetSong?.title,
      artist: targetSong?.artist,
      tj: targetSong?.tj,
      voiceType: ls.get(`bl_voice_${uid}`, null),
      situation,
      recommendedKey: keyNum,
      actualKey,
      evals: evalSel,
      date: new Date().toLocaleDateString("ko-KR"),
    }, ...evals].slice(0, 200));
    setShowEval(false);
    setEvalDone(true);
  };

  return (
    <div>
      <button onClick={() => setTab("home")}
        style={{
          background: "none", border: "none", color: T.textDim, cursor: "pointer",
          fontSize: 13, padding: "0 0 20px", display: "flex", alignItems: "center", gap: 6,
          fontFamily: F.body, letterSpacing: "0.5px",
        }}>
        ← 다시 분석하기
      </button>

      {/* 곡 정보 */}
      <div style={{ animation: "fadeUp 0.35s ease forwards", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>
          분석 결과
        </div>
        <div style={{
          fontFamily: F.display, fontSize: 32, fontWeight: 400,
          color: T.text, lineHeight: 1.2, marginBottom: 4,
        }}>
          {targetSong?.title}
        </div>
        <div style={{ fontSize: 14, color: T.textMid }}>{targetSong?.artist}</div>
        {targetSong?.tj && (
          <span style={{ ...S.tag(T.gold), marginTop: 8, display: "inline-flex" }}>
            TJ {targetSong.tj}
          </span>
        )}
      </div>

      {/* 핵심: 추천 키 */}
      <div style={{
        ...S.card,
        marginBottom: 12,
        background: `linear-gradient(135deg, #0f0f0f, #161200)`,
        border: `1px solid ${T.goldBdr}`,
        textAlign: "center",
        padding: "36px 20px",
        animation: "fadeUp 0.35s 0.05s ease both",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-30%", right: "-10%",
          width: "50%", height: "100%",
          background: `radial-gradient(circle, ${T.goldDim} 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 16 }}>
          추천 시작 키
        </div>
        <div style={{
          fontFamily: F.display, fontSize: 80, fontWeight: 300,
          color: T.gold, lineHeight: 1, letterSpacing: "-2px",
          animation: "keyReveal 0.6s 0.1s cubic-bezier(0.34,1.56,0.64,1) both",
        }}>
          {r.recommendedKey}
        </div>
        <div style={{ fontSize: 13, color: T.textMid, marginTop: 16, lineHeight: 1.7, maxWidth: 280, margin: "16px auto 0" }}>
          {r.keyLogic}
        </div>

        {/* 키 계산 내역 */}
        {r.keyBreakdown?.length > 0 && (
          <div style={{
            marginTop: 20, padding: "14px 16px", borderRadius: 14,
            background: "rgba(0,0,0,0.4)", border: `1px solid ${T.bdr}`,
            textAlign: "left",
          }}>
            <div style={{ fontSize: 10, color: T.textDim, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>
              계산 내역
            </div>
            {r.keyBreakdown.map((b, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "5px 0",
                borderBottom: i < r.keyBreakdown.length - 1 ? `1px solid ${T.bdr}` : "none",
              }}>
                <span style={{ fontSize: 12, color: T.textMid }}>{b.label}{b.note ? ` (${b.note})` : ""}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: b.value > 0 ? "#10b981" : b.value < 0 ? T.rose : T.textDim,
                }}>
                  {b.value > 0 ? `+${b.value}키` : b.value < 0 ? `${b.value}키` : "±0"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 요약 */}
      <div style={{ ...S.card, marginBottom: 12, animation: "fadeUp 0.35s 0.1s ease both" }}>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: T.textMid, margin: 0 }}>{r.voiceSummary}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
          <span style={S.tag(r.feasibility?.includes("쉬움") ? "#10b981" : r.feasibility?.includes("도전") ? T.gold : T.rose)}>
            {r.feasibility}
          </span>
          {r.vibes?.map(v => <span key={v} style={S.tag(T.textDim)}>#{v}</span>)}
        </div>
      </div>

      {/* 컨디션/상황 팁 */}
      {(r.conditionTip || r.situationStrategy) && (
        <div style={{
          display: "grid",
          gridTemplateColumns: r.conditionTip && r.situationStrategy ? "1fr 1fr" : "1fr",
          gap: 10, marginBottom: 12,
          animation: "fadeUp 0.35s 0.15s ease both",
        }}>
          {r.conditionTip && (
            <div style={{ ...S.card, borderColor: `${T.rose}30`, background: T.roseDim }}>
              <div style={{ fontSize: 11, color: T.rose, fontWeight: 700, marginBottom: 6, letterSpacing: "0.5px" }}>🩺 컨디션 팁</div>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: T.textMid }}>{r.conditionTip}</p>
            </div>
          )}
          {r.situationStrategy && (
            <div style={{ ...S.card, borderColor: `${T.teal}30`, background: T.tealDim }}>
              <div style={{ fontSize: 11, color: T.teal, fontWeight: 700, marginBottom: 6, letterSpacing: "0.5px" }}>🎭 상황 전략</div>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: T.textMid }}>{r.situationStrategy}</p>
            </div>
          )}
        </div>
      )}

      {/* 세트리스트 */}
      {r.setlist && situation && sit && (
        <div style={{ ...S.card, marginBottom: 12, animation: "fadeUp 0.35s 0.18s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 20 }}>{sit.emoji}</span>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 400, color: T.text }}>
              {sit.label} 세트리스트
            </div>
          </div>
          {r.setlist.map((item, i) => (
            <div key={i} style={{
              display: "flex", gap: 14, marginBottom: 14, alignItems: "flex-start",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: i === 2 ? `linear-gradient(135deg, ${T.gold}, ${T.goldLt})` : T.bg2,
                border: `1px solid ${i === 2 ? T.goldBdr : T.bdr}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800,
                color: i === 2 ? "#080808" : T.textDim,
              }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{item.title}</div>
                  <span style={{
                    fontSize: 10, color: T.gold, fontWeight: 700,
                    background: T.goldDim, padding: "2px 8px", borderRadius: 20,
                  }}>{item.role}</span>
                </div>
                <div style={{ fontSize: 12, color: T.textMid }}>{item.artist}</div>
                {item.tj && <span style={{ ...S.tag(T.gold), marginTop: 4 }}>TJ {item.tj}</span>}
                <div style={{ fontSize: 12, color: i === 2 ? T.gold : T.textDim, marginTop: 4, lineHeight: 1.5 }}>
                  {item.reason}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 보컬 팁 */}
      <div style={{ ...S.card, marginBottom: 12, animation: "fadeUp 0.35s 0.2s ease both" }}>
        <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>
          보컬 팁
        </div>
        {r.vocalTips?.map((tip, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
              background: T.goldDim, border: `1px solid ${T.goldBdr}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, color: T.gold,
            }}>{i + 1}</div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: T.textMid, paddingTop: 2 }}>{tip}</p>
          </div>
        ))}
      </div>

      {/* 연습 가이드 */}
      <div style={{ ...S.card, marginBottom: 12, animation: "fadeUp 0.35s 0.22s ease both" }}>
        <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>
          연습 가이드
        </div>
        {r.practiceSteps?.map((step, i) => (
          <div key={i} style={{
            display: "flex", gap: 14, marginBottom: 12,
            padding: "14px 16px", borderRadius: 14,
            background: i === 0 ? T.goldDim : T.bg2,
            border: `1px solid ${i === 0 ? T.goldBdr : T.bdr}`,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{["🎵", "🎹", "🎤", "🌟"][i] || "✅"}</span>
            <div>
              <div style={{ fontSize: 11, color: i === 0 ? T.gold : T.textDim, fontWeight: 700, marginBottom: 4, letterSpacing: "0.5px" }}>
                STEP {step.step}. {step.title}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: T.text }}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 대체곡 */}
      <div style={{ ...S.card, marginBottom: 12, animation: "fadeUp 0.35s 0.24s ease both" }}>
        <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>
          대체 추천곡
        </div>
        {r.alternatives?.map((alt, i) => (
          <div key={i} style={{
            padding: "14px 16px", borderRadius: 14, marginBottom: 10,
            background: T.bg2, border: `1px solid ${T.bdr}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            transition: "border-color 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.goldBdr}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.bdr}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{alt.title}</div>
              <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{alt.artist}</div>
              {alt.tj && <span style={{ ...S.tag(T.gold), marginTop: 6 }}>TJ {alt.tj}</span>}
              <div style={{ fontSize: 12, color: T.teal, marginTop: 6, lineHeight: 1.5 }}>✓ {alt.reason}</div>
            </div>
            <div style={{ marginLeft: 12, textAlign: "center", flexShrink: 0 }}>
              <div style={{
                fontSize: 22, fontWeight: 800,
                color: alt.matchScore >= 8 ? "#10b981" : alt.matchScore >= 6 ? T.gold : T.textMid,
                fontFamily: F.display,
              }}>
                {alt.matchScore}
              </div>
              <div style={{ fontSize: 9, color: T.textDim }}>/ 10</div>
            </div>
          </div>
        ))}
      </div>

      {/* 저장 + 평가 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32, animation: "fadeUp 0.35s 0.26s ease both" }}>
        {!saved ? (
          <Btn onClick={saveToRepo}
            style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 8px 24px rgba(16,185,129,0.3)" }}>
            레파토리에 저장하기
          </Btn>
        ) : (
          <div style={{
            ...S.card, textAlign: "center", padding: "14px",
            borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)",
            animation: "scaleIn 0.25s ease forwards",
          }}>
            <span style={{ color: "#10b981" }}>✅ 저장됐어요! </span>
            <span onClick={() => setTab("library")} style={{ color: "#10b981", cursor: "pointer", textDecoration: "underline" }}>
              레파토리 보기
            </span>
          </div>
        )}

        {evalDone ? (
          <div style={{
            ...S.card, textAlign: "center", padding: "14px",
            borderColor: T.goldBdr, background: T.goldDim,
            fontSize: 13, color: T.gold,
          }}>
            🎯 평가 저장! 다음 분석에 반영돼요
          </div>
        ) : !showEval ? (
          <Btn variant="secondary" onClick={() => setShowEval(true)}>
            불러본 뒤 평가 남기기
          </Btn>
        ) : (
          <div style={{ ...S.card, borderColor: T.goldBdr, animation: "fadeUp 0.25s ease forwards" }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>어떻게 불렀나요?</div>
            <div style={{ fontSize: 12, color: T.textDim, marginBottom: 16 }}>
              평가는 다음 키 추천에 자동 반영돼요
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {EVAL_OPTIONS.map(opt => (
                <Btn key={opt.id} variant={evalSel.includes(opt.id) ? "chipOn" : "chip"}
                  onClick={() => setEvalSel(p => p.includes(opt.id) ? p.filter(x => x !== opt.id) : [...p, opt.id])}
                  style={{ fontSize: 12 }}>
                  {opt.emoji} {opt.label}
                </Btn>
              ))}
            </div>

            {/* 실제 키 선택 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>
                실제로 몇 키로 부르셨나요?
                <span style={{ fontSize: 9, color: T.textDim, marginLeft: 6, letterSpacing: 0, textTransform: "none" }}>
                  (개인 학습에 활용)
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[-3, -2, -1, 0, 1, 2, 3].map(k => (
                  <Btn key={k} variant={actualKey === k ? "chipOn" : "chip"}
                    onClick={() => setActualKey(actualKey === k ? null : k)}
                    style={{ fontSize: 12, padding: "7px 12px" }}>
                    {k === 0 ? "원키" : k > 0 ? `+${k}키` : `${k}키`}
                  </Btn>
                ))}
              </div>
            </div>

            <Btn onClick={submitEval} disabled={!evalSel.length}>
              평가 저장
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// LIBRARY TAB
// ─────────────────────────────────────────────────────────────────
const LibraryTab = ({ repo, saveRepo, setTab }) => {
  const [filter, setFilter] = useState(null);
  const [editId, setEditId] = useState(null);

  const tagCounts = {};
  REPO_TAGS.forEach(t => { tagCounts[t.id] = repo.filter(r => r.tags?.includes(t.id)).length; });
  const filtered = filter ? repo.filter(r => r.tags?.includes(filter)) : repo;

  const toggleTag = (rid, tid) => saveRepo(repo.map(r => r.id !== rid ? r
    : { ...r, tags: r.tags?.includes(tid) ? r.tags.filter(t => t !== tid) : [...(r.tags || []), tid] }));
  const setMyKey = (rid, k, kn) => saveRepo(repo.map(r => r.id === rid ? { ...r, myKey: k, myKeyNum: kn } : r));
  const remove = (rid) => { if (window.confirm("삭제할까요?")) saveRepo(repo.filter(r => r.id !== rid)); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingTop: 8 }}>
        <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 300, color: T.text }}>
          내 레파토리
        </div>
        <span style={{ ...S.tag(T.gold), fontSize: 13, padding: "4px 12px" }}>{repo.length}곡</span>
      </div>

      {/* 필터 */}
      {repo.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          <Btn variant={!filter ? "chipOn" : "chip"} onClick={() => setFilter(null)}
            style={{ fontSize: 11, padding: "6px 14px", flexShrink: 0 }}>
            전체 {repo.length}
          </Btn>
          {REPO_TAGS.filter(t => tagCounts[t.id] > 0).map(t => (
            <Btn key={t.id} variant={filter === t.id ? "chipOn" : "chip"}
              onClick={() => setFilter(filter === t.id ? null : t.id)}
              style={{ fontSize: 11, padding: "6px 14px", flexShrink: 0 }}>
              {t.emoji} {t.label} {tagCounts[t.id]}
            </Btn>
          ))}
        </div>
      )}

      {repo.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", padding: 56 }}>
          <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 300, color: T.textDim, marginBottom: 16 }}>
            비어있어요
          </div>
          <p style={{ color: T.textMid, marginBottom: 24, lineHeight: 1.7 }}>
            분석 후 결과를 저장하면<br />여기서 관리할 수 있어요
          </p>
          <Btn onClick={() => setTab("home")}>분석 시작하기</Btn>
        </div>
      )}

      {filtered.map((entry, idx) => {
        const s = entry.song;
        const isEditing = editId === entry.id;
        return (
          <div key={entry.id}
            style={{
              ...S.card, marginBottom: 10,
              borderColor: isEditing ? T.goldBdr : T.bdr,
              animation: `fadeUp 0.3s ${idx * 0.04}s ease both`,
              transition: "border-color 0.2s",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s?.title}
                </div>
                <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{s?.artist}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {s?.tj && <span style={S.tag(T.gold)}>TJ {s.tj}</span>}
                  {entry.myKey && (
                    <span style={{
                      ...S.tag("#10b981"), fontWeight: 800, fontSize: 13,
                      padding: "4px 12px",
                    }}>
                      🎹 {entry.myKey}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: 10, flexShrink: 0 }}>
                <button onClick={() => setEditId(isEditing ? null : entry.id)}
                  style={{
                    width: 32, height: 32, borderRadius: 10, cursor: "pointer",
                    border: `1px solid ${isEditing ? T.goldBdr : T.bdr}`,
                    background: isEditing ? T.goldDim : T.bg2,
                    color: isEditing ? T.gold : T.textMid, fontSize: 14,
                  }}>✏️</button>
                <button onClick={() => remove(entry.id)}
                  style={{
                    width: 32, height: 32, borderRadius: 10, cursor: "pointer",
                    border: `1px solid ${T.rose}44`, background: T.roseDim,
                    color: T.rose, fontSize: 14,
                  }}>✕</button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 12 }}>
              {REPO_TAGS.map(t => (
                <Btn key={t.id} variant={entry.tags?.includes(t.id) ? "chipOn" : "chip"}
                  onClick={() => toggleTag(entry.id, t.id)}
                  style={{ fontSize: 10, padding: "4px 10px", borderRadius: 20, opacity: entry.tags?.includes(t.id) ? 1 : 0.4 }}>
                  {t.emoji} {t.label}
                </Btn>
              ))}
            </div>

            {isEditing && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.bdr}`, animation: "fadeUp 0.2s ease forwards" }}>
                <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>
                  내 최적 키
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[[-3, "-3키"], [-2, "-2키"], [-1, "-1키"], [0, "원키"], [1, "+1키"], [2, "+2키"], [3, "+3키"]].map(([n, l]) => (
                    <Btn key={n} variant={entry.myKey === l ? "chipOn" : "chip"}
                      onClick={() => setMyKey(entry.id, l, n)}
                      style={{ fontSize: 12, padding: "7px 13px" }}>
                      {l}
                    </Btn>
                  ))}
                </div>
                {entry.myKey && (
                  <div style={{
                    marginTop: 10, padding: "8px 12px", borderRadius: 10,
                    background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                    fontSize: 12, color: "#10b981",
                  }}>
                    ✅ {s?.title} — 내 키: {entry.myKey}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div style={{ height: 32 }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// HISTORY TAB
// ─────────────────────────────────────────────────────────────────
const HistoryTab = ({ history, saveHistory, setResult, setTargetSong, setSituation, setTab }) => {
  const [evalOpen, setEvalOpen] = useState(null);
  return (
    <div>
      <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 300, color: T.text, marginBottom: 24, paddingTop: 8 }}>
        분석 기록
      </div>
      {history.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 56 }}>
          <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 300, color: T.textDim, marginBottom: 12 }}>
            기록 없음
          </div>
          <p style={{ color: T.textMid }}>첫 곡을 분석해보세요</p>
        </div>
      ) : history.map((h, idx) => {
        const sit = h.situation ? SITUATIONS.find(s => s.id === h.situation) : null;
        const isOpen = evalOpen === h.id;
        return (
          <div key={h.id || idx}
            style={{
              ...S.card, marginBottom: 10,
              animation: `fadeUp 0.3s ${idx * 0.04}s ease both`,
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {h.target?.title}
                </div>
                <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{h.target?.artist}</div>
              </div>
              <span style={{ fontSize: 10, color: T.textDim, flexShrink: 0, marginLeft: 8 }}>{h.date}</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{ ...S.tag(T.gold), fontWeight: 800 }}>🎹 {h.result?.recommendedKey}</span>
              {h.target?.tj && <span style={S.tag(T.textDim)}>TJ {h.target.tj}</span>}
              {sit && <span style={S.tag(sit.color)}>{sit.emoji} {sit.label}</span>}
              {h.rating && <span style={S.tag("#10b981")}>✅ {h.rating}</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="chip"
                onClick={() => { setResult(h.result); setTargetSong(h.target); setSituation(h.situation); setTab("result"); }}
                style={{ flex: 1, fontSize: 12, padding: "9px" }}>
                결과 보기
              </Btn>
              <Btn variant={isOpen ? "chipOn" : "chip"}
                onClick={() => setEvalOpen(isOpen ? null : h.id)}
                style={{ flex: 1, fontSize: 12, padding: "9px" }}>
                평가
              </Btn>
            </div>
            {isOpen && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.bdr}`, animation: "fadeUp 0.2s ease forwards" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {EVAL_OPTIONS.map(opt => (
                    <Btn key={opt.id} variant="chip"
                      onClick={() => { saveHistory(history.map(x => x.id === h.id ? { ...x, rating: opt.label } : x)); setEvalOpen(null); }}
                      style={{ fontSize: 11, padding: "7px 12px" }}>
                      {opt.emoji} {opt.label}
                    </Btn>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div style={{ height: 32 }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// PROFILE TAB
// ─────────────────────────────────────────────────────────────────
const ProfileTab = ({ user, onLogout, voiceType, saveVoiceType, history, uid }) => {
  const evals = ls.get(`bl_eval_${uid}`, []);
  const personalAdj = getPersonalAdj(uid);
  const learnedCount = evals.filter(e => e.actualKey != null).length;
  const avgConf = history.length
    ? Math.round(history.reduce((a, h) => a + (h.result?.confidence || 7), 0) / history.length)
    : 0;

  return (
    <div>
      {/* 프로필 헤더 */}
      <div style={{ textAlign: "center", padding: "32px 0 24px", animation: "fadeUp 0.35s ease forwards" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", margin: "0 auto 16px",
          background: `linear-gradient(135deg, ${T.gold}, ${T.goldLt})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 900, color: "#080808",
          boxShadow: `0 0 30px ${T.goldDim}`,
        }}>
          {(user.name || "U")[0].toUpperCase()}
        </div>
        <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 300, color: T.text }}>{user.name}</div>
        <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>{user.email}</div>

        {/* 학습 현황 */}
        {learnedCount > 0 && (
          <div style={{
            marginTop: 16, padding: "12px 20px", borderRadius: 14, display: "inline-block",
            background: personalAdj !== 0 ? T.tealDim : T.goldDim,
            border: `1px solid ${personalAdj !== 0 ? T.teal + "44" : T.goldBdr}`,
          }}>
            {personalAdj !== 0 ? (
              <div style={{ fontSize: 13, color: T.teal }}>
                🧠 학습 완료 — {personalAdj > 0 ? `+${personalAdj}키` : `${personalAdj}키`} 보정 중
              </div>
            ) : (
              <div style={{ fontSize: 13, color: T.gold }}>
                📊 학습 중 ({learnedCount}건)
              </div>
            )}
          </div>
        )}
      </div>

      {/* 통계 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16, animation: "fadeUp 0.35s 0.05s ease both" }}>
        {[
          { label: "분석", val: history.length, icon: "🎯" },
          { label: "확신도", val: avgConf ? `${avgConf}/10` : "-", icon: "⭐" },
          { label: "학습", val: learnedCount, icon: "🧠" },
        ].map(s => (
          <div key={s.label} style={{ ...S.card, textAlign: "center", padding: "18px 8px" }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 400, color: T.gold, margin: "6px 0" }}>{s.val}</div>
            <div style={{ fontSize: 10, color: T.textDim, letterSpacing: "1px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 음역대 설정 */}
      <div style={{ ...S.card, marginBottom: 16, animation: "fadeUp 0.35s 0.1s ease both" }}>
        <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>
          내 음역대
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {VOICE_TYPES.map(v => (
            <div key={v.id} onClick={() => saveVoiceType(v.id)}
              style={{
                padding: "14px 8px", borderRadius: 16, textAlign: "center", cursor: "pointer",
                background: voiceType === v.id ? T.goldDim : T.bg2,
                border: `1px solid ${voiceType === v.id ? T.goldBdr : T.bdr}`,
                transition: "all 0.2s",
              }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{v.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: voiceType === v.id ? T.gold : T.text, marginBottom: 3 }}>
                {v.label}
              </div>
            </div>
          ))}
        </div>
        {voiceType ? (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 12, background: T.goldDim, border: `1px solid ${T.goldBdr}`, fontSize: 12, color: T.gold, textAlign: "center" }}>
            ✅ {VOICE_TYPES.find(v => v.id === voiceType)?.label} 설정됨
          </div>
        ) : (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 12, background: T.roseDim, border: `1px solid ${T.rose}44`, fontSize: 12, color: T.rose, textAlign: "center" }}>
            ⚠ 음역대를 설정해야 정확한 키 계산이 가능해요
          </div>
        )}
      </div>

      {/* 로그아웃 */}
      <Btn variant="secondary" onClick={onLogout} style={{ animation: "fadeUp 0.35s 0.15s ease both" }}>
        로그아웃
      </Btn>
      <div style={{ height: 32 }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────
function MainApp({ user, onLogout }) {
  const uid = user.email;
  const [tab,        setTab]       = useState("home");
  const [quickMode,  setQuickMode] = useState(true);
  const [comfSongs,  setComfSongs] = useState([null, null, null]);
  const [targetSong, setTargetSong]= useState(null);
  const [situation,  setSituation] = useState(null);
  const [condition,  setCondition] = useState(null);
  const [extraNote,  setExtraNote] = useState("");
  const [result,     setResult]    = useState(null);
  const [loading,    setLoading]   = useState(false);
  const [loadStep,   setLoadStep]  = useState(0);
  const [repo,       setRepo]      = useState(() => ls.get(`bl_repo_${uid}`, []));
  const [history,    setHistory]   = useState(() => ls.get(`bl_hist_${uid}`, []));
  const [voiceType,  setVoiceType] = useState(() => ls.get(`bl_voice_${uid}`, null));

  const saveRepo      = r => { setRepo(r);      ls.set(`bl_repo_${uid}`, r);    };
  const saveHistory   = h => { setHistory(h);   ls.set(`bl_hist_${uid}`, h);    };
  const saveVoiceType = v => { setVoiceType(v); ls.set(`bl_voice_${uid}`, v);   };

  // ── 분석 실행 ──────────────────────────────────────────────────
  const runAnalysis = async () => {
    const valid = comfSongs.filter(Boolean);
    if (!valid.length) { alert("편하게 부르는 곡을 1개 이상 입력해주세요!"); return; }
    if (!targetSong)   { alert("목표곡을 입력해주세요!"); return; }

    setLoading(true); setResult(null); setLoadStep(0);
    const iv = setInterval(() => setLoadStep(p => (p + 1) % 4), 1400);

    // 키 계산 (코드가 직접 결정)
    const { keyStr, keyNum, breakdown, songData } = await calcKey({
      voiceType, targetSong, situation, condition, history, uid,
    });

    const voice = VOICE_TYPES.find(v => v.id === voiceType);
    const sit   = SITUATIONS.find(s => s.id === situation);
    const cond  = CONDITIONS.find(c => c.id === condition);
    const personalAdj = getPersonalAdj(uid);
    const keyFeedback = history.slice(0, 10)
      .filter(h => h.rating && h.target?.title)
      .map(h => `"${h.target.title}" → ${h.result?.recommendedKey} 추천, 평가: "${h.rating}"`)
      .join("\n") || "없음";

    const prompt = `당신은 노래방 AI 코치 "부를레옹"입니다.
키는 이미 계산 완료됐어요. 설명과 팁만 작성하세요. recommendedKey는 반드시 "${keyStr}"로 고정하세요.

[확정 키: ${keyStr}]
계산: ${breakdown.map(b => `${b.label}(${b.value > 0 ? "+" + b.value : b.value}키)`).join(" + ")}
${personalAdj !== 0 ? `개인학습 ${personalAdj > 0 ? "+" + personalAdj : personalAdj}키 반영` : ""}

[사용자]
음역: ${voice?.label || "미설정"}
기준곡: ${valid.map(s => `"${s.title}"(${s.artist})`).join(", ")}
목표곡: "${targetSong.title}"(${targetSong.artist}) TJ:${targetSong.tj}
상황: ${sit ? sit.label : "없음"} / 컨디션: ${cond ? cond.label : "없음"}
메모: ${extraNote || "없음"}
DB: ${songData ? `최고음 ${songData.maxNote}, 난이도 ${songData.difficulty}, ${songData.gender}곡` : "미수록"}
과거: ${keyFeedback}

대체곡은 사용자 음역에 맞고 실제 존재하는 곡으로, TJ 번호 포함해서 추천해주세요.

JSON만 반환:
{
  "voiceSummary": "음역 분석 2문장",
  "feasibility": "부르기 쉬움 또는 도전적 또는 키 조절 필수",
  "recommendedKey": "${keyStr}",
  "keyLogic": "이 키인 이유",
  "conditionTip": ${cond ? '"컨디션 팁"' : "null"},
  "situationStrategy": ${sit ? '"상황 전략"' : "null"},
  "vocalTips": ["팁1","팁2","팁3"],
  "practiceSteps": [{"step":1,"title":"단계","desc":"설명"},{"step":2,"title":"단계","desc":"설명"},{"step":3,"title":"단계","desc":"설명"}],
  ${sit ? `"setlist": [${sit.roles.map(r => `{"role":"${r}","title":"곡명","artist":"가수","tj":"번호","reason":"이유"}`).join(",")}],` : `"setlist": null,`}
  "alternatives": [
    {"title":"곡명","artist":"가수","tj":"번호","reason":"이유","matchScore":9},
    {"title":"곡명","artist":"가수","tj":"번호","reason":"이유","matchScore":8},
    {"title":"곡명","artist":"가수","tj":"번호","reason":"이유","matchScore":7}
  ],
  "repoTag": "safe",
  "confidence": 8,
  "vibes": ["키워드1","키워드2"]
}`;

    let r;
    try {
      const text = await callAI(prompt);
      r = parseJSON(text) || {};
    } catch(e) {
      r = {};
    }

    // 키는 항상 코드 계산값
    r.recommendedKey = keyStr;
    r.keyNum         = keyNum;
    r.keyBreakdown   = breakdown;

    // 기본값 보정
    if (!r.voiceSummary)  r.voiceSummary  = "기준곡을 분석해 음역을 파악했어요.";
    if (!r.feasibility)   r.feasibility   = "키 조절 필수";
    if (!r.keyLogic)      r.keyLogic      = `음역 분석 결과 ${keyStr}이 가장 적합해요.`;
    if (!r.vocalTips)     r.vocalTips     = ["후렴 전 깊게 숨 들이쉬기", "고음 구간에서 힘 빼기", "끝 음절 부드럽게"];
    if (!r.practiceSteps) r.practiceSteps = [
      { step: 1, title: "원곡 청취", desc: "원곡 3번 들으며 멜로디 파악" },
      { step: 2, title: "허밍 연습", desc: "추천 키로 전체 허밍" },
      { step: 3, title: "반복 연습", desc: "후렴구 위주 반복" },
    ];
    if (!r.alternatives)  r.alternatives  = [
      { title: "취중고백",     artist: "김민석", tj: "62994", reason: "비슷한 음역의 감성 발라드", matchScore: 9 },
      { title: "걱정말아요 그대", artist: "이적",   tj: "45592", reason: "편안한 중저음",           matchScore: 8 },
      { title: "거리에서",     artist: "성시경", tj: "16503", reason: "안정적인 중저음 발라드",   matchScore: 7 },
    ];
    if (!r.confidence) r.confidence = 7;
    if (!r.vibes)      r.vibes      = ["감성", "발라드"];
    if (!r.repoTag)    r.repoTag    = "prac";

    const entry = {
      id: Date.now(), target: targetSong, comfSongs: valid,
      situation, condition, result: r,
      date: new Date().toLocaleDateString("ko-KR"), rating: null,
    };
    setResult(r);
    saveHistory([entry, ...history].slice(0, 40));
    setTab("result");

    clearInterval(iv);
    setLoading(false);
  };

  const TABS = [
    { id: "home",    icon: "♪",  label: "홈"      },
    { id: "result",  icon: "✦",  label: "결과"    },
    { id: "library", icon: "◈",  label: "레파토리" },
    { id: "history", icon: "◷",  label: "기록"    },
    { id: "profile", icon: "◎",  label: "프로필"  },
  ];

  return (
    <div style={S.app}>
      <style>{G}</style>

      {/* 배경 장식 */}
      <div style={{
        position: "fixed", top: "-20%", right: "-15%",
        width: "50vw", height: "50vw", borderRadius: "50%",
        background: `radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ ...S.wrap, paddingTop: 0, paddingBottom: 88 }}>
        {/* 헤더 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 0 12px", position: "sticky", top: 0, zIndex: 50,
          background: `linear-gradient(to bottom, ${T.bg} 80%, transparent)`,
        }}>
          <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 300, color: T.gold, letterSpacing: "2px" }}>
            부를레옹
          </div>
          {repo.length > 0 && (
            <span style={{ ...S.tag(T.gold), fontSize: 11 }}>{repo.length}곡</span>
          )}
        </div>

        {/* 탭 컨텐츠 */}
        <div key={tab} style={{ animation: "fadeUp 0.25s ease forwards" }}>
          {tab === "home" && (
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
              onGoProfile={() => setTab("profile")}
            />
          )}
          {tab === "result" && (
            <ResultTab
              result={result} targetSong={targetSong}
              situation={situation} uid={uid}
              repo={repo} saveRepo={saveRepo}
              setTab={setTab}
            />
          )}
          {tab === "library" && (
            <LibraryTab repo={repo} saveRepo={saveRepo} setTab={setTab} />
          )}
          {tab === "history" && (
            <HistoryTab
              history={history} saveHistory={saveHistory}
              setResult={setResult} setTargetSong={setTargetSong}
              setSituation={setSituation} setTab={setTab}
            />
          )}
          {tab === "profile" && (
            <ProfileTab
              user={user} onLogout={onLogout}
              voiceType={voiceType} saveVoiceType={saveVoiceType}
              history={history} uid={uid}
            />
          )}
        </div>
      </div>

      {/* 바텀 탭 */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, zIndex: 100,
        background: `${T.bg1}f0`, backdropFilter: "blur(20px)",
        borderTop: `1px solid ${T.bdr}`,
      }}>
        <div style={{ display: "flex" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: "12px 0 10px",
                background: "transparent", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                position: "relative",
                color: tab === t.id ? T.gold : T.textDim,
                transition: "color 0.2s", fontFamily: F.body,
              }}>
              {tab === t.id && (
                <div style={{
                  position: "absolute", top: 0, left: "25%", right: "25%",
                  height: 1.5, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`,
                  animation: "fadeIn 0.2s ease forwards",
                }} />
              )}
              <span style={{ fontSize: 16, transition: "transform 0.2s", transform: tab === t.id ? "scale(1.2)" : "scale(1)" }}>
                {t.icon}
              </span>
              <span style={{ fontSize: 9, fontWeight: tab === t.id ? 700 : 400, letterSpacing: "0.5px" }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState(() => ls.get("bl_sess", null) ? "app" : "login");
  const [user,   setUser]   = useState(() => ls.get("bl_sess", null));
  const login  = u => { setUser(u); setScreen("app"); };
  const logout = () => { ls.del("bl_sess"); setUser(null); setScreen("login"); };
  if (screen === "register") return <RegisterScreen onLogin={login} onBack={() => setScreen("login")} />;
  if (screen === "login")    return <LoginScreen onLogin={login} onRegister={() => setScreen("register")} />;
  if (user)                  return <MainApp user={user} onLogout={logout} />;
  return null;
}
