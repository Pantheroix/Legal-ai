import app from "./app.js";
import { OLLAMA_CHAT_MODEL, PORT } from "./config/index.js";
import { ensureStorage } from "./services/storageService.js";

await ensureStorage();

app.listen(PORT, () => {
  console.log(
    `[legal-rag-server] running on http://localhost:${PORT} with chat model ${OLLAMA_CHAT_MODEL}`,
  );
});
