## Rooms

Rooms are **arbitrary string IDs**. The server does not enforce semantics: it just tracks membership and broadcasts events to members of a room.

### Join / leave over WebSocket

Send JSON commands:

- Join:

```json
{"action":"join","room":"conversation:123"}
```

- Leave:

```json
{"action":"leave","room":"conversation:123"}
```

### Claim an escalation (agent)

Agent claims an escalation atomically (DB enforced single active assignee):

```json
{
  "action": "claim",
  "room": "conversation:conv_123",
  "data": {
    "conversationId": "conv_123",
    "escalationId": "esc_123",
    "agentUserId": "agent_7"
  }
}
```

### Send a chat message (widget or agent)

```json
{
  "action": "message",
  "room": "conversation:conv_123",
  "data": {
    "conversationId": "conv_123",
    "senderType": "USER",
    "text": "Hello",
    "messageId": "msg_123"
  }
}
```

### Server -> client events

The server broadcasts events in this envelope:

```json
{"roomId":"conversation:conv_123","eventType":"STATE_UPDATE","data":{...}}
```

Event types (MVP):
- `NEW_ESCALATION` (to `agents:notifications`)
- `CHAT_CLAIMED` (to `agents:notifications`)
- `STATE_UPDATE` (to `conversation:{id}`)
- `CHAT_MESSAGE` (to `conversation:{id}`)
- `ERROR` (to `conversation:{id}`)

`STATE_UPDATE.data` includes:
- `onlineAgents`: number of unique online human agents for this escalation’s `{workspaceId, chatbotId}` (counted from `agents:notifications:{workspaceId}:{chatbotId}` room membership)

### Online agent presence (unique agents)

When the widget joins a conversation room that has an active escalation, the server includes a presence hint:

- `STATE_UPDATE.data.onlineAgents` = **unique online human agents** for that escalation’s `{workspaceId, chatbotId}`.
- “Online” here means: an **agent WebSocket connection is currently joined** to the agents notifications room for that `{workspaceId, chatbotId}`.

#### Agent frontend requirements

1. **Connect with identity** (so uniqueness is by agent user id, not by connection id):

- WebSocket URL query:
  - `client_type=agent`
  - `agent_user_id=<your-agent-user-id>`

Example (shape):

```text
wss://<socket-server-host>/ws?client_type=agent&agent_user_id=agent_7
```

2. **Join the per-chatbot agents notifications room** (this is what presence is counted from):

Room name:

```text
agents:notifications:{workspaceId}:{chatbotId}
```

Join command example:

```json
{"action":"join","room":"agents:notifications:ws_123:cb_456"}
```

#### Widget/frontend usage

1. Connect with `client_type=widget` (existing behavior).
2. Join `conversation:{conversationId}` (existing behavior).
3. When you receive a `STATE_UPDATE`, read `data.onlineAgents`:
   - `0` => no agents currently online for that chatbot (you can keep the bot in “no humans online” messaging)
   - `>0` => at least one human agent is online and could claim/respond

Example `STATE_UPDATE` payload (shape):

```json
{
  "roomId": "conversation:conv_123",
  "eventType": "STATE_UPDATE",
  "data": {
    "conversationId": "conv_123",
    "escalationId": "esc_123",
    "status": "REQUESTED",
    "onlineAgents": 2
  }
}
```

#### Notes / limitations

- Uniqueness is based on `agent_user_id`. If an agent connects without `agent_user_id`, the server falls back to per-connection uniqueness (so reconnects / multiple tabs can inflate the count).
- This is **single socket-server instance** presence only (no cross-instance aggregation).

### Suggested naming conventions (optional)

- Conversation room (user widget):
  - `conversation:{conversationId}`
- Agent inbox room:
  - `agent:{agentId}:inbox`
- Global notifications room:
  - `agents:notifications`
