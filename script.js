
const EMAILJS_PUBLIC_KEY = "PASTE_PUBLIC_KEY_HERE";
const EMAILJS_SERVICE_ID = "PASTE_SERVICE_ID_HERE";
const EMAILJS_TEMPLATE_ID = "PASTE_TEMPLATE_ID_HERE";

(function(){
  const bg=document.getElementById('bgGL'); if(!bg) return;
  const gl=bg.getContext('2d');
  function R(){ bg.width=innerWidth; bg.height=innerHeight; }
  addEventListener('resize', R, {passive:true}); R();
  (function loop(){
    const g=gl.createLinearGradient(0,0,bg.width,bg.height);
    g.addColorStop(0,'rgba(255,214,0,0.08)');
    g.addColorStop(1,'rgba(255,230,96,0.06)');
    gl.fillStyle=g; gl.fillRect(0,0,bg.width,bg.height);
    requestAnimationFrame(loop);
  })();
})();

(function(){
  const canvas=document.getElementById('playground');
  if (!canvas) return;
  const ctx=canvas.getContext('2d');
  let W,H,DPR,targets=[],particles=[],explodeUntil=0;
  const pointer={x:0,y:0,inside:false,lastTap:0};
  const N=800,INFL=.24,K=.06,KP=.10,ORB=.12,D=.88,J=.003,EX=800;
  function r(a,b){return a+Math.random()*(b-a)}
  function resize(){
    DPR=Math.min(devicePixelRatio||1,2);
    const rct=canvas.getBoundingClientRect(); W=rct.width; H=rct.height;
    canvas.width=Math.floor(W*DPR); canvas.height=Math.floor(H*DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0); build();
  }
  function build(){
    const off=document.createElement('canvas'); off.width=Math.floor(W); off.height=Math.floor(H);
    const o=off.getContext('2d'); o.clearRect(0,0,off.width,off.height); o.fillStyle='#fff'; o.textBaseline='middle';
    const text='UTBY'; let size=Math.min(W*.7,H*.5), PAD=W*.06; o.font=`800 ${size}px "Space Grotesk", Inter, system-ui`;
    let tw=o.measureText(text).width; while((tw+PAD*2)>W && size>8){ size*=.96; o.font=`800 ${size}px "Space Grotesk", Inter, system-ui`; tw=o.measureText(text).width; }
    const x=(W-tw)/2, y=H/2; o.fillText(text,x,y);
    const step=Math.max(3,Math.floor(size/22)); targets=[]; const img=o.getImageData(0,0,off.width,off.height).data;
    for(let j=0;j<off.height;j+=step){
      for(let i=0;i<off.width;i+=step){
        const idx=(j*off.width+i)*4+3; if(img[idx]>0) targets.push({x:i+r(-.5,.5), y:j+r(-.5,.5)});
      }
    }
    if(!particles.length){ for(let i=0;i<N;i++) particles.push({x:r(0,W), y:r(0,H), vx:0, vy:0, r:r(1.2,2.2), t:i}); }
    for(let i=0;i<particles.length;i++) particles[i].t=i%targets.length;
  }
  function boom(){
    const now=performance.now(); explodeUntil=now+EX;
    for(const p of particles){ const a=Math.random()*Math.PI*2, s=4+Math.random()*4; p.vx+=Math.cos(a)*s; p.vy+=Math.sin(a)*s; }
  }
  addEventListener('resize', resize, {passive:true});
  canvas.addEventListener('mousemove',e=>{const rct=canvas.getBoundingClientRect(); pointer.x=e.clientX-rct.left; pointer.y=e.clientY-rct.top; pointer.inside=true;});
  canvas.addEventListener('mouseleave',()=>pointer.inside=false);
  canvas.addEventListener('dblclick',()=>boom());
  canvas.addEventListener('touchstart',e=>{
    const now=Date.now(), rct=canvas.getBoundingClientRect();
    if(e.touches&&e.touches.length){pointer.x=e.touches[0].clientX-rct.left; pointer.y=e.touches[0].clientY-rct.top;}
    if(now-pointer.lastTap<300) boom();
    pointer.lastTap=now; pointer.inside=true;
  },{passive:false});
  canvas.addEventListener('touchmove',e=>{
    const rct=canvas.getBoundingClientRect();
    if(e.touches&&e.touches.length){pointer.x=e.touches[0].clientX-rct.left; pointer.y=e.touches[0].clientY-rct.top;}
    e.preventDefault();
  },{passive:false});
  function draw(){
    ctx.clearRect(0,0,W,H);
    const g=ctx.createRadialGradient(W/2,H/2,10,W/2,H/2,Math.max(W,H)/1.2); g.addColorStop(0,'rgba(255,214,0,.14)'); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    const R=Math.min(W,H)*INFL, R2=R*R, now=performance.now();
    for(let i=0;i<particles.length;i++){
      const p=particles[i], T=targets[p.t%targets.length];
      if(pointer.inside){
        const dx=pointer.x-p.x, dy=pointer.y-p.y, d2=dx*dx+dy*dy, dist=Math.sqrt(d2)+1e-4;
        if(d2<R2){
          const pull=KP*(1-dist/R); p.vx+=(dx/dist)*pull*14; p.vy+=(dy/dist)*pull*14;
          const tx=-dy/dist, ty=dx/dist, orb=ORB*(1-dist/R); p.vx+=tx*orb*12; p.vy+=ty*orb*12;
          p.vx+=(Math.random()-.5)*J*40; p.vy+=(Math.random()-.5)*J*40;
        } else if(T){ p.vx+=(T.x-p.x)*K; p.vy+=(T.y-p.y)*K; }
      } else if(T){ p.vx+=(T.x-p.x)*K; p.vy+=(T.y-p.y)*K; }
      if(now<explodeUntil){ p.vx*=.9; p.vy*=.9; } else { p.vx*=D; p.vy*=D; }
      p.x+=p.vx; p.y+=p.vy; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle='rgba(255,214,0,.95)'; ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  resize(); draw();
})();

(function(){
  function toast(msg, ok=true){
    const el=document.getElementById('toast'); if(!el) return;
    el.textContent=msg; el.classList.add('show');
    el.style.borderColor = ok ? 'rgba(113,255,178,.35)' : 'rgba(255,140,140,.35)';
    setTimeout(()=>el.classList.remove('show'), 3200);
  }
  function validEmail(v){return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
  function validPhone(v){return v && v.replace(/\D/g,'').length>=7}

  function setup(formId, whatsSelector){
    const form=document.getElementById(formId); if(!form) return;
    const submitBtn=form.querySelector('button[type="submit"]');
    const whatsBtn=whatsSelector ? document.querySelector(whatsSelector) : null;

    function serialize(f){const d=new FormData(f), o={}; d.forEach((v,k)=>o[k]=v); return o;}

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const d=serialize(form);
      if(!d.name || !validPhone(d.phone) || !validEmail(d.email)){ toast('Fyll i namn, giltigt telefonnummer och e‑post (eller lämna tomt).', false); return; }
      submitBtn.disabled=true; submitBtn.textContent='Skickar...';

      try{
        if(EMAILJS_PUBLIC_KEY==='PASTE_PUBLIC_KEY_HERE'){ throw new Error('EmailJS keys missing'); }
        emailjs.init(EMAILJS_PUBLIC_KEY);
        const payload = { from_name: d.name, from_phone: d.phone, from_email: d.email||'', reg: d.reg||'', service: d.service||'', date: d.date||'', message: d.msg||'', to_email: 'info@utbysnabbbilservice.se' };
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload);
        form.reset(); toast('Tack! Din bokning skickades.');
      } catch(err){
        const subject=encodeURIComponent(`Bokningsförfrågan – ${d.service||'Tjänst'} – ${d.reg||''}`);
        const body=encodeURIComponent(`Namn: ${d.name}\nTelefon: ${d.phone}\nE‑post: ${d.email||''}\nRegnr: ${d.reg||''}\nÖnskat datum: ${d.date||''}\nTjänst: ${d.service}\n\nBeskrivning:\n${d.msg||''}`);
        window.location.href = `mailto:info@utbysnabbbilservice.se?subject=${subject}&body=${body}`;
        toast('Öppnade e‑post. Lägg till ev. ändring och skicka.');
      } finally {
        submitBtn.disabled=false; submitBtn.textContent='Skicka förfrågan';
      }
    });

    if(whatsBtn){
      whatsBtn.addEventListener('click',()=>{
        const d=serialize(form);
        const text=encodeURIComponent(`Hej! Jag vill boka: ${d.service}. Regnr: ${d.reg||'-'}. Datum: ${d.date||'-'}.\nNamn: ${d.name}. Tel: ${d.phone}.\nBeskrivning: ${d.msg||'-'}`);
        window.open(`https://wa.me/46720040936?text=${text}`,'_blank');
      });
    }
  }
  setup('bookingFormHome', '[data-whatsapp]');
  setup('bookingForm', '#whatsBtn');
})();
