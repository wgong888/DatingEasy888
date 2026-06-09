const { resetDatabase, DEFAULT_DB_PATH } = require('./database');

const db = resetDatabase();
db.close();
console.log(`Reset prototype database: ${DEFAULT_DB_PATH}`);
