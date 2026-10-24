// 무림인생 — NovelAI 중계 서버 (Cloudflare Workers)
// 브라우저는 보안 정책(CORS) 때문에 NovelAI에 바로 요청하지 못할 수 있다. 이 워커가 대신 전달한다.
// 1) ALLOW_ORIGIN을 게임이 올라간 주소로 바꾼다. 예: 'https://내아이디.github.io'
//    (주소 끝에 / 나 저장소 이름은 붙이지 않는다. 다른 사이트는 이 워커를 쓰지 못한다.)
// 2) Cloudflare 대시보드 → Workers & Pages → Create → Worker → 이 코드를 붙여 넣고 Deploy.
// 3) 게임의 설정 → 중계 서버 주소에 워커 주소(https://○○.workers.dev)를 넣는다.
// NovelAI 토큰은 요청마다 브라우저에서 넘어올 뿐, 이 워커에는 저장되지 않는다.
const ALLOW_ORIGIN = 'https://jjhk0803.github.io';
const ALLOW_HOSTS = ['image.novelai.net'];

function cors(req) {
  return {
    'access-control-allow-origin': ALLOW_ORIGIN,
    'access-control-allow-methods': 'POST,OPTIONS',
    'access-control-allow-headers': req.headers.get('access-control-request-headers') || 'authorization,content-type',
    'access-control-expose-headers': '*',
    'access-control-max-age': '86400',
    'vary': 'origin',
  };
}

export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) });
    const origin = req.headers.get('origin') || '';
    if (origin !== ALLOW_ORIGIN) return new Response('origin not allowed', { status: 403 });
    if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: cors(req) });
    let target;
    try { target = new URL(new URL(req.url).searchParams.get('u')); } catch (e) { return new Response('bad url', { status: 400, headers: cors(req) }); }
    if (target.protocol !== 'https:' || !ALLOW_HOSTS.includes(target.hostname)) return new Response('host not allowed', { status: 403, headers: cors(req) });
    const h = new Headers();
    for (const k of ['authorization', 'content-type', 'accept']) { const v = req.headers.get(k); if (v) h.set(k, v); }
    const r = await fetch(target, { method: 'POST', headers: h, body: await req.arrayBuffer() });
    const out = new Response(r.body, r);
    Object.entries(cors(req)).forEach(([k, v]) => out.headers.set(k, v));
    return out;
  },
};
