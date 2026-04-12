# Demo Script Guide

> Use the **Demo page** (`/demo`) to record perfect marketing videos of the widget — you type the user messages, the bot replies with exactly what you scripted.

---

## How it works

1. Open `/demo` in your browser
2. Enter your **Chatbot ID** and click **Load** — your real widget (with actual branding and colors) appears on the right
3. Paste your **script** in the JSON box on the left and click **Apply Script**
4. Start typing user messages in the widget — each message you send triggers the **next step** in your script
5. When you want to redo the recording, click **Reset** to start from step 1 again

---

## Writing a script

A script is a list of steps written in **JSON format** (don't worry, it's simpler than it sounds).

The script is wrapped in square brackets `[ ]`, and each step is separated by a comma.

```
[
  step 1,
  step 2,
  step 3
]
```

Every time you type a message in the widget, the **next step** plays automatically.

---

## The simplest script — plain bot replies

Just write the bot's reply as a quoted string. That's it.

```json
[
  "Hi there! How can I help you today?",
  "Sure, I can look into that for you.",
  "Great news — your order has been shipped!"
]
```

You type 3 messages → bot gives those 3 replies, one by one. The reply streams in like real typing.

---

## All action types

When you need more than just a bot reply, use an **action object** with a `type` field.

---

### Bot message (with streaming effect)

Same as the plain string shorthand, but written as an object.

```json
{ "type": "bot_message", "content": "Here is the information you asked for." }
```

---

### Human agent message

Makes a message appear as if a real human agent sent it. Shows the agent's name above the bubble.

```json
{ "type": "agent_message", "content": "Hey! I'm Sarah from the billing team.", "agentName": "Sarah" }
```

You can also add an avatar image URL:

```json
{ "type": "agent_message", "content": "Hi, I'm Alex!", "agentName": "Alex", "agentAvatar": "https://..." }
```

---

### Escalation (hand-off to human agent)

Triggers the escalation UI — shows the "connecting you to an agent" state in the widget.

```json
{ "type": "escalate" }
```

With a reason:

```json
{ "type": "escalate", "reason": "billing inquiry" }
```

---

### Lead form

Pops up the lead capture form inside the chat. The user can fill it in and submit.

```json
{ "type": "show_lead_form" }
```

> The form submission is a no-op in demo mode — it closes cleanly without hitting any API, so you can safely demo it.

---

### No-agents-online form

Shows the "no agents available right now" offline contact form.

```json
{ "type": "show_no_agents_form" }
```

> Same as above — submission closes the form without any real API call.

---

### Conversation resolved

Marks the conversation as resolved. The input box disappears and a "Your conversation has ended" message appears at the bottom.

```json
{ "type": "resolve" }
```

---

### Conversation closed

Same visual result as resolve, but uses the "closed" state.

```json
{ "type": "close" }
```

---

## Combining multiple actions for one user message

Sometimes you want several things to happen after a single user message — for example, the bot says something AND the escalation UI appears, all in one turn.

Wrap them in square brackets `[ ]`:

```json
[
  { "type": "bot_message", "content": "I'll connect you with a specialist right away." },
  { "type": "escalate", "reason": "needs specialist" }
]
```

Both actions fire one after the other when the user sends that one message.

---

## Full example — a complete escalation demo

This script walks through: greeting → small talk → escalation → agent joins → lead form → resolution.

```json
[
  "Hi there! How can I help you today?",

  "I can definitely help with your billing question. Let me check on that.",

  [
    "I'm going to connect you with one of our billing specialists who can sort this out for you.",
    { "type": "escalate", "reason": "billing question" }
  ],

  {
    "type": "agent_message",
    "content": "Hey! I'm Sarah from the billing team. I can see your account — let me take a look.",
    "agentName": "Sarah"
  },

  {
    "type": "agent_message",
    "content": "Found the issue! There was a duplicate charge on March 3rd. I've already raised a refund — you'll see it in 3–5 business days.",
    "agentName": "Sarah"
  },

  { "type": "show_lead_form" },

  { "type": "resolve" }
]
```

**What the recording looks like:**
1. User types "Hi" → bot greets them
2. User types "I have a billing question" → bot acknowledges
3. User types "Can you help me?" → bot says it's escalating AND the escalation UI appears
4. User types another message → Sarah's first agent message appears
5. User types again → Sarah resolves the issue
6. User types again → lead form pops up
7. User types again → conversation ends

---

## Full example — lead form demo

Simple script to showcase the lead generation form.

```json
[
  "Hi! I can help you get started. Mind if I grab a few details?",
  { "type": "show_lead_form" },
  "Thanks! Someone from our team will be in touch shortly."
]
```

---

## Full example — no agents online

```json
[
  "I'd like to connect you with a human agent for this.",
  [
    { "type": "escalate" },
    { "type": "show_no_agents_form" }
  ]
]
```

---

## Tips for recording great videos

- **Use Reset freely** — every time you click Reset, the script restarts from step 1 with a fresh chat. Re-record as many times as you need.
- **Type realistic user messages** — the content doesn't matter (the bot ignores it in demo mode), but typing something real makes the video look authentic.
- **Adjust typing speed** — the bot's reply streams in character by character. Longer replies take a little longer, which looks natural.
- **Load your real chatbot ID** — the widget will use your actual branding, colors, and logo, so the video looks exactly like what customers will see.
- **Script length** — keep scripts short (5–8 steps) for a focused video. If you run past the end of the script, the widget shows "End of script" and you just click Reset.

---

## Quick reference cheat sheet

| What you want to show | What to write |
|---|---|
| Bot reply | `"Your reply text here"` |
| Bot reply (explicit) | `{"type":"bot_message","content":"..."}` |
| Human agent reply | `{"type":"agent_message","content":"...","agentName":"Name"}` |
| Escalation UI | `{"type":"escalate"}` |
| Lead capture form | `{"type":"show_lead_form"}` |
| No agents form | `{"type":"show_no_agents_form"}` |
| End conversation | `{"type":"resolve"}` |
| Multiple things at once | `[action1, action2]` |

---

## Common mistakes

**Forgot a comma between steps**
```json
// Wrong
[
  "Hello!"
  "How are you?"
]

// Correct
[
  "Hello!",
  "How are you?"
]
```

**Used single quotes instead of double quotes**
```json
// Wrong
{ 'type': 'bot_message', 'content': 'Hi!' }

// Correct
{ "type": "bot_message", "content": "Hi!" }
```

**Forgot the outer square brackets**
```json
// Wrong
{ "type": "bot_message", "content": "Hi!" }

// Correct
[
  { "type": "bot_message", "content": "Hi!" }
]
```

If your script has an error, the page will show a red error message below the text box. Fix it and click **Apply Script** again.
