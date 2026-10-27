const $ = id => document.getElementById(id);
const toast = (m) => alert(m);
// loader, theme, menu
addEventListener('load', () => setTimeout(() => $('loader')?.remove(), 3200));
const setTheme = t => { document.documentElement.dataset.theme = t; localStorage.setItem('theme', t); $('theme').textContent = t === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode' };
setTheme(document.documentElement.dataset.theme);
$('theme').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
$('burger').onclick = () => { const o = $('links').classList.toggle('on'); $('burger').classList.toggle('open', o); $('burger').setAttribute('aria-expanded', o) };
$('links').addEventListener('click', e => { if (e.target.closest('a')) { $('links').classList.remove('on'); $('burger').classList.remove('open') } });
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => b.closest('.mod').classList.remove('on'));
document.querySelectorAll('.mod').forEach(m => m.onclick = e => { if (e.target === m) m.classList.remove('on') });
const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: .08 });
document.querySelectorAll('.rv').forEach(s => io.observe(s));
// faculty
$('fgrid').innerHTML = FACULTY.map(([n, s], i) => `<div class="fc" style="animation-delay:${i * .08}s"><div class="av">${esc(n.split(' ')[1][0])}</div><h3 style="margin:0">${esc(n)}</h3><p>${esc(s)}</p><a class="btn" href="teacher.html?name=${encodeURIComponent(n)}&subject=${encodeURIComponent(s)}">View Profile</a></div>`).join('');
// admin
['adminPanel', 'editTT', 'viewFol'].forEach(i => $(i).classList.toggle('hid', !isAdmin));
$('adate').disabled = true; todayKey().then(d => $('adate').value = d);
$('cls').innerHTML = ['XI', 'XII'].flatMap(y => [...'ABCDEF'].map(l => `<option>${y}-${l}</option>`)).join('');
// follow
const vid = getVid();
const fRef = db.ref('website_followers'); let joined = false;
fRef.on('value', s => {
    joined = s.hasChild(vid); window.isJoined = joined; $('followers').textContent = '👥 Total Followers: ' + s.numChildren();
    $('joinBtn').textContent = joined ? '💔 Unfollow' : '💗 Join / Follow Website'; $('joinStatus').textContent = joined ? 'Status: Following Successfully 🎉' : 'Status: Not Following'; $('joinStatus').style.color = joined ? '#4ade80' : '#ff8f8f'
});
$('joinBtn').onclick = async () => { if (!joined) return $('mFollow').classList.add('on'); try { await fRef.child(vid).remove() } catch (e) { toast('Could not unfollow. Check Firebase rules.') } };
$('doFollow').onclick = async () => {
    const n = $('fName').value.trim(); if (!n) return toast('Please enter your profile name.');
    try { await fRef.child(vid).set({ name: n, joinedAt: new Date().toISOString() }); $('mFollow').classList.remove('on') } catch (e) { toast('Could not follow. Check Firebase rules.') }
};
const showFollowers = () => {
    $('folBody').innerHTML = 'Loading...'; $('mFol').classList.add('on');
    fRef.once('value').then(s => {
        const a = []; s.forEach(c => { a.push([c.key, c.val()]) }); $('folTitle').textContent = '👥 Followers (' + a.length + ')';
        $('folBody').innerHTML = a.length ? `<div class="tw"><table><thead><tr><th>#</th><th>Profile Name</th><th>Followed On</th><th></th></tr></thead><tbody>${a.reverse().map(([k, v], i) => `<tr><td>${a.length - i}</td><td><b>${esc(v.name || 'Guest Follower')}</b></td><td>${v.joinedAt ? esc(new Date(v.joinedAt).toLocaleString()) : '-'}</td><td><button class="red mini" style="padding:4px 10px;font-size:12px;min-height:0;width:auto" data-rm="${k}">Remove</button></td></tr>`).join('')}</tbody></table></div>` : 'No followers yet.';
        $('folBody').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => confirm('Remove this follower?') && fRef.child(b.dataset.rm).remove().then(showFollowers))
    }).catch(e => { $('folBody').innerHTML = '<p style="color:#ef4444">' + esc(e.message) + '</p>' })
};
$('viewFol').onclick = () => isAdmin && showFollowers();
// manual attendance
$('saveAtt').onclick = async () => {
    if (!joined) return toast('⚠️ Please JOIN / FOLLOW the website first to mark attendance!');
    const r = $('roll').value.trim(), n = $('sname').value.trim(); if (!r || !n) return toast('Please enter both Roll Number and Student Name!');
    const b = $('saveAtt'); b.disabled = true;
    try {
        const c = await claimToday({ via: 'manual', roll: r, name: n });
        if (!c.ok) return toast(BLOCKED_MSG);
        try { await db.ref('attendance_records').push({ date: c.day, rollNo: r, studentName: n, status: $('status').value, timestamp: new Date().toLocaleTimeString() }); toast('Attendance saved successfully 🎉'); $('roll').value = $('sname').value = '' }
        catch (e) { await releaseToday(c.day); toast('Not saved: ' + e.message) }
    } catch (e) { toast('Error: ' + e.message) } finally { b.disabled = false }
};
let recMode = '';
const showErr = e => { $('recBody').innerHTML = `<p style="color:#ef4444"><b>Records load nahi hue:</b> ${esc(e.message || e)}</p><p style="color:var(--mut);font-size:13px">Agar "permission_denied" hai to Firebase Console → Realtime Database → Rules mein <code>.read</code> ko true karein.</p>` };
const openRec = (title, mode) => {
    recMode = mode; $('mTitle').textContent = title; $('clearRec').classList.toggle('hid', !isAdmin); $('recBody').innerHTML = 'Loading...'; $('mRec').classList.add('on');
    if (mode === 'manual') db.ref('attendance_records').once('value').then(s => { const a = []; s.forEach(c => { a.push(c.val()) }); $('recBody').innerHTML = a.length ? `<div class="tw"><table><thead><tr><th>Date</th><th>Roll</th><th>Name</th><th>Status</th></tr></thead><tbody>${a.reverse().map(r => `<tr><td>${esc(r.date)}</td><td>${esc(r.rollNo)}</td><td>${esc(r.studentName)}</td><td style="color:${r.status === 'Present' ? '#16a34a' : '#dc2626'};font-weight:700">${esc(r.status)}</td></tr>`).join('')}</tbody></table></div>` : 'No attendance records found.' }).catch(showErr);
    else db.ref('attendance_logs').once('value').then(s => { let h = ''; s.forEach(ss => { h += `<div class="item" style="display:block"><b>📅 ${esc(ss.key)}</b>`; ss.forEach(c => { const v = c.val(); h += `<div style="font-size:13px;margin-top:4px">👤 <b>${esc(v.name || v.studentName)}</b> (Roll: ${esc(v.rollNo || v.rollNumber || c.key)}) — ${esc(v.time || v.timestamp)}</div>` }); h += '</div>' }); $('recBody').innerHTML = h || 'No attendance records saved yet.' }).catch(showErr)
};
$('viewAtt').onclick = () => openRec('Attendance Records', 'manual'); $('viewQR').onclick = () => openRec('📋 QR Attendance Records', 'qr');
$('clearRec').onclick = () => { if (!isAdmin || !confirm('Delete ALL these records?')) return; db.ref(recMode === 'manual' ? 'attendance_records' : 'attendance_logs').remove().then(() => openRec($('mTitle').textContent, recMode)) };
// QR session
let sKey = null, tmr = null, tok = null; const rnd = () => Math.random().toString(36).slice(2, 8);
function renderQR() {
    const prev = tok; tok = rnd(); db.ref('attendance_sessions/' + sKey).update({ token: tok, prevToken: prev || tok });
    $('qrcode').innerHTML = ''; new QRCode($('qrcode'), { text: `${location.href.split('?')[0].replace(/[^/]*$/, '')}scan-attendance.html?session=${sKey}&token=${tok}`, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.H })
}
$('startBtn').onclick = () => {
    sKey = 'session_' + Date.now(); tok = null;
    db.ref('attendance_sessions/' + sKey).set({ class: $('cls').value, status: 'OPEN', timestamp: Date.now() }).then(() => { renderQR(); tmr = setInterval(renderQR, 30000) });
    $('qrArea').classList.remove('hid'); $('startBtn').classList.add('hid'); $('stopBtn').classList.remove('hid');
    db.ref('attendance_logs/' + sKey).on('value', s => { $('pc').textContent = s.numChildren(); let h = ''; s.forEach(c => { const v = c.val(); h += `<div class="item">✅ <b>${esc(v.name)}</b> (${esc(v.rollNo)}) <small>${esc(v.time)}</small></div>` }); $('live').innerHTML = h })
};
$('stopBtn').onclick = () => {
    if (!confirm('Do you really want to end the session?')) return; clearInterval(tmr); db.ref('attendance_sessions/' + sKey).update({ status: 'CLOSED' }); db.ref('attendance_logs/' + sKey).off();
    $('qrArea').classList.add('hid'); $('startBtn').classList.remove('hid'); $('stopBtn').classList.add('hid'); toast('Session ended!')
};
// timetable
const base = d => d === 'Friday' ? ['08:40 - 09:10', '09:10 - 09:40', '09:40 - 10:10', '10:30 - 11:00', '11:00 - 11:30', '11:30 - 12:00'] : ['08:40 - 09:20', '09:20 - 10:00', '10:00 - 10:40', '11:00 - 11:40', '11:40 - 12:20', '12:20 - 01:00'];
const ROWS = ['Mon - Thu', 'Friday', 'Saturday'];
$('tDay').innerHTML = [...ROWS, ...DAYS.slice(0, 4)].map(d => `<option>${d}</option>`).join('');
$('tPer').innerHTML = PERIODS.map(p => `<option>${p[0]}</option>`).join('');
db.ref('college_timetable').on('value', s => {
    const v = s.val() || {}; $('ttb').innerHTML = ROWS.map(d => {
        const t = v[d] || {}, b = base(d), c = i => `<td>${esc(typeof t[PERIODS[i][0]] === 'string' ? t[PERIODS[i][0]] : b[i])}</td>`;
        return `<tr><td class="d">${d}</td>${c(0)}${c(1)}${c(2)}<td class="b">${d === 'Friday' ? '10:10 - 10:30' : '10:40 - 11:00'}</td>${c(3)}${c(4)}${c(5)}</tr>`
    }).join('')
});
$('editTT').onclick = () => $('mTT').classList.add('on');
$('saveTT').onclick = () => {
    if (!isAdmin) return; const t = $('tTime').value.trim(); if (!t) return toast('Please enter timing!');
    db.ref(`college_timetable/${$('tDay').value}/${$('tPer').value}`).set(t, e => { if (e) toast(e.message); else { toast('Timetable updated 🎉'); $('mTT').classList.remove('on'); $('tTime').value = '' } })
};
// notices
let editKey = null;
db.ref('messages').on('value', s => {
    const a = []; s.forEach(c => a.push([c.key, c.val()])); $('board').innerHTML = a.length ? a.reverse().map(([k, m]) => `<div class="item"><div><b>📢 ${esc(m.text)}</b><br><small>🕒 ${esc(m.timestamp)}</small></div>${isAdmin ? `<div class="row" style="flex:0"><button class="amber" data-e="${k}">Edit</button><button class="red" data-d="${k}">Delete</button></div>` : ''}</div>`).join('') : '<p style="color:var(--mut)">No official announcements yet.</p>';
    $('board').querySelectorAll('[data-e]').forEach(b => b.onclick = () => { editKey = b.dataset.e; $('adminInput').value = a.find(x => x[0] === editKey)[1].text; $('sendMsg').textContent = 'Update Message'; $('adminInput').scrollIntoView({ behavior: 'smooth' }) });
    $('board').querySelectorAll('[data-d]').forEach(b => b.onclick = () => confirm('Delete this message?') && db.ref('messages/' + b.dataset.d).remove())
});
$('sendMsg').onclick = () => {
    if (!isAdmin) return toast('No permission.'); const t = $('adminInput').value.trim(); if (!t) return toast('Please type a message first!');
    const p = { text: t, timestamp: new Date().toLocaleString() }, r = editKey ? db.ref('messages/' + editKey).set(p) : db.ref('messages').push(p);
    r.then(() => { toast(editKey ? 'Message updated ✏️' : 'Message sent 📢'); editKey = null; $('adminInput').value = ''; $('sendMsg').textContent = 'Send Message' })
};
// complaints (public sees only answered ones; admin sees all)
$('sendC').onclick = () => {
    const n = $('cn').value.trim(), c = $('cc').value.trim(), m = $('cm').value.trim(); if (!n || !c || !m) return toast('Please fill all fields!'); const w = checkComplaint(n, c, m); if (w) return warn(w);
    db.ref('college_complaints').push({ name: n, class: c, message: m, date: new Date().toLocaleString() }, e => { if (e) toast(e.message); else { toast('Complaint submitted 🎉'); $('cn').value = $('cc').value = $('cm').value = '' } })
};
$('cTitle').textContent = isAdmin ? '📥 Student Complaints Inbox (Admin)' : 'Admin Responses';
db.ref('college_complaints').on('value', s => {
    let h = ''; s.forEach(c => {
        const v = c.val(), k = c.key; if (!isAdmin && !v.reply) return;
        h += `<div class="item" style="display:block"><b style="color:var(--pri)">👤 ${esc(v.name)} (${esc(v.class)})</b><p>💬 ${esc(v.message)}</p>${v.reply ? `<div class="rep"><b>Admin Reply:</b> ${esc(v.reply)}</div>` : ''}<small>📅 ${esc(v.date)}</small>${isAdmin ? `<div class="row" style="margin-top:8px"><button class="mini" style="padding:4px 12px;font-size:12px;min-height:0;width:auto;flex:0 0 auto" data-r="${k}">Reply</button><button class="red mini" style="padding:4px 12px;font-size:12px;min-height:0;width:auto;flex:0 0 auto" data-x="${k}">Delete</button></div>` : ''}</div>`
    });
    $('clist').innerHTML = h || '<p style="color:var(--mut)">Nothing to show yet.</p>';
    $('clist').querySelectorAll('[data-r]').forEach(b => b.onclick = () => { const t = prompt('Write your reply:'); t && t.trim() && db.ref('college_complaints/' + b.dataset.r).update({ reply: t.trim() }) });
    $('clist').querySelectorAll('[data-x]').forEach(b => b.onclick = () => isAdmin && confirm('Delete this complaint?') && db.ref('college_complaints/' + b.dataset.x).remove())
});

// ===== Complaint box filter: only genuine complaints allowed =====
function checkComplaint(n, c, m) {
    const all = [n, c, m].map(norm).join(' ');
    const words = all.split(/[^a-z\u0600-\u06ff]+/).filter(Boolean), squashed = all.replace(/[^a-z\u0600-\u06ff]/g, '');
    if (BAD.some(b => words.includes(b) || (b.length >= 5 && squashed.includes(b)))) return 'Gali galoch ya bad-tameezi wali baat likhna mana hai.';
    if (/(https?:\/\/|www\.|\.com|\.pk)/i.test(m)) return 'Complaint mein links likhna mana hai.';
    if (m.length < 15 || m.trim().split(/\s+/).length < 3) return 'Complaint bohat chhoti hai. Apna masla thori detail se likhein.';
    if (/(.)\1{5,}/.test(m) || (m.match(/[a-z\u0600-\u06ff]/gi) || []).length < m.length * .5) return 'Ye sahi complaint nahi lag rahi. Bekaar ya mazaaq wali baat na likhein.';
    return '';
}
function warn(why) { $('warnMsg').textContent = why; $('mWarn').classList.add('on') }


// ===== Events preview on home page =====
const evq = isAdmin ? 'maryam=imran' : '';
['navEv', 'evBtn', 'evAll'].forEach(i => { const a = $(i); if (a) a.href = 'events.html' + (evq ? '?' + evq : '') });