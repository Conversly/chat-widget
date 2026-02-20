/** Verly Chat Widget Embed v1 */
(function () {
    'use strict';

    // 1. Duplicate load guard
    if (window.__verly_chat_loaded) return;
    window.__verly_chat_loaded = true;

    // Find script tag
    function getLoaderScript() {
        var current = document.currentScript;
        if (current && current.getAttribute('data-chatbot-id')) return current;
        var scripts = document.querySelectorAll('script[data-chatbot-id]');
        return scripts.length > 0 ? scripts[0] : null;
    }

    var scriptEl = getLoaderScript();
    if (!scriptEl) return;

    // Derive base URL strictly from script src — no overrides, no fallbacks
    var WIDGET_BASE_URL = new URL(scriptEl.src).origin;

    // Validate chatbot ID
    var chatbotId = scriptEl.getAttribute('data-chatbot-id');
    if (!chatbotId || !/^[a-z0-9]{10,40}$/i.test(chatbotId)) return;

    // Config
    var config = {
        chatbotId: chatbotId,
        position: scriptEl.getAttribute('data-position') || 'bottom-right',
        primaryColor: scriptEl.getAttribute('data-primary-color') || '#000000'
    };
    Object.freeze(config);

    // --- Rate limiter state ---
    var lastNotifyTime = 0;

    // --- 1. Create Launcher Button ---
    var launcher = document.createElement('button');
    launcher.id = 'verly-chat-launcher';

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
        'z-index: 2147483647',
        'display: flex',
        'align-items: center',
        'justify-content: center',
        'transition: transform 0.2s ease, box-shadow 0.2s ease',
        '-webkit-tap-highlight-color: transparent'
    ].join(';');

    var iconSvg = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="msg-icon" style="position:absolute; top:14px; left:14px; transition: opacity 0.2s, transform 0.2s;"><path d="M21 11.5C21.0039 12.8199 20.6357 14.1147 19.9359 15.2259C19.2361 16.3372 18.2323 17.2199 17.0398 17.7719C15.8473 18.324 14.5152 18.5235 13.1973 18.3475C11.8793 18.1716 10.6288 17.6272 9.59 16.777L4 18L5.385 13.418C4.30396 11.9688 3.86411 10.1504 4.14856 8.31198C4.43301 6.47352 5.42232 4.74316 6.92936 3.44759C8.43641 2.15202 10.3556 1.38137 12.3213 1.28066C14.2869 1.17996 16.1627 1.75619 17.59 2.90101C19.6708 4.56846 20.9332 7.0768 21 9.75V11.5Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var closeSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="close-icon" style="position:absolute; opacity:0; transform: scale(0.5); transition: all 0.2s;"><path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    launcher.innerHTML = iconSvg + closeSvg;

    launcher.onmouseenter = function () { launcher.style.transform = 'scale(1.05)'; };
    launcher.onmouseleave = function () { launcher.style.transform = 'scale(1)'; };

    // --- 2. Create Hidden Container (iframe lazy-loaded on first open) ---
    var container = document.createElement('div');
    container.id = 'verly-chat-container';

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
        'box-shadow: 0 12px 40px rgba(0,0,0,0.15)',
        'z-index: 2147483647',
        'overflow: hidden',
        'opacity: 0',
        'pointer-events: none',
        'transform: scale(0.9) translateY(20px)',
        'transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'background: transparent'
    ].join(';');

    // --- Iframe Smart Loader ---
    var iframeSrc = WIDGET_BASE_URL + '/embed/' + config.chatbotId + '?mode=hybrid';
    if (config.primaryColor) iframeSrc += '&primaryColor=' + encodeURIComponent(config.primaryColor);

    var iframe = null;
    var iframeLoaded = false;
    var iframeLoading = false;

    function loadIframe() {
        if (iframeLoaded || iframeLoading) return;
        iframeLoading = true;

        iframe = document.createElement('iframe');
        iframe.src = iframeSrc;
        iframe.style.cssText = 'width: 100%; height: 100%; border: none; background: transparent;';
        iframe.setAttribute('allow', 'microphone; camera');
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals');

        iframe.onload = function () {
            iframeLoaded = true;
            iframeLoading = false;
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    source: 'verly-widget-host',
                    type: 'widget:url_change',
                    payload: { url: window.location.href }
                }, WIDGET_BASE_URL);
            }
        };

        container.appendChild(iframe);
    }

    // Preload iframe during browser idle time — zero impact on page load
    function smartPreload() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(loadIframe, { timeout: 3000 });
        } else {
            setTimeout(loadIframe, 2000);
        }
    }

    // --- 3. State Management ---
    var isOpen = false;

    function toggleWidget(forceState) {
        if (typeof forceState === 'boolean') {
            isOpen = forceState;
        } else {
            isOpen = !isOpen;
        }

        if (isOpen) {
            // Ensure iframe exists (instant if preloaded, loads now if not)
            loadIframe();

            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
            container.style.transform = 'scale(1) translateY(0)';

            launcher.querySelector('.msg-icon').style.opacity = '0';
            launcher.querySelector('.msg-icon').style.transform = 'rotate(90deg) scale(0.5)';
            launcher.querySelector('.close-icon').style.opacity = '1';
            launcher.querySelector('.close-icon').style.transform = 'rotate(0) scale(1)';

            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    source: 'verly-widget-host',
                    type: 'widget:opened'
                }, WIDGET_BASE_URL);
            }

            var popup = document.getElementById('verly-chat-popups');
            if (popup) popup.remove();
        } else {
            container.style.opacity = '0';
            container.style.pointerEvents = 'none';
            container.style.transform = 'scale(0.9) translateY(20px)';

            launcher.querySelector('.msg-icon').style.opacity = '1';
            launcher.querySelector('.msg-icon').style.transform = 'rotate(0) scale(1)';
            launcher.querySelector('.close-icon').style.opacity = '0';
            launcher.querySelector('.close-icon').style.transform = 'rotate(-90deg) scale(0.5)';

            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    source: 'verly-widget-host',
                    type: 'widget:closed'
                }, WIDGET_BASE_URL);
            }
        }
    }

    launcher.onclick = function () { toggleWidget(); };

    // --- 4. Append to Body & Start Smart Preload ---
    document.body.appendChild(launcher);
    document.body.appendChild(container);
    smartPreload();

    // --- 5. Message Handling (Strict Origin + Source Validation) ---
    window.addEventListener('message', function (event) {
        if (event.origin !== WIDGET_BASE_URL) return;

        var data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.source !== 'verly-widget') return;

        if (data.type === 'widget:close') {
            toggleWidget(false);
        }

        if (data.type === 'widget:open') {
            toggleWidget(true);
        }

        if (data.type === 'widget:notify') {
            var now = Date.now();
            if (now - lastNotifyTime < 3000) return;
            lastNotifyTime = now;

            var payload = data.payload || {};
            var messages = payload.messages || (payload.text ? [payload.text] : []);

            if (!messages.length || isOpen) return;

            // Cap popup count
            var MAX_POPUPS = 3;
            messages = messages.slice(0, MAX_POPUPS);

            var existingContainer = document.getElementById('verly-chat-popups');
            if (existingContainer) existingContainer.remove();

            var popupContainer = document.createElement('div');
            popupContainer.id = 'verly-chat-popups';

            var popupPosition = config.position === 'bottom-left'
                ? 'left: 20px; bottom: 90px; align-items: flex-start;'
                : 'right: 20px; bottom: 90px; align-items: flex-end;';

            popupContainer.style.cssText = [
                'position: fixed',
                popupPosition,
                'display: flex',
                'flex-direction: column',
                'gap: 10px',
                'z-index: 2147483646',
                'pointer-events: none'
            ].join(';');

            document.body.appendChild(popupContainer);

            messages.forEach(function (text, index) {
                var popup = document.createElement('div');

                popup.style.cssText = [
                    'background: white',
                    'padding: 12px 16px',
                    'border-radius: 12px',
                    'box-shadow: 0 4px 20px rgba(0,0,0,0.15)',
                    'font-family: system-ui, -apple-system, sans-serif',
                    'font-size: 14px',
                    'line-height: 1.4',
                    'color: #1f2937',
                    'max-width: 260px',
                    'cursor: pointer',
                    'opacity: 0',
                    'transform: scale(0.9) translateY(10px)',
                    'transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    'display: flex',
                    'align-items: flex-start',
                    'gap: 8px',
                    'pointer-events: auto'
                ].join(';');

                var closeBtn = document.createElement('div');
                closeBtn.innerHTML = '&times;';
                closeBtn.style.cssText = 'color: #9ca3af; font-size: 18px; line-height: 1; cursor: pointer; padding: 0 4px; margin-right: -4px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;';
                closeBtn.onclick = function (e) {
                    e.stopPropagation();
                    popup.style.opacity = '0';
                    popup.style.transform = 'scale(0.9) translateY(10px)';
                    setTimeout(function () { popup.remove(); }, 300);
                };

                var msgText = document.createElement('div');
                msgText.style.cssText = 'flex: 1; overflow: hidden;';
                msgText.textContent = text;

                popup.appendChild(msgText);
                popup.appendChild(closeBtn);

                popup.onclick = function () {
                    toggleWidget(true);
                    popupContainer.remove();
                };

                popupContainer.appendChild(popup);

                setTimeout(function () {
                    requestAnimationFrame(function () {
                        popup.style.opacity = '1';
                        popup.style.transform = 'scale(1) translateY(0)';
                    });
                }, index * 200);
            });
        }

        if (data.type === 'widget:resize') {
            var p = data.payload || {};
            var width = parseInt(p.width, 10);
            var height = parseInt(p.height, 10);
            if (!Number.isFinite(width) || !Number.isFinite(height)) return;
            container.style.width = Math.min(Math.max(width, 300), 500) + 'px';
            container.style.height = Math.min(Math.max(height, 400), 800) + 'px';
        }

        if (data.type === 'widget:ready') {
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    source: 'verly-widget-host',
                    type: 'widget:url_change',
                    payload: { url: window.location.href }
                }, WIDGET_BASE_URL);
            }
        }
    });

    // --- 6. URL Change Detection (no polling) ---
    var lastUrl = window.location.href;

    function checkUrlChange() {
        var currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    source: 'verly-widget-host',
                    type: 'widget:url_change',
                    payload: { url: currentUrl }
                }, WIDGET_BASE_URL);
            }
        }
    }

    var pushState = history.pushState;
    history.pushState = function () {
        pushState.apply(history, arguments);
        checkUrlChange();
    };

    var replaceState = history.replaceState;
    history.replaceState = function () {
        replaceState.apply(history, arguments);
        checkUrlChange();
    };

    window.addEventListener('popstate', checkUrlChange);

})();
