// The opening and context workflow share navigation; returning preserves the answer check.
(() => {
  const byId = id => document.getElementById(id);
  const opening = byId('opening'), story = document.querySelector('main');
  const presenter = byId('presenter'), replay = byId('replay-opening');
  const marks = Array.from(opening.querySelectorAll('.opening-track i'));
  let state = 'ready', timer = null;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function progress(index, label) {
    byId('opening-step').textContent = label;
    marks.forEach((mark, i) => {
      mark.classList.toggle('is-current', i === index);
      mark.classList.toggle('is-complete', i < index);
    });
  }
  function cancelPending() { if (timer !== null) clearTimeout(timer); timer = null; }
  function openingNav() {
    document.querySelectorAll('nav [data-step]').forEach(button => { button.classList.remove('active'); button.setAttribute('aria-current','false'); });
    byId('flow-question').classList.add('active'); byId('flow-question').setAttribute('aria-current','step');
  }
  function placeNavigation(slot) {
    const navigation=byId('flow-navigation'), focused=document.activeElement;
    const preserve=focused && navigation.contains(focused);
    byId(slot).append(navigation);
    if(preserve)focused.focus({preventScroll:true});
  }
  function showOpening(focus = true) {
    story.hidden = true; presenter.hidden = true; replay.hidden = true; opening.hidden = false;
    placeNavigation('opening-navigation'); openingNav();
    if (focus) {
      const target = state === 'checked' ? byId('opening-check-title') : state === 'answered' ? opening.querySelector('[data-opening-choice="trust"]') : byId('opening-input');
      target.focus({preventScroll:true});
      opening.scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'});
    }
  }
  function start(focus = true) {
    cancelPending(); state = 'ready';
    ['opening-question','opening-answer','opening-typing','opening-choices','opening-reveal','opening-choice-record','opening-restart'].forEach(id => { byId(id).hidden = true; });
    byId('opening-empty').hidden = false; byId('opening-check-prompt').hidden = false;
    byId('opening-input').setAttribute('aria-describedby','opening-disclosure opening-send-guidance');
    byId('opening-ask').disabled = false; byId('opening-ask').textContent = 'Send';
    byId('opening-evidence').open = false; byId('opening-ack').textContent = '';
    progress(0, 'Step 1 of 5 · Ask the question'); showOpening(focus);
  }
  function showWalkthrough() {
    if (state === 'pending') start(false);
    cancelPending(); opening.hidden = true; story.hidden = false; presenter.hidden = false; replay.hidden = false; placeNavigation('story-navigation');
  }
  function enter() { showWalkthrough(); navigateChapter(0); }
  function restart() { resetWalkthrough(); start(); }
  window.showWalkthrough = showWalkthrough;
  window.returnToQuestion = () => showOpening();
  window.restartQuestion = restart;
  byId('flow-question').addEventListener('click', () => showOpening());
  byId('opening-form').addEventListener('submit', event => {
    event.preventDefault();
    if (state !== 'ready') return;
    state = 'pending'; byId('opening-ask').disabled = true;
    byId('opening-empty').hidden = true; byId('opening-question').hidden = false; byId('opening-typing').hidden = false;
    byId('opening-input').setAttribute('aria-describedby','opening-disclosure');
    timer = setTimeout(() => {
      timer = null; if (state !== 'pending' || opening.hidden) return;
      state = 'answered'; byId('opening-typing').hidden = true; byId('opening-answer').hidden = false;
      byId('opening-check-prompt').hidden = true;
      byId('opening-choices').hidden = false; byId('opening-restart').hidden = false;
      byId('opening-ask').textContent = 'Sent'; progress(1, 'Step 1 of 5 · Review the answer');
      opening.querySelector('[data-opening-choice="trust"]').focus({preventScroll:true});
    }, reduced()?0:800);
  });
  opening.querySelectorAll('[data-opening-choice]').forEach(button => button.addEventListener('click', () => {
    if (state !== 'answered') return;
    state = 'checked';
    byId('opening-choice-record').textContent = 'Your choice: ' + button.textContent;
    byId('opening-choice-record').hidden = false; byId('opening-choices').hidden = true;
    byId('opening-ack').textContent = button.dataset.openingChoice === 'trust'
      ? 'The numbers look consistent. The metric needs a closer look.'
      : 'A definition check reveals the mismatch.';
    byId('opening-check-prompt').hidden = true; byId('opening-reveal').hidden = false;
    progress(2, 'Step 1 of 5 · Check the metric');
    byId('opening-check-title').focus({preventScroll:true});
    if (window.matchMedia('(max-width:850px)').matches) byId('opening-check-title').scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'});
  }));
  byId('opening-skip').addEventListener('click', enter);
  byId('opening-enter').addEventListener('click', enter);
  byId('opening-restart').addEventListener('click', restart);
  replay.addEventListener('click', restart);
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target && story.contains(target)) replay.hidden = false;
  else start(false);
})();
