import{S as m}from"./firebase-config-FYaKDP7r.js";/* empty css                *//* empty css                   */import{s as p}from"./auth-Ct-q7bEl.js";let a=null,h=new Date,y=[],f=[];document.addEventListener("DOMContentLoaded",()=>{m.auth.onAuthStateChanged(async o=>{if(!o||o.role!=="user"){window.location.href="../auth/login.html";return}a=o;const i=document.getElementById("page-loader");i&&i.classList.add("fade-out"),T(),M(),await I(),P(),H(),R(),A()}),j();const t=document.getElementById("sidebar-toggle"),n=document.getElementById("sidebar");t&&n&&t.addEventListener("click",()=>{n.classList.toggle("active")});const e=document.getElementById("logout-btn");e&&e.addEventListener("click",async()=>{await m.auth.signOut(),window.location.href="../../index.html"})});function T(){const t=document.querySelectorAll(".sidebar-link"),n=document.querySelectorAll(".dash-panel");t.forEach(e=>{e.addEventListener("click",()=>{t.forEach(r=>r.classList.remove("active")),n.forEach(r=>r.classList.remove("active")),e.classList.add("active");const o=e.getAttribute("data-target"),i=document.getElementById(o);i&&i.classList.add("active"),document.getElementById("sidebar").classList.remove("active")})})}async function I(){if(!a)return;const t=document.getElementById("welcome-name"),n=document.getElementById("user-display-name"),e=document.getElementById("avatar-circle");t&&(t.textContent=a.fullName),n&&(n.textContent=a.fullName),e&&(e.textContent=a.fullName[0].toUpperCase());try{y=await m.db.getCollection("competitions"),f=(await m.db.getCollection("registrations")).filter(r=>r.userId===a.uid),document.getElementById("stats-reg-count").textContent=f.length,document.getElementById("stats-badge-count").textContent=a.badges?a.badges.length:1;const i=f.filter(r=>r.status==="approved"&&r.attended);document.getElementById("stats-cert-count").textContent=i.length,x(),k(),C(),D(),$(),N(),z(i)}catch(o){console.error("Error setting up athlete workspace layout",o)}}function k(){const t=document.getElementById("rec-comps-grid");if(!t)return;const n=a.sportsInterests||[],e=a.state||"",o=y.filter(i=>{const r=n.includes(i.sportType),l=i.state.toLowerCase()===e.toLowerCase();return(r||l)&&i.status!=="completed"}).slice(0,3);if(o.length===0){const i=y.filter(r=>r.status!=="completed").slice(0,3);i.length===0?t.innerHTML='<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No active competitions scheduled at this time.</p>':B(i,t)}else B(o,t)}function B(t,n){n.innerHTML=t.map(e=>{const i=a.bookmarkIds&&a.bookmarkIds.includes(e.id)?"★":"☆";return`
      <div class="glass-card competition-card" style="padding: 1rem;">
        <div class="comp-header" style="height: 120px;">
          <img src="${e.bannerUrl}" class="comp-banner" alt="${e.title}" />
          <button onclick="window.toggleBookmark('${e.id}')" style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.5); width: 35px; height: 35px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; color: gold; font-size: 1.25rem; z-index: 5;">${i}</button>
        </div>
        <div style="padding: 1rem 0 0; display: flex; flex-direction: column; gap: 0.5rem;">
          <small style="color: var(--primary-light); font-weight: 700;">${e.sportType} · ${e.city}</small>
          <h4 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; line-height: 1.2;">${e.title}</h4>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
            <strong style="color: var(--accent);">${e.regFee==="0"?"FREE":"₹"+e.regFee}</strong>
            <button class="btn btn-primary" onclick="window.openRegModal('${e.id}')" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Register</button>
          </div>
        </div>
      </div>
    `}).join("")}window.toggleBookmark=async t=>{if(!a)return;const n=a.bookmarkIds||[];let e=[];n.includes(t)?(e=n.filter(o=>o!==t),p("Competition removed from favorites list.","warning")):(e=[...n,t],p("Competition bookmarked successfully!","success")),a.bookmarkIds=e,await m.db.updateDoc("users",a.uid,{bookmarkIds:e}),localStorage.setItem("sports_portal_current_user",JSON.stringify(a)),I()};async function x(){const t=document.getElementById("interest-selector");if(!t)return;const n=await m.db.getCollection("sports"),e=a.sportsInterests||[];t.innerHTML=n.map(o=>`
      <button class="interest-pill-btn ${e.includes(o.title)?"active":""}" onclick="window.toggleSportInterest('${o.title}')">
        ${o.icon} ${o.title}
      </button>
    `).join("")}window.toggleSportInterest=async t=>{const n=a.sportsInterests||[];let e=[];n.includes(t)?e=n.filter(o=>o!==t):e=[...n,t],a.sportsInterests=e,await m.db.updateDoc("users",a.uid,{sportsInterests:e}),localStorage.setItem("sports_portal_current_user",JSON.stringify(a)),x(),k()};function C(){const t=document.getElementById("badge-showcase");if(!t)return;const n=a.badges||["🏆 Portal Rookie"];t.innerHTML=n.map(e=>`
    <div class="badge-achievement-card">
      <div class="badge-ach-icon">${e.split(" ")[0]}</div>
      <div class="badge-ach-title">${e.substr(e.indexOf(" ")+1)}</div>
    </div>
  `).join("")}function D(){const t=document.getElementById("activity-log");if(!t)return;const n=["Joined SportsBharat database as certified athlete.",...f.map(e=>`Registered for ${e.competitionTitle} as ${e.regType}.`)].reverse().slice(0,4);t.innerHTML=n.map(e=>`
    <li style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--text-secondary);">
      ✓ ${e}
    </li>
  `).join("")}function $(){const t=document.getElementById("edit-name"),n=document.getElementById("edit-age"),e=document.getElementById("edit-gender"),o=document.getElementById("edit-city"),i=document.getElementById("edit-state"),r=document.getElementById("edit-contact"),l=document.getElementById("edit-skills"),c=document.getElementById("edit-bio");t&&(t.value=a.fullName||""),n&&(n.value=a.age||20),e&&(e.value=a.gender||"Male"),o&&(o.value=a.city||""),i&&(i.value=a.state||""),r&&(r.value=a.contactInfo||""),l&&(l.value=a.skills||""),c&&(c.value=a.bio||"");const s=document.getElementById("edit-avatar-preview");s&&(a.profilePhoto?(s.style.background=`url(${a.profilePhoto}) center/cover`,s.textContent=""):(s.style.background="",s.textContent=a.fullName[0].toUpperCase()))}function M(){const t=document.getElementById("profile-edit-form"),n=document.getElementById("profile-photo-input");n&&n.addEventListener("change",async e=>{const o=e.target.files[0];if(o)try{const i=await m.storage.uploadBytes(`avatars/${a.uid}`,o);a.profilePhoto=i,$(),p("Profile image uploaded successfully!","success")}catch{p("Photo upload failed. Check file dimensions.","danger")}}),t&&t.addEventListener("submit",async e=>{e.preventDefault();const o={fullName:document.getElementById("edit-name").value,age:parseInt(document.getElementById("edit-age").value),gender:document.getElementById("edit-gender").value,city:document.getElementById("edit-city").value,state:document.getElementById("edit-state").value,contactInfo:document.getElementById("edit-contact").value,skills:document.getElementById("edit-skills").value,bio:document.getElementById("edit-bio").value,profilePhoto:a.profilePhoto||""};try{await m.db.updateDoc("users",a.uid,o),a={...a,...o},localStorage.setItem("sports_portal_current_user",JSON.stringify(a)),await I(),p("Profile credentials synchronized successfully.","success")}catch(i){p(i.message,"danger")}})}async function N(){const t=document.getElementById("dash-competitions-grid");if(!t)return;const n=document.getElementById("dash-filter-sport"),e=document.getElementById("dash-filter-state"),o=document.getElementById("dash-comp-search"),i=await m.db.getCollection("sports");n.innerHTML='<option value="">All Sports</option>'+i.map(c=>`<option>${c.title}</option>`).join("");const r=[...new Set(y.map(c=>c.state))];e.innerHTML='<option value="">All States</option>'+r.map(c=>`<option>${c}</option>`).join("");const l=()=>{const c=n.value,s=e.value,u=o.value.toLowerCase(),v=y.filter(d=>{const g=!c||d.sportType===c,b=!s||d.state===s,w=d.title.toLowerCase().includes(u)||d.venue.toLowerCase().includes(u);return g&&b&&w});if(v.length===0){t.innerHTML='<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">No matching competitions found.</p>';return}t.innerHTML=v.map(d=>{const g=f.some(L=>L.competitionId===d.id),b=g?"✓ Registered":"Register Now",w=g?"btn-ghost":"btn-primary",S=d.status==="upcoming"?'<span class="badge badge-success">Upcoming</span>':d.status==="ongoing"?'<span class="badge badge-warning">Ongoing</span>':'<span class="badge badge-danger">Completed</span>';return`
        <div class="glass-card competition-card">
          <div class="comp-header">
            <img src="${d.bannerUrl}" class="comp-banner" alt="${d.title}" />
            <div class="comp-badge">${S}</div>
          </div>
          <div class="comp-body">
            <div class="comp-meta">
              <span>📅 ${d.dateTime.split("T")[0]}</span>
              <span>📍 ${d.city}, ${d.state}</span>
            </div>
            <h3 class="comp-title">${d.title}</h3>
            <p class="comp-info" style="font-size:0.85rem; margin-bottom:1rem;">${d.description}</p>
            <div class="comp-footer">
              <strong style="color:var(--accent); font-family:var(--font-display); font-size:1.25rem;">${d.regFee==="0"?"FREE":"₹"+d.regFee}</strong>
              <button class="btn ${w}" onclick="window.openRegModal('${d.id}')" ${g?"disabled":""}>${b}</button>
            </div>
          </div>
        </div>
      `}).join("")};[n,e,o].forEach(c=>c.addEventListener("input",l)),l()}function H(){const t=document.getElementById("reg-modal"),n=document.getElementById("reg-modal-close"),e=document.getElementById("reg-modal-cancel"),o=document.getElementById("modal-reg-form");window.openRegModal=r=>{const l=y.find(c=>c.id===r);l&&(document.getElementById("modal-comp-title").textContent=l.title,document.getElementById("modal-comp-location").textContent=`${l.venue} | ${l.city}, ${l.state}`,document.getElementById("modal-comp-id").value=l.id,t.classList.add("active"))};const i=()=>t.classList.remove("active");[n,e].forEach(r=>r.addEventListener("click",i)),o.addEventListener("submit",async r=>{r.preventDefault();const l=document.getElementById("modal-comp-id").value,c=document.getElementById("modal-reg-type").value,s=document.getElementById("modal-id-proof").value,u=y.find(d=>d.id===l),v={competitionId:l,competitionTitle:u.title,sportType:u.sportType,dateTime:u.dateTime,userId:a.uid,userName:a.fullName,regType:c,idProof:s,status:"pending",attended:!1,timestamp:new Date().toISOString()};try{await m.db.addDoc("registrations",v),await m.db.addDoc("notifications",{userId:a.uid,title:"Registration Submitted",message:`Your registration for ${u.title} is pending approval from the organizer.`,type:"registration",read:!1,timestamp:new Date().toISOString()}),i(),p("Application submitted successfully. Under verification.","success"),await I()}catch(d){p(d.message,"danger")}})}function R(){const t=document.getElementById("prev-month-btn"),n=document.getElementById("next-month-btn");t&&t.addEventListener("click",()=>{h.setMonth(h.getMonth()-1),E()}),n&&n.addEventListener("click",()=>{h.setMonth(h.getMonth()+1),E()}),E()}function E(){const t=document.getElementById("calendar-month-label"),n=document.getElementById("calendar-days-container");if(!n)return;const e=h.getFullYear(),o=h.getMonth(),i=["January","February","March","April","May","June","July","August","September","October","November","December"];t.textContent=`${i[o]} ${e}`,n.innerHTML="",["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(s=>{n.innerHTML+=`<div class="calendar-day-label">${s}</div>`});const l=new Date(e,o,1).getDay(),c=new Date(e,o+1,0).getDate();for(let s=0;s<l;s++)n.innerHTML+="<div></div>";for(let s=1;s<=c;s++){const u=`${e}-${String(o+1).padStart(2,"0")}-${String(s).padStart(2,"0")}`,v=f.find(b=>b.dateTime.split("T")[0]===u),d=new Date().toDateString()===new Date(e,o,s).toDateString();let g="calendar-day";v&&(g+=" has-event"),d&&(g+=" today"),n.innerHTML+=`
      <div class="${g}" onclick="window.selectCalendarDay('${u}')">${s}</div>
    `}}window.selectCalendarDay=t=>{const n=document.getElementById("calendar-event-details");if(!n)return;const e=f.filter(o=>o.dateTime.split("T")[0]===t);e.length===0?n.innerHTML=`<p style="color: var(--text-secondary); font-size: 0.9rem;">No sports competitions scheduled for ${t}.</p>`:n.innerHTML=e.map(o=>`
      <div class="glass-card" style="padding: 1rem; border-left: 3px solid var(--accent); margin-bottom: 0.75rem;">
        <h4 style="font-weight:700;">${o.competitionTitle}</h4>
        <small style="color:var(--text-secondary); display:block; margin: 0.25rem 0;">Type: ${o.regType} | Status: <strong>${o.status.toUpperCase()}</strong></small>
        <span style="font-size: 0.8rem; background:rgba(255,255,255,0.05); padding: 0.15rem 0.5rem; border-radius: 4px;">📅 ${o.dateTime.replace("T"," ")}</span>
      </div>
    `).join("")};function z(t){const n=document.getElementById("certificates-table-body");if(n){if(t.length===0){n.innerHTML='<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No participation certificates available. Complete an approved tournament attendance to unlock!</td></tr>';return}n.innerHTML=t.map(e=>`
    <tr>
      <td style="font-weight: 600;">${e.competitionTitle}</td>
      <td><span class="badge badge-success">${e.sportType}</span></td>
      <td>${new Date(e.timestamp).toLocaleDateString()}</td>
      <td style="font-size: 1.25rem; color:var(--success);">📷 Validated</td>
      <td><button class="btn btn-outline" onclick="window.downloadMockCertificate('${e.competitionTitle}')" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;">Download PDF</button></td>
    </tr>
  `).join("")}}window.downloadMockCertificate=t=>{p(`Initiating validated cryptographic certificate download for "${t}"`,"success"),window.open("","_blank").document.write(`
    <html>
    <head>
      <title>SportsBharat Certificate</title>
      <style>
        body { font-family: 'Georgia', serif; background: #0b111e; color: #fff; text-align: center; padding: 50px; }
        .cert-border { border: 15px solid #1e3a8a; padding: 40px; border-radius: 8px; background: rgba(255,255,255,0.03); max-width: 800px; margin: 0 auto; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
        h1 { font-family: 'Rajdhani', sans-serif; font-size: 3rem; color: #f97316; margin-bottom: 5px; }
        h2 { font-size: 1.5rem; letter-spacing: 2px; text-transform: uppercase; color: #94a3b8; }
        .name { font-size: 2.5rem; font-weight: bold; color: #3b82f6; margin: 30px 0; border-bottom: 2px solid rgba(255,255,255,0.1); display: inline-block; padding: 0 50px 10px; }
        .footer-cols { display: flex; justify-content: space-between; margin-top: 50px; font-size: 0.9rem; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="cert-border">
        <h2>Ministry of Youth Affairs & Sports</h2>
        <h1>SportsBharat Validation Certificate</h1>
        <p style="margin-top:20px; font-style:italic;">This proudly acknowledges that</p>
        <div class="name">${a.fullName}</div>
        <p style="max-width: 600px; margin: 0 auto; line-height: 1.6;">Successfully participated as a validated elite sport contender in the prestigious <strong>"${t}"</strong> national championship program.</p>
        <div class="footer-cols">
          <div>
            <p><strong>Dr. Sunita Sharma</strong></p>
            <p>National Committee Chair</p>
          </div>
          <div>
            <p style="font-size:2rem;">📷</p>
            <p>Cryptographic Gov Seal</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `)};function A(){const t=document.getElementById("live-score-text");t&&(m.db.onSnapshot("liveScores/live_kabaddi",n=>{n&&(t.innerHTML=`<strong>${n.matchName}</strong>: <span style="color:var(--accent); font-weight:700;">${n.score}</span> (${n.status})`)}),setInterval(()=>{const n=["29 - 24","29 - 26","31 - 26","31 - 29","35 - 31"],e=n[Math.floor(Math.random()*n.length)];m.db.updateDoc("liveScores","live_kabaddi",{score:e})},1e4))}function P(){const t=document.getElementById("notif-toggle"),n=document.getElementById("notif-drawer"),e=document.getElementById("notif-close-btn");t&&n&&e&&(t.addEventListener("click",()=>n.classList.add("active")),e.addEventListener("click",()=>n.classList.remove("active"))),m.db.onSnapshot("notifications",o=>{const i=Object.values(o||{}).filter(s=>s.userId===a.uid),r=i.filter(s=>!s.read),l=document.getElementById("notif-badge-count");l&&(l.textContent=r.length);const c=document.getElementById("notif-drawer-body");if(c){if(i.length===0){c.innerHTML='<p style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">No notifications found.</p>';return}c.innerHTML=i.map(s=>`
        <div class="notif-card ${s.read?"":"unread"}" onclick="window.markNotifRead('${s.id}')">
          <div class="notif-card-title">${s.title}</div>
          <div class="notif-card-msg">${s.message}</div>
          <small style="color:var(--text-muted); font-size:0.7rem; margin-top:0.25rem; display:block;">${new Date(s.timestamp).toLocaleTimeString()}</small>
        </div>
      `).join("")}})}window.markNotifRead=async t=>{await m.db.updateDoc("notifications",t,{read:!0})};function j(){const t=document.getElementById("theme-toggle");if(!t)return;const n=localStorage.getItem("theme")||"light";document.documentElement.setAttribute("data-theme",n);const e=t.querySelector(".theme-icon");e&&(e.textContent=n==="dark"?"☀️":"🌙"),t.addEventListener("click",()=>{const i=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",i),localStorage.setItem("theme",i),e&&(e.textContent=i==="dark"?"☀️":"🌙")})}
