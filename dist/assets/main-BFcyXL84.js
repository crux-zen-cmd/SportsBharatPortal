import"./modulepreload-polyfill-B5Qt9EMX.js";import{f as E,b as k,g as L,t as I,a as $}from"./news-service-V54tnDWR.js";import{S as v}from"./firebase-config-oFJisMBH.js";document.addEventListener("DOMContentLoaded",async()=>{const s=document.getElementById("page-loader");s&&setTimeout(()=>{s.classList.add("fade-out")},600),S();const e=document.getElementById("main-navbar"),t=document.querySelectorAll("header[id], section[id]"),n=document.querySelectorAll(".nav-link, .mobile-nav-link");window.addEventListener("scroll",()=>{window.scrollY>50?e.classList.add("scrolled"):e.classList.remove("scrolled");let r="";t.forEach(o=>{const c=o.offsetTop;window.scrollY>=c-200&&(r=o.getAttribute("id"))}),n.forEach(o=>{o.classList.remove("active"),o.getAttribute("href")===`#${r}`&&o.classList.add("active")})});const a=document.getElementById("hamburger"),i=document.getElementById("mobile-menu");a&&i&&a.addEventListener("click",()=>{const r=a.getAttribute("aria-expanded")==="true";a.setAttribute("aria-expanded",!r),a.classList.toggle("active"),i.classList.toggle("active")}),await T(),await x(),await C(),await B(),A()});function S(){const s=document.getElementById("theme-toggle");if(!s)return;const e=localStorage.getItem("theme")||"light";document.documentElement.setAttribute("data-theme",e),s.querySelector(".theme-icon").textContent=e==="dark"?"☀️":"🌙",s.addEventListener("click",()=>{const n=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",n),localStorage.setItem("theme",n),s.querySelector(".theme-icon").textContent=n==="dark"?"☀️":"🌙"})}async function T(){const s=document.getElementById("sports-grid");if(s)try{const e=await v.db.getCollection("sports");s.innerHTML=e.map(t=>`
      <div class="sport-card glass-card" onclick="quickFilterSport('${t.title}')">
        <span class="sport-card-icon">${t.icon||'<img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Ashoka Stambh" style="height:32px;width:auto;">'}</span>
        <h3 class="sport-card-title">${t.title}</h3>
      </div>
    `).join("")}catch(e){console.error("Error loading sports grid",e)}}let g=[];async function x(){const s=document.getElementById("competitions-grid");if(s){s.innerHTML=Array(3).fill().map(()=>`
    <div class="glass-card competition-card">
      <div class="skeleton" style="height: 200px; border-radius: 12px 12px 0 0;"></div>
      <div style="padding: 1.5rem;">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width: 80%;"></div>
      </div>
    </div>
  `).join("");try{const e=await v.db.getCollection("competitions");g=e,u(e);const t=document.getElementById("comp-search"),n=document.getElementById("filter-sport"),a=document.getElementById("filter-status"),i=document.getElementById("filter-state"),r=()=>{const o=t.value.toLowerCase(),c=n.value,m=a.value,p=i.value,h=g.filter(l=>{const f=l.title.toLowerCase().includes(o)||l.venue.toLowerCase().includes(o),y=!c||l.sportType===c,b=!m||l.status===m,w=!p||l.state===p;return f&&y&&b&&w});u(h)};[t,n,a,i].forEach(o=>{o&&o.addEventListener("input",r)})}catch(e){s.innerHTML='<div class="error-msg">Failed to load competitions. Please try again later.</div>',console.error(e)}}}function u(s){const e=document.getElementById("competitions-grid");if(e){if(s.length===0){e.innerHTML='<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">No competitions match your selected filters.</div>';return}e.innerHTML=s.map(t=>{const n=t.status==="upcoming"?'<span class="badge badge-success">Upcoming</span>':t.status==="ongoing"?'<span class="badge badge-warning">Ongoing</span>':'<span class="badge badge-danger">Completed</span>',a=t.regFee==="0"?'<span class="comp-price free">FREE</span>':`<span class="comp-price">₹${t.regFee}</span>`;return`
      <article class="glass-card competition-card" data-id="${t.id}">
        <div class="comp-header">
          <img src="${t.bannerUrl}" class="comp-banner" alt="${t.title}" loading="lazy" />
          <div class="comp-badge">${n}</div>
        </div>
        <div class="comp-body">
          <div class="comp-meta">
            <span>📅 ${t.dateTime.split("T")[0]}</span>
            <span>📍 ${t.city}, ${t.state}</span>
          </div>
          <h3 class="comp-title">${t.title}</h3>
          <div class="comp-info">
            <div class="info-item"><img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Ashoka Stambh" style="height:16px;width:auto;vertical-align:middle;margin-right:4px;"> Sport: <strong>${t.sportType}</strong></div>
            <div class="info-item">🏟️ Venue: <strong>${t.venue}</strong></div>
          </div>
          <div class="comp-footer">
            ${a}
            <a href="pages/auth/register.html" class="btn btn-primary">Register Now</a>
          </div>
        </div>
      </article>
    `}).join("")}}window.quickFilterSport=s=>{const e=document.getElementById("filter-sport");e&&(e.value=s,e.dispatchEvent(new Event("input")),document.getElementById("competitions").scrollIntoView({behavior:"smooth"}))};async function C(){const s=document.getElementById("live-news-preview");if(s)try{const e=await E("all",6);if(e.length===0){s.innerHTML='<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">No live news available right now.</div>';return}s.innerHTML=e.slice(0,3).map(t=>{const n=k(t.category),a=L(t.category),i=I(t.pubDate),r=t.title.replace(/\s*-\s*[^-]+$/,"").trim(),o=t.thumbnail||"https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=60";return`
        <article class="live-preview-card" onclick="window.open('${t.link}', '_blank')">
          <div class="lp-card-img-wrap">
            <img src="${o}" alt="${d(r)}" class="lp-card-img" loading="lazy"
                 onerror="this.src='https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=60'" />
            ${t.isLive?'<span class="lp-live-badge"><span class="lp-live-dot"></span>LIVE</span>':""}
          </div>
          <div class="lp-card-body">
            <div class="lp-card-meta">
              <span class="lp-card-category" style="color: ${a};">${n} Sports</span>
              <span class="lp-card-time">${i}</span>
            </div>
            <h3 class="lp-card-title">${d(r)}</h3>
            <div class="lp-card-footer">
              <span class="lp-card-source">${d(t.source)}</span>
              <span class="lp-card-read">Read →</span>
            </div>
          </div>
        </article>
      `}).join("")}catch(e){console.error("Error loading live news preview",e)}}function d(s){const e=document.createElement("div");return e.textContent=s,e.innerHTML}async function B(){const s=document.getElementById("landing-ticker-track");if(s)try{const t=(await $()).map(n=>{const a=n.replace(/\s*-\s*[^-]+$/,"").trim();return`<span class="ticker-item"><span class="ticker-dot"></span>${d(a)}</span>`}).join("");s.innerHTML=t+t}catch{s.innerHTML='<span class="ticker-item">Live sports updates loading...</span>'}}function A(){const s=document.querySelectorAll(".stat-number"),e=new IntersectionObserver(t=>{t.forEach(n=>{if(n.isIntersecting){const a=parseInt(n.target.getAttribute("data-target"));let i=0;const o=Math.ceil(a/(2e3/16)),c=setInterval(()=>{i+=o,i>=a?(n.target.textContent=a.toLocaleString(),clearInterval(c)):n.target.textContent=i.toLocaleString()},16);e.unobserve(n.target)}})},{threshold:.5});s.forEach(t=>e.observe(t))}
