const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.login = async (req, res) => {
    try {

        const {email, password } = req.body;

        if( !email || !password) {
            return res.status(400).render('login', {
                message: 'Please Provide Email & Password!'
            })
        }

        db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
            console.log(results);
            if( !results.length || !(await bcrypt.compare(password, results[0].password)) ) {
                res.status(401).render('login', {
                    message: 'Email Or Password Is Incorrect!'
                })
            } else {
                const id = results[0].id;

                const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                });

                console.log('The Token Is: ' + token);

                const cookieOptions = {
                    expires: new Date (
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }

                res.cookie('jwt', token, cookieOptions );
                res.status(200).redirect('/');
            }
        })

    } catch (error) {
        console.log(error)
    }
}

exports.register = (req, res) => {
    console.log(req.body);

    const { name, email, password, passwordConfirm } = req.body;

    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
        if(error) {
            console.log(error);
        }

        if( results.length > 0 ) {
            return res.render('register', {
                message: 'That Email Is Already In Use!'
            })
        } else if( password != passwordConfirm ) {
            return res.render('register', {
                message: 'Passwords Do Not Match!'
            });
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        db.query('INSERT INTO users SET ?', {name: name, email: email, password: hashedPassword}, (error, results) => {
            if(error) {
                console.log(error);
            } else {
                console.log(results);
                return res.render('register', {
                    message: 'User Registered'
                });
            }
        })
    });
}

exports.isLoggedIn = async (req, res, next) => {
    //console.log(req.cookies);
    if( req.cookies.jwt ) {
        try{
            //1. verify the token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt,
                process.env.JWT_SECRET
                );

            console.log(decoded);

            //2. Check If the user still exists
            db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
                console.log(result);

                if( !result ) {
                    return next();
                }

                req.user = result[0];
                return next();
            });

        } catch (error) {
            console.log(error);
            return next();
        }
    } else {
        next();
    }
}

exports.logout = async (req, res, next) => {
    res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 2*1000),
        httpOnly: true //Security Reason
    });

    res.status(200).redirect('/');
}