// inject.js (nouveau fichier)
(function () {
    console.log('Inject script loaded in page context');

    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

        if (url && url.includes('/backend-api/conversation/')) {
            console.log('Conversation fetch intercepted:', url);
            const cloned = response.clone();

            cloned.json().then(data => {
                console.log('Posting conversation data');
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

    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;

    XHR.open = function (method, url) {
        this._url = url;
        return open.apply(this, arguments);
    };

    XHR.send = function () {
        this.addEventListener('load', function () {
            if (this._url && this._url.includes('/backend-api/conversation/')) {
                console.log('Conversation XHR intercepted:', this._url);
                try {
                    const data = JSON.parse(this.responseText);
                    console.log('Posting data from XHR: ', data);
                    window.postMessage({
                        type: 'CHATGPT_CONVERSATION',
                        data: data
                    }, '*');
                } catch (e) {
                    console.error('Error parsing XHR:', e);
                }
            }
        });

        return send.apply(this, arguments);
    };
})();