const GATE_KEY = 'hellaverse_gate_open';

function enterSite() {
  localStorage.setItem(GATE_KEY, 'yes');
  const gate = document.getElementById('gate');
  const shell = document.getElementById('shell');
  if (gate) gate.hidden = true;
  if (shell) shell.hidden = false;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function addGateStyle() {
  if (document.getElementById('gateClickStyle')) return;
  const style = document.createElement('style');
  style.id = 'gateClickStyle';
  style.textContent = `
    #gate {
      cursor: pointer;
    }
    #gate .gate-card {
      pointer-events: none;
      user-select: none;
    }
    #gate[hidden], #shell[hidden] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

function bindGateClick() {
  addGateStyle();
  document.addEventListener('click', (event) => {
    if (!event.target.closest('#gate')) return;
    event.preventDefault();
    event.stopPropagation();
    enterSite();
  }, true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindGateClick);
} else {
  bindGateClick();
}
