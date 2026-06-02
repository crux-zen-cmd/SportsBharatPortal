import"./firebase-config-FYaKDP7r.js";/* empty css                */function n(o,e="success"){const s=document.getElementById("toast-container"),t=document.createElement("div");t.className=`toast toast-${e} show`,t.innerHTML=`
        <span>${e==="success"?"✅":e==="danger"?"❌":"⚠️"}</span>
        <div>${o}</div>
      `,s.appendChild(t),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},4e3)}document.getElementById("forgot-form").addEventListener("submit",o=>{o.preventDefault();const e=document.getElementById("forgot-email").value;n(`A secure recovery link has been dispatched to ${e}. Check your government inbox!`,"success"),setTimeout(()=>{window.location.href="login.html"},2e3)});
