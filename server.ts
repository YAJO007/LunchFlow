import http from "http";
import { app } from "./app";

// ใช้ PORT จาก Environment (เวลา Deploy บน Render) ถ้าไม่มีให้ใช้ 3000
const port = process.env.PORT || 3000;
const server = http.createServer(app);

server
  .listen(port, () => {
    console.log(`Server is started on port ${port}`);
  })
  .on("error", (error) => {
    console.error(error);
  });
