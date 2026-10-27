# HmJS

The semi-offical JavaScript SDK for the Hymenia API.

## Example Ping-pong command
```js
import { HmJS } from "./src/client.js";

const hm = new HmJS({
  token: hm.app...,
});

// call this when your bot receives a message
async function handleMessage(message) {
  if (message.content?.trim() !== "!ping") return;

  await hm.sendMessage({
    chat_id: message.chat_id,
    content: "Pong!",
  });
}
```
