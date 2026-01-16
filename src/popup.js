let conversationData = null;

document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('status');
    const copyBtn = document.getElementById('copyBtn');
    const previewEl = document.getElementById('preview');

    function limitString(str, maxLen = 100) {
        if (!str) return "";
        if (str.length <= maxLen) return str;
        return str.slice(0, maxLen).trim() + " ...";
    }

    chrome.runtime.sendMessage({ action: 'getConversation' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError);
            statusEl.textContent = 'Erreur de communication';
            statusEl.className = 'error';
            return;
        }

        if (response && response.data) {
            conversationData = response.data;
            const markdown = extractMarkdown(conversationData);

            if (markdown) {
                statusEl.textContent = 'Conversation chargée';
                statusEl.className = 'success';
                copyBtn.disabled = false;

                previewEl.textContent = limitString(markdown, 100);
                previewEl.style.display = 'block';
            } else {
                statusEl.textContent = 'Aucune donnée markdown trouvée';
                statusEl.className = 'error';
            }
        } else {
            statusEl.textContent = 'Aucune conversation détectée. Actualisez la page.';
            statusEl.className = 'error';
        }
    });

    copyBtn.addEventListener('click', () => {
        const markdown = extractMarkdown(conversationData);

        navigator.clipboard.writeText(markdown).then(() => {
            statusEl.textContent = 'Markdown copié';
            statusEl.className = 'success';

            setTimeout(() => {
                statusEl.textContent = 'Conversation chargée';
            }, 2000);
        }).catch((err) => {
            console.error('Copy error:', err);
            statusEl.textContent = 'Erreur lors de la copie';
            statusEl.className = 'error';
        });
    });
});

function extractMarkdown(data) {
    if (!data) return '';

    let markdown = '';

    if (data.mapping) {
        const nodes = Object.values(data.mapping).sort((a, b) => {
            return (a.message?.create_time || 0) - (b.message?.create_time || 0);
        });

        for (const node of nodes) {
            if (node.message && node.message.content) {
                const content = node.message.content;
                const role = node.message.author?.role || 'unknown';

                if (content.parts && content.parts.length > 0) {
                    const text = content.parts.join('\n\n');

                    if (role === 'user') {
                        markdown += `## User\n\n${text}\n\n\n\n\n\n`;
                    } else if (role === 'assistant') {
                        markdown += `## Assistant\n\n${text}\n\n\n\n\n\n`;
                    }
                }
            }
        }
    } else if (data.content) {
        markdown = data.content;
    } else {
        markdown = JSON.stringify(data, null, 2);
    }

    return markdown;
}