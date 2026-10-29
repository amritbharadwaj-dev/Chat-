(function () {
'use strict';
const db = firebase.firestore(), FV = firebase.firestore.FieldValue, $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let me, tab = 'chats', sub = 'chats', U = {}, msgs = [], posts = [], calls = [], open = null, subs = [], pollT = 0;
let cs = null, pc = null, stream = null, p2p = null, ringT = 0, callT = 0, ac = null;

/* ---------- theme ---------- */
function theme() {
  const t = localStorage.th || 'dark';
  document.documentElement.dataset.th = t === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t;
}
theme(); matchMedia('(prefers-color-scheme: dark)').addEventListener('change', theme);

const CSS = `
html[data-th=light]{--bg:#fff;--card:#f0f2f5;--line:#e3e6e9;--tx:#111b21;--mut:#667781;--bub:#d9fdd3;--bubt:#111b21}
html[data-th=dark]{--bub:#005c4b;--bubt:#e9edef}
#app{padding:0;flex-direction:column;background:var(--bg)}
.top{display:flex;align-items:center;justify-content:space-between;background:var(--card);padding:max(14px,env(safe-area-inset-top)) 18px 12px;border-bottom:1px solid var(--line);font-size:21px;font-weight:700}
#main{flex:1;overflow:auto}.pad{padding:14px 16px}
.chips{display:flex;gap:8px;padding:10px 14px;overflow:auto}.chip{padding:7px 14px;border-radius:18px;background:var(--card);color:var(--mut);font-size:13px;white-space:nowrap}.chip.on{background:#25d36633;color:var(--g);font-weight:700}
.row{display:flex;gap:12px;align-items:center;padding:10px 16px;border-bottom:1px solid var(--line)}.row:active{background:var(--card)}
.grow{flex:1;min-width:0}.nm{font-weight:600;display:flex;align-items:center;gap:4px}.sm{font-size:13px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.av{border-radius:50%;object-fit:cover;display:grid;place-items:center;color:#fff;font-weight:700;flex:none;text-transform:uppercase}
.tk{width:15px;height:15px;flex:none}.bd{background:var(--g);color:#06260f;border-radius:10px;min-width:20px;height:20px;font-size:12px;font-weight:700;display:grid;place-items:center;padding:0 6px}
.srch{margin:6px 14px;padding:11px 16px;border-radius:14px;border:0;background:var(--card);color:var(--tx);font-size:15px;width:calc(100% - 28px)}
.tabs{display:flex;background:var(--card);border-top:1px solid var(--line);padding-bottom:env(safe-area-inset-bottom)}
.tabs button{flex:1;background:none;border:0;color:var(--mut);padding:9px 0;font-size:11px;position:relative}.tabs button.on{color:var(--g);font-weight:700}.tabs svg{display:block;margin:0 auto 2px;width:22px;height:22px;fill:currentColor}
.ov{position:fixed;inset:0;background:var(--bg);display:flex;flex-direction:column;z-index:20;animation:in .2s}
.ov.hide,#top.hide{display:none}
#top{position:fixed;inset:0;z-index:30;display:flex;flex-direction:column;background:#0b141a;color:#fff;align-items:center;justify-content:center;gap:10px}
.th-h{display:flex;align-items:center;gap:10px;padding:max(10px,env(safe-area-inset-top)) 10px 10px;background:var(--card);border-bottom:1px solid var(--line)}
.ib{background:none;border:0;color:var(--tx);padding:8px;font-size:20px;line-height:1}.ib svg{width:22px;height:22px;fill:currentColor;display:block}
#ml{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:5px}
.b{max-width:78%;padding:8px 11px;border-radius:12px;word-break:break-word;white-space:pre-wrap;background:var(--card);align-self:flex-start;user-select:text}.b.me{background:var(--bub);color:var(--bubt);align-self:flex-end}
.b small{display:block;font-size:10px;color:var(--mut);text-align:right;margin-top:2px}.b.st{background:none;font-size:56px;padding:0}
.inp{display:flex;gap:8px;padding:8px 10px max(8px,env(safe-area-inset-bottom));background:var(--card);align-items:center}
.inp input{flex:1;border-radius:22px;padding:11px 16px}.send{background:var(--g);border:0;border-radius:50%;width:44px;height:44px;color:#06260f;font-size:18px}
.tray{display:none;flex-wrap:wrap;gap:4px;padding:8px;background:var(--card);border-top:1px solid var(--line)}.tray.on{display:flex}.tray span{font-size:32px;padding:4px}
.p2p{color:var(--g);font-weight:900;font-size:16px}
.req{padding:12px;background:var(--card);text-align:center;font-size:13px}.req button{margin:8px 6px 0;padding:8px 18px;border-radius:18px;border:0;background:var(--g);color:#06260f;font-weight:700}.req button.x{background:#3a4a52;color:#fff}
.notes{display:flex;gap:14px;overflow:auto;padding:14px 16px}.note{flex:none;width:84px;text-align:center;font-size:11px}.nb{background:var(--card);border-radius:14px;padding:6px 8px;margin-bottom:-8px;position:relative;z-index:1;font-size:11px;max-height:46px;overflow:hidden}
.ring{padding:2px;border-radius:50%;background:linear-gradient(135deg,#25d366,#128c7e)}.ring.seen{background:var(--line)}.ring .av{border:2px solid var(--bg)}
h4{margin:14px 16px 4px;color:var(--mut);font-size:12px;text-transform:uppercase;letter-spacing:1px}
.seg{display:flex;background:var(--card);border-radius:12px;padding:3px}.seg button{flex:1;border:0;background:none;color:var(--mut);padding:9px;border-radius:10px}.seg button.on{background:var(--g);color:#06260f;font-weight:700}
.btn{border:0;border-radius:14px;padding:13px;background:var(--card);color:var(--tx);font-size:15px;width:100%;margin-top:10px}
.cbtn{width:64px;height:64px;border-radius:50%;border:0;font-size:26px;color:#fff;background:#2a3942;margin:8px}.cbtn.g{background:#25d366}.cbtn.r{background:#f44}
#rv{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1}
.story{background:linear-gradient(160deg,#128c7e,#0b141a);padding:30px;text-align:center;font-size:26px;font-weight:600;flex:1;display:flex;align-items:center;justify-content:center;color:#fff}
.mini{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:50}`;
const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

/* ---------- helpers ---------- */
const TK = '<svg class="tk" viewBox="0 0 24 24"><path fill="#1d9bf0" d="M12 1l3 2 3.5-.3 1 3.4 3 1.9-1.2 3.3 1.2 3.3-3 1.9-1 3.4L15 21l-3 2-3-2-3.5.3-1-3.4-3-1.9L3.7 12 2.5 8.7l3-1.9 1-3.4L9 3z"/><path d="M8 12.5l2.7 2.7L16 9.8" stroke="#fff" stroke-width="2" fill="none"/></svg>';
const IC = { chat: 'M4 4h16v12H7l-3 3z', upd: 'M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7z', call: 'M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02z', you: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4 0-8 2-8 5v3h16v-3c0-3-4-5-8-5z' };
const ico = k => `<svg viewBox="0 0 24 24"><path d="${IC[k]}"/></svg>`;
function cu(s) { const d = s.data() || {}, r = U[s.id] = U[s.id] || {}; Object.assign(r, { id: s.id, username: d.username, name: d.displayName || d.username, v: !!d.verified, img: d.avatar || '' }); return r; }
async function ensureU(ids) { const miss = [...new Set(ids)].filter(i => !U[i] || !U[i].username); await Promise.all(miss.map(async i => { const s = await db.doc('users/' + i).get(); if (s.exists) cu(s); })); }
async function findUsers(q) { const s = await db.collection('users').orderBy('username').startAt(q).endAt(q + '\uf8ff').limit(15).get(); return s.docs.filter(d => d.id !== me.id).map(cu); }
async function userByName(n) { const d = await db.doc('usernames/' + n).get(); if (!d.exists) return null; await ensureU([d.data().uid]); return U[d.data().uid]; }
const av = (u, s = 46) => u.img ? `<img class="av" data-a="photo" data-id="${u.id}" src="${esc(u.img)}" style="width:${s}px;height:${s}px">` :
  `<div class="av" data-a="photo" data-id="${u.id}" style="width:${s}px;height:${s}px;font-size:${s * .4}px;background:hsl(${[...(u.id || 'x')].reduce((a, c) => a + c.charCodeAt(0), 0) * 47 % 360},45%,42%)">${esc((u.username || '?')[0])}</div>`;
const nm = u => esc(u.name) + (u.v ? TK : '');
const tm = d => { d = new Date(d); const n = new Date(); return d.toDateString() === n.toDateString() ? d.toTimeString().slice(0, 5) : d.getDate() + '/' + (d.getMonth() + 1); };
function toast(t) { const e = $('toast'); e.textContent = t; e.classList.add('on'); setTimeout(() => e.classList.remove('on'), 2600); }
function beep(ring) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    [[880, 0], [1175, .13]].forEach(([f, t]) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(.18, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + t + (ring ? .35 : .2)); o.start(ac.currentTime + t); o.stop(ac.currentTime + t + .4); });
  } catch (e) {}
}
function notify(title, body) {
  beep();
  if (document.hidden && window.Notification && Notification.permission === 'granted') try { new Notification(title, { body }); } catch (e) {} else toast(title + ': ' + body);
}
const ytId = u => { const m = String(u || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : ''; };
const yt = id => `<iframe width="100%" height="90" src="https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1" allow="autoplay;encrypted-media" style="border:0;border-radius:12px"></iframe>`;

/* ---------- data ---------- */
const E = { serverTimestamps: 'estimate' };
async function loadPosts() {
  const s = await db.collection('posts').where('exp', '>', new Date()).get();
  posts = s.docs.map(x => { const d = x.data(E); return { id: x.id, o: d.owner, type: d.type, text: d.text, yt: d.yt, at: d.at.toDate() }; }).sort((a, b) => b.at - a.at);
  await ensureU(posts.map(p => p.o));
}
async function loadCalls() {
  const r = await Promise.all(['from', 'to'].map(f => db.collection('calls').where(f, '==', me.id).get()));
  const all = r.flatMap(s => s.docs.map(x => x.data(E))).sort((a, b) => b.at.toDate() - a.at.toDate()).slice(0, 40);
  await ensureU(all.map(d => d.from === me.id ? d.to : d.from));
  calls = all.map(d => ({ o: d.from === me.id ? d.to : d.from, out: d.from === me.id, kind: d.kind, res: d.result, dur: d.dur, at: d.at.toDate() }));
}
const MM = {};
async function onMsgSnap(snap, first) {
  const add = [];
  snap.docChanges().forEach(ch => {
    const d = ch.doc.data(E), m = { id: ch.doc.id, f: d.from, t: d.to, text: d.text, at: d.at.toDate() };
    if (ch.type === 'removed') delete MM[m.id]; else { const isNew = !MM[m.id]; MM[m.id] = m; if (isNew) add.push(m); }
  });
  await ensureU(Object.values(MM).map(m => m.f === me.id ? m.t : m.f));
  msgs = Object.values(MM).sort((a, b) => a.at - b.at);
  if (!first) add.filter(m => m.t === me.id).forEach(m => { if (open === m.f && !document.hidden) localStorage['seen_' + m.f] = Date.now(); else notify(U[m.f].name, m.text.startsWith('[s]') ? 'Sticker' : m.text); });
  rThread(); if (tab === 'chats' && !open) rChats();
}
function convs() {
  const m = {}, acc = (me.accepted || []), arc = (me.archived || []);
  msgs.forEach(x => { const o = x.f === me.id ? x.t : x.f; (m[o] = m[o] || { o, l: [] }).l.push(x); });
  return Object.values(m).map(c => { c.last = c.l[c.l.length - 1]; c.req = !acc.includes(c.o); c.arc = arc.includes(c.o); const seen = +localStorage['seen_' + c.o] || 0; c.un = c.l.filter(x => x.f === c.o && +x.at > seen).length; return c; }).sort((a, b) => b.last.at - a.last.at);
}

/* ---------- main render ---------- */
function shell() {
  $('app').innerHTML = `<div class="top"><span id="ttl">Chats</span><span id="topr"></span></div><div id="main"></div>
  <div class="tabs">${[['chats', 'chat', 'Chats'], ['upd', 'upd', 'Updates'], ['calls', 'call', 'Calls'], ['you', 'you', 'You']].map(t => `<button data-a="tab" data-id="${t[0]}">${ico(t[1])}${t[2]}</button>`).join('')}</div>
  <div class="ov hide" id="ov"></div><div id="top" class="hide"></div>`;
  $('app').onclick = onClick;
}
function render() {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.id === tab));
  $('ttl').textContent = { chats: 'Chats', upd: 'Updates', calls: 'Calls', you: 'You' }[tab];
  ({ chats: rChats, upd: rUpd, calls: rCalls, you: rYou })[tab]();
}
function rChats() {
  const cv = convs(), rq = cv.filter(c => c.req && !c.arc).length;
  const list = cv.filter(c => sub === 'arc' ? c.arc : sub === 'req' ? c.req && !c.arc : !c.req && !c.arc);
  $('main').innerHTML = `<input class="srch" id="sq" placeholder="Username search karein" autocapitalize="none" autocomplete="off" value="${esc(window._sq || '')}">
  <div class="chips">${[['chats', 'Chats'], ['req', 'Requests' + (rq ? ' (' + rq + ')' : '')], ['arc', 'Archived']].map(c => `<span class="chip ${sub === c[0] ? 'on' : ''}" data-a="sub" data-id="${c[0]}">${c[1]}</span>`).join('')}</div><div id="cl">${rows(list)}</div>`;
  $('sq').oninput = onSearch;
  if (window._sq) onSearch({ target: $('sq') });
}
function rows(list) {
  return list.length ? list.map(c => { const u = U[c.o] || {}; return `<div class="row" data-a="open" data-id="${c.o}">${av(u)}<div class="grow"><div class="nm">${nm(u)}</div><div class="sm">${c.last.f === me.id ? '✓ ' : ''}${esc(c.last.text.startsWith('[s]') ? 'Sticker' : c.last.text)}</div></div><div style="text-align:right"><div class="sm">${tm(c.last.at)}</div>${c.un ? `<div class="bd">${c.un}</div>` : ''}</div></div>`; }).join('') : '<p class="sm" style="text-align:center;margin:40px">Kuch nahi hai</p>';
}
let sT = 0;
function onSearch(e) {
  clearTimeout(sT); const q = e.target.value.trim().toLowerCase(); window._sq = q;
  if (!q) return rChats();
  sT = setTimeout(async () => {
    const r = await findUsers(q);
    if ($('cl') && window._sq === q) $('cl').innerHTML = r.length ? r.map(u => `<div class="row" data-a="open" data-id="${u.id}">${av(u)}<div class="grow"><div class="nm">${nm(u)}</div><div class="sm">@${esc(u.username)}</div></div></div>`).join('') : '<p class="sm" style="text-align:center;margin:40px">User nahi mila</p>';
  }, 300);
}

/* ---------- thread ---------- */
function openThread(id) {
  open = id; localStorage['seen_' + id] = Date.now(); const u = U[id];
  const o = $('ov'); o.classList.remove('hide');
  o.innerHTML = `<div class="th-h"><button class="ib" data-a="back">←</button>${av(u, 38)}<div class="grow"><div class="nm">${nm(u)}<span id="p2pi"></span></div><div class="sm">@${esc(u.username)}</div></div>
  <button class="ib" data-a="call" data-id="${id}" data-v="0">${ico('call')}</button><button class="ib" data-a="call" data-id="${id}" data-v="1">📹</button><button class="ib" data-a="arch" data-id="${id}">🗂</button></div>
  <div id="rq"></div><div id="ml"></div><div class="tray" id="tray">${'😀😂😍🥰😎😭😡👍🙏❤️🔥🎉😴🤔🥳😘'.match(/\p{Extended_Pictographic}\uFE0F?/gu).map(e => `<span data-a="stk" data-id="${e}">${e}</span>`).join('')}</div>
  <div class="inp"><button class="ib" data-a="tray">😊</button><input id="mi" placeholder="Message" autocomplete="off"><button class="send" data-a="send">➤</button></div>`;
  $('mi').onkeydown = e => e.key === 'Enter' && send($('mi').value);
  rThread(); history.pushState({ t: 1 }, '');
}
function rThread() {
  if (!open || !$('ml')) return;
  const acc = ((me.accepted || [])).includes(open);
  $('rq').innerHTML = acc ? '' : `<div class="req">Ye user pehli baar message kar raha hai.<br><button data-a="accept" data-id="${open}">Accept</button><button class="x" data-a="arch" data-id="${open}">Ignore</button></div>`;
  $('p2pi').innerHTML = p2p === open ? ' <span class="p2p">⇄</span>' : '';
  $('ml').innerHTML = msgs.filter(x => x.f === open || x.t === open).map(x => x.text.startsWith('[s]') ? `<div class="b st ${x.f === me.id ? 'me' : ''}">${esc(x.text.slice(3))}</div>` : `<div class="b ${x.f === me.id ? 'me' : ''}">${esc(x.text)}<small>${tm(x.at)}</small></div>`).join('');
  $('ml').scrollTop = 1e9;
}
async function send(text) {
  text = String(text || '').trim(); if (!text || !open) return; const to = open; $('mi').value = '';
  try {
    await db.collection('msgs').add({ from: me.id, to, text, at: FV.serverTimestamp() });
    if (!(me.accepted || []).includes(to)) { me.accepted = (me.accepted || []).concat(to); db.doc('priv/' + me.id).set({ accepted: FV.arrayUnion(to) }, { merge: true }); }
  } catch (e) { toast('Message nahi gaya'); }
}

/* ---------- updates ---------- */
function rUpd() {
  const S = U[me.id];
  const mine = posts.filter(p => p.o === me.id), by = {};
  posts.filter(p => p.type === 'story' && p.o !== me.id).forEach(p => (by[p.o] = by[p.o] || []).push(p));
  const notes = {}; posts.filter(p => p.type === 'note').forEach(p => { if (!notes[p.o]) notes[p.o] = p; });
  const ids = Object.keys(notes);
  $('main').innerHTML = `<div class="notes"><div class="note" data-a="compose" data-id="note"><div class="nb">${notes[me.id] ? esc(notes[me.id].text) : 'Note likhein'}</div>${av(S, 60)}<div>Aapka note</div></div>
  ${ids.filter(i => i !== me.id).map(i => `<div class="note" data-a="pview" data-id="${notes[i].id}"><div class="nb">${notes[i].yt ? '🎵 ' : ''}${esc(notes[i].text)}</div>${av(U[i], 60)}<div>${esc(U[i].name)}</div></div>`).join('')}</div>
  <h4>Status</h4><div class="row" data-a="${mine.some(p => p.type === 'story') ? 'sview' : 'compose'}" data-id="${mine.some(p => p.type === 'story') ? me.id : 'story'}"><div class="ring">${av(S, 50)}</div><div class="grow"><div class="nm">Mera status</div><div class="sm">${mine.some(p => p.type === 'story') ? 'Dekhein' : 'Story add karein'}</div></div><button class="ib" data-a="compose" data-id="story">＋</button></div>
  ${Object.keys(by).map(i => `<div class="row" data-a="sview" data-id="${i}"><div class="ring">${av(U[i], 50)}</div><div class="grow"><div class="nm">${nm(U[i])}</div><div class="sm">${tm(by[i][0].at)}</div></div></div>`).join('')}`;
}
function compose(type) {
  const o = $('ov'); o.classList.remove('hide'); history.pushState({ t: 1 }, '');
  o.innerHTML = `<div class="th-h"><button class="ib" data-a="back">←</button><b>${type === 'note' ? 'Naya Note' : 'Nayi Story'}</b></div><div class="pad">
  <div class="seg"><button class="${type === 'story' ? 'on' : ''}" data-a="compose" data-id="story">Story</button><button class="${type === 'note' ? 'on' : ''}" data-a="compose" data-id="note">Note</button></div>
  <textarea id="ptx" class="srch" style="width:100%;margin:14px 0 0;height:110px" maxlength="${type === 'note' ? 60 : 300}" placeholder="${type === 'note' ? 'Kuch likhein (60 characters)' : 'Story likhein'}"></textarea>
  <input id="pyt" class="srch" style="width:100%;margin:10px 0" placeholder="🎵 YouTube / YouTube Music link (optional)"><button class="btn" style="background:var(--g);color:#06260f;font-weight:700" id="ppost" data-type="${type}" data-a="post">Post (24 ghante)</button></div>`;
}
async function post(btn) {
  const text = $('ptx').value.trim(), link = $('pyt').value.trim(), id = ytId(link);
  if (!text && !id) return toast('Kuch likhein'); if (link && !id) return toast('Sahi YouTube link daalein');
  btn.disabled = true;
  try {
    const type = btn.dataset.type;
    if (type === 'note') await Promise.all(posts.filter(p => p.o === me.id && p.type === 'note').map(p => db.collection('posts').doc(p.id).delete()));
    await db.collection('posts').add({ type, text, yt: id, owner: me.id, at: FV.serverTimestamp(), exp: new Date(Date.now() + 864e5) });
    await loadPosts(); closeOv(); render();
  } catch (e) { toast('Post nahi ho paya'); btn.disabled = false; }
}
function viewPosts(list, i) {
  const p = list[i]; if (!p) return closeOv(); const u = U[p.o];
  const o = $('ov'); o.classList.remove('hide');
  o.innerHTML = `<div class="th-h"><button class="ib" data-a="back">←</button>${av(u, 36)}<div class="grow"><div class="nm">${nm(u)}</div><div class="sm">${tm(p.at)}</div></div>${p.o === me.id ? `<button class="ib" id="pdel">🗑</button>` : ''}</div>
  <div class="story" id="pnext">${esc(p.text)}</div>${p.yt ? yt(p.yt) : ''}<div class="sm" style="text-align:center;padding:8px">${i + 1}/${list.length} · agle ke liye tap karein</div>`;
  $('pnext').onclick = () => viewPosts(list, i + 1);
  if ($('pdel')) $('pdel').onclick = async () => { await db.collection('posts').doc(p.id).delete(); await loadPosts(); closeOv(); render(); };
}

/* ---------- calls tab ---------- */
function rCalls() {
  $('main').innerHTML = `<div class="pad"><input id="dn" class="srch" style="width:100%;margin:0" placeholder="Username type karke call karein" autocapitalize="none" autocomplete="off"><div id="dres"></div>
  <div style="display:flex;justify-content:center"><button class="cbtn g" data-a="dcall" data-v="0">📞</button><button class="cbtn g" data-a="dcall" data-v="1">📹</button></div></div><h4>Recent</h4>
  ${calls.map(c => { const u = U[c.o] || {}; return `<div class="row" data-a="call" data-id="${c.o}" data-v="${c.kind === 'video' ? 1 : 0}">${av(u)}<div class="grow"><div class="nm" style="${c.res === 'missed' && !c.out ? 'color:#f55' : ''}">${nm(u)}</div><div class="sm">${c.out ? '↗' : '↙'} ${c.res === 'missed' ? 'Missed' : c.dur ? Math.round(c.dur / 60 * 10) / 10 + ' min' : 'Declined'} · ${tm(c.at)}</div></div><span>${c.kind === 'video' ? '📹' : '📞'}</span></div>`; }).join('') || '<p class="sm" style="text-align:center;margin:30px">Koi call nahi</p>'}`;
  $('dn').oninput = async e => {
    const q = e.target.value.trim().toLowerCase(); if (!q) return $('dres').innerHTML = '';
    const r = (await findUsers(q)).slice(0, 5);
    $('dres').innerHTML = r.map(u => `<div class="row" data-a="pick" data-id="${u.username}">${av(u, 36)}<div class="nm">${nm(u)}</div></div>`).join('');
  };
}

/* ---------- You ---------- */
function rYou() {
  const S = U[me.id], t = localStorage.th || 'dark';
  $('main').innerHTML = `<div class="pad" style="text-align:center">${av(S, 96)}<div><button class="btn" style="width:auto;padding:8px 18px" data-a="pic">Photo badlein</button><input type="file" id="pf" accept="image/*" hidden></div>
  <div class="nm" style="justify-content:center;font-size:20px;margin-top:8px">${nm(S)}</div><div class="sm">@${esc(S.username)}</div></div>
  <div class="pad"><div class="sm">Naam</div><input id="dnm" class="srch" style="width:100%;margin:4px 0 14px" maxlength="30" value="${esc(S.name)}">
  <div class="sm" style="margin-bottom:6px">Theme</div><div class="seg">${['dark', 'light', 'auto'].map(x => `<button class="${t === x ? 'on' : ''}" data-a="th" data-id="${x}">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div>
  <button class="btn" data-a="notif">🔔 Notifications chalu karein</button><button class="btn" style="color:#f55" data-a="out">Logout</button></div>`;
  $('dnm').onchange = async e => { const v = e.target.value.trim().slice(0, 30); if (!v) return; await db.doc('users/' + me.id).update({ displayName: v }); me.name = v; toast('Naam save ho gaya'); };
  $('pf').onchange = async e => {
    const f = e.target.files[0]; if (!f) return; const bm = await createImageBitmap(f), s = Math.min(1, 200 / Math.max(bm.width, bm.height)), c = document.createElement('canvas');
    c.width = bm.width * s; c.height = bm.height * s; c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
    const url = c.toDataURL('image/jpeg', .7); await db.doc('users/' + me.id).update({ avatar: url }); me.img = url; rYou(); toast('Photo badal gayi');
  };
}

/* ---------- calls (WebRTC peer to peer) ---------- */
const sig = (to, type, data) => db.collection('signals').add({ from: me.id, to, type, data: JSON.parse(JSON.stringify(data)), at: FV.serverTimestamp() }).catch(() => {});
const media = v => navigator.mediaDevices.getUserMedia({ audio: true, video: v ? { facingMode: 'user' } : false });
function mkpc() {
  const c = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  c.onicecandidate = e => e.candidate && sig(cs.u.id, 'ice', { c: e.candidate });
  c.ontrack = e => { const v = $('rv'); if (v) { v.srcObject = e.streams[0]; v.play().catch(() => {}); } };
  c.onconnectionstatechange = () => {
    if (!cs) return;
    if (c.connectionState === 'connected') { clearInterval(ringT); cs.t0 = Date.now(); p2p = cs.u.id; callUI(); rThread(); callT = setInterval(callUI, 1000); }
    if (['failed', 'closed'].includes(c.connectionState)) endCall(false, 'ended');
  };
  return c;
}
function callUI() {
  const t = $('top'); if (!t || !cs) return; t.classList.remove('hide');
  const s = cs.t0 ? (v => String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0'))(Math.floor((Date.now() - cs.t0) / 1000)) : cs.dir === 'in' && !cs.on ? 'Incoming ' + (cs.video ? 'video' : 'audio') + ' call…' : 'Calling…';
  if (!$('cst')) t.innerHTML = `<video id="rv" autoplay playsinline></video><div id="cav"></div><div class="nm" style="font-size:24px" id="cnm"></div><div id="cst" style="opacity:.8"></div><video id="lv" autoplay muted playsinline style="position:absolute;right:14px;top:14px;width:96px;border-radius:12px;display:none"></video><div style="position:absolute;bottom:50px;display:flex" id="cbt"></div>`;
  $('cav').innerHTML = av(cs.u, 110); $('cnm').innerHTML = nm(cs.u) + (cs.t0 ? ' <span class="p2p">⇄</span>' : '');
  $('cst').textContent = s;
  const lv = $('lv'); if (stream && cs.video && stream.getVideoTracks().length) { lv.style.display = 'block'; if (lv.srcObject !== stream) lv.srcObject = stream; }
  const inc = cs.dir === 'in' && !cs.on;
  const b = inc ? `<button class="cbtn r" data-a="end">✖</button><button class="cbtn g" data-a="acc">✔</button>` : `<button class="cbtn" data-a="mute">${cs.muted ? '🔇' : '🎤'}</button><button class="cbtn r" data-a="end">✖</button>`;
  if ($('cbt').dataset.s !== b) { $('cbt').innerHTML = b; $('cbt').dataset.s = b; }
}
async function startCall(u, v) {
  if (cs) return toast('Aap pehle se call me hain'); if (!window.RTCPeerConnection) return toast('Call supported nahi');
  cs = { u, dir: 'out', video: v, on: true, ice: [] };
  try { stream = await media(v); } catch (e) { cs = null; return toast('Mic/Camera ki permission dein'); }
  pc = mkpc(); stream.getTracks().forEach(t => pc.addTrack(t, stream));
  await pc.setLocalDescription(await pc.createOffer()); sig(u.id, 'offer', { sdp: pc.localDescription, video: v });
  callUI(); ringT = setTimeout(() => cs && !cs.t0 && endCall(true, 'missed'), 45000);
  ringBack();
}
let rbT = 0; const ringBack = () => { clearInterval(rbT); rbT = setInterval(() => cs && !cs.t0 ? beep(1) : clearInterval(rbT), 2500); };
async function acceptCall() {
  cs.on = true; clearInterval(rbT);
  try { stream = await media(cs.video); } catch (e) { return endCall(true, 'declined'); }
  pc = mkpc(); stream.getTracks().forEach(t => pc.addTrack(t, stream));
  await pc.setRemoteDescription(cs.offer); for (const c of cs.ice) await pc.addIceCandidate(c).catch(() => {}); cs.ice = [];
  await pc.setLocalDescription(await pc.createAnswer()); sig(cs.u.id, 'answer', { sdp: pc.localDescription }); callUI();
}
function endCall(notifyPeer, res) {
  if (!cs) return; const c = cs; cs = null;
  if (notifyPeer) sig(c.u.id, 'end', {});
  if (c.dir === 'out') db.collection('calls').add({ from: me.id, to: c.u.id, kind: c.video ? 'video' : 'audio', result: c.t0 ? 'done' : res, dur: c.t0 ? Math.round((Date.now() - c.t0) / 1000) : 0, at: FV.serverTimestamp() }).then(loadCalls).then(() => tab === 'calls' && rCalls()).catch(() => {});
  if (stream) stream.getTracks().forEach(t => t.stop()); if (pc) pc.close();
  stream = pc = null; p2p = null; clearInterval(callT); clearInterval(rbT); clearTimeout(ringT);
  const t = $('top'); if (t) { t.classList.add('hide'); t.innerHTML = ''; }
  rThread();
}
async function onSignal(o) {
  const d = o.data(E), s = { from: d.from, type: d.type, data: d.data || {}, at: d.at.toDate() }; o.ref.delete().catch(() => {});
  await ensureU([s.from]);
  if (s.type === 'offer') {
    if (Date.now() - s.at > 45000) return;
    if (cs) return sig(s.from, 'busy', {});
    cs = { u: U[s.from], dir: 'in', video: !!s.data.video, offer: s.data.sdp, ice: [] }; callUI();
    notify(U[s.from].name, 'Incoming call'); clearInterval(rbT); rbT = setInterval(() => cs && !cs.on ? (beep(1), navigator.vibrate && navigator.vibrate(300)) : clearInterval(rbT), 1500);
    ringT = setTimeout(() => cs && !cs.on && endCall(false, 'missed'), 45000);
  } else if (!cs || cs.u.id !== s.from) return;
  else if (s.type === 'answer' && pc) { await pc.setRemoteDescription(s.data.sdp); for (const c of cs.ice) await pc.addIceCandidate(c).catch(() => {}); cs.ice = []; }
  else if (s.type === 'ice') { pc && pc.remoteDescription ? pc.addIceCandidate(s.data.c).catch(() => {}) : cs.ice.push(s.data.c); }
  else if (s.type === 'end' || s.type === 'busy') { if (s.type === 'busy') toast('User busy hai'); endCall(false, s.type === 'busy' ? 'busy' : 'missed'); }
}

/* ---------- actions ---------- */
function closeOv() { open = null; const o = $('ov'); if (o) { o.classList.add('hide'); o.innerHTML = ''; } if (tab === 'chats') rChats(); }
window.addEventListener('popstate', () => { if (open || ($('ov') && !$('ov').classList.contains('hide'))) closeOv(); });
let asked = false;
async function onClick(e) {
  if (!asked && window.Notification && Notification.permission === 'default') { asked = true; Notification.requestPermission(); }
  const el = e.target.closest('[data-a]'); if (!el) return; const a = el.dataset.a, id = el.dataset.id, v = el.dataset.v === '1';
  try {
    if (a === 'tab') { tab = id; render(); if (tab === 'upd') loadPosts().then(rUpd); if (tab === 'calls') loadCalls().then(rCalls); }
    else if (a === 'sub') { sub = id; rChats(); }
    else if (a === 'open') { await ensureU([id]); openThread(id); }
    else if (a === 'back') history.back();
    else if (a === 'send') send($('mi').value);
    else if (a === 'tray') $('tray').classList.toggle('on');
    else if (a === 'stk') { $('tray').classList.remove('on'); send('[s]' + id); }
    else if (a === 'accept') { await db.doc('priv/' + me.id).set({ accepted: FV.arrayUnion(id) }, { merge: true }); me.accepted = (me.accepted || []).concat(id); rThread(); }
    else if (a === 'arch') { const has = (me.archived || []).includes(id); await db.doc('priv/' + me.id).set({ archived: has ? FV.arrayRemove(id) : FV.arrayUnion(id) }, { merge: true }); me.archived = has ? me.archived.filter(x => x !== id) : (me.archived || []).concat(id); toast('Archive update ho gaya'); history.back(); }
    else if (a === 'call') { await ensureU([id]); startCall(U[id], v); }
    else if (a === 'pick') { $('dn').value = id; $('dres').innerHTML = ''; }
    else if (a === 'dcall') { const n = $('dn').value.trim().toLowerCase(); const u = n && await userByName(n); if (!u) return toast('Ye username nahi mila'); startCall(u, v); }
    else if (a === 'compose') compose(id);
    else if (a === 'post') post(el);
    else if (a === 'sview') viewPosts(posts.filter(p => p.o === id && p.type === 'story').reverse(), 0), history.pushState({ t: 1 }, '');
    else if (a === 'pview') { const p = posts.find(x => x.id === id); viewPosts([p], 0); history.pushState({ t: 1 }, ''); }
    else if (a === 'photo') { e.stopPropagation(); const u = U[id]; if (u && u.img) { const t = $('top'); t.classList.remove('hide'); t.innerHTML = `<img src="${esc(u.img)}" style="max-width:100%;max-height:80%;border-radius:12px"><div class="nm" style="font-size:18px">${esc(u.name)}</div>`; t.onclick = () => { if (!cs) { t.classList.add('hide'); t.innerHTML = ''; } t.onclick = null; }; } }
    else if (a === 'pic') $('pf').click();
    else if (a === 'th') { localStorage.th = id; theme(); rYou(); }
    else if (a === 'notif') { const r = window.Notification ? await Notification.requestPermission() : 'denied'; toast(r === 'granted' ? 'Notifications chalu' : 'Browser settings me allow karein'); }
    else if (a === 'acc') acceptCall();
    else if (a === 'end') endCall(true, cs && cs.dir === 'in' && !cs.on ? 'declined' : 'ended');
    else if (a === 'mute' && stream) { cs.muted = !cs.muted; stream.getAudioTracks().forEach(t => t.enabled = !cs.muted); callUI(); }
    else if (a === 'out') { window.stopApp(); await firebase.auth().signOut(); location.reload(); }
  } catch (x) { toast(x.message || 'Error'); }
}

/* ---------- realtime (Firestore) ---------- */
function watch() {
  ['from', 'to'].forEach(f => { let first = true; subs.push(db.collection('msgs').where(f, '==', me.id).onSnapshot(s => { onMsgSnap(s, first); first = false; })); });
  subs.push(db.collection('signals').where('to', '==', me.id).onSnapshot(s => s.docChanges().forEach(c => c.type === 'added' && onSignal(c.doc))));
}
window.startApp = async function () {
  const uid = firebase.auth().currentUser.uid;
  const [us, pr] = await Promise.all([db.doc('users/' + uid).get(), db.doc('priv/' + uid).get()]);
  me = cu(us); const pd = pr.exists ? pr.data() : {}; me.accepted = pd.accepted || []; me.archived = pd.archived || [];
  shell(); await Promise.all([loadPosts(), loadCalls()].map(p => p.catch(() => {}))); render(); watch();
};
window.stopApp = function () { subs.forEach(u => u()); subs = []; };
})();
