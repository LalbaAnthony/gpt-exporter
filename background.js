// background.js
let conversationData = {};

console.log('Background script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request.action, 'from tab:', sender.tab?.id);

    if (request.action === 'storeConversation') {
        const tabId = sender.tab.id;
        console.log('Storing conversation for tab:', tabId);
        conversationData[tabId] = request.data;
        console.log('Total stored conversations:', Object.keys(conversationData).length);
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'getConversation') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            console.log('Getting conversation for tab:', tabId);
            console.log('Available tabs with data:', Object.keys(conversationData));

            const data = conversationData[tabId] || null;
            console.log('Returning data:', data ? 'Found' : 'Not found');

            sendResponse({ data: data });
        });
        return true;
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    console.log('Tab removed:', tabId);
    delete conversationData[tabId];
}); 