import { app } from "./app";
import { config } from "./config/env";

app.listen(config.PORT, () => {
  console.log(`TaskCanvas backend listening on http://localhost:${config.PORT}`);
});
