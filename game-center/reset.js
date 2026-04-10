const db = require('./database');

db.run("DELETE FROM sessions", () => {
  console.log("Sessions cleared");
});