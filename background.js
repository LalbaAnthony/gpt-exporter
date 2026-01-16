let conversationData = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message in background:', request, sender);

    if (request.action === 'storeConversation') {
        console.log('Storing conversation data from tab:', sender.tab.id);
        console.log(request.data);
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