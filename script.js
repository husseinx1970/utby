
(function(){
  const f=document.getElementById('bookingForm');
  const b=document.getElementById('whatsBtn');
  if(!f || !b) return;
  const ser=()=>{ const d=new FormData(f), o={}; d.forEach((v,k)=>o[k]=v); return o; };
  b.addEventListener('click',()=>{
    const d=ser();
    const text = encodeURIComponent(`Hej! Jag vill boka: ${d['Tjänst']}. Regnr: ${d['Regnr']||'-'}. Datum: ${d['Datum']||'-'}.\nNamn: ${d['Namn']}. Tel: ${d['Telefon']}.\nBeskrivning: ${d['Meddelande']||'-'}`);
    window.open(`https://wa.me/46720040936?text=${text}`,'_blank');
  });
})();
document.querySelectorAll('#year').forEach(el=>el.textContent=new Date().getFullYear());
