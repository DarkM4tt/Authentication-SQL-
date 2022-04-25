const express = require('express');
const path = require('path');
const mysql = require('mysql');
const dotenv = require('dotenv'); //for storing sensitive Information.
const cookieParser = require('cookie-parser');

dotenv.config({ path: './.env' });  // ./ represents same level of directory.

const app = express();

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

const publicDirectory = path.join(__dirname, './public'); //for css & js
app.use(express.static(publicDirectory));

//Parse URL-encoded bodies
app.use(express.urlencoded({ extended: false }));
//Parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'hbs');

db.connect( (error) => {
    if(error) {
        console.log(error)
    } else {
        console.log("MYSQL CONNECTED...")
    }
})

//Define Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

app.listen(3001, () => {
    console.log('Sever Started At 3001!');
});