// background.js
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

                const sessionToken = getCookieValue(cookies, '__Secure-next-auth.session-token');

                if (!sessionToken) {
                    console.error('Session token not found');
                    return;
                }

                // Reconstruct the request with proper headers
                const response = await fetch(details.url, {
                    method: 'GET',
                    headers: {
                        'accept': '*/*',
                        'authorization': `Bearer ${sessionToken}`,
                        'oai-device-id': getCookieValue(cookies, 'oai-did'),
                        'oai-language': 'en-US',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'sec-ch-ua': "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
                        'sec-ch-ua-arch': "\"x86\"",
                        'sec-ch-ua-bitness': "\"64\"",
                        'sec-ch-ua-full-version': "\"143.0.7499.170\"",
                        'sec-ch-ua-full-version-list': "\"Google Chrome\";v=\"143.0.7499.170\", \"Chromium\";v=\"143.0.7499.170\", \"Not A(Brand\";v=\"24.0.0.0\"",
                        'sec-ch-ua-mobile': "?0",
                        'sec-ch-ua-model': "\"\"",
                        'sec-ch-ua-platform': "\"Windows\"",
                        'sec-ch-ua-platform-version': "\"19.0.0\"",
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
