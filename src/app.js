// Main app logic (uses firebase compat objects from firebase-config.js)
(function () {
  // ensure auth and db are available (use window.* if provided)
  const auth = window.auth || (firebase && firebase.auth && firebase.auth());
  const db = window.db || (firebase && firebase.firestore && firebase.firestore());

  const authArea = document.getElementById('authArea');
  const authSection = document.getElementById('authSection');
  const appSection = document.getElementById('appSection');
  const dashboard = document.getElementById('dashboard');
  const noData = document.getElementById('noData');

  // Auth elements
  const googleSignIn = document.getElementById('googleSignIn');
  const emailSignIn = document.getElementById('emailSignIn');
  const emailSignUp = document.getElementById('emailSignUp');
  const emailInput = document.getElementById('email');
  const passInput = document.getElementById('password');

  // Tracker elements
  const datePicker = document.getElementById('datePicker');
  const activitiesList = document.getElementById('activitiesList');
  const actName = document.getElementById('actName');
  const actCat = document.getElementById('actCat');
  const actMin = document.getElementById('actMin');
  const addAct = document.getElementById('addAct');
  const remainingEl = document.getElementById('remaining');
  const analyseBtn = document.getElementById('analyseBtn');

  // Dashboard elements
  const dashDate = document.getElementById('dashDate');
  const totalMins = document.getElementById('totalMins');
  const pieCtx = document.getElementById('pieChart');
  const barCtx = document.getElementById('barChart');

  let currentUser = null;
  let currentDate = null;
  let activities = [];

  // Charts
  let pieChart = null;
  let barChart = null;

  // --- Auth ---
  function renderAuthArea(user) {
    authArea.innerHTML = '';
    if (user) {
      const btn = document.createElement('button');
      btn.textContent = 'Sign out';
      btn.className = 'px-3 py-1 border rounded';
      btn.onclick = () => auth.signOut();
      authArea.appendChild(btn);
    }
  }

  googleSignIn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => {
      if (err && err.code === 'auth/configuration-not-found') {
        alert('Google sign-in is not enabled for this Firebase project. Enable it in the Firebase Console → Authentication → Sign-in method.');
        return;
      }
      alert(err && err.message ? err.message : err);
    });
  };

  emailSignUp.onclick = () => {
    const email = emailInput.value.trim();
    const pass = passInput.value;
    if (!email || !pass) return alert('Provide email and password');
    auth.createUserWithEmailAndPassword(email, pass).catch(e => alert(e.message));
  };

  emailSignIn.onclick = () => {
    const email = emailInput.value.trim();
    const pass = passInput.value;
    if (!email || !pass) return alert('Provide email and password');
    auth.signInWithEmailAndPassword(email, pass).catch(e => alert(e.message));
  };

  auth.onAuthStateChanged(user => {
    currentUser = user;
    renderAuthArea(user);
    if (user) {
      authSection.classList.add('hidden');
      appSection.classList.remove('hidden');
      // default date = today
      const today = new Date().toISOString().slice(0, 10);
      if (datePicker) datePicker.value = today;
      loadForDate(today);
    } else {
      authSection.classList.remove('hidden');
      appSection.classList.add('hidden');
    }
  });

  // --- Data helpers ---
  function datePathFor(dateStr) {
    return `users/${currentUser.uid}/days/${dateStr}/activities`;
  }

  async function loadForDate(dateStr) {
    currentDate = dateStr;
    activitiesList.innerHTML = '';
    activities = [];
    updateRemaining(1440);
    if (analyseBtn) analyseBtn.disabled = true;
    if (dashboard) dashboard.classList.add('hidden');

    if (!currentUser) return;
    try {
      const docRef = db.collection('users').doc(currentUser.uid).collection('days').doc(dateStr);
      let doc;
      try {
        doc = await docRef.get();
      } catch (err) {
        // If we failed because the client is offline, try to read from cache
        const msg = err && err.message ? err.message.toLowerCase() : '';
        if (msg.includes('client is offline') || err.code === 'unavailable') {
          try {
            doc = await docRef.get({ source: 'cache' });
            if (doc && doc.exists) {
              alert('You appear to be offline — showing cached data.');
            } else {
              // try localStorage fallback (in case persistence not enabled or cache missing)
              const key = `att_cache_${currentUser.uid}_${dateStr}`;
              const raw = localStorage.getItem(key);
              if (raw) {
                try {
                  activities = JSON.parse(raw);
                  renderActivities();
                  alert('You are offline — showing locally saved data.');
                  return;
                } catch (pErr) {
                  console.warn('Local cache parse failed', pErr);
                }
              }
              alert('You appear to be offline and no cached data is available. Please reconnect and refresh.');
              return;
            }
          } catch (cacheErr) {
            console.warn('Cache read failed', cacheErr);
            // as a fallback, try localStorage
            const key = `att_cache_${currentUser.uid}_${dateStr}`;
            const raw = localStorage.getItem(key);
            if (raw) {
              try {
                activities = JSON.parse(raw);
                renderActivities();
                alert('You are offline — showing locally saved data.');
                return;
              } catch (pErr) {
                console.warn('Local cache parse failed', pErr);
              }
            }
            alert('Offline and no cached data available. Please reconnect and refresh.');
            return;
          }
        } else {
          throw err;
        }
      }

      if (!doc || !doc.exists) {
        showNoData(true);
        return;
      }
      const data = doc.data();
      const acts = data.activities || [];
      activities = acts;
      renderActivities();
    } catch (e) {
      console.error('Failed to load data', e);
      alert('Failed to load data: ' + (e && e.message ? e.message : e));
    }
  }

  function showNoData(on) {
    if (!dashboard) return;
    dashboard.classList.toggle('hidden', !on ? true : false);
    const noDataEl = document.getElementById('noData');
    if (noDataEl) noDataEl.classList.toggle('hidden', !on);
  }

  function updateRemaining(remaining) {
    if (remainingEl) remainingEl.textContent = remaining;
  }

  function renderActivities() {
    activitiesList.innerHTML = '';
    let total = 0;
    activities.forEach((a, idx) => total += Number(a.minutes || 0));
    updateRemaining(1440 - total);

    activities.forEach((a, idx) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-3 border rounded px-3 py-2';
      row.innerHTML = `<div class="flex-1"><div class="font-medium">${a.name}</div><div class="text-sm text-slate-600">${a.category || ''}</div></div><div class="w-24 text-right">${a.minutes}m</div>`;
      const controls = document.createElement('div');
      controls.className = 'flex gap-2';
      const edit = document.createElement('button'); edit.textContent = 'Edit'; edit.className = 'px-2 py-1 border rounded';
      const del = document.createElement('button'); del.textContent = 'Delete'; del.className = 'px-2 py-1 border rounded';
      edit.onclick = () => editActivity(idx);
      del.onclick = () => deleteActivity(idx);
      controls.appendChild(edit); controls.appendChild(del);
      row.appendChild(controls);
      activitiesList.appendChild(row);
    });

    // Enable analyse if total > 0 and total <= 1440
    if (analyseBtn) analyseBtn.disabled = !(total > 0 && total <= 1440);
    if (totalMins) totalMins.textContent = total;
  }

  function editActivity(idx) {
    const a = activities[idx];
    const newName = prompt('Activity name', a.name);
    if (newName == null) return;
    const newCat = prompt('Category', a.category || '');
    if (newCat == null) return;
    const newMin = prompt('Minutes', a.minutes);
    if (newMin == null) return;
    const minutes = Number(newMin);
    if (isNaN(minutes) || minutes <= 0) return alert('Invalid minutes');
    // check total constraint
    const otherTotal = activities.reduce((s, it, i) => i===idx? s : s + Number(it.minutes || 0), 0);
    if (otherTotal + minutes > 1440) return alert('Total minutes for the day cannot exceed 1440');
    activities[idx] = { name: newName, category: newCat, minutes };
    persistActivities();
  }

  function deleteActivity(idx) {
    if (!confirm('Delete this activity?')) return;
    activities.splice(idx, 1);
    persistActivities();
  }

  async function persistActivities() {
    if (!currentUser || !currentDate) return;
    try {
      const docRef = db.collection('users').doc(currentUser.uid).collection('days').doc(currentDate);
      await docRef.set({ activities }, { merge: true });
      // also clear any localStorage cache for this date on success
      try { localStorage.removeItem(`att_cache_${currentUser.uid}_${currentDate}`); } catch (_) {}
      renderActivities();
    } catch (e) {
      console.error('Failed to save activities to Firestore, falling back to localStorage', e);
      // Save locally so user data isn't lost; we'll try to sync later
      try {
        localStorage.setItem(`att_cache_${currentUser.uid}_${currentDate}`, JSON.stringify(activities));
        alert('Saved locally (offline). Data will sync when you reconnect.');
        renderActivities();
      } catch (lsErr) {
        console.error('Failed to save to localStorage', lsErr);
        alert('Failed to save activities: ' + (e && e.message ? e.message : e));
      }
    }
  }

  // Attempt to sync any locally saved caches to Firestore when we regain connectivity
  async function trySyncLocalCaches() {
    if (!currentUser || !currentDate) return;
    const prefix = `att_cache_${currentUser.uid}_`;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const dateKey = key.substring(prefix.length);
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          try {
            const acts = JSON.parse(raw);
            const docRef = db.collection('users').doc(currentUser.uid).collection('days').doc(dateKey);
            await docRef.set({ activities: acts }, { merge: true });
            localStorage.removeItem(key);
            console.info('Synced local cache for', dateKey);
          } catch (innerErr) {
            console.warn('Failed to sync local cache for', dateKey, innerErr);
          }
        }
      }
    } catch (outerErr) {
      console.warn('Error iterating localStorage for sync', outerErr);
    }
  }

  // Try to sync when coming online
  window.addEventListener('online', () => {
    console.info('Browser online — attempting to sync local caches');
    trySyncLocalCaches();
  });

  if (addAct) {
    addAct.onclick = () => {
      const name = actName.value.trim();
      const cat = actCat.value.trim();
      const mins = Number(actMin.value);
      if (!name || !mins || mins <= 0) return alert('Provide name and minutes');
      const totalNow = activities.reduce((s, it) => s + Number(it.minutes || 0), 0);
      if (totalNow + mins > 1440) return alert('Cannot add — total minutes would exceed 1440');
      activities.push({ name, category: cat, minutes: mins });
      actName.value = ''; actCat.value = ''; actMin.value = '';
      persistActivities();
    };
  }

  if (datePicker) {
    datePicker.onchange = (e) => {
      const d = e.target.value;
      if (!d) return;
      loadForDate(d);
    };
  }

  if (analyseBtn) {
    analyseBtn.onclick = () => {
      if (!activities || activities.length === 0) return alert('No activities to analyse');
      if (dashboard) dashboard.classList.remove('hidden');
      const noDataEl = document.getElementById('noData');
      if (noDataEl) noDataEl.classList.add('hidden');
      renderDashboard();
    };
  }

  function renderDashboard() {
    if (dashDate) dashDate.textContent = currentDate;
    const cats = {};
    activities.forEach(a => {
      const c = a.category || 'Other';
      cats[c] = (cats[c] || 0) + Number(a.minutes || 0);
    });
    const labels = Object.keys(cats);
    const values = Object.values(cats);

    // Pie
    if (pieChart) pieChart.destroy();
    if (pieCtx) pieChart = new Chart(pieCtx.getContext('2d'), {
      type: 'pie', data: { labels, datasets: [{ data: values, backgroundColor: generateColors(values.length) }] },
      options: { responsive: true }
    });

    // Bar (activity durations)
    if (barChart) barChart.destroy();
    const actLabels = activities.map(a => a.name + ' (' + (a.category||'') + ')');
    const actValues = activities.map(a => a.minutes);
    if (barCtx) barChart = new Chart(barCtx.getContext('2d'), {
      type: 'bar', data: { labels: actLabels, datasets: [{ label: 'Minutes', data: actValues, backgroundColor: generateColors(actValues.length) }] },
      options: { responsive: true }
    });
  }

  function generateColors(n) {
    const preset = ['#2563eb','#16a34a','#ef4444','#f59e0b','#8b5cf6','#06b6d4','#f97316','#0ea5a4'];
    const out = [];
    for (let i=0;i<n;i++) out.push(preset[i % preset.length]);
    return out;
  }

})();
