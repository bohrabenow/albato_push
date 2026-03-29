document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');

  let result = await chrome.storage.local.get(['apiKey', 'pushHistory']);

  // 🔥 ГЕНЕРАЦИЯ КЛЮЧА (если нет)
  if (!result.apiKey) {
    const key = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    result.apiKey = key;
    await chrome.storage.local.set({apiKey: key});
    console.log('Key generated:', key);
  }

  const keyEl = document.getElementById('key');
  const statusEl = document.getElementById('status');
  const historyEl = document.getElementById('history');
  const powerBtn = document.getElementById('power');

  // Заполнить ключ
  if (keyEl) {
    keyEl.value = result.apiKey;
  }

  // История пушей
  const history = result.pushHistory || [];
  if (historyEl) {
    historyEl.innerHTML =
      history
        .map((push, i) => `
      <div class="push">
        <div class="push-title">#${i+1} ${push.title || 'Без заголовка'}</div>
        <div class="push-body">${push.body || 'Без текста'}</div>
      </div>
    `)
        .join('') || '<div class="no-pushes">Пушей пока нет</div>';
  }

  // Статус кол‑ва пушей
  if (statusEl) {
    statusEl.textContent = `✅ ${history.length} пушей`;
    statusEl.style.display = history.length > 0 ? 'block' : 'none';
  }

  // Копировать ключ
  const copyBtn = document.getElementById('copy');
  if (copyBtn && keyEl) {
    copyBtn.onclick = () => {
      const realKey = keyEl.value;
      navigator.clipboard
        .writeText(realKey)
        .then(() => {
          if (statusEl) {
            statusEl.textContent = '📋 Скопировано!';
            statusEl.style.display = 'block';
          }
        })
        .catch(() => {
          // Fallback для старых Chrome
          keyEl.select();
          keyEl.setSelectionRange(0, 9999);
          document.execCommand('copy');
          if (statusEl) {
            statusEl.textContent = '📋 Скопировано!';
            statusEl.style.display = 'block';
          }
        });
    };
  }

  // Показать/скрыть ключ
  const toggleBtn = document.getElementById('toggle');
  let isVisible = false;
  if (toggleBtn && keyEl) {
    toggleBtn.onclick = () => {
      isVisible = !isVisible;
      keyEl.type = isVisible ? 'text' : 'password';
      toggleBtn.textContent = isVisible ? '🙈' : '👁️';
    };
  }

  // Кнопка "Открыть в Albato" (переход в новой вкладке)
  const openBtn = document.getElementById('open');
  if (openBtn) {
    openBtn.onclick = () => {
      chrome.tabs.create({ url: 'https://albato.com' }); // поменяй URL при необходимости
    };
  }

  // 🔌 КНОПКА POWER — управление поллингом
  // По умолчанию включён (если не задано иначе)
  const data = await chrome.storage.local.get(['pollingEnabled']);
  const isPollingEnabled = data.pollingEnabled !== false;

  if (powerBtn) {
    // Изначальный стиль кнопки
    powerBtn.innerHTML = isPollingEnabled ? '📺' : '📴';
    powerBtn.title = isPollingEnabled ? 'Выключить пуш‑сервис' : 'Включить пуш‑сервис';

    powerBtn.onclick = async () => {
      // Сначала переключим флажок в storage
      const current = await chrome.storage.local.get('pollingEnabled');
      const isCurrentlyOn = current.pollingEnabled !== false;
      const turnOn = !isCurrentlyOn;

      await chrome.storage.local.set({ pollingEnabled: turnOn });

      // Отправить команду в background
      const response = await chrome.runtime.sendMessage({
        action: 'toggle_polling',
        isOn: turnOn,
      });

      if (response) {
        if (response.isOn) {
          powerBtn.innerHTML = '📺';
          powerBtn.title = 'Выключить пуш‑сервис';
        } else {
          powerBtn.innerHTML = '📴';
          powerBtn.title = 'Включить пуш‑сервис';
        }

        if (statusEl && response.status) {
          statusEl.textContent = response.status;
          statusEl.style.display = 'block';
        }
      }
    };
  }
});
