// Shared real data (faculty + teacher timetables) – edit here only
const FIREBASE_CONFIG={apiKey:"AIzaSyDpot5YRJpW1l6qGWtNl5YE0nhDUENVdzQ",authDomain:"college-portal-695c0.firebaseapp.com",databaseURL:"https://college-portal-695c0-default-rtdb.firebaseio.com",projectId:"college-portal-695c0",storageBucket:"college-portal-695c0.firebasestorage.app",messagingSenderId:"557644866574",appId:"1:557644866574:web:b6bad6548c60128ffe085f"};
const FACULTY=[["Prof. Sadia","Urdu Department","DAEBCF"],["Prof. Fazeeela","Physics Department","BDFCAE"],["Prof. Bushra","English Department","CFAEBD"],["Prof. Isra","Mathematics Department","EBDAFC"],["Prof. Rabia","Islamiat Department","FCBFDA"],["Prof. Beenish","Computer Science","AECDFB"]];
const DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const PERIODS=[["1st Period","08:40 - 09:20"],["2nd Period","09:20 - 10:00"],["3rd Period","10:00 - 10:40"],["4th Period","11:00 - 11:40"],["5th Period","11:00 - 11:30"],["6th Period","12:20 - 01:00"]];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isAdmin=new URLSearchParams(location.search).get('maryam')==='imran';
if(!firebase.apps.length)firebase.initializeApp(FIREBASE_CONFIG);
const db=firebase.database();
// theme (shared)
document.documentElement.dataset.theme=localStorage.getItem('theme')||'dark';

// ---- One attendance per device per day (resets at 12:00 midnight, Karachi time) ----
function getVid(){let v=localStorage.getItem('cvid');if(!v){v='visitor_'+Date.now().toString(36)+Math.random().toString(36).slice(2,12);localStorage.setItem('cvid',v)}return v}
async function todayKey(){const off=(await db.ref('.info/serverTimeOffset').once('value')).val()||0;return new Date(Date.now()+off).toLocaleDateString('en-CA',{timeZone:'Asia/Karachi'})}
async function claimToday(info){const day=await todayKey();const r=await db.ref(`attendance_devices/${day}/${getVid()}`).transaction(c=>c?undefined:{...info,at:new Date().toISOString()});return{ok:r.committed,day}}
function releaseToday(day){return db.ref(`attendance_devices/${day}/${getVid()}`).remove().catch(()=>{})}
const BLOCKED_MSG='⚠️ Is device se aaj attendance pehle hi lag chuki hai.\nAgli attendance kal raat 12 baje ke baad lag sakti hai.';

// ---- shared moderation + helpers ----
const BAD=['fuck','shit','bitch','bastard','asshole','idiot','stupid','dumb','slut','whore','crap','dick','kutta','kutti','kamina','kameena','haramzada','haramzadi','harami','bewakoof','gadha','ullu','pagal','chutiya','madarchod','behenchod','bhosdi','gandu','lund','saala','saali','کتا','کتی','کمینہ','حرامی','حرامزادہ','بیوقوف','گدھا','الو','پاگل'];
const norm=t=>t.toLowerCase().replace(/[@]/g,'a').replace(/[0]/g,'o').replace(/[1!|]/g,'i').replace(/3/g,'e').replace(/[$5]/g,'s').replace(/(.)\1{2,}/g,'$1');
const abusive=t=>{const a=norm(t),w=a.split(/[^a-z\u0600-\u06ff]+/).filter(Boolean),q=a.replace(/[^a-z\u0600-\u06ff]/g,'');return BAD.some(b=>w.includes(b)||(b.length>=5&&q.includes(b)))};
const thumb=e=>e.type==='youtube'?`https://img.youtube.com/vi/${e.ytId}/hqdefault.jpg`:e.type==='image'?e.url:'';

// ---- FREE VIDEO HOSTING (Cloudinary). Fill these 2 values once, see steps below ----
// 1) Sign up free at cloudinary.com  2) Copy "Cloud name" from the Dashboard
// 3) Settings > Upload > Add upload preset > Signing mode: Unsigned > Save, copy the preset name
const CLOUDINARY={cloud:'miqoo1qz',preset:'college_events'};