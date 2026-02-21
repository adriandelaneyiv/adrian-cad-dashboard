import fs from 'node:fs/promises';

const outPath = new URL('./social-data.json', import.meta.url);

async function fetchYouTubeSubs(apiKey, channelId) {
  if (!apiKey || !channelId) return null;
  const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API ${res.status}`);
  const data = await res.json();
  const subs = Number(data?.items?.[0]?.statistics?.subscriberCount || 0);
  return Number.isFinite(subs) ? subs : null;
}

async function main() {
  const current = JSON.parse(await fs.readFile(outPath, 'utf8'));

  const yt = await fetchYouTubeSubs(process.env.YOUTUBE_API_KEY, process.env.YOUTUBE_CHANNEL_ID).catch(() => null);

  const instagram = Number(process.env.INSTAGRAM_FOLLOWERS || current.totals.instagram || 0);
  const tiktok = Number(process.env.TIKTOK_FOLLOWERS || current.totals.tiktok || 0);
  const youtube = yt ?? Number(process.env.YOUTUBE_FOLLOWERS || current.totals.youtube || 0);
  const total = instagram + tiktok + youtube;

  const next = {
    lastUpdated: new Date().toISOString(),
    totals: {
      instagram,
      tiktok,
      youtube,
      total,
      yearTarget: Number(process.env.YEAR_TARGET || current.totals.yearTarget || 100000)
    }
  };

  await fs.writeFile(outPath, JSON.stringify(next, null, 2));
  console.log('Updated social-data.json', next);
}

main();
