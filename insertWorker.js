const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust the path as needed

// Connect to MongoDB
const MONGO_URL = "mongodb://127.0.0.1:27017/fixmyplace_practice";
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to fixmyplace_practice DB'))
    .catch(err => console.log(err));

const email = 'kedar7@gmail.com';
const password = '7777';
const isWorker = true;

// Hash the password before saving
bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
        console.error('Error hashing password:', err);
        process.exit(1);
    }

    const newUser = new User({
        email,
        password: hashedPassword,
        isWorker
    });

    newUser.save()
        .then(() => {
            console.log('Worker registered successfully!');
            mongoose.connection.close();
        })
        .catch(err => {
            console.error('Error registering worker:', err);
            mongoose.connection.close();
        });
});
