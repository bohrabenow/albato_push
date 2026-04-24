let lastPollTime = 0;

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.alarms.get('poll');
  if (!existing) {
    // Включаем по умолчанию
    await chrome.storage.local.set({ pollingEnabled: true });
    await startPolling();
  }
});

// Управление поллингом через popup
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.action === 'toggle_polling') {
    const isOn = msg.isOn;
    await chrome.storage.local.set({ pollingEnabled: isOn });

    if (isOn) {
      await startPolling();
      sendResponse({ isOn: true, updated: true, status: '✅ Пуши включёны' });
    } else {
      chrome.alarms.clear('poll');
      sendResponse({ isOn: false, updated: true, status: '🛑 Пуши выключены' });
    }
  } else if (msg.action === 'sync_ui') {
    const { pollingEnabled } = await chrome.storage.local.get('pollingEnabled');
    const isOn = pollingEnabled !== false;
    sendResponse({ isOn });
  }
});

async function startPolling() {
  const { pollingEnabled } = await chrome.storage.local.get('pollingEnabled');
  if (!pollingEnabled) return;

  chrome.alarms.create('poll', { periodInMinutes: 0.2 }); // 30 секунд
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'poll') return;

  const { pollingEnabled } = await chrome.storage.local.get('pollingEnabled');
  if (!pollingEnabled) return;

  const { apiKey } = await chrome.storage.local.get('apiKey');
  if (!apiKey) return;

  try {
    const res = await fetch(`http://45.92.174.2:3000/check?key=${apiKey}`);
    const messages = await res.json();

    messages.forEach((data, i) => {
      chrome.storage.local.get('pushHistory').then(result => {
        const history = result.pushHistory || [];
        history.unshift(data);
        chrome.storage.local.set({ pushHistory: history.slice(0, 20) });

        chrome.notifications.create(`bg_${Date.now()}_${i}`, {
          type: 'basic',
          iconUrl: 'icon.png',
          title: data.title,
          message: data.body?.slice(0, 50),
        });
      });
    });
  } catch (e) {
    console.error('BG error:', e);
  }
});

chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'https://albato.com' });
});
