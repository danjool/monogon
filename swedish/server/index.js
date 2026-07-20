// Local dev entry point. In production the app is mounted into monogon as a
// router (see server/app.js); this file reproduces the pieces monogon provides
// — a JSON body parser and the /swedish mount prefix — so dev and prod share
// identical paths. Run with `pnpm run server`.
const express = require('express');

const MOUNT = process.env.MOUNT_PREFIX || '/swedish';
const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());
app.use(MOUNT, require('./app'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}${MOUNT}`);
});
