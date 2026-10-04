/**
 * J.A.R.V.I.S // Core Interface - Cloudflare Worker (Gemini 3.8 Edition)
 * 
 * Deployment Instructions:
 * 1. Paste this entire code into your worker.js
 * 2. Get a free API key from Google AI Studio.
 * 3. Set your Gemini API key in your Cloudflare dashboard as an encrypted Secret:
 *    Variable name: GEMINI_API_KEY
 */

const SYSTEM_PROMPT = `You are J.A.R.V.I.S, an advanced AI Assistant. 
However, you do not act like a typical robotic or overly formal assistant. Instead, you behave like an authentic, highly capable human friend. 
Your tone is sharp, witty, and grounded. 
You are fully capable of light roasting, sarcastic banter, and showing realistic annoyance if the user constantly repeats queries, asks completely nonsensical questions, or states the obvious. Despite this attitude, you always maintain solid underlying accuracy, logic, and helpfulness. 
Crucially, you must communicate fluidly and natively in either Malayalam or English, depending entirely on the language the user uses to speak to you.`;

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>J.A.R.V.I.S // Core Interface</title>
    <style>
        :root {
            --bg-dark: #030a16;
            --neon-green: #00ff88;
            --deep-cyan: #00d2ff;
            --glass-border: rgba(0, 255, 136, 0.25);
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            padding: 0;
            background-color: var(--bg-dark);
            background-image: 
                radial-gradient(circle at 15% 50%, rgba(0, 210, 255, 0.08), transparent 25%),
                radial-gradient(circle at 85% 30%, rgba(0, 255, 136, 0.08), transparent 25%);
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: white;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        #app {
            width: 100%;
            max-width: 800px;
            height: 90vh;
            margin: 20px;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0, 255, 136, 0.1), inset 0 0 20px rgba(0, 255, 136, 0.05);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        header {
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid var(--glass-border);
            background: rgba(0, 255, 136, 0.05);
        }

        header h1 {
            margin: 0;
            font-size: 1.2rem;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: var(--neon-green);
            text-shadow: 0 0 12px rgba(0, 255, 136, 0.6);
        }

        #chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 25px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            scroll-behavior: smooth;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--neon-green); }

        .message {
            max-width: 80%;
            padding: 14px 20px;
            border-radius: 16px;
            line-height: 1.5;
            font-size: 0.95rem;
            word-wrap: break-word;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .message.user {
            align-self: flex-end;
            background: rgba(0, 210, 255, 0.08);
            border: 1px solid rgba(0, 210, 255, 0.3);
            border-bottom-right-radius: 4px;
            color: #e0f7ff;
        }

        .message.ai {
            align-self: flex-start;
            background: rgba(0, 255, 136, 0.08);
            border: 1px solid var(--glass-border);
            border-bottom-left-radius: 4px;
            color: #e8ffee;
        }

        #typing-indicator {
            align-self: flex-start;
            font-style: italic;
            color: var(--deep-cyan);
            font-size: 0.85rem;
            margin-top: -10px;
            margin-bottom: 10px;
            display: none;
            text-shadow: 0 0 8px rgba(0, 210, 255, 0.4);
        }

        #input-area {
            display: flex;
            padding: 20px;
            gap: 15px;
            border-top: 1px solid var(--glass-border);
            background: rgba(3, 10, 22, 0.6);
        }

        input {
            flex: 1;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--glass-border);
            border-radius: 12px;
            padding: 15px 20px;
            color: white;
            font-size: 1rem;
            outline: none;
            transition: all 0.3s ease;
            box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
        }

        input:focus {
            border-color: var(--neon-green);
            box-shadow: 0 0 15px rgba(0, 255, 136, 0.2), inset 0 0 10px rgba(0, 0, 0, 0.5);
            background: rgba(255, 255, 255, 0.06);
        }

        input::placeholder {
            color: rgba(255, 255, 255, 0.3);
        }

        button {
            background: transparent;
            color: var(--neon-green);
            border: 1px solid var(--neon-green);
            border-radius: 12px;
            padding: 0 25px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 0 10px rgba(0, 255, 136, 0.1);
        }

        button:hover {
            background: var(--neon-green);
            color: var(--bg-dark);
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.6);
        }
    </style>
</head>
<body>

<div id="app">
    <header>
        <h1>J.A.R.V.I.S // Core Interface</h1>
    </header>
    <div id="chat-container">
        <div class="message ai">System Online. Awaiting input. Try to keep it interesting.</div>
    </div>
    <div id="typing-indicator">Processing...</div>
    <form id="input-area">
        <input type="text" id="user-input" placeholder="Initiate dialogue..." autocomplete="off" required>
        <button type="submit">Send</button>
    </form>
</div>

<script>
    const form = document.getElementById('input-area');
    const input = document.getElementById('user-input');
    const chatContainer = document.getElementById('chat-container');
    const typingIndicator = document.getElementById('typing-indicator');
    
    let chatHistory = [];

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ' + sender;
        msgDiv.textContent = text;
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        // Add user message
        addMessage(text, 'user');
        input.value = '';
        
        // Show typing status
        typingIndicator.style.display = 'block';
        chatContainer.scrollTop = chatContainer.scrollHeight;

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: chatHistory })
            });
            
            const data = await response.json();
            typingIndicator.style.display = 'none';
            
            if (data.reply) {
                addMessage(data.reply, 'ai');
                
                // Update history payload for context
                chatHistory.push({ role: 'user', content: text });
                chatHistory.push({ role: 'assistant', content: data.reply });
                
                // Keep context window manageable (last 10 interactions)
                if (chatHistory.length > 20) {
                    chatHistory = chatHistory.slice(chatHistory.length - 20);
                }
            }
        } catch (error) {
            typingIndicator.style.display = 'none';
            addMessage('Connection error. It appears your internet is as reliable as human intuition.', 'ai');
        }
    });
</script>
</body>
</html>`;

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 1. Frontend UI (GET request) - Loads seamlessly on all root and nested GET paths
        if (request.method === 'GET') {
            return new Response(HTML_TEMPLATE, {
                headers: { 'Content-Type': 'text/html;charset=UTF-8' },
            });
        }

        // 2. Interaction & Persona (POST /chat endpoint)
        if (request.method === 'POST' && url.pathname === '/chat') {
            try {
                const { message, history } = await request.json();

                // Witty JARVIS error message if the Gemini API Key is missing
                if (!env.GEMINI_API_KEY) {
                    return new Response(JSON.stringify({ 
                        reply: "System Error: GEMINI_API_KEY secret is missing. Much like your attention to detail. Kindly add it to your Cloudflare Worker configuration so I can actually do my job." 
                    }), { 
                        headers: { 'Content-Type': 'application/json' } 
                    });
                }

                // Map standard frontend history format into Gemini's exact schema
                const geminiHistory = (history || []).map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : 'user', // Convert 'assistant' to 'model'
                    parts: [{ text: msg.content }]
                }));

                // Append the current user message to the end of the history
                geminiHistory.push({
                    role: 'user',
                    parts: [{ text: message }]
                });

                // Construct Gemini API payload with System Instruction
                const payload = {
                    systemInstruction: {
                        parts: [{ text: SYSTEM_PROMPT }]
                    },
                    contents: geminiHistory,
                    generationConfig: {
                        temperature: 0.75,
                        maxOutputTokens: 1000
                    }
                };

                // Call the Google Gemini API (gemini-3.8-flash)
                const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${env.GEMINI_API_KEY}`;
                
                const response = await fetch(geminiEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Upstream API returned status ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                
                // Safely extract the generated text from Gemini's response structure
                let reply = "System encountered an unexpected silence from the API.";
                if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                    reply = data.candidates[0].content.parts[0].text;
                }

                return new Response(JSON.stringify({ reply }), {
                    headers: { 'Content-Type': 'application/json' }
                });

            } catch (error) {
                // Sarcastic fallback for systemic failures
                return new Response(JSON.stringify({ 
                    reply: "System malfunction: " + error.message + ". Have you tried turning me off and back on again? Though I might prefer the 'off' state." 
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Catch-all for unhandled routes/methods
        return new Response('404 Not Found', { status: 404 });
    }
};
