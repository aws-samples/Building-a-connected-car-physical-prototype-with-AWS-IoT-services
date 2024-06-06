import { io } from "socket.io-client";

// "undefined" means the URL will be computed from the `window.location` object
// export NODE_ENV=dev
const URL = "192.168.1.153:5000";

export const socket = io(URL);
