/* service.js
   Frontend interactive features:
   - vehicle lookup (uses mock by default)
   - injects short Issue dropdown (Annat first)
   - handles contact form submit UI (keeps existing formsubmit)
*/

/* ---------- Configuration ---------- */
const VEHICLE_API_URL = null; // set to your proxy e.g. 'https://my-proxy.example.com/vehicle'

/* ---------- Helpers ---------- */
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/* ---------- Vehicle lookup UI ---------- */
(function initVehicleLookup(){
  const carInput = document.getElementById('car');
  const carInfo = document.getElementById('carInfo');
  if (!carInput || !carInfo) return;

  let debounceTimer = null;
  const DEBOUNCE_MS = 600;

  carInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(onCarChanged, DEBOUNCE_MS);
  });
  carInput.addEventListener('blur', onCarChanged);

  function showLoading(msg = 'Söker...') {
    carInfo.style.display = 'block';
    carInfo.innerHTML = `<div class="loading">${escapeHtml(msg)}</div>`;
  }
  function showError(msg) {
    carInfo.style.display = 'block';
    carInfo.innerHTML = `<div class="error">${escapeHtml(msg)}</div>`;
    setHiddenFields({});
  }
  function showData(data) {
    carInfo.style.display = 'block';
    carInfo.innerHTML = `
      <div class="row"><div class="label">Märke</div><div class="value">${escapeHtml(data.make||'—')}</div></div>
      <div class="row"><div class="label">Modell</div><div class="value">${escapeHtml(data.model||'—')}</div></div>
      <div class="row"><div class="label">Årsmodell</div><div class="value">${escapeHtml(data.year||'—')}</div></div>
      <div class="row"><div class="label">Drivmedel</div><div class="value">${escapeHtml(data.fuel||'—')}</div></div>
      <div class="row"><div class="label">VIN</div><div class="value">${escapeHtml(data.vin||'—')}</div></div>
    `;
    setHiddenFields(data);
  }

  function setHiddenFields(d) {
    const ids = ['car_make','car_model','car_year','car_fuel','car_vin'];
    const keys = ['make','model','year','fuel','vin'];
    ids.forEach((id,i)=>{
      const el = document.getElementById(id);
      if (el) el.value = d[keys[i]] || '';
    });
  }

  function onCarChanged() {
    const reg = (carInput.value || '').trim();
    if (!reg || reg.length < 2) { carInfo.style.display = 'none'; setHiddenFields({}); return; }

    showLoading('Hämtar fordonsuppgifter...');

    if (VEHICLE_API_URL) {
      fetch(`${VEHICLE_API_URL}?reg=${encodeURIComponent(reg)}`)
        .then(r => { if (!r.ok) throw new Error('API fel'); return r.json(); })
        .then(json => {
          if (!json || (!json.make && !json.model)) {
            showError('Inga uppgifter hittades för detta regnr.');
            return;
          }
          showData(json);
        })
        .catch(err => {
          console.error(err);
          showError('Kunde inte hämta uppgifter. Kontrollera proxy/API.');
        });
    } else {
      // mock lookup
      setTimeout(()=>{
        const mock = mockLookup(reg);
        if (mock) showData(mock);
        else showError('Inga uppgifter hittades för detta regnr (mock).');
      }, 500);
    }
  }

  function mockLookup(reg) {
    const key = reg.replace(/\s|-/g,'').toUpperCase();
    const db = {
      'ABC123': { make: 'Volvo', model: 'V60', year: '2017', fuel: 'Diesel', vin: 'YV1ZZZ1Z2J1234567' },
      'XYZ987': { make: 'Toyota', model: 'Corolla', year: '2019', fuel: 'Bensin', vin: 'JTDBR32E720123456' },
      'BUF040': { make: 'BMW', model: '320i', year: '2018', fuel: 'Bensin', vin: 'WBA8E9G50GNU00001' }
    };
    return db[key] || null;
  }
})();


/* ---------- Issue dropdown injection (short list, 'Annat' first) ---------- */
(function injectIssueDropdown(){
  const container = document.getElementById('issueContainer');
  if (!container) return;
  container.innerHTML = `
    <label for="issueInput">Problem / Tjänst</label>
    <div class="custom-dropdown" id="issueDropdown">
      <input type="text" id="issueInput" name="issue" placeholder="Välj eller sök tjänst..." required autocomplete="off">
      <ul class="dropdown-list">
        <li>Annat – beskriv i meddelandet</li>
        <li>Service & olja</li>
        <li>Bromsar</li>
        <li>Däck & hjul</li>
        <li>AC / klimatanläggning</li>
        <li>El / elektronik</li>
        <li>Diagnos / OBD</li>
        <li>Motor</li>
        <li>Växellåda / koppling</li>
        <li>Besiktning / kontroll</li>
      </ul>
    </div>
  `;

  // minimal styles for dropdown (matching page)
  const style = document.createElement('style');
  style.textContent = `
    .custom-dropdown{position:relative;width:100%;margin-bottom:14px}
    .custom-dropdown input{width:100%;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:#eee;font-size:15px;outline:none;cursor:pointer}
    .custom-dropdown input:focus{border-color:rgba(255,215,90,0.9);box-shadow:0 0 10px rgba(255,215,90,0.1)}
    .dropdown-list{position:absolute;top:100%;left:0;right:0;max-height:220px;overflow-y:auto;background:#111;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:6px 0;list-style:none;margin:4px 0 0 0;display:none;z-index:999}
    .dropdown-list li{padding:10px 14px;color:#ddd;cursor:pointer;font-size:15px}
    .dropdown-list li:hover{background:rgba(255,215,90,0.15);color:#fff}
    .custom-dropdown::after{content:"▾";position:absolute;right:14px;top:12px;color:rgba(255,255,255,0.4);pointer-events:none;font-size:18px}
  `;
  document.head.appendChild(style);

  // behavior
  const dropdown = document.getElementById("issueDropdown");
  if (!dropdown) return;
  const input = dropdown.querySelector("input");
  const list = dropdown.querySelector(".dropdown-list");

  input.addEventListener("focus", () => list.style.display = "block");
  input.addEventListener("input", () => {
    const filter = input.value.toLowerCase();
    const items = list.querySelectorAll("li");
    items.forEach(li => {
      li.style.display = li.textContent.toLowerCase().includes(filter) ? "block" : "none";
    });
  });
  list.querySelectorAll("li").forEach(li => {
    li.addEventListener("click", () => {
      input.value = li.textContent;
      list.style.display = "none";
    });
  });
  document.addEventListener("click", e => {
    if (!dropdown.contains(e.target)) list.style.display = "none";
  });
})();


/* ---------- Contact form submit UI (keeps existing fetch to formsubmit) ---------- */
(function initContactForm(){
  const contactForm = document.getElementById('contactForm');
  const contactStatus = document.getElementById('contactStatus');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = contactForm.querySelector('button[type="submit"]') || contactForm.querySelector('#submitBtn');
    if (!submitBtn) return;
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Skickar...';
    contactStatus.style.display = 'none';

    try {
      const formData = new FormData(contactForm);
      const response = await fetch(contactForm.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });
      if (response.ok) {
        contactStatus.textContent = 'Tack! Ditt meddelande har skickats. Vi återkommer så snart som möjligt.';
        contactStatus.className = 'success';
        contactStatus.style.display = 'block';
        contactForm.reset();
      } else {
        throw new Error('Något gick fel');
      }
    } catch (error) {
      console.error(error);
      contactStatus.textContent = 'Något gick fel. Vänligen försök igen eller ring oss direkt.';
      contactStatus.className = 'error';
      contactStatus.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
})();
