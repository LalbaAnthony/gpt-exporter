let conversationData = null;

document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('status');
    const copyBtn = document.getElementById('copyBtn');
    const previewEl = document.getElementById('preview');
    const fingerprintCheckbox = document.getElementById('fingerprintCheckbox');

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
        let markdown = extractMarkdown(conversationData);

        if (markdown && fingerprintCheckbox.checked) {
            markdown = removeGPTFingerprints(markdown);
        }

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

                    if (role === 'assistant') {
                        markdown += `${text}\n\n`;
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

function removeGPTFingerprints(str) {
    // Remove all emojis from the text,
    str = str.replace(/\p{Extended_Pictographic}/gu, '');
    
    // Replace number keycap emojis with their corresponding numbers and a closing parenthesis
    str = str.replace(/([0-9])\uFE0F?\u20E3/g, '$1)');

    // Normalize special characters,
    str = str
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/[«»]/g, '"')
        .replace(/≥/g, '>=')
        .replace(/≤/g, '<=')
        .replace(/—/g, '-')
        .replace(/…/g, '...')
        .replace(/œ/g, 'oe')
        .replace(/→/g, '->');

    // Remove all '---' dashes lines from the text,
    str = str.replace(/^-{3,}$/gm, '');

    // Remove all double spaces from the text,
    // str = str.replace(/\s{2,}/g, ' ');

    // Remove all triple new lines from the text,
    str = str.replace(/\n{3,}/g, '\n\n');

    // Remove all spaces before end of sentence punctuation,
    str = str.replace(/\s+([.!?])/g, '$1');

    str = str.trim();

    return str;
}