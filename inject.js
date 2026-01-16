// inject.js (nouveau fichier)
(function () {
    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
        const verb = typeof args[0] === 'object' ? (args[0]?.method || 'GET') : 'GET';

        // Check if URL is like `https://chatgpt.com/backend-api/conversation/696a2acc-a14c-832e-b8d7-c5ff6cb622ac` where UUID is variable
        const isMainGetFetch = verb === 'GET' && url && url.match(/\/backend-api\/conversation\/[0-9a-fA-F-]+$/);
        
        if (isMainGetFetch) {
            const cloned = response.clone();

            cloned.json().then(data => {
                window.postMessage({
                    type: 'CHATGPT_CONVERSATION',
                    data: data
                }, '*');
            }).catch(err => {
                console.error('Error parsing:', err);
            });
        }

        return response;
    };
})();