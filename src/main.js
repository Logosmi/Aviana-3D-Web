import './style.css';
import { renderHomeView } from './views/homeView.js';
import { renderViewerView } from './views/viewerView.js';

const app = document.querySelector('#app');
let activeCleanup = null;

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('voxcauc-theme', theme); } catch (e) {}
}

export function toggleTheme() {
  const current = getTheme();
  setTheme(current === 'dark' ? 'light' : 'dark');
}

// Initialize theme from storage
const saved = (() => { try { return localStorage.getItem('voxcauc-theme'); } catch (e) { return null; } })();
setTheme(saved || 'light');

function parseHashRoute() {
  const hash = window.location.hash || '#/';
  const [pathPart, queryPart] = hash.replace(/^#/, '').split('?');
  const path = pathPart || '/';
  const params = new URLSearchParams(queryPart || '');
  return { path, params };
}

function navigate(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  window.location.hash = query ? `${path}?${query}` : path;
}

function rerender() {
  if (typeof activeCleanup === 'function') {
    activeCleanup();
    activeCleanup = null;
  }

  const { path, params } = parseHashRoute();

  if (path === '/viewer') {
    activeCleanup = renderViewerView(app, {
      id: params.get('id') || '',
      onBack: () => navigate('/', { view: params.get('from') || 'showcase' })
    });
    return;
  }

  const initialView = params.get('view') || 'intro';
  activeCleanup = renderHomeView(app, {
    initialView,
    onOpenModel: (id, sourceView = 'showcase') => navigate('/viewer', { id, from: sourceView })
  });
}

window.addEventListener('hashchange', rerender);
window.addEventListener('DOMContentLoaded', rerender);

if (!window.location.hash) {
  navigate('/');
} else {
  rerender();
}
