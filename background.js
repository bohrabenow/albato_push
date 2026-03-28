// TOP-LEVEL listener (MV3 обязательно!)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('🔄 Polling:', new Date().toLocaleTimeString());
  
  if (alarm.name === 'poll') {
    const {apiKey} = await chrome.storage.local.get('apiKey');
    if (!apiKey) return;
    
    try {
      const response = await fetch(`http://37.233.83.81:3000/check?key=${apiKey}`);
      const data = await response.json();
      
      if (data.title) {
        chrome.notifications.create('', {
          type: 'basic',
          iconUrl: 'icon.png',
          title: data.title,
          message: data.body
        });
        console.log('🔔 PUSH OK!');
      }
    } catch(e) {
      console.log('Network error:', e.message);
    }
  }
});

// Запуск при установке
chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 Extension started');
  chrome.alarms.create('poll', {periodInMinutes: 1/3}); // МИНИМУМ 1 минута!
});