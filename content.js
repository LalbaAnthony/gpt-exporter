// Inject script file into page
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from injected script
window.addEventListener('message', (event) => {
    if (event.source === window && event.data.type === 'CHATGPT_CONVERSATION') {
        console.log('Received conversation data in content script:', event.data);
        chrome.runtime.sendMessage({
            action: 'storeConversation',
            data: event.data.data
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error:', chrome.runtime.lastError);
            }
        });
    }
});