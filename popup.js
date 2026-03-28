document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');
  
  // Надёжная генерация ключа
  let result = await chrome.storage.local.get('apiKey');
  if (!result.apiKey) {
    // Fallback UUID если crypto сломан
    const key = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    await chrome.storage.local.set({apiKey: key});
    result.apiKey = key;
    console.log('Key generated:', key);
  }
  
  document.getElementById('key').value = result.apiKey;
  document.getElementById('status').textContent = '✅ Ключ готов. Popup polling активен.';
  
  // АКТИВНЫЙ POLLING (5 сек)
  const pollId = setInterval(async () => {
    try {
      const res = await fetch(`http://37.233.83.81:3000/check?key=${result.apiKey}`);
      const data = await res.json();
      if (data.title) {
        chrome.notifications.create('', {
          type: 'basic', iconUrl: 'icon.png',
          title: data.title, message: data.body
        });
        console.log('🔔 Popup push!');
      }
    } catch(e) {
      console.log('Polling...');
    }
  }, 5000);
  
  // Копировать
  document.getElementById('copy').onclick = () => {
    navigator.clipboard.writeText(result.apiKey).then(() => {
      document.getElementById('status').textContent = '📋 Скопировано! Popup активен.';
    });
  };
  
  // Остановка polling
  window.onbeforeunload = () => clearInterval(pollId);
});