const mysql = require('mysql2');
const dotenv = require("dotenv");
dotenv.config();

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: process.env.sql_password,
    database: process.env.sql_database,
  connectionLimit: 10
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
  connection.release(); 
});

module.exports = db;
