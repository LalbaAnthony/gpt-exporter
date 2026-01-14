(function () {
    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);

        const url = args[0];
        if (typeof url === 'string' && url.includes('/backend-api/conversation/')) {
            const clonedResponse = response.clone();

            try {
                const data = await clonedResponse.json();
                chrome.runtime.sendMessage({
                    action: 'storeConversation',
                    data: data
                });
            } catch (e) {
                console.error('Error parsing conversation data:', e);
            }
        }

        return response;
    };

    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this._url = url;
        return originalXHROpen.apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function (...args) {
        this.addEventListener('load', function () {
            if (this._url && this._url.includes('/backend-api/conversation/')) {
                try {
                    const data = JSON.parse(this.responseText);
                    chrome.runtime.sendMessage({
                        action: 'storeConversation',
                        data: data
                    });
                } catch (e) {
                    console.error('Error parsing conversation data:', e);
                }
            }
        });
        return originalXHRSend.apply(this, args);
    };
})();