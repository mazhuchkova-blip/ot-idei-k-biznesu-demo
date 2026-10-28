(function () {
  var storageKey = 'ot-idei-k-biznesu-demo';
  var screens = Array.prototype.slice.call(document.querySelectorAll('[data-screen]'));
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-route]'));
  var fields = Array.prototype.slice.call(document.querySelectorAll('[data-save]'));
  var knownRoutes = ['start', 'direction', 'idea', 'audience', 'model', 'plan'];
  var progress = {};

  try { progress = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (error) { progress = {}; }

  fields.forEach(function (field) {
    if (field.type === 'checkbox') field.checked = Boolean(progress[field.dataset.save]);
    else field.value = progress[field.dataset.save] || '';
    field.addEventListener('input', saveProgress);
    field.addEventListener('change', saveProgress);
  });

  function saveProgress() {
    fields.forEach(function (field) {
      progress[field.dataset.save] = field.type === 'checkbox' ? field.checked : field.value.trim();
    });
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch (error) {}
    renderSummary();
  }

  function getRoute() {
    var route = location.hash.replace(/^#\/?/, '').split('/')[0];
    return knownRoutes.indexOf(route) >= 0 ? route : 'start';
  }

  function showRoute() {
    if (location.hash && location.hash.indexOf('#/') !== 0) return;
    var route = getRoute();
    screens.forEach(function (screen) { screen.hidden = screen.dataset.screen !== route; });
    tabs.forEach(function (tab) {
      var activeRoute = route === 'direction' ? 'start' : route;
      if (tab.dataset.route === activeRoute) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
    renderSummary();
    if (location.hash.indexOf('#/') === 0) {
      document.getElementById('app').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderSummary() {
    var summary = document.getElementById('summary');
    var items = [
      ['Идея', progress.idea],
      ['Польза', progress.benefit],
      ['Клиент', progress.audience],
      ['Ситуация', progress.situation],
      ['Результат', progress.result],
      ['Первый тест', progress.test]
    ].filter(function (item) { return item[1]; });
    if (!items.length) {
      summary.innerHTML = '<p class="summary-empty">Заполните предыдущие шаги — здесь появится краткий план.</p>';
      return;
    }
    summary.innerHTML = items.map(function (item) {
      return '<div class="summary-item"><b>' + escapeHtml(item[0]) + '</b><p>' + escapeHtml(item[1]) + '</p></div>';
    }).join('');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, function (character) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[character];
    });
  }

  document.getElementById('resetProgress').addEventListener('click', function () {
    if (!window.confirm('Удалить ответы и начать заново?')) return;
    try { localStorage.removeItem(storageKey); } catch (error) {}
    progress = {};
    fields.forEach(function (field) {
      if (field.type === 'checkbox') field.checked = false;
      else field.value = '';
    });
    location.hash = '#/start';
    renderSummary();
  });

  document.getElementById('copyPlan').addEventListener('click', function () {
    var text = document.getElementById('summary').innerText.trim();
    var status = document.getElementById('copyStatus');
    if (!text || text.indexOf('Заполните предыдущие шаги') === 0) {
      status.textContent = 'Сначала заполните хотя бы один предыдущий шаг.';
      return;
    }
    copyText(text).then(function () {
      status.textContent = 'План скопирован.';
    }).catch(function () {
      status.textContent = 'Не удалось скопировать автоматически — выделите текст вручную.';
    });
  });

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var helper = document.createElement('textarea');
      helper.value = text;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      try {
        if (document.execCommand('copy')) resolve();
        else reject(new Error('copy failed'));
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(helper);
      }
    });
  }

  window.addEventListener('hashchange', showRoute);
  showRoute();
})();
