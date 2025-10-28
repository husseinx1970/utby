// ===== Core site behaviors =====
(function(){
  // Min date = today
  const dateInput=document.getElementById('date');
  if(dateInput){
    const t=new Date(),y=t.getFullYear(),m=String(t.getMonth()+1).padStart(2,'0'),d=String(t.getDate()).padStart(2,'0');
    dateInput.min=`${y}-${m}-${d}`;
  }

  // Sync _replyto with visitor email
  const email=document.getElementById('email');
  const reply=document.getElementById('replyToField');
  function sync(){ if(reply && email) reply.value = email.value.trim(); }
  email?.addEventListener('input', sync);
  email?.addEventListener('change', sync);
  sync();

  // Open Hussein modal
  const modal=document.getElementById('creatorModal');
  const open =document.getElementById('openCreator2');
  const close=document.getElementById('closeCreator');
  function openFast(ev){ev?.preventDefault();modal?.classList.add('show');document.body.classList.add('scroll-lock');}
  function hide(ev){ev?.preventDefault();modal?.classList.remove('show');document.body.classList.remove('scroll-lock');}
  open?.addEventListener('pointerdown',openFast,{passive:false});
  open?.addEventListener('click',openFast);
  close?.addEventListener('click',hide);
  modal?.addEventListener('click',e=>{if(e.target===modal)hide(e);});

  // Native submit + thanks
  const form=document.getElementById('bookingForm');
  const submitBtn=document.getElementById('submitBtn');
  const thanksModal=document.getElementById('thanksModal');
  const thanksClose=document.getElementById('thanksClose');
  let isSubmitting=false;
  form?.addEventListener('submit',(e)=>{
    if(!form.checkValidity()){form.reportValidity();return;}
    if(isSubmitting){e.preventDefault();return;}
    isSubmitting=true;

    submitBtn.disabled=true;
    const oldLabel=submitBtn.textContent;
    submitBtn.textContent='Skickar…';
    const y=window.scrollY||window.pageYOffset||0;
    document.body.classList.add('scroll-lock');
    thanksModal?.classList.add('show');

    setTimeout(()=>{ try{form.reset();}catch(_){} document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0,y); }, 200);

    function closeThanks(){
      thanksModal?.classList.remove('show');
      document.body.classList.remove('scroll-lock');
      submitBtn.disabled=false;
      submitBtn.textContent=oldLabel;
      isSubmitting=false;
    }
    thanksClose?.addEventListener('click',ev=>{ev.preventDefault();closeThanks();},{once:true});
    thanksModal?.addEventListener('click',ev=>{if(ev.target===thanksModal)closeThanks();},{once:true});
  });

  // SMS chooser
  const fab=document.getElementById('smsFab');
  const chooser=document.getElementById('chooserModal');
  const chooserSms=document.getElementById('chooserSms');
  const chooserMail=document.getElementById('chooserMail');
  const chooserClose=document.getElementById('chooserClose');
  function smsHref(){
    const base='sms:+46790574975';
    const body=encodeURIComponent('Hej! Jag behöver rådgivning om bilen.');
    const ua=navigator.userAgent.toLowerCase();
    return (ua.includes('iphone')||ua.includes('ipad'))?`${base}&body=${body}`:`${base}?body=${body}`;
  }
  function openChooser(e){
    e?.preventDefault();
    chooser?.classList.add('show');
    document.body.classList.add('scroll-lock');
    chooserSms?.setAttribute('href', smsHref());
  }
  function closeChooser(e){
    e?.preventDefault();
    chooser?.classList.remove('show');
    document.body.classList.remove('scroll-lock');
  }
  fab?.addEventListener('click',openChooser);
  chooserClose?.addEventListener('click',closeChooser);
  chooser?.addEventListener('click',ev=>{ if(ev.target===chooser) closeChooser(ev); });

  // Draggable SMS + snap + remember
  const el=document.getElementById('smsFab'); 
  if(el){
    const MARGIN_X=14,MARGIN_Y=8,CLICK_TOL=6;
    let dragging=false,startX=0,startY=0,startLeft=0,startTop=0,pointerId=null;

    (function restore(){
      try{
        const s=JSON.parse(localStorage.getItem('smsFabStick')||'null');
        if(s && (s.side==='left'||s.side==='right') && Number.isFinite(s.top)){
          el.style.top=Math.max(MARGIN_Y,s.top)+'px';
          if(s.side==='left'){el.style.left=MARGIN_X+'px';el.style.right='auto';}
          else{el.style.right=MARGIN_X+'px';el.style.left='auto';}
        }
      }catch(_){}
    })();

    function ensureLeftTop(){
      const r=el.getBoundingClientRect();
      el.style.left=r.left+'px'; el.style.top=r.top+'px'; el.style.right='auto'; el.style.bottom='auto';
    }
    function clampTop(top){
      const r=el.getBoundingClientRect();
      const vh=Math.max(document.documentElement.clientHeight,window.innerHeight||0);
      return Math.min(vh-r.height-MARGIN_Y,Math.max(MARGIN_Y,top));
    }

    function onDown(e){
      if(pointerId!==null && e.pointerId!==pointerId) return;
      pointerId=e.pointerId; try{e.target.setPointerCapture(pointerId);}catch(_){}
      dragging=true; startX=e.clientX; startY=e.clientY; ensureLeftTop();
      startLeft=parseFloat(el.style.left||0); startTop=parseFloat(el.style.top||0);
      el.style.transition='none'; e.preventDefault();
    }
    function onMove(e){
      if(!dragging || e.pointerId!==pointerId) return;
      const dx=e.clientX-startX,dy=e.clientY-startY;
      el.style.left=Math.round(startLeft+dx)+'px';
      el.style.top =Math.round(startTop +dy)+'px';
      e.preventDefault();
    }
    function onUp(e){
      if(e.pointerId!==pointerId) return;
      try{e.target.releasePointerCapture(pointerId);}catch(_){}
      const dx=e.clientX-startX,dy=e.clientY-startY;
      const moved=Math.hypot(dx,dy); dragging=false; pointerId=null;

      const r=el.getBoundingClientRect();
      const vw=Math.max(document.documentElement.clientWidth,window.innerWidth||0);
      const side=(r.left + r.width/2 < vw/2)?'left':'right';
      const top=clampTop(parseFloat(el.style.top||r.top));
      el.style.top=Math.round(top)+'px';
      if(side==='left'){el.style.left='14px';el.style.right='auto';}
      else{el.style.right='14px';el.style.left='auto';}
      try{localStorage.setItem('smsFabStick',JSON.stringify({side,top}));}catch(_){}

      if(moved>CLICK_TOL){
        el.addEventListener('click',function once(ev){ev.stopImmediatePropagation();ev.preventDefault();},{once:true,capture:true});
      }
    }

    el.addEventListener('pointerdown',onDown,{passive:false});
    window.addEventListener('pointermove',onMove,{passive:false});
    window.addEventListener('pointerup',onUp,{passive:false});
    window.addEventListener('pointercancel',onUp,{passive:false});
  }
})();

// ===== BG: Fog + Particles Engine (mouse/touch repel) =====
(function(){
  // Ensure canvases exist & style
  function ensureCanvas(id){
    let el=document.getElementById(id);
    if(!el){ el=document.createElement('canvas'); el.id=id; document.body.prepend(el); }
    el.style.position='fixed'; el.style.inset='0'; el.style.width='100%'; el.style.height='100%';
    el.style.pointerEvents='none'; el.style.zIndex='0'; el.style.background='transparent';
    return el;
  }
  const fogCanvas = ensureCanvas('bgFog');
  const pCanvas   = ensureCanvas('bgParticles');
  const fogCtx = fogCanvas.getContext('2d');
  const pCtx   = pCanvas.getContext('2d');

  let W=innerWidth, H=innerHeight, DPR=Math.min(devicePixelRatio||1,2);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    W=innerWidth; H=innerHeight; DPR=Math.min(devicePixelRatio||1,2);
    // Fog lower-res for natural blur
    fogCanvas.width  = Math.round(W*0.6);
    fogCanvas.height = Math.round(H*0.6);
    fogCanvas.style.width='100%'; fogCanvas.style.height='100%';
    // Particles high-res
    pCanvas.width = Math.round(W*DPR);
    pCanvas.height= Math.round(H*DPR);
    pCanvas.style.width='100%'; pCanvas.style.height='100%';
    pCtx.setTransform(DPR,0,0,DPR,0,0);
  }
  addEventListener('resize', resize, {passive:true});
  resize();

  const isMobile = /iphone|ipad|android|mobile/i.test(navigator.userAgent);
  const BASE_PARTICLES = prefersReduced ? 0 : (isMobile ? 80 : 140);

  // Particles with repel
  const particles = Array.from({length: BASE_PARTICLES}, () => ({
    x: Math.random()*W,
    y: Math.random()*H,
    vx:(Math.random()-0.5)*0.6,
    vy:(Math.random()-0.5)*0.6,
    r: Math.random()*2+1.2,
    a: Math.random()*Math.PI*2,
    spin:(Math.random()-0.5)*0.02
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
    const R  = isMobile ? 110 : 160;
    const R2 = R*R;

    for(const p of particles){
      p.x+=p.vx; p.y+=p.vy; p.a+=p.spin;

      // wrap
      if(p.x<-10) p.x=W+10; if(p.x>W+10) p.x=-10;
      if(p.y<-10) p.y=H+10; if(p.y>H+10) p.y=-10;

      // repel
      if(attractor.active){
        const dx=p.x-attractor.x, dy=p.y-attractor.y, d2=dx*dx+dy*dy;
        if(d2<R2){
          const d=Math.sqrt(d2)||0.001, force=Math.min(1.6,(R2/d2));
          const ux=dx/d, uy=dy/d;
          p.vx += ux*0.08*force;
          p.vy += uy*0.08*force;
          p.vx*=0.98; p.vy*=0.98;
        }
      }

      // draw with golden glow
      pCtx.save();
      pCtx.translate(p.x,p.y);
      pCtx.rotate(p.a);
      pCtx.globalAlpha=0.35;
      pCtx.beginPath(); pCtx.arc(0,0,p.r*2.2,0,Math.PI*2);
      pCtx.fillStyle='rgba(218,189,102,0.25)'; pCtx.fill();
      pCtx.globalAlpha=0.9;
      pCtx.beginPath(); pCtx.arc(0,0,p.r,0,Math.PI*2);
      pCtx.fillStyle='rgba(218,189,102,0.85)'; pCtx.fill();
      pCtx.restore();

      const sp2=p.vx*p.vx+p.vy*p.vy; if(sp2>2.5){ p.vx*=0.96; p.vy*=0.96; }
    }
    idleOff();
  }

  // Fog (smoke)
  const FOG_COUNT = prefersReduced ? 0 : (isMobile ? 16 : 26);
  const fogs = Array.from({length: FOG_COUNT}, () => {
    const baseR=(isMobile?90:120)+Math.random()*140;
    return {
      x: Math.random()*fogCanvas.width,
      y: Math.random()*fogCanvas.height,
      r: baseR,
      alpha:0.06+Math.random()*0.08,
      dx:(Math.random()*0.4+0.05)*(Math.random()<.5?-1:1),
      dy:(Math.random()*0.25+0.03)*(Math.random()<.5?-1:1)
    };
  });
  const fogRGBA=a=>`rgba(180,190,200,${a})`;

  function drawFog(){
    const ctx=fogCtx, w=fogCanvas.width, h=fogCanvas.height;
    ctx.clearRect(0,0,w,h);
    ctx.globalCompositeOperation='lighter';
    for(const f of fogs){
      f.x+=f.dx*0.2; f.y+=f.dy*0.2;

      // Spawn/respawn edges to feel like workshop smoke (left/bottom bias)
      if(f.x<-f.r){ f.x=w+f.r*0.5; f.y=h*0.6+Math.random()*h*0.4; }
      if(f.x>w+f.r){ f.x=-f.r*0.5;  f.y=h*0.6+Math.random()*h*0.4; }
      if(f.y<-f.r){ f.y=h+f.r*0.5; f.x=Math.random()*w*0.4; }
      if(f.y>h+f.r){ f.y=-f.r*0.5; f.x=Math.random()*w*0.4; }

      const grad=ctx.createRadialGradient(f.x,f.y,f.r*0.1,f.x,f.y,f.r);
      grad.addColorStop(0, fogRGBA(f.alpha));
      grad.addColorStop(1, fogRGBA(0));

      ctx.save();
      ctx.filter='blur(3px)';
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.arc(f.x,f.y,f.r,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalCompositeOperation='source-over';
  }

  // Loop
  let last=0, step=prefersReduced? 1000/24 : 16;
  function loop(ts){
    if(ts-last>step){
      if(FOG_COUNT) drawFog();
      if(BASE_PARTICLES) drawParticles();
      last=ts;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
