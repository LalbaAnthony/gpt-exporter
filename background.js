let conversationData = {};

chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        // Store headers for potential reuse
        conversationData[`${details.tabId}_headers`] = details.requestHeaders;
    },
    { urls: ["https://chatgpt.com/backend-api/conversation/*"] },
    ["requestHeaders"]
);

chrome.webRequest.onCompleted.addListener(
    async (details) => {
        if (details.url.includes('/backend-api/conversation/')) {
            try {
                // Get cookies for the request
                const cookies = await chrome.cookies.getAll({
                    domain: 'chatgpt.com'
                });

                const sessionToken = cookies.find(c => c.name === '__Secure-next-auth.session-token');

                if (!sessionToken) {
                    console.error('Session token not found');
                    return;
                }

                // Reconstruct the request with proper headers
                const response = await fetch(details.url, {
                    method: 'GET',
                    headers: {
                        'accept': '*/*',
                        'authorization': `Bearer ${sessionToken.value}`,
                        'oai-device-id': getCookieValue(cookies, 'oai-did') || generateDeviceId(),
                        'oai-language': 'en-US',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin'
                    },
                    credentials: 'include',
                    mode: 'cors'
                });

                if (response.ok) {
                    const data = await response.json();
                    conversationData[details.tabId] = data;
                }
            } catch (err) {
                console.error('Fetch error:', err);
            }
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
    delete conversationData[`${tabId}_headers`];
});

function getCookieValue(cookies, name) {
    const cookie = cookies.find(c => c.name === name);
    return cookie ? cookie.value : null;
}

function generateDeviceId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}