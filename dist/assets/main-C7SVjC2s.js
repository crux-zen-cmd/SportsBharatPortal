import{S as d}from"./firebase-config-FYaKDP7r.js";document.addEventListener("DOMContentLoaded",async()=>{const n=document.getElementById("page-loader");n&&setTimeout(()=>{n.classList.add("fade-out")},600),b();const t=document.getElementById("main-navbar"),e=document.querySelectorAll("header[id], section[id]"),o=document.querySelectorAll(".nav-link, .mobile-nav-link");window.addEventListener("scroll",()=>{window.scrollY>50?t.classList.add("scrolled"):t.classList.remove("scrolled");let s="";e.forEach(r=>{const c=r.offsetTop;window.scrollY>=c-200&&(s=r.getAttribute("id"))}),o.forEach(r=>{r.classList.remove("active"),r.getAttribute("href")===`#${s}`&&r.classList.add("active")})});const a=document.getElementById("hamburger"),i=document.getElementById("mobile-menu");a&&i&&a.addEventListener("click",()=>{const s=a.getAttribute("aria-expanded")==="true";a.setAttribute("aria-expanded",!s),a.classList.toggle("active"),i.classList.toggle("active")}),await w(),await I(),await L(),S()});function b(){const n=document.getElementById("theme-toggle");if(!n)return;const t=localStorage.getItem("theme")||"light";document.documentElement.setAttribute("data-theme",t),n.querySelector(".theme-icon").textContent=t==="dark"?"☀️":"🌙",n.addEventListener("click",()=>{const o=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",o),localStorage.setItem("theme",o),n.querySelector(".theme-icon").textContent=o==="dark"?"☀️":"🌙"})}async function w(){const n=document.getElementById("sports-grid");if(n)try{const t=await d.db.getCollection("sports");n.innerHTML=t.map(e=>`
      <div class="sport-card glass-card" onclick="quickFilterSport('${e.title}')">
        <span class="sport-card-icon">${e.icon||"🏆"}</span>
        <h3 class="sport-card-title">${e.title}</h3>
      </div>
    `).join("")}catch(t){console.error("Error loading sports grid",t)}}let g=[];async function I(){const n=document.getElementById("competitions-grid");if(n){n.innerHTML=Array(3).fill().map(()=>`
    <div class="glass-card competition-card">
      <div class="skeleton" style="height: 200px; border-radius: 12px 12px 0 0;"></div>
      <div style="padding: 1.5rem;">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width: 80%;"></div>
      </div>
    </div>
  `).join("");try{const t=await d.db.getCollection("competitions");g=t,p(t);const e=document.getElementById("comp-search"),o=document.getElementById("filter-sport"),a=document.getElementById("filter-status"),i=document.getElementById("filter-state"),s=()=>{const r=e.value.toLowerCase(),c=o.value,m=a.value,u=i.value,v=g.filter(l=>{const h=l.title.toLowerCase().includes(r)||l.venue.toLowerCase().includes(r),f=!c||l.sportType===c,y=!m||l.status===m,E=!u||l.state===u;return h&&f&&y&&E});p(v)};[e,o,a,i].forEach(r=>{r&&r.addEventListener("input",s)})}catch(t){n.innerHTML='<div class="error-msg">Failed to load competitions. Please try again later.</div>',console.error(t)}}}function p(n){const t=document.getElementById("competitions-grid");if(t){if(n.length===0){t.innerHTML='<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">No competitions match your selected filters.</div>';return}t.innerHTML=n.map(e=>{const o=e.status==="upcoming"?'<span class="badge badge-success">Upcoming</span>':e.status==="ongoing"?'<span class="badge badge-warning">Ongoing</span>':'<span class="badge badge-danger">Completed</span>',a=e.regFee==="0"?'<span class="comp-price free">FREE</span>':`<span class="comp-price">₹${e.regFee}</span>`;return`
      <article class="glass-card competition-card" data-id="${e.id}">
        <div class="comp-header">
          <img src="${e.bannerUrl}" class="comp-banner" alt="${e.title}" loading="lazy" />
          <div class="comp-badge">${o}</div>
        </div>
        <div class="comp-body">
          <div class="comp-meta">
            <span>📅 ${e.dateTime.split("T")[0]}</span>
            <span>📍 ${e.city}, ${e.state}</span>
          </div>
          <h3 class="comp-title">${e.title}</h3>
          <div class="comp-info">
            <div class="info-item">🏆 Sport: <strong>${e.sportType}</strong></div>
            <div class="info-item">🏟️ Venue: <strong>${e.venue}</strong></div>
          </div>
          <div class="comp-footer">
            ${a}
            <a href="pages/auth/register.html" class="btn btn-primary">Register Now</a>
          </div>
        </div>
      </article>
    `}).join("")}}window.quickFilterSport=n=>{const t=document.getElementById("filter-sport");t&&(t.value=n,t.dispatchEvent(new Event("input")),document.getElementById("competitions").scrollIntoView({behavior:"smooth"}))};async function L(){const n=document.getElementById("news-track"),t=document.getElementById("carousel-dots");if(n)try{const e=await d.db.getCollection("news");n.innerHTML=e.map(s=>`
      <div class="news-item">
        <div class="news-image">
          <img src="${s.imageUrl}" alt="${s.title}" />
        </div>
        <div class="news-content">
          <span class="news-date">📢 Announcement · ${s.date}</span>
          <h3 class="news-title">${s.title}</h3>
          <p class="news-excerpt">${s.excerpt}</p>
          <a href="pages/auth/login.html" class="btn btn-ghost">Read Full Release</a>
        </div>
      </div>
    `).join(""),t.innerHTML=e.map((s,r)=>`
      <div class="carousel-dot ${r===0?"active":""}" onclick="goToSlide(${r})"></div>
    `).join("");let o=0;const a=e.length,i=s=>{n.style.transform=`translateX(-${s*100}%)`,document.querySelectorAll(".carousel-dot").forEach((r,c)=>{r.classList.toggle("active",c===s)}),o=s};window.goToSlide=s=>i(s),document.getElementById("news-next").addEventListener("click",()=>{let s=(o+1)%a;i(s)}),document.getElementById("news-prev").addEventListener("click",()=>{let s=(o-1+a)%a;i(s)}),setInterval(()=>{let s=(o+1)%a;i(s)},6e3)}catch(e){console.error("Error setting up news carousel",e)}}function S(){const n=document.querySelectorAll(".stat-number"),t=new IntersectionObserver(e=>{e.forEach(o=>{if(o.isIntersecting){const a=parseInt(o.target.getAttribute("data-target"));let i=0;const r=Math.ceil(a/(2e3/16)),c=setInterval(()=>{i+=r,i>=a?(o.target.textContent=a.toLocaleString(),clearInterval(c)):o.target.textContent=i.toLocaleString()},16);t.unobserve(o.target)}})},{threshold:.5});n.forEach(e=>t.observe(e))}
