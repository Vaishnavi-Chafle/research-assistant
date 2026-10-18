
const form = document.getElementById("chat-form");
const input = document.getElementById("message");
const messages = document.getElementById("messages");
const sendButton = document.getElementById("send-button");

const welcome = document.getElementById("welcome");
const newChatButton = document.getElementById("new-chat");
const homeLink = document.getElementById("home-link");
const recentLink = document.getElementById("recent-link");

// Add a message to the chat
function addMessage(text, sender) {
    const div = document.createElement("div");

    div.className = `message ${sender}`;

    if (sender === "bot") {
        // Render Markdown safely for bot responses
        div.innerHTML = DOMPurify.sanitize(
            marked.parse(String(text ?? ""))
        );
    } else {
        // Display user messages as plain text
        div.textContent = text;
    }

    messages.appendChild(div);
    div.scrollIntoView({ behavior: "smooth", block: "end" });

    return div;
}

// Start a new chat
function startNewChat() {
    messages.replaceChildren();
    welcome.style.display = "block";
    input.value = "";
    input.style.height = "auto";
    input.focus();

    homeLink.classList.add("active");
    recentLink.classList.remove("active");
}

newChatButton.addEventListener("click", startNewChat);
homeLink.addEventListener("click", startNewChat);

// Recent chat navigation
recentLink.addEventListener("click", () => {
    recentLink.classList.add("active");
    homeLink.classList.remove("active");

    if (messages.children.length === 0) {
        addMessage("Your current conversation will appear here.", "bot");
    }
});

// Suggested prompt cards
document.querySelectorAll(".suggestion-card").forEach((card) => {
    card.addEventListener("click", () => {
        input.value = card.dataset.prompt;
        input.focus();
        input.dispatchEvent(new Event("input"));
    });
});

// Automatically adjust input height
input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
});

// Enter sends; Shift + Enter creates a new line
input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
    }
});

// Send message to FastAPI
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const question = input.value.trim();

    if (!question || sendButton.disabled) return;

    welcome.style.display = "none";

    addMessage(question, "user");

    input.value = "";
    input.style.height = "auto";
    sendButton.disabled = true;

    const reply = addMessage("Thinking...", "bot");

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: question
            })
        });

        if (!response.ok) {
            throw new Error(
                `Request failed with status ${response.status}`
            );
        }

        const data = await response.json();

        // Render the Gemini response as Markdown
        const botReply =
            typeof data.reply === "string" && data.reply.trim()
                ? data.reply
                : "The assistant returned an empty response.";

        reply.innerHTML = DOMPurify.sanitize(
            marked.parse(botReply)
        );

        reply.scrollIntoView({
            behavior: "smooth",
            block: "end"
        });

    } catch (error) {
        reply.textContent =
            "Sorry, I couldn't get a response. Check the server and try again.";

        reply.classList.add("error");

        console.error("Chat error:", error);

    } finally {
        sendButton.disabled = false;
        input.focus();
    }
});
