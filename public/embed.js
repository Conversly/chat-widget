/**
 * Chat Widget Loader Script (Hybrid Architecture)
 * 
 * Architecture:
 * 1. Native Launcher Button (Direct DOM) - Zero click blocking
 * 2. Chat Window Iframe (Lazy/Hidden) - Heavy lift
 * 
 * Usage:
 * <script 
 *   src="https://widget.yourapp.com/embed.js" 
 *   data-chatbot-id="YOUR_CHATBOT_ID"
 * ></script>
 */

(function () {
    'use strict';

    // console.log('[ChatWidget] Initializing (Hybrid Architecture)...');

    // Configuration
    // Find script and config
    function getLoaderScript() {
        var current = document.currentScript;
        if (current && current.getAttribute('data-chatbot-id')) return current;
        var scripts = document.querySelectorAll('script[data-chatbot-id]');
        return scripts.length > 0 ? scripts[0] : null;
    }

    var scriptEl = getLoaderScript();
    var WIDGET_BASE_URL = window.CHAT_WIDGET_BASE_URL || (scriptEl ? new URL(scriptEl.src).origin : 'http://localhost:3000');
    if (!scriptEl) {
        console.error('[ChatWidget] No script with data-chatbot-id found');
        return;
    }

    var config = {
        chatbotId: scriptEl.getAttribute('data-chatbot-id'),
        position: scriptEl.getAttribute('data-position') || 'bottom-right',
        primaryColor: scriptEl.getAttribute('data-primary-color') || '#000000',
        testing: scriptEl.getAttribute('data-testing') === 'true'
    };

    // --- 1. Create Native Launcher Button ---
    var launcher = document.createElement('button');
    launcher.id = 'verly-chat-launcher';

    // Base Styles
    var positionStyles = config.position === 'bottom-left'
        ? 'left: 20px; bottom: 20px;'
        : 'right: 20px; bottom: 20px;';

    launcher.style.cssText = [
        'position: fixed',
        positionStyles,
        'width: 60px',
        'height: 60px',
        'border-radius: 50%',
        'background-color: ' + config.primaryColor,
        'box-shadow: 0 4px 12px rgba(0,0,0,0.15)',
        'border: none',
        'cursor: pointer',
        'z-index: 2147483647', // Max z-index
        'display: flex',
        'align-items: center',
        'justify-content: center',
        'transition: transform 0.2s ease, box-shadow 0.2s ease',
        '-webkit-tap-highlight-color: transparent',
    ].join(';');

    // Icons (Message & Close)
    var iconSvg = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="msg-icon" transition="opacity 0.2s" style="position:absolute; top:14px; left:14px;"><path d="M21 11.5C21.0039 12.8199 20.6357 14.1147 19.9359 15.2259C19.2361 16.3372 18.2323 17.2199 17.0398 17.7719C15.8473 18.324 14.5152 18.5235 13.1973 18.3475C11.8793 18.1716 10.6288 17.6272 9.59 16.777L4 18L5.385 13.418C4.30396 11.9688 3.86411 10.1504 4.14856 8.31198C4.43301 6.47352 5.42232 4.74316 6.92936 3.44759C8.43641 2.15202 10.3556 1.38137 12.3213 1.28066C14.2869 1.17996 16.1627 1.75619 17.59 2.90101C19.6708 4.56846 20.9332 7.0768 21 9.75V11.5Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var closeSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="close-icon" style="position:absolute; opacity:0; transform: scale(0.5); transition: all 0.2s;"><path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    launcher.innerHTML = iconSvg + closeSvg;

    // Hover effect
    launcher.onmouseenter = function () { launcher.style.transform = 'scale(1.05)'; };
    launcher.onmouseleave = function () { launcher.style.transform = 'scale(1)'; };

    // --- 2. Create Hidden Iframe Container ---
    var container = document.createElement('div');
    container.id = 'verly-chat-container';

    // Container Styles (Hidden by default)
    var containerPosition = config.position === 'bottom-left'
        ? 'left: 20px; bottom: 100px; transform-origin: bottom left;'
        : 'right: 20px; bottom: 100px; transform-origin: bottom right;';

    container.style.cssText = [
        'position: fixed',
        containerPosition,
        'width: 400px',
        'height: 700px',
        'max-width: calc(100vw - 40px)',
        'max-height: calc(100vh - 120px)',
        'border-radius: 20px',
        'box-shadow: 0 12px 40px rgba(0,0,0,0.15)', // Shadow is now ON THE CONTAINER, not the iframe
        'z-index: 2147483647',
        'overflow: hidden',
        'opacity: 0',
        'pointer-events: none',
        'transform: scale(0.9) translateY(20px)',
        'transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'background: transparent' // Let iframe handle background or transparent
    ].join(';');

    // Iframe URL
    var iframeSrc = WIDGET_BASE_URL + '/embed/' + config.chatbotId + '?mode=hybrid';
    if (config.primaryColor) iframeSrc += '&primaryColor=' + encodeURIComponent(config.primaryColor);
    if (config.testing) iframeSrc += '&testing=true';

    var iframe = document.createElement('iframe');
    iframe.src = iframeSrc;
    iframe.style.cssText = 'width: 100%; height: 100%; border: none; background: transparent;';
    iframe.setAttribute('allow', 'microphone; camera');

    container.appendChild(iframe);

    // --- 3. State Management ---
    var isOpen = false;

    function toggleWidget(forceState) {
        if (typeof forceState === 'boolean') {
            isOpen = forceState;
        } else {
            isOpen = !isOpen;
        }

        if (isOpen) {
            // Open
            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
            container.style.transform = 'scale(1) translateY(0)';

            // Icon transition
            launcher.querySelector('.msg-icon').style.opacity = '0';
            launcher.querySelector('.msg-icon').style.transform = 'rotate(90deg) scale(0.5)';
            launcher.querySelector('.close-icon').style.opacity = '1';
            launcher.querySelector('.close-icon').style.transform = 'rotate(0) scale(1)';

            // Inform iframe
            iframe.contentWindow.postMessage({ type: 'widget:opened' }, '*');
        } else {
            // Close
            container.style.opacity = '0';
            container.style.pointerEvents = 'none';
            container.style.transform = 'scale(0.9) translateY(20px)';

            // Icon transition
            launcher.querySelector('.msg-icon').style.opacity = '1';
            launcher.querySelector('.msg-icon').style.transform = 'rotate(0) scale(1)';
            launcher.querySelector('.close-icon').style.opacity = '0';
            launcher.querySelector('.close-icon').style.transform = 'rotate(-90deg) scale(0.5)';
        }
    }

    // Click Handler
    launcher.onclick = function () { toggleWidget(); };

    // --- 4. Append to Body ---
    document.body.appendChild(launcher);
    document.body.appendChild(container);

    // --- 5. Message Handling ---
    window.addEventListener('message', function (event) {
        // Security check omitted for brevity in demo, but usually: if (event.origin !== WIDGET_BASE_URL) return;

        var data = event.data;
        if (!data) return;

        if (data.type === 'widget:close') {
            toggleWidget(false);
        }

        if (data.type === 'widget:resize') {
            var payload = data.payload || {};
            if (payload.width) container.style.width = payload.width;
            if (payload.height) container.style.height = payload.height;
            if (payload.maxWidth) container.style.maxWidth = payload.maxWidth;
            if (payload.maxHeight) container.style.maxHeight = payload.maxHeight;
        }
    });

    // console.log('[ChatWidget] Hybrid setup complete.');

})();
