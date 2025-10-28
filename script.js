// === Utilities ===
(function(){
  // Set min date today
  const dateInput=document.getElementById('date');
  if(dateInput){
    const t=new Date(),y=t.getFullYear(),m=String(t.getMonth()+1).padStart(2,'0'),d=String(t.getDate()).padStart(2,'0');
    dateInput.min=`${y}-${m}-${d}`;
  }
  // Reply-To sync
  const email=document.getElementById('email');
  const reply=document.getElementById('replyToField');
  function sync(){ if(reply && email) reply.value = email.value.trim(); }
  email?.addEventListener('input', sync);
  email?.addEventListener('change', sync);
  sync();
})();

// === SMS FAB: picker (SMS / mail) ===
(function(){
  const fab=document.getElementById('smsFab'); if(!fab) return;
  function smsHref(){
    const base='sms:+46790574975';
    const body=encodeURIComponent('Hej! Jag behöver rådgivning om bilen.');
    const ua=navigator.userAgent.toLowerCase();
    return (ua.includes('iphone')||ua.includes('ipad'))?`${base}&body=${body}`:`${base}?body=${body}`;
  }
  fab.addEventListener('click', (e)=>{
    e.preventDefault();
    location.href = smsHref();
  });
})();

// === BG: Fog + Particles with mouse/touch repel ===
(function(){
  function ensureCanvas(id){
    let el=document.getElementById(id);
    if(!el){ el=document.createElement('canvas'); el.id=id; document.body.prepend(el); }
    Object.assign(el.style,{position:'fixed',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:0,background:'transparent'});
    return el;
  }
  const fogCanvas = ensureCanvas('bgFog');
  const pCanvas   = ensureCanvas('bgParticles');
  const fogCtx = fogCanvas.getContext('2d');
  const pCtx   = pCanvas.getContext('2d');

  let W=innerWidth, H=innerHeight, DPR=Math.min(devicePixelRatio||1,2);
  const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile=/iphone|ipad|android|mobile/i.test(navigator.userAgent);

  function resize(){
    W=innerWidth; H=innerHeight; DPR=Math.min(devicePixelRatio||1,2);
    fogCanvas.width=Math.round(W*0.6);
    fogCanvas.height=Math.round(H*0.6);
    pCanvas.width=Math.round(W*DPR);
    pCanvas.height=Math.round(H*DPR);
    pCanvas.style.width='100%'; pCanvas.style.height='100%';
    pCtx.setTransform(DPR,0,0,DPR,0,0);
  }
  addEventListener('resize', resize, {passive:true});
  resize();

  const BASE_PARTICLES = prefersReduced ? 0 : (isMobile ? 80 : 140);
  const particles = Array.from({length: BASE_PARTICLES}, () => ({
    x: Math.random()*W, y: Math.random()*H,
    vx:(Math.random()-0.5)*0.6, vy:(Math.random()-0.5)*0.6,
    r: Math.random()*2+1.2, a: Math.random()*Math.PI*2, spin:(Math.random()-0.5)*0.02
  }));

  const attractor={x:-9999,y:-9999,active:false};
  let lastPointerTime=0;
  const setAttractor=(x,y)=>{attractor.x=x; attractor.y=y; attractor.active=true; lastPointerTime=performance.now();};
  const idleOff=()=>{ if(performance.now()-lastPointerTime>1600){ attractor.active=false; attractor.x=-9999; attractor.y=-9999; } };

  addEventListener('pointermove', e=>setAttractor(e.clientX,e.clientY), {passive:true});
  addEventListener('pointerdown', e=>setAttractor(e.clientX,e.clientY), {passive:true});
  addEventListener('pointerup',   ()=>{ lastPointerTime=performance.now(); }, {passive:true});
  addEventListener('touchstart', e=>{ const t=e.touches[0]; if(t) setAttractor(t.clientX,t.clientY); }, {passive:true});
  addEventListener('touchmove',  e=>{ const t=e.touches[0]; if(t) setAttractor(t.clientX,t.clientY); }, {passive:true});
  addEventListener('touchend',   ()=>{ lastPointerTime=performance.now(); }, {passive:true});

  function drawParticles(){
    pCtx.clearRect(0,0,W,H);
    const R=isMobile?110:160, R2=R*R;
    for(const p of particles){
      p.x+=p.vx; p.y+=p.vy; p.a+=p.spin;
      if(p.x<-10) p.x=W+10; if(p.x>W+10) p.x=-10;
      if(p.y<-10) p.y=H+10; if(p.y>H+10) p.y=-10;
      if(attractor.active){
        const dx=p.x-attractor.x, dy=p.y-attractor.y, d2=dx*dx+dy*dy;
        if(d2<R2){
          const d=Math.sqrt(d2)||0.001, force=Math.min(1.6,(R2/d2));
          const ux=dx/d, uy=dy/d; p.vx+=ux*0.08*force; p.vy+=uy*0.08*force; p.vx*=0.98; p.vy*=0.98;
        }
      }
      pCtx.save(); pCtx.translate(p.x,p.y); pCtx.rotate(p.a);
      pCtx.globalAlpha=0.35; pCtx.beginPath(); pCtx.arc(0,0,p.r*2.2,0,Math.PI*2);
      pCtx.fillStyle='rgba(218,189,102,0.25)'; pCtx.fill();
      pCtx.globalAlpha=0.9; pCtx.beginPath(); pCtx.arc(0,0,p.r,0,Math.PI*2);
      pCtx.fillStyle='rgba(218,189,102,0.85)'; pCtx.fill();
      pCtx.restore();
      const sp2=p.vx*p.vx+p.vy*p.vy; if(sp2>2.5){ p.vx*=0.96; p.vy*=0.96; }
    }
    idleOff();
  }

  const FOG_COUNT = prefersReduced ? 0 : (isMobile ? 16 : 26);
  const fogs = Array.from({length: FOG_COUNT}, () => {
    const baseR=(isMobile?90:120)+Math.random()*140;
    return {x:Math.random()*fogCanvas.width, y:Math.random()*fogCanvas.height, r:baseR,
            alpha:0.06+Math.random()*0.08, dx:(Math.random()*0.4+0.05)*(Math.random()<.5?-1:1),
            dy:(Math.random()*0.25+0.03)*(Math.random()<.5?-1:1)};
  });
  const fogRGBA=a=>`rgba(180,190,200,${a})`;
  function drawFog(){
    const w=fogCanvas.width,h=fogCanvas.height,ctx=fogCtx;
    ctx.clearRect(0,0,w,h); ctx.globalCompositeOperation='lighter';
    for(const f of fogs){
      f.x+=f.dx*0.2; f.y+=f.dy*0.2;
      if(f.x<-f.r){ f.x=w+f.r*0.5; f.y=h*0.6+Math.random()*h*0.4; }
      if(f.x>w+f.r){ f.x=-f.r*0.5;  f.y=h*0.6+Math.random()*h*0.4; }
      if(f.y<-f.r){ f.y=h+f.r*0.5; f.x=Math.random()*w*0.4; }
      if(f.y>h+f.r){ f.y=-f.r*0.5; f.x=Math.random()*w*0.4; }
      const g=ctx.createRadialGradient(f.x,f.y,f.r*0.1,f.x,f.y,f.r);
      g.addColorStop(0, fogRGBA(f.alpha)); g.addColorStop(1, fogRGBA(0));
      ctx.save(); ctx.filter='blur(3px)'; ctx.fillStyle=g; ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,Math.PI*2); ctx.fill(); ctx.restore();
    }
    ctx.globalCompositeOperation='source-over';
  }

  let last=0, step=prefersReduced ? 1000/24 : 16;
  function loop(ts){ if(ts-last>step){ if(FOG_COUNT) drawFog(); if(BASE_PARTICLES) drawParticles(); last=ts; } requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
})();
