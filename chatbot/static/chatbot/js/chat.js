document.addEventListener("DOMContentLoaded", function() {
    const chatForm = document.getElementById("chatForm");
    const chatMessages = document.getElementById("chatMessages");
    const userMessageInput = document.getElementById("userMessage");
    const typingIndicator = document.getElementById("typingIndicator");
    const sessionIdInput = document.getElementById("sessionId");
    const sendBtn = document.getElementById("sendBtn");
    const welcomeScreen = document.getElementById("welcomeScreen");
    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function markdownToHtml(md) {
        if (!md) return "";
        var h = md;
        h = h.replace(/```(\w*)\n([\s\S]*?)```/g, function(m, lang, code) {
            var safe = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            var langLabel = lang ? '<div class="code-lang">' + lang + '</div>' : '';
            return '<pre>' + langLabel + '<code class="language-' + lang + '">' + safe + '</code></pre>';
        });
        h = h.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        h = h.replace(/^\s*-\s+(.*?)$/gm, "<li>$1</li>");
        h = h.replace(/(<li>.*?<\/li>)/gs, "<ul>$1</ul>");
        h = h.replace(/^\s*\d+\.\s+(.*?)$/gm, "<li>$1</li>");
        h = h.replace(/\n/g, "<br>");
        return h;
    }

    function addMessage(text, isUser) {
        if (welcomeScreen) welcomeScreen.style.display = "none";
        var wrapper = document.createElement("div");
        wrapper.className = "message " + (isUser ? "user-message" : "bot-message");
        var avatar = document.createElement("div");
        avatar.className = "message-avatar " + (isUser ? "user" : "bot");
        avatar.innerHTML = isUser ? "U" : '<i class="fas fa-bolt"></i>';
        wrapper.appendChild(avatar);
        var content = document.createElement("div");
        content.className = "message-content";
        var header = document.createElement("div");
        header.className = "message-header";
        var sender = document.createElement("span");
        sender.className = "message-sender";
        sender.textContent = isUser ? "You" : "Conversio";
        header.appendChild(sender);
        var ts = document.createElement("span");
        ts.className = "message-time";
        var now = new Date();
        ts.textContent = now.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
        header.appendChild(ts);
        content.appendChild(header);
        var textDiv = document.createElement("div");
        textDiv.className = "message-text";
        if (isUser) {
            textDiv.textContent = text;
        } else {
            textDiv.innerHTML = markdownToHtml(text);
        }
        content.appendChild(textDiv);
        wrapper.appendChild(content);
        chatMessages.appendChild(wrapper);
        chatMessages.parentElement.scrollTop = chatMessages.parentElement.scrollHeight;
        return wrapper;
    }

    function typeText(text, container, speed) {
        speed = speed || 30;
        var i = 0;
        function typeChar() {
            if (i <= text.length) {
                container.innerHTML = markdownToHtml(text.substring(0, i));
                i++;
                var wrap = document.getElementById("chatMessagesWrap");
                if (wrap) wrap.scrollTop = wrap.scrollHeight;
                setTimeout(typeChar, speed);
            } else {
                var ts = document.createElement("div");
                ts.className = "message-time";
                var now = new Date();
                ts.textContent = now.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
                var header = container.closest(".message-content")?.querySelector(".message-header");
                if (header) header.appendChild(ts);
                var wrap = document.getElementById("chatMessagesWrap");
                if (wrap) wrap.scrollTop = wrap.scrollHeight;
                addCopyButtonsToCode();
            }
        }
        typeChar();
    }

    function addCopyButtonsToCode() {
        document.querySelectorAll(".message-text pre code").forEach(function(block) {
            var pre = block.parentElement;
            if (pre.querySelector(".copy-btn")) return;
            var btn = document.createElement("button");
            btn.className = "copy-btn";
            btn.textContent = "Copy";
            btn.onclick = function() {
                navigator.clipboard.writeText(block.textContent);
                btn.textContent = "Copied!";
                setTimeout(function() { btn.textContent = "Copy"; }, 1500);
            };
            pre.appendChild(btn);
        });
    }

    function autoResize() {
        userMessageInput.style.height = "auto";
        userMessageInput.style.height = Math.min(userMessageInput.scrollHeight, 160) + "px";
        if (sendBtn) {
            sendBtn.disabled = !userMessageInput.value.trim();
        }
    }

    userMessageInput.addEventListener("input", autoResize);
    userMessageInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event("submit"));
        }
    });

    document.querySelectorAll(".suggestion-card").forEach(function(card) {
        card.addEventListener("click", function() {
            var prompt = this.dataset.prompt;
            if (prompt) {
                userMessageInput.value = prompt;
                autoResize();
                chatForm.dispatchEvent(new Event("submit"));
            }
        });
    });

    chatForm.addEventListener("submit", function(e) {
        e.preventDefault();
        var msg = userMessageInput.value.trim();
        if (!msg) return;
        addMessage(msg, true);
        userMessageInput.value = "";
        autoResize();
        if (typingIndicator) typingIndicator.style.display = "flex";
        var wrap = document.getElementById("chatMessagesWrap");
        if (wrap) wrap.scrollTop = wrap.scrollHeight;
        var formData = new FormData();
        formData.append("user_message", msg);
        formData.append("session_id", sessionIdInput ? sessionIdInput.value || "" : "");
        formData.append("csrfmiddlewaretoken", getCookie("csrftoken"));
        fetch("/chat/ajax", {
            method: "POST",
            body: formData,
            headers: {"X-Requested-With": "XMLHttpRequest"}
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (typingIndicator) typingIndicator.style.display = "none";
            if (data.session_id && sessionIdInput) {
                sessionIdInput.value = data.session_id;
                if (window.history.replaceState) {
                    var url = new URL(window.location);
                    url.searchParams.set("session", data.session_id);
                    window.history.replaceState({}, "", url);
                }
                var activeItem = document.querySelector(".session-item.active");
                if (!activeItem) {
                    location.reload();
                } else if (data.session_title) {
                    var titleEl = activeItem.querySelector(".session-title");
                    if (titleEl) titleEl.textContent = data.session_title;
                }
            }
            var botMsg = addMessage(data.bot_response, false);
            if (botMsg) {
                var textDiv = botMsg.querySelector(".message-text");
                if (textDiv) typeText(data.bot_response, textDiv);
            }
            setTimeout(function() { hljs.highlightAll(); }, 100);
        })
        .catch(function(err) {
            if (typingIndicator) typingIndicator.style.display = "none";
            addMessage("Error: " + err.message);
        });
    });

    document.querySelectorAll(".session-rename").forEach(function(btn) {
        btn.addEventListener("click", function(e) {
            e.preventDefault();
            var sid = this.dataset.sessionId;
            var titleEl = this.closest(".session-item").querySelector(".session-title");
            var current = titleEl ? titleEl.textContent : "";
            var newTitle = prompt("Rename conversation:", current);
            if (newTitle && newTitle.trim()) {
                var fd = new FormData();
                fd.append("title", newTitle.trim());
                fd.append("csrfmiddlewaretoken", getCookie("csrftoken"));
                fetch("/session/rename/" + sid + "/", {
                    method: "POST",
                    body: fd,
                    headers: {"X-Requested-With": "XMLHttpRequest"}
                }).then(function() {
                    if (titleEl) titleEl.textContent = newTitle.trim();
                });
            }
        });
    });

    if (menuBtn && sidebar && sidebarOverlay) {
        menuBtn.addEventListener("click", function() {
            sidebar.classList.toggle("open");
            sidebarOverlay.classList.toggle("open");
        });
        sidebarOverlay.addEventListener("click", function() {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.remove("open");
        });
    }

    document.querySelectorAll(".msg-copy-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
            var text = this.closest(".message-content")?.querySelector(".message-text")?.textContent;
            if (text) {
                navigator.clipboard.writeText(text);
                var orig = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(function() { this.innerHTML = orig; }.bind(this), 1500);
            }
        });
    });

    var sidebarSearch = document.getElementById("sidebarSearch");
    if (sidebarSearch) {
        sidebarSearch.addEventListener("input", function() {
            var q = this.value.toLowerCase();
            document.querySelectorAll(".session-item").forEach(function(item) {
                var title = item.querySelector(".session-title");
                if (title) {
                    item.style.display = title.textContent.toLowerCase().includes(q) ? "flex" : "none";
                }
            });
        });
    }

    autoResize();
    setTimeout(function() {
        addCopyButtonsToCode();
        hljs.highlightAll();
    }, 500);
});
