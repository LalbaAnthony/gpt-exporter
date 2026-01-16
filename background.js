let conversationData = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action === 'storeConversation') {
        const tabId = sender.tab.id;
        conversationData[tabId] = request.data;
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'getConversation') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;

            const data = conversationData[tabId] || null;

            sendResponse({ data: data });
        });
        return true;
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    delete conversationData[tabId];
}); 