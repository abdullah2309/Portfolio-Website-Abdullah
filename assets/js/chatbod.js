// Enhanced chatbot functionality (Modified FAQ structure for power/flow)
const faq = [
    { 
        keys: ["hello", "hi", "hey", "assalam", "salam", "start"], 
        ans: "Assalamualaikum! I'm Abdullah's AI Assistant. I am here to provide quick, structured information about his professional background. Please choose an option below or ask me directly. 😊",
        followUp: ["What specific aspect of Abdullah's profile interests you the most?"],
        actions: ["Skills", "Projects", "Experience", "Contact"] // New: Guided actions
    },
    { 
        keys: ["name", "who are you", "your name", "are you an ai"], 
        ans: "I am a custom virtual assistant, designed to serve as the official information gateway for Abdullah's professional portfolio. I process your queries to deliver accurate, pre-verified data.",
        actions: []
    },
    { 
        keys: ["contact", "email", "phone", "number", "reach", "get in touch", "address"], 
        ans: "You can establish contact with Abdullah through the following professional channels:\n\n• **Email:** Abdullah2309a@aptechorangi.com\n• **Phone (Primary):** +92 313 2586938\n• **LinkedIn:** https://www.linkedin.com/in/abdullah-shahid-a61175336/\n• **GitHub:** https://github.com/abdullah2309\n\nHe is currently based in **Karachi, Pakistan**.",
        actions: ["View LinkedIn", "View GitHub"]
    },
    { 
        keys: ["skills", "technologies", "what can you do", "expertise", ".net"], 
        ans: "Abdullah is a proficient Full Stack Developer. His core technical stack includes:\n\n• **Backend Mastery:** C#, .NET / ASP.NET Core (Primary Expertise)\n• **Frontend Proficiency:** HTML5, CSS3, JavaScript, Bootstrap, Angular.js, jQuery\n• **Databases:** Microsoft SQL Server, MySQL, MongoDB\n• **Mobile/Hybrid:** Flutter, Dart\n\nThis expertise allows him to manage complex applications from database schema to deployment.",
        actions: ["Tell me about .NET projects"]
    },
    { 
        keys: ["projects", "portfolio", "work", "show me projects", "developed", "built", "Fix All", "Cara"], 
        ans: "Abdullah's work demonstrates versatility across various domains. Key projects include:\n\n1.  **Fix All** (.NET): A robust service booking platform.\n2.  **Vehicle Insurance Management** (.NET): Comprehensive policy management system.\n3.  **Cara** (.NET): An advanced E-commerce solution.\n4.  **Care** (PHP/Laravel): A systematic caregiving management system.\n\nAll source code and live demos are available in the Projects section and on his GitHub.",
        actions: ["View GitHub", "View Resume"]
    },
    { 
        keys: ["experience", "background", "career", "work experience", "student"], 
        ans: "Abdullah is a Software Engineering student at Aptech with strong practical experience encompassing:\n\n• **Software Development Lifecycle (SDLC):** Application design and structured implementation.\n• **Cloud Integration:** Practical exposure to Azure Services.\n• **Version Control:** Professional use of Git/GitHub in collaborative environments.",
        actions: ["What about his education?"]
    },
    { 
        keys: ["location", "where", "based", "city", "country"], 
        ans: "Abdullah is based in **Karachi, Pakistan**.",
        actions: ["Contact Info"]
    },
    { 
        keys: ["education", "study", "aptech", "college"], 
        ans: "Abdullah is currently enrolled in the Software Engineering program at **Aptech**, focusing on gaining a deep, structured understanding of modern software development principles and industry best practices.",
        actions: ["Tell me about his experience"]
    },
    { 
        keys: ["resume", "cv", "download", "hire", "job"], 
        ans: "To review detailed credentials, please access the official Resume/CV document. Abdullah is actively seeking challenging roles in software development. Look for the 'Download CV' link on the main page.",
        actions: ["View Resume", "Send Email"]
    },
    { 
        keys: ["salary", "internship", "payment", "rate", "cost"], 
        ans: "For specific inquiries about Abdullah's availability and rates, please contact him directly using the contact methods provided. This ensures a transparent and tailored discussion.",
        actions: ["Contact Info"]
    },
    { 
        keys: ["thank", "thanks", "shukriya"], 
        ans: "You are most welcome. My function is to provide structured information efficiently. Is there any other professional inquiry I can address for you? 😊",
        actions: ["Skills", "Projects"]
    },
    { 
        keys: ["bye", "goodbye", "see you", "allah hafiz", "finish"], 
        ans: "Thank you for engaging with the assistant. I am always available for further inquiries. Have a productive day! Allah Hafiz. 👋",
        actions: []
    }
];

// --- DOM Elements ---
// (Note: No changes to IDs or Class names are allowed as per instructions)
const openBtn = document.getElementById("openChat");
const closeBtn = document.getElementById("closeChat");
const minimizeBtn = document.getElementById("minimizeChat");
const chatWin = document.getElementById("chatWindow");
const chatBody = document.getElementById("chatBody");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const typingIndicator = document.getElementById("typingIndicator");
const clearBtn = document.getElementById("clearChat");
const themeBtn = document.getElementById("toggleTheme");
const exportBtn = document.getElementById("exportChat");
const suggestionChips = document.querySelectorAll(".suggestion-chip"); // Existing chips
const notificationBadge = document.getElementById("notificationBadge");

// --- Chat state ---
let isDarkTheme = false;
// Updated history to store actions for re-rendering (Transparency/Improvement)
let chatHistory = []; 
let hasNewMessage = false; 

// --- Utility Functions ---

/** Gets current time for message timestamp (e.g., 10:35 PM) */
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Saves the current chat history to local storage. */
function saveChatHistory() {
    localStorage.setItem('abdullahChatHistory', JSON.stringify(chatHistory));
}

// --- Message Rendering Functions (Improved Professionalism and Power) ---

/**
 * Adds a new message to the chat body and updates history.
 * Adds logic to parse text for bolding (e.g., **word**) and new action buttons.
 * @param {string} text - The message content.
 * @param {string} type - 'user' or 'bot'.
 * @param {Array<string>} [actions=[]] - Optional array of action button texts.
 */
function addMsg(text, type, actions = []) {
    const div = document.createElement("div");
    div.className = "message " + (type === "user" ? "user-msg" : "bot-msg");
    
    // 1. Process text for professional formatting: replace \n with <br>, and **bold** key terms.
    // (Improved transparency/readability)
    const formattedText = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    const messageText = document.createElement("div");
    messageText.innerHTML = formattedText;
    div.appendChild(messageText);
    
    // 2. Add timestamp (Transparency)
    const timestamp = document.createElement("div");
    timestamp.className = "timestamp";
    timestamp.innerText = getCurrentTime();
    div.appendChild(timestamp);
    
    // 3. Add dynamic action buttons (Power/Strength)
    if (type === "bot" && actions && actions.length > 0) {
        const actionContainer = document.createElement("div");
        // Reusing the general suggestion chips class structure for styling consistency
        actionContainer.className = "suggestions bot-actions-dynamic"; 
        
        actions.forEach(action => {
            const btn = document.createElement("button");
            // Reusing .suggestion-chip class for look/feel
            btn.className = "suggestion-chip dynamic-action-btn"; 
            btn.innerText = action;
            // Use an anonymous function to call the action handler
            btn.onclick = () => handleDynamicAction(action); 
            actionContainer.appendChild(btn);
        });
        div.appendChild(actionContainer);
    }
    
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // 4. Save to history (including actions for accurate re-render)
    chatHistory.push({ text, type, time: new Date(), actions });
    saveChatHistory();
    
    // 5. Show notification if chat is closed
    if (chatWin.style.display === "none" && type === "bot") {
        hasNewMessage = true;
        notificationBadge.style.display = 'flex';
    }
}

/** Renders all messages from the chatHistory array. */
function renderChatHistory() {
    // Check and hide the default welcome message if history exists (Professionalism)
    const welcomeMsg = document.querySelector('.welcome-msg');
    if (welcomeMsg) {
        welcomeMsg.style.display = chatHistory.length > 0 ? 'none' : 'block';
    }
    
    chatBody.innerHTML = '';
    
    if (chatHistory.length === 0 && welcomeMsg) {
        chatBody.appendChild(welcomeMsg);
    } else {
        chatHistory.forEach(msg => {
            const div = document.createElement("div");
            div.className = "message " + (msg.type === "user" ? "user-msg" : "bot-msg");
            
            // Re-apply formatting for history
            const formattedText = msg.text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            const messageText = document.createElement("div");
            messageText.innerHTML = formattedText;
            div.appendChild(messageText);
            
            const timestamp = document.createElement("div");
            timestamp.className = "timestamp";
            timestamp.innerText = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            div.appendChild(timestamp);

            // Re-render action buttons from history (Transparency)
            if (msg.type === "bot" && msg.actions && msg.actions.length > 0) {
                const actionContainer = document.createElement("div");
                actionContainer.className = "suggestions bot-actions-dynamic"; 
                msg.actions.forEach(action => {
                    const btn = document.createElement("button");
                    btn.className = "suggestion-chip dynamic-action-btn history-action";
                    btn.innerText = action;
                    // Disable historical buttons for clarity
                    btn.disabled = true; 
                    actionContainer.appendChild(btn);
                });
                div.appendChild(actionContainer);
            }
            
            chatBody.appendChild(div);
        });
    }
    chatBody.scrollTop = chatBody.scrollHeight;
}

// --- Main Logic & Core Functionality (Power/Strength) ---

/** Generates the bot's response and associated actions. */
function getReply(msg) {
    msg = msg.toLowerCase().trim();
    
    for (let item of faq) {
        for (let key of item.keys) {
            if (msg.includes(key)) {
                let response = item.ans;
                let actions = item.actions || [];
                
                // Add follow-up questions for deeper engagement
                if (item.followUp && Math.random() > 0.5) {
                    response += "\n\n" + item.followUp[Math.floor(Math.random() * item.followUp.length)];
                }
                
                return { response, actions };
            }
        }
    }
    
    // Default response for unmatched queries (Helpful & Professional)
    return { 
        response: "I couldn't match your query to a verified knowledge topic. Please try rephrasing, or use one of the action buttons below to ask about a specific area of expertise.",
        actions: ["Skills", "Projects", "Contact"] 
    };
}

/** Handles the submission of a user message. */
function sendMessage() {
    let text = chatInput.value.trim();
    if (!text) return;
    
    // 1. Add User Message
    addMsg(text, "user");
    chatInput.value = "";
    
    // Hide welcome message
    const welcomeMsg = document.querySelector('.welcome-msg');
    if (welcomeMsg) welcomeMsg.style.display = 'none'; 
    
    // 2. Show Typing Indicator
    typingIndicator.style.display = "flex";
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // 3. Simulate AI response time and deliver response
    setTimeout(() => {
        typingIndicator.style.display = "none";
        const { response, actions } = getReply(text);
        addMsg(response, "bot", actions);
    }, 800 + Math.random() * 1200); // Faster response time (800ms to 2000ms)
}

/** Handles clicks on the dynamically generated in-chat action buttons. (Guided Flow) */
function handleDynamicAction(action) {
    // Map action button text to a specific query for the AI to process
    let query;
    switch (action) {
        case "Skills":
            query = "What are your skills?";
            break;
        case "Projects":
        case "Tell me about .NET projects":
            query = "Tell me about your projects";
            break;
        case "Experience":
        case "What about his education?":
            query = "Tell me about your experience";
            break;
        case "Contact":
        case "Contact Info":
        case "Send Email":
            query = "How can I contact you?";
            break;
        case "View Resume":
            query = "Download CV";
            break;
        case "View GitHub":
            window.open("https://github.com/abdullah2309", "_blank");
            addMsg("Redirecting you to Abdullah's GitHub profile.", "bot", ["Projects"]);
            return; 
        case "View LinkedIn":
            window.open("https://www.linkedin.com/in/abdullah-shahid-a61175336/", "_blank");
            addMsg("Redirecting you to Abdullah's LinkedIn profile.", "bot", ["Contact Info"]);
            return; 
        default:
            query = action;
            break;
    }
    
    // Simulate user clicking the button by injecting the corresponding query
    chatInput.value = query;
    sendMessage();
}

// --- Event Handlers & Initialization (Minimal changes) ---

// Initialization logic remains the same, but the calls to renderChatHistory() 
// now use the enhanced function.
document.addEventListener('DOMContentLoaded', function() {
    const savedHistory = localStorage.getItem('abdullahChatHistory');
    if (savedHistory) {
        chatHistory = JSON.parse(savedHistory);
    }
    
    // This call now handles showing the welcome message if history is empty
    renderChatHistory(); 
    
    const savedTheme = localStorage.getItem('abdullahChatTheme');
    if (savedTheme === 'dark') {
        // Run toggleTheme to apply classes/text
        toggleTheme();
    }
    
    // Notification logic
    if (chatHistory.length > 0) {
        hasNewMessage = true;
        // Check if the badge is visible when chat is closed in CSS before this
        notificationBadge.style.display = 'flex'; 
    }
});

// Chat controls logic remains the same.
openBtn.onclick = () => {
    chatWin.style.display = "block";
    setTimeout(() => {
        chatWin.classList.add("active");
    }, 10);
    chatInput.focus();
    
    hasNewMessage = false;
    notificationBadge.style.display = 'none';
};

closeBtn.onclick = () => {
    chatWin.classList.remove("active");
    setTimeout(() => {
        chatWin.style.display = "none";
    }, 300);
};

minimizeBtn.onclick = () => {
    chatWin.classList.remove("active");
    setTimeout(() => {
        chatWin.style.display = "none";
    }, 300);
};

// Send message via button
sendBtn.onclick = sendMessage;

// Enter key to send
chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        e.preventDefault(); 
        sendMessage();
    }
});

// Existing Suggestion chips are now unified to call sendMessage
suggestionChips.forEach(chip => {
    chip.addEventListener("click", () => {
        const msg = chip.getAttribute("data-msg");
        chatInput.value = msg;
        sendMessage();
    });
});

// Clear chat (Improved professionalism in confirmation/reset)
clearBtn.onclick = () => {
    if (confirm("Are you sure you want to clear this entire professional chat session? This action cannot be undone.")) {
        chatHistory = [];
        localStorage.removeItem('abdullahChatHistory');
        
        // Re-create the welcome message element if it was removed
        const welcomeMsg = document.querySelector('.welcome-msg') || document.createElement('div');
        if (!welcomeMsg.classList.contains('welcome-msg')) {
             welcomeMsg.className = 'welcome-msg';
             welcomeMsg.innerHTML = `
                 <h4>Hello! I'm Abdullah's Assistant</h4>
                 <p>I can help you learn more about his skills, projects, and experience</p>
             `;
        }
        
        chatBody.innerHTML = '';
        chatBody.appendChild(welcomeMsg);
        welcomeMsg.style.display = 'block';
    }
};

// Toggle theme logic remains the same.
themeBtn.onclick = () => {
    toggleTheme();
};

function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    
    if (isDarkTheme) {
        chatWin.classList.add("dark");
        themeBtn.innerHTML = '<i class="fas fa-sun"></i> Theme';
        localStorage.setItem('abdullahChatTheme', 'dark');
    } else {
        chatWin.classList.remove("dark");
        themeBtn.innerHTML = '<i class="fas fa-moon"></i> Theme';
        localStorage.setItem('abdullahChatTheme', 'light');
    }
}

// Export chat (Improved professionalism in filename and header)
exportBtn.onclick = () => {
    let chatText = "--- Professional Chat Transcript: Abdullah Assistant ---\n\n";
    chatHistory.forEach(msg => {
        const sender = msg.type === "user" ? "USER" : "ASSISTANT";
        const time = new Date(msg.time).toLocaleString();
        chatText += `[${time}] ${sender}:\n${msg.text.replace(/<br>/g, '\n').replace(/<\/?strong>/g, '')}\n\n`;
    });
    
    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Stronger naming convention for exported file
    a.download = `abdullah-chat-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    // Alert removed for smoother professional feel, but could be reinstated if needed
}; 
 
 
 
 
 
 
 
 
 // // Enhanced chatbot functionality
        // const faq = [
        //     { 
        //         keys: ["hello", "hi", "hey", "assalam", "salam"], 
        //         ans: "Assalamualaikum! I'm Abdullah's AI assistant. How can I help you today? 😊",
        //         followUp: ["What would you like to know about Abdullah?", "Ask me about his skills, projects, or experience!"]
        //     },
        //     { 
        //         keys: ["name", "who are you", "your name"], 
        //         ans: "I'm Abdullah's virtual assistant, designed to help you learn more about his professional background and skills."
        //     },
        //     { 
        //         keys: ["contact", "email", "phone", "number", "reach", "get in touch"], 
        //         ans: "You can contact Abdullah through:\n• Email: Abdullah2309a@aptechorangi.com\n• Phone: +92 313 2586938\n• LinkedIn: https://www.linkedin.com/in/abdullah-shahid-a61175336/\n• GitHub: https://github.com/abdullah2309\nHe's based in Karachi, Pakistan."
        //     },
        //     { 
        //         keys: ["skills", "technologies", "what can you do", "expertise"], 
        //         ans: "Abdullah specializes in Full Stack Development with expertise in:\n\n• Frontend: HTML5, CSS3, JavaScript, Bootstrap, jQuery, Angular.js\n• Backend: .NET, ASP.NET Core, C#, PHP, Laravel\n• Mobile: Flutter, Dart\n• Databases: MySQL, Microsoft SQL Server, MongoDB, Firebase\n• Tools: Git, GitHub, Azure, Azure DevOps, Figma (UI/UX)\n• Other: JSON, REST APIs, Responsive Design\n\nHis strongest skills are in .NET ecosystem development."
        //     },
        //     { 
        //         keys: ["projects", "portfolio", "work", "show me projects"], 
        //         ans: "Abdullah has developed several impressive projects:\n\n• Fix All (.NET) - Service booking platform with admin, labor, and user panels\n• Vehicle Insurance Management (.NET) - Insurance policy management system\n• Cara (.NET) - E-commerce platform\n• Care (PHP) - Caregiving management system\n• Global Wanderers (PHP) - Travel agency platform\n• Jenson Decor - Home decoration e-commerce site\n\nYou can view all projects in the Projects section or on his GitHub."
        //     },
        //     { 
        //         keys: ["experience", "background", "career", "work experience"], 
        //         ans: "Abdullah is a Software Engineering student at Aptech with practical experience in:\n\n• Full Stack Web Development (.NET, Laravel)\n• Mobile App Development (Flutter)\n• Database Design & Management\n• UI/UX Design Principles\n• Version Control (Git/GitHub)\n• Cloud Platforms (Microsoft Azure)\n\nHe's continuously learning and expanding his skill set."
        //     },
        //     { 
        //         keys: ["location", "where", "based", "city", "country"], 
        //         ans: "Abdullah is based in Karachi, Pakistan."
        //     },
        //     { 
        //         keys: ["education", "study", "student", "aptech"], 
        //         ans: "Abdullah is currently pursuing Software Engineering at Aptech, where he's gaining comprehensive knowledge in programming, software development methodologies, and modern technologies."
        //     },
        //     { 
        //         keys: ["resume", "cv", "download", "hire"], 
        //         ans: "You can download Abdullah's resume directly from the portfolio website. Look for the 'Download CV' button on the main page. He's open to internship and job opportunities in software development."
        //     },
        //     { 
        //         keys: ["salary", "internship", "payment", "rate", "cost"], 
        //         ans: "For fresh developers in Pakistan, salaries typically range from 20k to 45k PKR depending on skills and experience. For specific inquiries about Abdullah's availability and rates, please contact him directly."
        //     },
        //     { 
        //         keys: ["thank", "thanks", "shukriya"], 
        //         ans: "You're welcome! 😊 Is there anything else you'd like to know about Abdullah?"
        //     },
        //     { 
        //         keys: ["bye", "goodbye", "see you", "allah hafiz"], 
        //         ans: "Thank you for your interest! Feel free to reach out anytime. Allah Hafiz! 👋"
        //     }
        // ];

        // // DOM Elements
        // const openBtn = document.getElementById("openChat");
        // const closeBtn = document.getElementById("closeChat");
        // const minimizeBtn = document.getElementById("minimizeChat");
        // const chatWin = document.getElementById("chatWindow");
        // const chatBody = document.getElementById("chatBody");
        // const chatInput = document.getElementById("chatInput");
        // const sendBtn = document.getElementById("sendBtn");
        // const typingIndicator = document.getElementById("typingIndicator");
        // const clearBtn = document.getElementById("clearChat");
        // const themeBtn = document.getElementById("toggleTheme");
        // const exportBtn = document.getElementById("exportChat");
        // const suggestionChips = document.querySelectorAll(".suggestion-chip");
        // const notificationBadge = document.getElementById("notificationBadge");

        // // Chat state
        // let isDarkTheme = false;
        // let chatHistory = [];
        // let hasNewMessage = false;

        // // Initialize chat
        // document.addEventListener('DOMContentLoaded', function() {
        //     // Load chat history from localStorage
        //     const savedHistory = localStorage.getItem('abdullahChatHistory');
        //     if (savedHistory) {
        //         chatHistory = JSON.parse(savedHistory);
        //         renderChatHistory();
        //     }
            
        //     // Load theme preference
        //     const savedTheme = localStorage.getItem('abdullahChatTheme');
        //     if (savedTheme === 'dark') {
        //         toggleTheme();
        //     }
            
        //     // Show notification if there are unread messages
        //     if (chatHistory.length > 0) {
        //         hasNewMessage = true;
        //         notificationBadge.style.display = 'flex';
        //     }
        // });

        // // Chat controls
        // openBtn.onclick = () => {
        //     chatWin.style.display = "block";
        //     setTimeout(() => {
        //         chatWin.classList.add("active");
        //     }, 10);
        //     chatInput.focus();
            
        //     // Hide notification when chat is opened
        //     hasNewMessage = false;
        //     notificationBadge.style.display = 'none';
        // };

        // closeBtn.onclick = () => {
        //     chatWin.classList.remove("active");
        //     setTimeout(() => {
        //         chatWin.style.display = "none";
        //     }, 300);
        // };

        // minimizeBtn.onclick = () => {
        //     chatWin.classList.remove("active");
        //     setTimeout(() => {
        //         chatWin.style.display = "none";
        //     }, 300);
        // };

        // // Add message to chat
        // function addMsg(text, type) {
        //     const div = document.createElement("div");
        //     div.className = "message " + (type === "user" ? "user-msg" : "bot-msg");
            
        //     const messageText = document.createElement("div");
        //     messageText.innerText = text;
        //     div.appendChild(messageText);
            
        //     // Add timestamp
        //     const timestamp = document.createElement("div");
        //     timestamp.className = "timestamp";
        //     timestamp.innerText = getCurrentTime();
        //     div.appendChild(timestamp);
            
        //     chatBody.appendChild(div);
        //     chatBody.scrollTop = chatBody.scrollHeight;
            
        //     // Save to history
        //     chatHistory.push({ text, type, time: new Date() });
        //     localStorage.setItem('abdullahChatHistory', JSON.stringify(chatHistory));
            
        //     // Show notification if chat is closed
        //     if (chatWin.style.display === "none" && type === "bot") {
        //         hasNewMessage = true;
        //         notificationBadge.style.display = 'flex';
        //     }
        // }

        // // Get current time for timestamp
        // function getCurrentTime() {
        //     const now = new Date();
        //     return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        // }

        // // Render chat history
        // function renderChatHistory() {
        //     // Skip the welcome message if we have history
        //     const welcomeMsg = document.querySelector('.welcome-msg');
        //     if (welcomeMsg && chatHistory.length > 0) {
        //         welcomeMsg.style.display = 'none';
        //     }
            
        //     chatBody.innerHTML = '';
        //     if (chatHistory.length === 0 && welcomeMsg) {
        //         chatBody.appendChild(welcomeMsg);
        //     } else {
        //         chatHistory.forEach(msg => {
        //             const div = document.createElement("div");
        //             div.className = "message " + (msg.type === "user" ? "user-msg" : "bot-msg");
                    
        //             const messageText = document.createElement("div");
        //             messageText.innerText = msg.text;
        //             div.appendChild(messageText);
                    
        //             const timestamp = document.createElement("div");
        //             timestamp.className = "timestamp";
        //             timestamp.innerText = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        //             div.appendChild(timestamp);
                    
        //             chatBody.appendChild(div);
        //         });
        //     }
        //     chatBody.scrollTop = chatBody.scrollHeight;
        // }

        // // Get AI response
        // function getReply(msg) {
        //     msg = msg.toLowerCase();
            
        //     // Check for exact matches first
        //     for (let item of faq) {
        //         for (let key of item.keys) {
        //             if (msg.includes(key)) {
        //                 // Add follow-up questions if available
        //                 let response = item.ans;
        //                 if (item.followUp && Math.random() > 0.5) {
        //                     response += "\n\n" + item.followUp[Math.floor(Math.random() * item.followUp.length)];
        //                 }
        //                 return response;
        //             }
        //         }
        //     }
            
        //     // If no match, provide a helpful default response
        //     return "I'm not sure I understand. You can ask me about Abdullah's skills, projects, experience, or how to contact him. Try asking something like 'What are your skills?' or 'Tell me about your projects'.";
        // }

        // // Send message
        // sendBtn.onclick = () => {
        //     let text = chatInput.value.trim();
        //     if (!text) return;
            
        //     addMsg(text, "user");
        //     chatInput.value = "";
            
        //     // Hide welcome message after first user message
        //     const welcomeMsg = document.querySelector('.welcome-msg');
        //     if (welcomeMsg) {
        //         welcomeMsg.style.display = 'none';
        //     }
            
        //     // Show typing indicator
        //     typingIndicator.style.display = "flex";
        //     chatBody.scrollTop = chatBody.scrollHeight;
            
        //     // Simulate AI thinking time
        //     setTimeout(() => {
        //         typingIndicator.style.display = "none";
        //         addMsg(getReply(text), "bot");
        //     }, 1000 + Math.random() * 1000);
        // };

        // // Enter key to send
        // chatInput.addEventListener("keydown", e => {
        //     if (e.key === "Enter") sendBtn.click();
        // });

        // // Suggestion chips
        // suggestionChips.forEach(chip => {
        //     chip.addEventListener("click", () => {
        //         const msg = chip.getAttribute("data-msg");
        //         chatInput.value = msg;
        //         sendBtn.click();
        //     });
        // });

        // // Clear chat
        // clearBtn.onclick = () => {
        //     if (confirm("Are you sure you want to clear the chat history?")) {
        //         chatHistory = [];
        //         localStorage.removeItem('abdullahChatHistory');
        //         chatBody.innerHTML = '';
                
        //         // Show welcome message again
        //         const welcomeMsg = document.createElement('div');
        //         welcomeMsg.className = 'welcome-msg';
        //         welcomeMsg.innerHTML = `
        //             <h4>Hello! I'm Abdullah's Assistant</h4>
        //             <p>I can help you learn more about his skills, projects, and experience</p>
        //         `;
        //         chatBody.appendChild(welcomeMsg);
        //     }
        // };

        // // Toggle theme
        // themeBtn.onclick = () => {
        //     toggleTheme();
        // };

        // function toggleTheme() {
        //     isDarkTheme = !isDarkTheme;
            
        //     if (isDarkTheme) {
        //         chatWin.classList.add("dark");
        //         themeBtn.innerHTML = '<i class="fas fa-sun"></i> Theme';
        //         localStorage.setItem('abdullahChatTheme', 'dark');
        //     } else {
        //         chatWin.classList.remove("dark");
        //         themeBtn.innerHTML = '<i class="fas fa-moon"></i> Theme';
        //         localStorage.setItem('abdullahChatTheme', 'light');
        //     }
        // }

        // // Export chat
        // exportBtn.onclick = () => {
        //     let chatText = "Chat with Abdullah Assistant\n\n";
        //     chatHistory.forEach(msg => {
        //         const sender = msg.type === "user" ? "You" : "Assistant";
        //         const time = new Date(msg.time).toLocaleString();
        //         chatText += `${time} - ${sender}:\n${msg.text}\n\n`;
        //     });
            
        //     const blob = new Blob([chatText], { type: "text/plain" });
        //     const url = URL.createObjectURL(blob);
        //     const a = document.createElement("a");
        //     a.href = url;
        //     a.download = "abdullah-chat-history.txt";
        //     document.body.appendChild(a);
        //     a.click();
        //     document.body.removeChild(a);
        //     URL.revokeObjectURL(url);
        // };
    
    
