document.addEventListener("DOMContentLoaded", () => {
    const messageList = document.getElementById("messageList");
    const sendBtn = document.getElementById("sendBtn");
    const contentInput = document.getElementById("content");
    const status = document.getElementById("status");
    const displayUsername = document.getElementById("displayUsername");
    const changeNameBtn = document.getElementById("changeNameBtn");
    const usernameModal = document.getElementById("usernameModal");
    const modalUsername = document.getElementById("modalUsername");
    const modalSave = document.getElementById("modalSave");
    const refreshBtn = document.getElementById("refreshBtn");
    const searchInput = document.getElementById("search");
    const filterUser = document.getElementById("filterUser");
    const messageTpl = document.getElementById("messageItemTpl");

    let username = localStorage.getItem("username") || "";

    function showModal() {
        usernameModal.style.display = "flex";
        modalUsername.value = username;
    }

    function hideModal() {
        usernameModal.style.display = "none";
    }

    function updateUsername(name) {
        username = name.trim();
        localStorage.setItem("username", username);
        displayUsername.textContent = username || "(not set)";
    }

    function renderMessages(messages, selectedUser = "") {
        messageList.innerHTML = "";
        const users = new Set();
        messages.forEach(msg => {
            users.add(msg.username);
            if (
                (filterUser.value === "" || msg.username === filterUser.value) &&
                (searchInput.value === "" || msg.content.toLowerCase().includes(searchInput.value.toLowerCase()))
            ) {
                const clone = messageTpl.content.cloneNode(true);
                clone.querySelector(".user").textContent = msg.username;
                clone.querySelector(".time").textContent = msg.created_at;
                clone.querySelector(".text").textContent = msg.content;
                clone.querySelector(".delete").addEventListener("click", () => deleteMessage(msg.id, msg.username));
                messageList.appendChild(clone);
            }
        });
        // Preserve current selection before resetting dropdown
        const currentSelection = filterUser.value;


        // Update filter dropdown
        filterUser.innerHTML = "";
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "All users";
        filterUser.appendChild(defaultOption);

        [...users].sort().forEach(user => {
            const opt = document.createElement("option");
            opt.value = user;
            opt.textContent = user;
            if (users === selectedUser || user === currentSelection) {
                opt.selected = true; // Highlight the selected user
            }
            filterUser.appendChild(opt);
        });
    }

    async function fetchMessages() {
        try {
            const res = await fetch("/api/messages", {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            if (data.ok) {
                renderMessages(data.messages);
            } else {
                status.textContent = "Failed to load messages.";
            }
        } catch (err) {
            status.textContent = "Error fetching messages.";
            console.error(err);
        }
    }

    async function sendMessage() {
        const content = contentInput.value.trim();
        if (!username || !content) {
            status.textContent = "Name and message required.";
            return;
        }

        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, content })
            });
            const data = await res.json();
            if (data.ok) {
                contentInput.value = "";
                status.textContent = "Message sent!";
                fetchMessages();
            } else {
                status.textContent = data.error || "Failed to send.";
            }
            setTimeout(() => {
                status.textContent = "";
            }, 5000);
        } catch (err) {
            status.textContent = "Error sending message.";
            console.error(err);
        }
    }

    async function deleteMessage(id, username) {
        if (!id || !username) {
            alert("Missing message ID or username.");
            return;
        }


        try {
            const res = await fetch("/api/messages", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id, username })
            });

            const data = await res.json();

            if (data.ok) {
                fetchMessages(); // Refresh the list
            } else {
                alert("Failed to delete message: " + data.error);
            }
        } catch (err) {
            console.error("Error deleting message:", err);
            alert("Error deleting message.");
        }
    }

    // Event bindings
    sendBtn.addEventListener("click", sendMessage);
    changeNameBtn.addEventListener("click", showModal);
    modalSave.addEventListener("click", () => {
        updateUsername(modalUsername.value);
        hideModal();
    });
    refreshBtn.addEventListener("click", fetchMessages);
    searchInput.addEventListener("input", fetchMessages);
    filterUser.addEventListener("change", fetchMessages);

    // Init
    if (!username) showModal();
    else updateUsername(username);
    fetchMessages();
});