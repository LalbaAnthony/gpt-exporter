let conversationData = {};

chrome.webRequest.onCompleted.addListener(
    (details) => {
        if (details.url.includes('/backend-api/conversation/')) {
            fetch(details.url)
                .then(res => res.json())
                .then(data => {
                    conversationData[details.tabId] = data;
                })
                .catch(err => console.error('Fetch error:', err));
        }
    },
    { urls: ["https://chatgpt.com/backend-api/conversation/*"] }
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getConversation') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            sendResponse({ data: conversationData[tabs[0].id] || null });
        });
        return true;
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    delete conversationData[tabId];
});