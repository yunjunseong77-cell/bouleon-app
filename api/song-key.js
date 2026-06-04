// v2
export default async function handler(req, res) {
  export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    // 환경변수 확인
    if (!clientId || !clientSecret) {
      return res.status(200).json({
        error: "환경변수 없음",
        clientId: clientId ? "있음" : "없음",
        clientSecret: clientSecret ? "있음" : "없음"
      });
    }

    // 토큰 발급
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(200).json({ error: "토큰 발급 실패", detail: tokenData });
    }

    return res.status(200).json({ success: true, token: "발급 성공!" });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
