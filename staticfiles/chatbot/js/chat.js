document.addEventListener("DOMContentLoaded", function() {
    const chatForm = document.getElementById("chatForm");
    const chatMessages = document.getElementById("chatMessages");
    const userMessageInput = document.getElementById("userMessage");
    const typingIndicator = document.getElementById("typingIndicator");
    const sessionIdInput = document.getElementById("sessionId");

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
        let h = md;
        h = h.replace(/```(\w*)\n([\s\S]*?)```/g, function(m, lang, code) {
            var safe = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            return "<pre><code class=\"language-" + lang + "\">" + safe + "</code></pre>";
        });
        h = h.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        h = h.replace(/^\s*-\s+(.*?)$/gm, "<li>$1</li>");
        h = h.replace(/(<li>.*?<\/li>)/gs, "<ul>$1</ul>");
        h = h.replace(/^\s*\d+\.\s+(.*?)$/gm, "<li>$1</li>");
        h = h.replace(/\n/g, "<br>");
        return h;
    }

    function addMessage(text, isUser) {
        var div = document.createElement("div");
        div.className = "message " + (isUser ? "user-message" : "bot-message");
        if (isUser) {
            div.textContent = text;
        } else {
            div.innerHTML = markdownToHtml(text);
        }
        var ts = document.createElement("div");
        ts.className = "timestamp";
        var now = new Date();
        ts.textContent = now.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
        div.appendChild(ts);
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function typeText(text, container, speed) {
        speed = speed || 30;
        var i = 0;
        function typeChar() {
            if (i <= text.length) {
                container.innerHTML = markdownToHtml(text.substring(0, i));
                i++;
                chatMessages.scrollTop = chatMessages.scrollHeight;
                setTimeout(typeChar, speed);
            } else {
                var ts = document.createElement("div");
                ts.className = "timestamp";
                var now = new Date();
                ts.textContent = now.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
                container.appendChild(ts);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }
        typeChar();
    }

    function addCopyButtons() {
        document.querySelectorAll("pre code").forEach(function(block) {
            if (block.parentElement.querySelector(".copy-btn")) return;
            var btn = document.createElement("button");
            btn.textContent = "Copy";
            btn.className = "copy-btn";
            btn.onclick = function() {
                navigator.clipboard.writeText(block.textContent);
                btn.textContent = "Copied!";
                setTimeout(function() { btn.textContent = "Copy"; }, 1500);
            };
            block.parentElement.style.position = "relative";
            block.parentElement.appendChild(btn);
        });
    }

    chatForm.addEventListener("submit", function(e) {
        e.preventDefault();
        var msg = userMessageInput.value.trim();
        if (!msg) return;
        addMessage(msg, true);
        userMessageInput.value = "";
        typingIndicator.style.display = "block";
        chatMessages.scrollTop = chatMessages.scrollHeight;
        var formData = new FormData();
        formData.append("user_message", msg);
        formData.append("session_id", sessionIdInput.value || "");
        formData.append("csrfmiddlewaretoken", getCookie("csrftoken"));
        fetch("/chat/ajax", {
            method: "POST",
            body: formData,
            headers: {"X-Requested-With": "XMLHttpRequest"}
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            typingIndicator.style.display = "none";
            if (data.session_id) {
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
            var botDiv = document.createElement("div");
            botDiv.className = "message bot-message";
            chatMessages.appendChild(botDiv);
            typeText(data.bot_response, botDiv);
            setTimeout(addCopyButtons, 500);
            hljs.highlightAll();
        })
        .catch(function(err) {
            typingIndicator.style.display = "none";
            addMessage("Error: " + err.message);
        });
    });

    setTimeout(function() {
        var initial = document.getElementById("initialMessage");
        if (initial) {
            var ts = document.createElement("div");
            ts.className = "timestamp";
            var now = new Date();
            ts.textContent = now.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
            initial.appendChild(ts);
        }
        addCopyButtons();
    }, 300);

    document.querySelectorAll(".session-rename").forEach(function(btn) {
        btn.addEventListener("click", function(e) {
            e.preventDefault();
            var sid = this.dataset.sessionId;
            var titleEl = this.closest(".session-item").querySelector(".session-title");
            var current = titleEl ? titleEl.textContent : "";
            var newTitle = prompt("Rename session:", current);
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
});
