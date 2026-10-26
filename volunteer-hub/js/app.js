/* Volunteer Hub — Riverside Food Pantry
 * Plain JavaScript, no libraries. All data below is sample data.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------
  // Sample data
  // ---------------------------------------------------------------
  const PAST_EVENTS = [
    { name: 'Holiday Coat Drive', count: 412 },
    { name: 'Summer Lunch Program', count: 538 },
    { name: 'Spring Food Sort', count: 296 },
    { name: 'Back-to-School Packs', count: 221 }
  ];

  // x / y are positions on the 800 x 520 map drawing
  const EVENTS = [
    { name: 'Saturday Food Sort', date: 'Sat, Oct 17', time: '9:00 AM – 12:00 PM', where: 'Memorial Park', addr: '1620 Riverside Ave, Riverside', spots: 5, x: 216, y: 240 },
    { name: 'Senior Grocery Delivery', date: 'Sun, Oct 18', time: '1:00 – 4:00 PM', where: 'Mandarin Senior Center', addr: '3848 Hartley Rd, Mandarin', spots: 1, x: 314, y: 462 },
    { name: 'Youth Tutoring', date: 'Tue, Oct 20', time: '4:00 – 6:00 PM', where: 'Main Library, Downtown', addr: '303 N Laura St, Downtown', spots: 4, x: 258, y: 210 },
    { name: 'Beach Food Drive', date: 'Sat, Oct 24', time: '8:00 – 11:00 AM', where: 'Jacksonville Beach Pier', addr: '503 1st St N, Jacksonville Beach', spots: 8, x: 744, y: 280 }
  ];

  const VOLUNTEERS = [
    { name: 'Maya Okafor', skills: ['Driving', 'Spanish'], avail: 'Weekends', hours: 64, status: 'Active' },
    { name: 'Daniel Reyes', skills: ['Lifting', 'Driving'], avail: 'Sat AM', hours: 41, status: 'Active' },
    { name: 'Priya Shah', skills: ['Tutoring', 'Spanish'], avail: 'Weekdays PM', hours: 38, status: 'Active' },
    { name: 'Tom Becker', skills: ['Lifting'], avail: 'Flexible', hours: 22, status: 'Onboarding' },
    { name: 'Aisha Grant', skills: ['Tutoring'], avail: 'Tue/Thu', hours: 17, status: 'Active' }
  ];
  const SKILLS = ['All', 'Driving', 'Lifting', 'Tutoring', 'Spanish'];

  // [label, hours, distinct volunteers]
  const REPORT = {
    Event: [['Saturday Food Sort', 142, 18], ['Senior Grocery Delivery', 96, 9], ['Youth Tutoring', 71, 6], ['Holiday Coat Drive', 33, 11]],
    Month: [['July', 88, 21], ['August', 104, 24], ['September', 117, 27], ['October (so far)', 33, 15]],
    Skill: [['Lifting', 121, 12], ['Driving', 109, 10], ['Tutoring', 71, 6], ['Spanish', 41, 8]]
  };

  const FAQ = [
    ['How do I sign up for an event?', 'On Home, press Sign up on any upcoming event card. Press it again to cancel.'],
    ['How do I log my hours?', 'Open Log hours, pick an event you joined, enter the date and hours, then Submit for approval. A coordinator approves it before it counts.'],
    ['What is the live counter on Home?', 'It totals every volunteer who has served at past pantry events, and it updates as new check-ins come in.'],
    ['How do I export hours for a grant report?', 'Open Reports, choose Group by and Metric, then Export CSV or Print PDF.']
  ];

  const TICK_MS = 3000;
  const STORAGE_KEY = 'volunteerHub.v1';

  // ---------------------------------------------------------------
  // State
  // ---------------------------------------------------------------
  const state = {
    mode: 'signup',
    user: '',
    tab: 'home',
    live: PAST_EVENTS.reduce((t, e) => t + e.count, 0),
    gained: 0,
    bumps: PAST_EVENTS.map(() => 0),
    joined: {},
    selEvent: EVENTS[0].name,
    skill: 'All',
    query: '',
    group: 'Event',
    metric: 'Hours',
    subs: [],
    openFaq: 0,
    ask: ''
  };

  // Light persistence so a refresh keeps you signed in. Wrapped in try/catch
  // because storage can be blocked (private windows, strict settings).
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: state.user, joined: state.joined, subs: state.subs }));
    } catch (e) { /* storage unavailable: app still works for this visit */ }
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) {
        state.user = saved.user || '';
        state.joined = saved.joined || {};
        state.subs = saved.subs || [];
      }
    } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'style') node.setAttribute('style', v);
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    });
    (children || []).forEach(c => node.append(c));
    return node;
  }
  function setError(id, msg) {
    const p = document.getElementById(id);
    p.textContent = msg || '';
    const input = document.getElementById(id.replace(/-err$/, ''));
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  const fmt = n => n.toLocaleString('en-US');
  const firstName = name => name.trim().split(/\s+/)[0];

  // ---------------------------------------------------------------
  // Sign up / log in
  // ---------------------------------------------------------------
  function renderAuthMode() {
    const signup = state.mode === 'signup';
    $('#tab-signup').setAttribute('aria-selected', String(signup));
    $('#tab-login').setAttribute('aria-selected', String(!signup));
    $('#auth-title').textContent = signup ? 'Create your volunteer account' : 'Welcome back';
    $('#auth-submit').textContent = signup ? 'Create account' : 'Log in';
    $('#name-field').hidden = !signup;
    $('#login-note').hidden = signup;
    $('#a-pass').setAttribute('autocomplete', signup ? 'new-password' : 'current-password');
    ['a-name-err', 'a-email-err', 'a-pass-err'].forEach(id => setError(id, ''));
  }

  function validateAuth(name, email, pass, mode) {
    const err = {};
    if (mode === 'signup') {
      if (!name.trim()) err.name = 'Enter your name so we know who’s helping.';
      else if (!/^[A-Za-zÀ-ɏ' .-]{2,60}$/.test(name.trim())) err.name = 'Use letters only (2–60 characters).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) err.email = 'Enter an email like name@example.com.';
    if (mode === 'signup') {
      if (pass.length < 8) err.pass = 'Password needs at least 8 characters.';
      else if (!/\d/.test(pass)) err.pass = 'Add at least one number to your password.';
    } else if (!pass) {
      err.pass = 'Enter your password.';
    }
    return err;
  }

  function onAuthSubmit(e) {
    e.preventDefault();
    const name = $('#a-name').value;
    const email = $('#a-email').value;
    const pass = $('#a-pass').value;
    const err = validateAuth(name, email, pass, state.mode);
    setError('a-name-err', err.name);
    setError('a-email-err', err.email);
    setError('a-pass-err', err.pass);
    if (Object.keys(err).length) {
      const firstBad = err.name ? '#a-name' : err.email ? '#a-email' : '#a-pass';
      $(firstBad).focus();
      return;
    }
    state.user = state.mode === 'signup'
      ? name.trim()
      : email.trim().split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    save();
    $('#auth-form').reset();
    showApp();
  }

  // ---------------------------------------------------------------
  // App shell
  // ---------------------------------------------------------------
  function showApp() {
    $('#auth-screen').hidden = true;
    $('#app-screen').hidden = false;
    $('#user-name').textContent = state.user;
    $('#first-name').textContent = firstName(state.user);
    state.gained = 0;
    setTab('home');
    renderAll();
    startTicker();
  }

  function showAuth() {
    stopTicker();
    $('#app-screen').hidden = true;
    $('#auth-screen').hidden = false;
    renderAuthMode();
  }

  function setTab(tab) {
    state.tab = tab;
    $$('.nav-btn').forEach(b => {
      if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    $$('[data-view]').forEach(v => { v.hidden = v.dataset.view !== tab; });
    window.scrollTo(0, 0);
  }

  function renderAll() {
    renderCounter(false);
    renderEvents();
    renderMap();
    renderLogOptions();
    renderSubs();
    renderVolunteers();
    renderReports();
    renderFaq();
  }

  // ---------------------------------------------------------------
  // Home: live counter
  // ---------------------------------------------------------------
  let timer = null;
  function startTicker() {
    stopTicker();
    timer = setInterval(() => {
      const add = Math.random() < 0.75 ? 1 : 2;
      const i = Math.floor(Math.random() * PAST_EVENTS.length);
      state.bumps[i] += add;
      state.live += add;
      state.gained += add;
      renderCounter(true);
    }, TICK_MS);
  }
  function stopTicker() { if (timer) clearInterval(timer); timer = null; }

  function renderCounter(animate) {
    const num = $('#live-total');
    num.textContent = fmt(state.live);
    if (animate) {
      num.classList.remove('bump');
      void num.offsetWidth; // restart the CSS animation
      num.classList.add('bump');
    }
    $('#live-gained').textContent = state.gained;

    const counts = PAST_EVENTS.map((e, i) => e.count + state.bumps[i]);
    const max = Math.max(...counts);
    const tiles = $('#past-tiles');
    tiles.replaceChildren(...PAST_EVENTS.map((e, i) => el('div', { class: 'tile' }, [
      el('span', { class: 'tile-name', text: e.name }),
      el('span', { class: 'tile-count', text: fmt(counts[i]) }),
      el('div', { class: 'bar-track', 'aria-hidden': 'true' }, [
        el('div', { class: 'bar-fill', style: 'width:' + Math.round(counts[i] / max * 100) + '%' })
      ])
    ])));
  }

  // ---------------------------------------------------------------
  // Home: events + map
  // ---------------------------------------------------------------
  function spotsText(ev) {
    const left = ev.spots - (state.joined[ev.name] ? 1 : 0);
    if (left <= 0) return 'Full';
    return left + (left === 1 ? ' spot left' : ' spots left');
  }

  function joinButton(ev) {
    const on = !!state.joined[ev.name];
    return el('button', {
      class: 'btn ' + (on ? 'btn-joined' : 'btn-primary'),
      'aria-pressed': String(on),
      text: on ? 'Signed up ✓' : 'Sign up',
      onclick: () => {
        state.joined[ev.name] = !on;
        save();
        renderEvents();
        renderMap();
      }
    });
  }

  function selectEvent(name, scroll) {
    state.selEvent = name;
    renderEvents();
    renderMap();
    if (scroll) $('#event-map').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderEvents() {
    $('#events').replaceChildren(...EVENTS.map((ev, i) => el('article', {
      class: 'event' + (ev.name === state.selEvent ? ' selected' : '')
    }, [
      el('div', { class: 'event-top' }, [
        el('span', { class: 'num', 'aria-hidden': 'true', text: String(i + 1) }),
        el('span', { class: 'event-date', text: ev.date })
      ]),
      el('h3', { text: ev.name }),
      el('div', { class: 'event-meta' }, [
        el('span', { class: 'muted', text: ev.time }),
        el('span', { class: 'event-where', text: ev.where }),
        el('span', { class: 'muted', text: ev.addr })
      ]),
      el('p', { class: 'muted', style: 'font-size:14px', text: spotsText(ev) }),
      el('div', { class: 'event-actions' }, [
        joinButton(ev),
        el('button', { class: 'btn btn-secondary', text: 'Show on map', onclick: () => selectEvent(ev.name, true) })
      ])
    ])));
  }

  function renderMap() {
    const map = $('#map');
    $$('.pin', map).forEach(p => p.remove());
    EVENTS.forEach((ev, i) => {
      map.append(el('button', {
        class: 'pin',
        style: 'left:' + (ev.x / 8) + '%; top:' + (ev.y / 5.2) + '%',
        'aria-pressed': String(ev.name === state.selEvent),
        'aria-label': 'Event ' + (i + 1) + ': ' + ev.name + ' at ' + ev.where,
        text: String(i + 1),
        onclick: () => selectEvent(ev.name, false)
      }));
    });

    const i = EVENTS.findIndex(e => e.name === state.selEvent);
    const detail = $('#map-detail');
    if (i < 0) { detail.hidden = true; return; }
    const ev = EVENTS[i];
    detail.hidden = false;
    detail.replaceChildren(
      el('span', { class: 'num', 'aria-hidden': 'true', text: String(i + 1) }),
      el('div', { class: 'map-detail-text' }, [
        el('strong', { text: ev.name + ' · ' + ev.where }),
        el('span', { class: 'muted', style: 'font-size:14px', text: ev.addr + ' · ' + ev.date + ', ' + ev.time })
      ]),
      joinButton(ev)
    );
  }

  // ---------------------------------------------------------------
  // Volunteers
  // ---------------------------------------------------------------
  function renderVolunteers() {
    $('#skill-chips').replaceChildren(...SKILLS.map(s => el('button', {
      class: 'pill', 'aria-pressed': String(state.skill === s), text: s,
      onclick: () => { state.skill = s; renderVolunteers(); }
    })));

    const q = state.query.trim().toLowerCase();
    const rows = VOLUNTEERS.filter(v =>
      (state.skill === 'All' || v.skills.includes(state.skill)) && v.name.toLowerCase().includes(q));

    $('#vol-rows').replaceChildren(...rows.map(v => el('tr', {}, [
      el('td', { text: v.name }),
      el('td', { class: 'muted', text: v.skills.join(', ') }),
      el('td', { class: 'muted', text: v.avail }),
      el('td', { class: 'num-col', text: String(v.hours) }),
      el('td', {}, [el('span', { class: 'tag ' + (v.status === 'Active' ? 'tag-active' : 'tag-pending'), text: v.status })])
    ])));
    $('#vol-count').textContent = rows.length;
    $('#vol-empty').hidden = rows.length > 0;
  }

  // ---------------------------------------------------------------
  // Log hours (syntactic + semantic validation)
  // ---------------------------------------------------------------
  function renderLogOptions() {
    const select = $('#f-event');
    const current = select.value;
    select.replaceChildren(...EVENTS.map(ev => el('option', { value: ev.name, text: ev.name })));
    if (current) select.value = current;
  }

  function validateLog(eventName, dateText, hoursText) {
    const err = {};
    // Syntactic: correct shape. Semantic: makes sense.
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateText.trim());
    if (!m) {
      err.date = 'Use MM/DD/YYYY, e.g. 10/17/2026.';
    } else {
      const d = new Date(+m[3], +m[1] - 1, +m[2]);
      if (d.getMonth() !== +m[1] - 1 || d.getDate() !== +m[2]) err.date = 'That date doesn’t exist — check the month and day.';
      else if (d > new Date()) err.date = 'Hours can’t be logged for a future date.';
    }
    const h = Number(hoursText);
    if (hoursText.trim() === '' || isNaN(h)) err.hours = 'Enter a number, like 2.5.';
    else if (h < 0.5 || h > 12) err.hours = 'A single shift must be between 0.5 and 12 hours.';
    else if (Math.round(h * 4) !== h * 4) err.hours = 'Round to the nearest quarter hour (e.g. 2.25).';
    if (!state.joined[eventName]) err.event = 'You aren’t signed up for ' + eventName + '. Join it on Home first.';
    return err;
  }

  function onLogSubmit(e) {
    e.preventDefault();
    const eventName = $('#f-event').value;
    const date = $('#f-date').value;
    const hours = $('#f-hours').value;
    const err = validateLog(eventName, date, hours);
    setError('f-event-err', err.event);
    setError('f-date-err', err.date);
    setError('f-hours-err', err.hours);
    const notice = $('#log-notice');
    if (Object.keys(err).length) { notice.hidden = true; return; }

    const text = hours.trim() + ' hrs · ' + eventName + ' · ' + date.trim();
    state.subs.unshift({ text });
    save();
    notice.textContent = 'Sent for review: ' + text + '. You’ll be notified once it’s approved.';
    notice.hidden = false;
    $('#f-date').value = '';
    $('#f-hours').value = '';
    renderSubs();
  }

  function renderSubs() {
    $('#subs').hidden = state.subs.length === 0;
    $('#sub-rows').replaceChildren(...state.subs.map(s => el('div', { class: 'sub-row' }, [
      el('span', { text: s.text }),
      el('span', { class: 'tag tag-pending', text: 'Pending approval' })
    ])));
  }

  // ---------------------------------------------------------------
  // Reports
  // ---------------------------------------------------------------
  function chips(container, options, current, onPick) {
    container.replaceChildren(...options.map(o => el('button', {
      class: 'pill', 'aria-pressed': String(current === o), text: o, onclick: () => onPick(o)
    })));
  }

  function currentReport() {
    const idx = state.metric === 'Hours' ? 1 : 2;
    return REPORT[state.group].map(r => ({ label: r[0], value: r[idx] }));
  }

  function renderReports() {
    chips($('#group-chips'), Object.keys(REPORT), state.group, g => { state.group = g; renderReports(); });
    chips($('#metric-chips'), ['Hours', 'Volunteers'], state.metric, m => { state.metric = m; renderReports(); });

    const rows = currentReport();
    const max = Math.max(...rows.map(r => r.value));
    $('#chart-h').textContent = (state.metric === 'Hours' ? 'Service hours' : 'Distinct volunteers') + ' by ' + state.group.toLowerCase();
    $('#bars').replaceChildren(...rows.map(r => el('div', { class: 'bar-row' }, [
      el('span', { text: r.label }),
      el('div', { class: 'track', 'aria-hidden': 'true' }, [el('div', { class: 'fill', style: 'width:' + Math.round(r.value / max * 100) + '%' })]),
      el('span', { class: 'val', text: String(r.value) })
    ])));

    const top = rows.slice().sort((a, b) => b.value - a.value)[0];
    const total = rows.reduce((t, r) => t + r.value, 0);
    $('#insight').textContent = top.label + ' leads with ' + top.value + (state.metric === 'Hours' ? ' hours' : ' volunteers') +
      ' — ' + Math.round(top.value / total * 100) + '% of the total.';
  }

  function exportCsv() {
    const rows = currentReport();
    const header = state.group + ',' + state.metric;
    const body = rows.map(r => '"' + r.label.replace(/"/g, '""') + '",' + r.value).join('\n');
    const blob = new Blob([header + '\n' + body + '\n'], { type: 'text/csv' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'volunteer-report-' + state.group.toLowerCase() + '.csv' });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------------------------------------------------------------
  // Help
  // ---------------------------------------------------------------
  function renderFaq() {
    const q = state.ask.trim().toLowerCase();
    const words = q.split(/\s+/).filter(w => w.length > 2);
    const list = FAQ.map((f, i) => ({ q: f[0], a: f[1], i }))
      .filter(f => !words.length || words.some(w => (f.q + ' ' + f.a).toLowerCase().includes(w)));

    const box = $('#faqs');
    if (!list.length) {
      box.replaceChildren(el('p', { class: 'muted', text: 'No matching answers. Try different words, or contact a coordinator.' }));
      return;
    }
    box.replaceChildren(...list.map((f, n) => {
      const open = q ? n === 0 : state.openFaq === f.i;
      const answerId = 'faq-a-' + f.i;
      return el('div', { class: 'card faq' }, [
        el('button', {
          'aria-expanded': String(open), 'aria-controls': answerId, text: f.q,
          onclick: () => { state.ask = ''; $('#ask').value = ''; state.openFaq = state.openFaq === f.i ? -1 : f.i; renderFaq(); }
        }),
        el('p', open ? { id: answerId, text: f.a } : { id: answerId, text: f.a, hidden: '' })
      ]);
    }));
  }

  // ---------------------------------------------------------------
  // Wire up
  // ---------------------------------------------------------------
  function init() {
    load();

    $('#tab-signup').addEventListener('click', () => { state.mode = 'signup'; renderAuthMode(); });
    $('#tab-login').addEventListener('click', () => { state.mode = 'login'; renderAuthMode(); });
    $('#auth-form').addEventListener('submit', onAuthSubmit);

    $$('.nav-btn').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
    $('#logout').addEventListener('click', () => {
      state.user = '';
      save();
      showAuth();
    });

    $('#vol-search').addEventListener('input', e => { state.query = e.target.value; renderVolunteers(); });
    $('#log-form').addEventListener('submit', onLogSubmit);
    $('#export-csv').addEventListener('click', exportCsv);
    $('#print-report').addEventListener('click', () => window.print());
    $('#ask').addEventListener('input', e => { state.ask = e.target.value; renderFaq(); });

    if (state.user) showApp();
    else showAuth();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
