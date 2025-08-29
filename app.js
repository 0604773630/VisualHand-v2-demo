// VisualHand Offline Demo — No network calls
(function(){
  const state = {
    mode: 'user', // 'user' | 'monitor'
    optInNearby: true,
    listenMode: true,
    alertSounds: true,
    nextCheckin: null,
    userPos: {x: 80, y: 140},
    responders: [
      {id: 'R-102', x: 320, y: 120, optIn:true},
      {id: 'R-221', x: 430, y: 220, optIn:true}
    ],
    activeAlerts: []
  };

  // Elements
  const sosBtn = document.getElementById('sosBtn');
  const duressToggle = document.getElementById('duressToggle');
  const simulateVoice = document.getElementById('simulateVoice');
  const voiceCode = document.getElementById('voiceCode');
  const optInNearby = document.getElementById('optInNearby');
  const listenMode = document.getElementById('listenMode');
  const alertSounds = document.getElementById('alertSounds');
  const nextCheckinEl = document.getElementById('nextCheckin');
  const safeBtn = document.getElementById('safeBtn');
  const skipBtn = document.getElementById('skipBtn');
  const feed = document.getElementById('feed');
  const monitorFeed = document.getElementById('monitorFeed');
  const monitorCard = document.getElementById('monitorCard');
  const feedTitle = document.getElementById('feedTitle');
  const modeToggle = document.getElementById('modeToggle');
  const modeLabel = document.getElementById('modeLabel');
  const beep = document.getElementById('beep');

  // Restore prefs
  try{
    const saved = JSON.parse(localStorage.getItem('vh_prefs')||'{}');
    if (typeof saved.optInNearby === 'boolean') { state.optInNearby = saved.optInNearby; optInNearby.checked = saved.optInNearby; }
    if (typeof saved.listenMode === 'boolean') { state.listenMode = saved.listenMode; listenMode.checked = saved.listenMode; }
    if (typeof saved.alertSounds === 'boolean') { state.alertSounds = saved.alertSounds; alertSounds.checked = saved.alertSounds; }
  }catch(e){}

  // Schedule next check-in (simulated every 2 minutes)
  function scheduleCheckin(){
    const now = new Date();
    const next = new Date(now.getTime() + 2*60*1000);
    state.nextCheckin = next;
    nextCheckinEl.textContent = next.toLocaleTimeString();
  }
  scheduleCheckin();

  safeBtn.addEventListener('click', ()=>{
    log(feed, 'Check-in: I\'m Safe', 'You confirmed safety for scheduled check-in.');
    scheduleCheckin();
  });
  skipBtn.addEventListener('click', ()=>{
    log(feed, 'Check-in Skipped', 'You skipped a scheduled check-in. Monitor may follow up.');
    scheduleCheckin();
  });

  function savePrefs(){
    localStorage.setItem('vh_prefs', JSON.stringify({
      optInNearby: optInNearby.checked,
      listenMode: listenMode.checked,
      alertSounds: alertSounds.checked
    }));
  }
  optInNearby.addEventListener('change', ()=>{ state.optInNearby = optInNearby.checked; savePrefs(); });
  listenMode.addEventListener('change', ()=>{ state.listenMode = listenMode.checked; savePrefs(); });
  alertSounds.addEventListener('change', ()=>{ state.alertSounds = alertSounds.checked; savePrefs(); });

  // Mode switch
  modeToggle.addEventListener('change', ()=>{
    if(modeToggle.checked){
      state.mode = 'monitor';
      modeLabel.textContent = 'Monitor Mode';
      monitorCard.classList.remove('hidden');
      feedTitle.textContent = 'My Alerts (User View)';
    }else{
      state.mode = 'user';
      modeLabel.textContent = 'User Mode';
      monitorCard.classList.add('hidden');
      feedTitle.textContent = 'My Alerts';
    }
  });

  // SOS actions
  sosBtn.addEventListener('click', ()=> triggerSOS('Manual SOS'));
  simulateVoice.addEventListener('click', ()=>{
    const phrase = voiceCode.value.trim() || 'Default phrase';
    triggerSOS('Stealth Voice Code: "'+phrase+'"', true);
  });

  function triggerSOS(label, stealth=false){
    sosBtn.classList.add('active');
    const duress = duressToggle.checked;
    const timestamp = new Date().toLocaleTimeString();
    const alertId = 'A-' + Math.floor(100000 + Math.random()*899999);
    const alert = { id: alertId, label, duress, stealth, time: timestamp, x: state.userPos.x+Math.random()*20, y: state.userPos.y+Math.random()*20 };
    state.activeAlerts.push(alert);

    // User feed
    log(feed, label, 'Alert ID '+alertId+' — Location locked (simulated).', duress);

    // Sound
    if (state.alertSounds) { try{ beep.currentTime = 0; beep.play().catch(()=>{}); }catch(e){} }

    // Broadcast logic (simulated)
    broadcastToResponders(alert);

    // Visual map update
    drawMap();
    setTimeout(()=> sosBtn.classList.remove('active'), 1800);
  }

  function broadcastToResponders(alert){
    // Only opt-in responders receive; listen mode shows anonymized card
    const listeners = state.responders.filter(r=> r.optIn);
    listeners.forEach(r=>{
      if(state.mode === 'monitor'){
        log(monitorFeed, 'Incoming Alert '+(alert.duress?'(DURESS)':''), `${alert.label} • ${alert.time} • Approx @ (${Math.round(alert.x)},${Math.round(alert.y)})`, alert.duress);
      }
      if(state.listenMode){
        // Nearby unregistered "listener" view (anonymized)
        log(feed, 'Nearby Alert (Anonymized)', 'Someone nearby needs help. Route guidance enabled (simulated).');
      }
    });
  }

  function log(container, title, meta, duress=false){
    const item = document.createElement('div');
    item.className = 'log' + (duress ? ' duress' : '') + (title.toLowerCase().includes('alert') ? ' alert' : '');
    const t = document.createElement('div'); t.className='title'; t.textContent = title;
    const m = document.createElement('div'); m.className='meta'; m.textContent = meta;
    item.appendChild(t); item.appendChild(m);
    container.prepend(item);
  }

  // Map rendering (simple dots)
  const map = document.getElementById('map');
  const ctx = map.getContext('2d');
  function drawMap(){
    ctx.clearRect(0,0,map.width,map.height);
    // bg grid
    ctx.fillStyle = '#031018';
    ctx.fillRect(0,0,map.width,map.height);
    ctx.strokeStyle = 'rgba(0,255,255,0.1)';
    for(let x=0;x<map.width;x+=40){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,map.height); ctx.stroke(); }
    for(let y=0;y<map.height;y+=40){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(map.width,y); ctx.stroke(); }

    // user
    drawDot(state.userPos.x, state.userPos.y, '#00d1ff', 6);

    // responders
    state.responders.forEach(r=> drawDot(r.x, r.y, '#00ff95', 5));

    // alerts
    state.activeAlerts.forEach(a=> drawDot(a.x, a.y, '#ff3b3b', 5));
  }
  function drawDot(x,y,color, r){
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  drawMap();

  // Demo: move responders slightly
  setInterval(()=>{
    state.responders.forEach(r=>{
      r.x += (Math.random()-0.5)*2;
      r.y += (Math.random()-0.5)*2;
    });
    drawMap();
  }, 900);
})();