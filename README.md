# gestar
<!doctype html>
<html lang="es">
 <head><script>window["__codeletBootstrap__"]=JSON.parse('{"A":"A","B":"20260722-05-f3252b3"}');</script><script src="/_sdk/e358eac22bd01364.telemetry_sdk.js" integrity="sha512-KPxp3rw4K8Nu9ceWJc3gyM7srgaZxiFWOVbyu260EYzzAqdz10mfo5xyXrCx+wEKtGo77JbtmwXvFLbwrGzwvw=="></script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GESTAR+</title>
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/lucide@0.263.0/dist/umd/lucide.min.js"></script>
  <style>
        body { font-family: 'DM Sans', sans-serif; }
        .view { display: none; }
        .view.active { display: block; }
        .screen { display: none; }
        .screen.active { display: flex; }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .toast { animation: slideDown 0.3s ease; }
        @keyframes slideDown { from { transform:translateY(-20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        .sidebar-link { transition: all 0.2s; }
        .sidebar-link:hover, .sidebar-link.active { background: rgba(168,85,247,0.1); color: #7c3aed; }
    </style>
  <script src="/_sdk/935a53bc2e11fb8d.data_sdk.js" type="text/javascript" integrity="sha512-qr2oyPnEys1WebcOABaRh6hG77r5PWpqeWW6JTKbRJqly/INsfBi31CVNlTmHqjgeLpkVmmHZJUdxSx/32tOFQ=="></script>
  <script src="/_sdk/7831c9b82769a23f.resizing_sdk.js" type="text/javascript" integrity="sha512-8T/qhF3yB5dtqHof6yvY2492zFsme1nYV1+FuXfYvPz63uo2L30fnKiOabmH0Sl3qhplMLgxjytDR8IvycRwKQ=="></script>
 </head>
 <body data-template-id="__page-root" class="w-full min-h-screen bg-gray-50"><!-- Toast -->
  <div id="toast" class="toast fixed top-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg z-[100] hidden"></div><!-- LANDING SCREEN -->
  <div id="screen-landing" class="screen active flex-col items-center justify-center w-full" style="min-height:calc(100 * min(var(--vh,1vh),1vh))">
   <div class="text-center fade-in"><!-- SVG Logo -->
    <div class="mx-auto mb-4 w-24 h-24 flex items-center justify-center">
     <svg viewbox="0 0 100 120" width="96" height="96" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="28" rx="12" ry="14" fill="#c084fc" /> <path d="M35 45 C30 50, 28 65, 32 80 C34 88, 40 95, 50 100 C60 95, 66 88, 68 80 C72 65, 70 50, 65 45 C60 42, 55 40, 50 40 C45 40, 40 42, 35 45Z" fill="url(#grad1)" /> <ellipse cx="52" cy="75" rx="10" ry="12" fill="#e9d5ff" opacity="0.6" /> <defs>
       <lineargradient id="grad1" x1="30" y1="40" x2="70" y2="100">
        <stop offset="0%" stop-color="#a855f7" />
        <stop offset="100%" stop-color="#ec4899" />
       </lineargradient>
      </defs>
     </svg>
    </div>
    <h1 data-template-id="landing-title" class="canva-text text-3xl font-bold mb-8"></h1>
    <div class="flex flex-col sm:flex-row gap-4 justify-center px-6"><button onclick="openNurse()" class="flex-1 max-w-xs mx-auto bg-white rounded-2xl shadow-md p-8 hover:shadow-lg transition border border-purple-100 flex flex-col items-center gap-3">
      <div class="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl">
       👩‍⚕️
      </div><span data-template-id="btn-nurse" class="canva-text font-semibold text-lg"></span> </button> <button onclick="openPatient()" class="flex-1 max-w-xs mx-auto bg-white rounded-2xl shadow-md p-8 hover:shadow-lg transition border border-pink-100 flex flex-col items-center gap-3">
      <div class="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-3xl">
       🤰
      </div><span data-template-id="btn-pregnant" class="canva-text font-semibold text-lg"></span> </button>
    </div>
   </div>
  </div><!-- NURSE SCREEN -->
  <div id="screen-nurse" class="screen flex-col md:flex-row w-full" style="min-height:calc(100 * min(var(--vh,1vh),1vh))"><!-- Sidebar -->
   <aside class="w-full md:w-60 bg-white border-r border-gray-100 md:min-h-full flex-shrink-0">
    <div class="p-5 border-b border-gray-100 flex items-center gap-3">
     <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
      <svg viewbox="0 0 100 120" width="20" height="20" fill="none">
       <ellipse cx="50" cy="28" rx="12" ry="14" fill="#fff" /><path d="M35 45C30 50,28 65,32 80C34 88,40 95,50 100C60 95,66 88,68 80C72 65,70 50,65 45C60 42,55 40,50 40C45 40,40 42,35 45Z" fill="#e9d5ff" />
      </svg>
     </div><span class="font-bold text-purple-700">GESTAR+</span>
    </div>
    <nav class="p-3 space-y-1" id="nurse-nav"><button class="sidebar-link active w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium" data-nav="nurse-home"><i data-lucide="home" style="width:18px;height:18px"></i> Inicio</button> <button class="sidebar-link w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium" data-nav="nurse-register"><i data-lucide="user-plus" style="width:18px;height:18px"></i> Registrar embarazada</button> <button class="sidebar-link w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium" data-nav="nurse-list"><i data-lucide="users" style="width:18px;height:18px"></i> Lista de usuarios</button> <button class="sidebar-link w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium" data-nav="nurse-bp"><i data-lucide="activity" style="width:18px;height:18px"></i> Registrar presión arterial</button> <button class="sidebar-link w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium" onclick="logout()"><i data-lucide="log-out" style="width:18px;height:18px"></i> Cerrar sesión</button>
    </nav>
   </aside><!-- Content -->
   <div class="flex-1 p-6 overflow-auto"><!-- Home -->
    <div id="nurse-home" class="view active fade-in">
     <h2 data-template-id="nurse-welcome" class="canva-text text-xl font-semibold mb-4"></h2>
     <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <p data-template-id="nurse-welcome-msg" class="canva-text text-gray-500"></p>
     </div>
    </div><!-- Register -->
    <div id="nurse-register" class="view fade-in">
     <h2 data-template-id="nurse-reg-title" class="canva-text text-xl font-semibold mb-4"></h2>
     <form id="form-register" class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 max-w-lg">
      <div>
       <label class="text-sm font-medium text-gray-700 block mb-1" for="reg-nombre">Nombre</label><input id="reg-nombre" type="text" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"><span class="text-red-500 text-xs hidden" id="err-nombre"></span>
      </div>
      <div>
       <label class="text-sm font-medium text-gray-700 block mb-1" for="reg-apellido">Apellido</label><input id="reg-apellido" type="text" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"><span class="text-red-500 text-xs hidden" id="err-apellido"></span>
      </div>
      <div>
       <label class="text-sm font-medium text-gray-700 block mb-1" for="reg-dni">DNI</label><input id="reg-dni" type="text" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"><span class="text-red-500 text-xs hidden" id="err-dni"></span>
      </div>
      <div>
       <label class="text-sm font-medium text-gray-700 block mb-1" for="reg-email">Email</label><input id="reg-email" type="email" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"><span class="text-red-500 text-xs hidden" id="err-email"></span>
      </div>
      <div>
       <label class="text-sm font-medium text-gray-700 block mb-1">Estado</label><span class="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">Activo</span>
      </div><button type="submit" class="w-full py-2.5 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition">Registrar</button>
     </form>
    </div><!-- List -->
    <div id="nurse-list" class="view fade-in">
     <h2 data-template-id="nurse-list-title" class="canva-text text-xl font-semibold mb-4"></h2>
     <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full text-sm" id="table-patients">
       <thead class="bg-gray-50">
        <tr>
         <th class="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
         <th class="text-left px-4 py-3 font-medium text-gray-600">Apellido</th>
         <th class="text-left px-4 py-3 font-medium text-gray-600">DNI</th>
         <th class="text-left px-4 py-3 font-medium text-gray-600">Email</th>
         <th class="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
        </tr>
       </thead>
       <tbody id="tbody-patients" class="divide-y divide-gray-50"></tbody>
      </table>
      <p id="empty-list" class="text-center text-gray-400 py-8 text-sm">No hay embarazadas registradas.</p>
     </div>
    </div><!-- BP -->
    <div id="nurse-bp" class="view fade-in">
     <h2 data-template-id="nurse-bp-title" class="canva-text text-xl font-semibold mb-4"></h2>
     <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-lg space-y-4">
      <div>
       <label class="text-sm font-medium text-gray-700 block mb-1">Seleccionar embarazada</label><select id="bp-select" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"><option value="">-- Seleccione --</option></select><span class="text-red-500 text-xs hidden" id="err-bp-select"></span>
      </div>
      <div class="grid grid-cols-2 gap-4">
       <div>
        <label class="text-sm font-medium text-gray-700 block mb-1" for="bp-sys">Sistólica</label><input id="bp-sys" type="number" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"><span class="text-red-500 text-xs hidden" id="err-bp-sys"></span>
       </div>
       <div>
        <label class="text-sm font-medium text-gray-700 block mb-1" for="bp-dia">Diastólica</label><input id="bp-dia" type="number" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"><span class="text-red-500 text-xs hidden" id="err-bp-dia"></span>
       </div>
      </div><button type="button" id="btn-save-bp" class="w-full py-2.5 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition">Guardar</button>
     </div>
     <div class="mt-6">
      <h3 class="font-semibold text-gray-700 mb-3">Historial de presión arterial</h3>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
       <table class="w-full text-sm">
        <thead class="bg-gray-50">
         <tr>
          <th class="text-left px-4 py-3 font-medium text-gray-600">Paciente</th>
          <th class="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
          <th class="text-left px-4 py-3 font-medium text-gray-600">Hora</th>
          <th class="text-left px-4 py-3 font-medium text-gray-600">Sistólica</th>
          <th class="text-left px-4 py-3 font-medium text-gray-600">Diastólica</th>
         </tr>
        </thead>
        <tbody id="tbody-bp" class="divide-y divide-gray-50"></tbody>
       </table>
       <p id="empty-bp" class="text-center text-gray-400 py-6 text-sm">Sin registros.</p>
      </div>
     </div>
    </div>
   </div>
  </div><!-- PATIENT SCREEN -->
  <div id="screen-patient" class="screen flex-col items-center justify-center w-full px-4" style="min-height:calc(100 * min(var(--vh,1vh),1vh))"><!-- Login -->
   <div id="patient-login" class="w-full max-w-sm fade-in">
    <div class="text-center mb-6">
     <div class="w-16 h-16 mx-auto rounded-full bg-pink-100 flex items-center justify-center text-3xl mb-3">
      🤰
     </div>
     <h2 data-template-id="patient-login-title" class="canva-text text-xl font-semibold"></h2>
    </div>
    <form id="form-login" class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
     <div>
      <label class="text-sm font-medium text-gray-700 block mb-1" for="login-email">Email</label><input id="login-email" type="email" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-200 outline-none">
     </div>
     <div>
      <label class="text-sm font-medium text-gray-700 block mb-1" for="login-pass">Contraseña</label><input id="login-pass" type="password" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-200 outline-none">
     </div><span class="text-red-500 text-xs hidden" id="err-login"></span> <button type="submit" class="w-full py-2.5 rounded-xl bg-pink-500 text-white font-medium hover:bg-pink-600 transition">Ingresar</button> <button type="button" onclick="logout()" class="w-full py-2 text-sm text-gray-500 hover:text-gray-700">← Volver</button>
    </form>
   </div><!-- Symptoms -->
   <div id="patient-symptoms" class="w-full max-w-md fade-in hidden">
    <div class="flex items-center justify-between mb-4">
     <h2 data-template-id="symptoms-title" class="canva-text text-xl font-semibold"></h2><button onclick="patientLogout()" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"><i data-lucide="log-out" style="width:16px;height:16px"></i> Salir</button>
    </div>
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
     <p data-template-id="symptoms-instruction" class="canva-text text-sm text-gray-500"></p>
     <div class="space-y-3" id="symptom-checks"><label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" value="Dolor de cabeza intenso" class="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-300"><span class="text-sm">Dolor de cabeza intenso</span></label> <label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" value="Visión borrosa" class="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-300"><span class="text-sm">Visión borrosa</span></label> <label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" value="Hinchazón" class="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-300"><span class="text-sm">Hinchazón</span></label> <label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" value="Dolor abdominal" class="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-300"><span class="text-sm">Dolor abdominal</span></label> <label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" value="Náuseas" class="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-300"><span class="text-sm">Náuseas</span></label> <label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" value="Mareos" class="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-300"><span class="text-sm">Mareos</span></label>
     </div><span class="text-red-500 text-xs hidden" id="err-symptoms"></span> <button type="button" id="btn-save-symptoms" class="w-full py-2.5 rounded-xl bg-pink-500 text-white font-medium hover:bg-pink-600 transition">Guardar</button>
    </div>
    <div class="mt-6">
     <h3 class="font-semibold text-gray-700 mb-3">Historial de síntomas</h3>
     <div id="symptom-history" class="space-y-2"></div>
     <p id="empty-symptoms" class="text-center text-gray-400 py-6 text-sm">Sin registros.</p>
    </div>
   </div>
  </div>
  <script src="/_sdk/47669dc8496955be.editing_sdk.js" integrity="sha512-SXgqvNdy3CX4R90Kr2d0cSNYZOv6KbcxTq/tprZCtYPHhvtgc5Aagp95xl8W/LNBFpixAlLGqjQW133qbh1QAg=="></script>
  <script>
    lucide.createIcons();

    // Data store
    const patients = [];
    const bpRecords = [];
    const symptomRecords = [];
    let currentPatient = null;

    // Screen management
    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    function openNurse() { showScreen('screen-nurse'); }
    function openPatient() { showScreen('screen-patient'); }
    function logout() { showScreen('screen-landing'); document.getElementById('patient-login').classList.remove('hidden'); document.getElementById('patient-symptoms').classList.add('hidden'); }
    function patientLogout() { currentPatient = null; logout(); }

    // Toast
    function showToast(msg, success=true) {
        const t = document.getElementById('toast');
        t.textContent = msg;
        t.className = 'toast fixed top-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg z-[100] ' + (success ? 'bg-green-500' : 'bg-red-500');
        setTimeout(() => t.classList.add('hidden'), 3000);
    }

    // Nurse nav
    document.getElementById('nurse-nav').addEventListener('click', e => {
        const btn = e.target.closest('[data-nav]');
        if (!btn) return;
        document.querySelectorAll('#nurse-nav .sidebar-link').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('#screen-nurse .view').forEach(v => v.classList.remove('active'));
        document.getElementById(btn.dataset.nav).classList.add('active');
        if (btn.dataset.nav === 'nurse-list') renderPatientTable();
        if (btn.dataset.nav === 'nurse-bp') renderBPSelect();
    });

    // Register patient
    document.getElementById('form-register').addEventListener('submit', e => {
        e.preventDefault();
        let valid = true;
        const f = (id) => document.getElementById(id);
        const show = (id, msg) => { const el = f(id); el.textContent = msg; el.classList.remove('hidden'); valid = false; };
        const hide = (id) => f(id).classList.add('hidden');

        ['err-nombre','err-apellido','err-dni','err-email'].forEach(hide);

        const nombre = f('reg-nombre').value.trim();
        const apellido = f('reg-apellido').value.trim();
        const dni = f('reg-dni').value.trim();
        const email = f('reg-email').value.trim();

        if (!nombre) show('err-nombre', 'Campo obligatorio');
        if (!apellido) show('err-apellido', 'Campo obligatorio');
        if (!dni) show('err-dni', 'Campo obligatorio');
        else if (patients.find(p => p.dni === dni)) show('err-dni', 'DNI ya registrado');
        if (!email) show('err-email', 'Campo obligatorio');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) show('err-email', 'Formato de email inválido');

        if (!valid) return;

        patients.push({ nombre, apellido, dni, email, estado: 'Activo' });
        e.target.reset();
        showToast('Usuario registrado correctamente');
    });

    function renderPatientTable() {
        const tbody = document.getElementById('tbody-patients');
        const empty = document.getElementById('empty-list');
        tbody.innerHTML = '';
        if (patients.length === 0) { empty.classList.remove('hidden'); return; }
        empty.classList.add('hidden');
        patients.forEach(p => {
            tbody.innerHTML += `<tr><td class="px-4 py-3">${p.nombre}</td><td class="px-4 py-3">${p.apellido}</td><td class="px-4 py-3">${p.dni}</td><td class="px-4 py-3">${p.email}</td><td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Activo</span></td></tr>`;
        });
    }

    function renderBPSelect() {
        const sel = document.getElementById('bp-select');
        sel.innerHTML = '<option value="">-- Seleccione --</option>';
        patients.forEach((p, i) => { sel.innerHTML += `<option value="${i}">${p.nombre} ${p.apellido}</option>`; });
    }

    // Save BP
    document.getElementById('btn-save-bp').addEventListener('click', () => {
        let valid = true;
        const hide = id => document.getElementById(id).classList.add('hidden');
        const show = (id, msg) => { const el = document.getElementById(id); el.textContent = msg; el.classList.remove('hidden'); valid = false; };
        ['err-bp-select','err-bp-sys','err-bp-dia'].forEach(hide);

        const idx = document.getElementById('bp-select').value;
        const sys = parseInt(document.getElementById('bp-sys').value);
        const dia = parseInt(document.getElementById('bp-dia').value);

        if (idx === '') show('err-bp-select', 'Seleccione una embarazada');
        if (isNaN(sys) || sys < 80 || sys > 200) show('err-bp-sys', 'Entre 80 y 200');
        if (isNaN(dia) || dia < 50 || dia > 130) show('err-bp-dia', 'Entre 50 y 130');

        if (!valid) return;

        const now = new Date();
        bpRecords.push({ patient: patients[idx].nombre + ' ' + patients[idx].apellido, fecha: now.toLocaleDateString('es-AR'), hora: now.toLocaleTimeString('es-AR', {hour:'2-digit',minute:'2-digit'}), sys, dia });
        document.getElementById('bp-sys').value = '';
        document.getElementById('bp-dia').value = '';
        showToast('Presión registrada correctamente');
        renderBPHistory();
    });

    function renderBPHistory() {
        const tbody = document.getElementById('tbody-bp');
        const empty = document.getElementById('empty-bp');
        tbody.innerHTML = '';
        if (bpRecords.length === 0) { empty.classList.remove('hidden'); return; }
        empty.classList.add('hidden');
        bpRecords.slice().reverse().forEach(r => {
            tbody.innerHTML += `<tr><td class="px-4 py-3">${r.patient}</td><td class="px-4 py-3">${r.fecha}</td><td class="px-4 py-3">${r.hora}</td><td class="px-4 py-3">${r.sys}</td><td class="px-4 py-3">${r.dia}</td></tr>`;
        });
    }

    // Patient login
    document.getElementById('form-login').addEventListener('submit', e => {
        e.preventDefault();
        const errEl = document.getElementById('err-login');
        errEl.classList.add('hidden');
        const email = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('login-pass').value.trim();
        const found = patients.find(p => p.email === email && p.dni === pass);
        if (!found) { errEl.textContent = 'Email o contraseña incorrectos.'; errEl.classList.remove('hidden'); return; }
        currentPatient = found;
        document.getElementById('patient-login').classList.add('hidden');
        document.getElementById('patient-symptoms').classList.remove('hidden');
        renderSymptomHistory();
    });

    // Save symptoms
    document.getElementById('btn-save-symptoms').addEventListener('click', () => {
        const checks = [...document.querySelectorAll('#symptom-checks input:checked')].map(c => c.value);
        const errEl = document.getElementById('err-symptoms');
        if (checks.length === 0) { errEl.textContent = 'Seleccioná al menos un síntoma.'; errEl.classList.remove('hidden'); return; }
        errEl.classList.add('hidden');
        const now = new Date();
        symptomRecords.push({ patient: currentPatient.dni, fecha: now.toLocaleDateString('es-AR'), hora: now.toLocaleTimeString('es-AR', {hour:'2-digit',minute:'2-digit'}), symptoms: checks });
        document.querySelectorAll('#symptom-checks input').forEach(c => c.checked = false);
        showToast('Síntomas registrados correctamente.');
        renderSymptomHistory();
    });

    function renderSymptomHistory() {
        const container = document.getElementById('symptom-history');
        const empty = document.getElementById('empty-symptoms');
        const records = symptomRecords.filter(r => r.patient === currentPatient.dni);
        container.innerHTML = '';
        if (records.length === 0) { empty.classList.remove('hidden'); return; }
        empty.classList.add('hidden');
        records.slice().reverse().forEach(r => {
            container.innerHTML += `<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"><div class="flex justify-between text-xs text-gray-400 mb-2"><span>${r.fecha}</span><span>${r.hora}</span></div><div class="flex flex-wrap gap-2">${r.symptoms.map(s => `<span class="px-2 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-medium">${s}</span>`).join('')}</div></div>`;
        });
    }
</script>
 </body>
</html>
