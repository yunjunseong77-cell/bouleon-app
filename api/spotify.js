export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId) return res.status(200).json({ error: "SPOTIFY_CLIENT_ID 없음" });
  if (!clientSecret) return res.status(200).json({ error: "SPOTIFY_CLIENT_SECRET 없음" });
  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.status(200).json({ error: "토큰 실패", detail: tokenData });
    return res.status(200).json({ success: true, message: "토큰 발급 성공!" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
