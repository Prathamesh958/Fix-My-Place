const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); 
require('./config/passport')(passport); 

const Image = require('./models/Image'); 
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Middleware 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'yourSecret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');
app.use(express.static("public"));

// Connect to MongoDB
const MONGO_URL = "mongodb://127.0.0.1:27017/fixmyplace_practice";

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to fixmyplace_test DB'))
    .catch(err => console.log(err));

// Multer setup 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Authentication Routes
app.get('/register', (req, res) => res.render('register'));
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    const newUser = new User({ email, password: bcrypt.hashSync(password, 10) });

    newUser.save()
        .then(() => res.redirect('/login'))
        .catch(err => res.status(400).send(err));
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login'
}));

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

// Middleware to ensure authentication
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

function ensureWorkerAuthenticated(req, res, next) {
    if (req.isAuthenticated() && req.user.isWorker) return next();
    res.redirect('/worker-login');
}

// Routes that require authentication
app.get('/home', ensureAuthenticated, (req, res) => res.render('home'));
app.get('/input', ensureAuthenticated, (req, res) => res.render('input'));

// Form submission route
app.post('/submit', ensureAuthenticated, upload.single('image'), (req, res) => {
    const { name, title, desc, address, contact, work } = req.body;

    const img = {
        data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
        contentType: 'image/png'
    };

    const newImage = new Image({
        name,
        title,
        desc,
        img,
        address,
        contact,
        work,
        userIdentifier: req.user.email
    });

    newImage.save()
        .then(() => res.redirect('/userHistory'))
        .catch(err => {
            console.log(err);
            res.status(400).send(err);
        });
});

// Route to display problems uploaded by email ID
app.get("/userHistory", ensureAuthenticated, (req, res) => {
    const email = req.user.email;

    Image.find({ userIdentifier: email })
        .then((data) => {
            res.render("userHistory.ejs", { email, problems: data });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send("Internal Server Error");
        });
});

// Route to display all uploaded images titles
app.get('/worker', ensureWorkerAuthenticated, (req, res) => {
    Image.find({})
        .then((data) => {
            res.render('worker', { problems: data });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send("Internal Server Error");
        });
});

// Route to display details of a specific image
app.get('/detailwork/:id', ensureWorkerAuthenticated, (req, res) => {
    const imageId = req.params.id;

    Image.findById(imageId)
        .then((data) => {
            res.render('detailwork', { problem: data });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send("Internal Server Error");
        });
});

app.get('/admin-register', (req, res) => res.render('admin-register'));
app.post('/admin-register', ensureAuthenticated, (req, res) => {
    const { email, password, isWorker } = req.body;
    // Only allow admin users to register workers
    if (!req.user.isWorker) {
        const newUser = new User({ email, password: bcrypt.hashSync(password, 10), isWorker });

        newUser.save()
            .then(() => res.redirect('/login'))
            .catch(err => res.status(400).send(err));
    } else {
        res.status(403).send('You do not have permission to register workers');
    }
});

app.get('/worker-login', (req, res) => res.render('worker-login'));
app.post('/worker-login', passport.authenticate('worker', {
    successRedirect: '/worker',
    failureRedirect: '/worker-login'
}));

app.get('/about',(req,res)=>res.render('about'))

// Middlewares
app.use((req, res, next) => {
    res.status(404).send("Sorry, that route doesn't exist.");
});

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});
