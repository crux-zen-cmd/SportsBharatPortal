import"./modulepreload-polyfill-B5Qt9EMX.js";import{f as L,b as f,g as h,t as m,a as $}from"./news-service-V54tnDWR.js";let d="all",c=!1;document.addEventListener("DOMContentLoaded",async()=>{E(),T(),I(),C(),S(),q(),await i("all"),await g(),setInterval(()=>{i(d,!0),g()},18e4)});function E(){const e=document.getElementById("theme-toggle");if(!e)return;const t=localStorage.getItem("theme")||"light";document.documentElement.setAttribute("data-theme",t),e.querySelector(".theme-icon").textContent=t==="dark"?"☀️":"🌙",e.addEventListener("click",()=>{const n=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",n),localStorage.setItem("theme",n),e.querySelector(".theme-icon").textContent=n==="dark"?"☀️":"🌙"})}function T(){const e=document.getElementById("hamburger"),t=document.getElementById("mobile-menu");e&&t&&e.addEventListener("click",()=>{e.classList.toggle("active"),t.classList.toggle("active")})}function I(){const e=document.getElementById("main-navbar");window.addEventListener("scroll",()=>{window.scrollY>50?e.classList.add("scrolled"):e.classList.remove("scrolled")})}function C(){const e=document.querySelectorAll(".news-filter-tab");e.forEach(t=>{t.addEventListener("click",()=>{const s=t.dataset.category;s===d&&!c||(e.forEach(n=>n.classList.remove("active")),t.classList.add("active"),i(s))})})}function q(){document.querySelectorAll(".quick-cat-link").forEach(e=>{e.addEventListener("click",t=>{t.preventDefault();const s=e.dataset.category;document.querySelectorAll(".news-filter-tab").forEach(n=>{n.classList.toggle("active",n.dataset.category===s)}),i(s),window.scrollTo({top:0,behavior:"smooth"})})})}function S(){const e=document.getElementById("refresh-news");e&&e.addEventListener("click",()=>{e.classList.add("spinning"),i(d,!0).then(()=>{setTimeout(()=>e.classList.remove("spinning"),500)})})}async function i(e="all",t=!1){if(c)return;c=!0,d=e;const s=document.getElementById("news-status-text"),n=document.getElementById("featured-article"),r=document.getElementById("news-grid"),w=document.getElementById("trending-list");t||(s.textContent=`Fetching live ${e==="all"?"":e+" "}news...`);try{const o=await L(e,10);if(o.length===0){n.innerHTML='<div class="no-news">No news available for this category right now. Try again later.</div>',r.innerHTML="",c=!1;return}const y=o[0];n.innerHTML=M(y);const p=o.slice(1);p.length>0?r.innerHTML=p.map(l=>B(l)).join(""):r.innerHTML='<div class="no-news" style="grid-column: 1/-1;">More articles coming soon...</div>',H(o.slice(0,5),w);const b=new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});s.innerHTML=`<span class="live-dot"></span> Updated at ${b} · ${o.length} articles`,requestAnimationFrame(()=>{document.querySelectorAll(".news-card, .featured-article-inner").forEach((l,k)=>{l.style.animationDelay=`${k*.08}s`,l.classList.add("animate-in")})})}catch(o){console.error("[NewsPage] Error loading news:",o),s.textContent="Unable to fetch live news. Showing cached data."}c=!1}function M(e){const t=f(e.category),s=h(e.category),n=m(e.pubDate);return`
    <div class="featured-article-inner">
      <div class="featured-img-wrap">
        <img src="${e.thumbnail||"https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60"}" alt="${a(e.title)}" class="featured-img" 
             onerror="this.src='https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60'" />
        <div class="featured-overlay"></div>
        ${e.isLive?'<div class="featured-live-badge"><span class="live-pulse"></span>LIVE</div>':""}
      </div>
      <div class="featured-body">
        <div class="featured-meta">
          <span class="featured-category" style="background: ${s}15; color: ${s}; border-color: ${s}30;">
            ${t} ${v(e.category)}
          </span>
          <span class="featured-time">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="7" cy="7" r="6" /><polyline points="7 4 7 7 9 8" />
            </svg>
            ${n}
          </span>
        </div>
        <h2 class="featured-title">${a(u(e.title))}</h2>
        <p class="featured-desc">${a(e.description.substring(0,200))}${e.description.length>200?"...":""}</p>
        <div class="featured-footer">
          <span class="featured-source">Source: ${a(e.source)}</span>
          <a href="${e.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
            Read Full Story
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12l5-5-5-5"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  `}function B(e){const t=f(e.category),s=h(e.category),n=m(e.pubDate),r=e.thumbnail||A(e.category);return`
    <article class="news-card" onclick="window.open('${e.link}', '_blank')">
      <div class="news-card-img-wrap">
        <img src="${r}" alt="${a(e.title)}" class="news-card-img" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=60'" />
        ${e.isLive?'<span class="card-live-badge"><span class="live-pulse-sm"></span>LIVE</span>':""}
      </div>
      <div class="news-card-body">
        <div class="news-card-meta">
          <span class="news-card-category" style="color: ${s};">
            ${t} ${v(e.category)}
          </span>
          <span class="news-card-time">${n}</span>
        </div>
        <h3 class="news-card-title">${a(u(e.title))}</h3>
        <p class="news-card-desc">${a(e.description.substring(0,120))}${e.description.length>120?"...":""}</p>
        <div class="news-card-footer">
          <span class="news-card-source">${a(e.source)}</span>
          <span class="news-card-read-more">Read →</span>
        </div>
      </div>
    </article>
  `}function H(e,t){t&&(t.innerHTML=e.map((s,n)=>`
    <a href="${s.link}" target="_blank" rel="noopener noreferrer" class="trending-item">
      <span class="trending-rank">${n+1}</span>
      <div class="trending-info">
        <span class="trending-title">${a(u(s.title))}</span>
        <span class="trending-meta">${m(s.pubDate)} · ${a(s.source)}</span>
      </div>
    </a>
  `).join(""))}async function g(){const e=document.getElementById("ticker-track");if(e)try{const s=(await $()).map(n=>`
      <span class="ticker-item">
        <span class="ticker-dot"></span>
        ${a(u(n))}
      </span>
    `).join("");e.innerHTML=s+s}catch{e.innerHTML='<span class="ticker-item">Live sports updates loading...</span>'}}function a(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function v(e){return e.charAt(0).toUpperCase()+e.slice(1)}function u(e){return e.replace(/\s*-\s*[^-]+$/,"").trim()}function A(e){const t={cricket:"https://images.unsplash.com/photo-1540747737956-37872404a87a?w=400&auto=format&fit=crop&q=60",hockey:"https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&auto=format&fit=crop&q=60",football:"https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400&auto=format&fit=crop&q=60",badminton:"https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&auto=format&fit=crop&q=60",athletics:"https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=60",olympics:"https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&auto=format&fit=crop&q=60",default:"https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=60"};return t[e]||t.default}
