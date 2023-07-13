const express = require('express');
const bp = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const ejs = require('ejs');
const app = express();
app.set('view engine', 'ejs');

//mongoose connection

mongoose.connect("mongodb://127.0.0.1:27017/ChickTask").then(() => {
    console.log("Conneced to mongodb");
}).catch((e) => {
    console.log("Not connected to mongodb");
});

// Define the User schema

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

const User = mongoose.model('User', userSchema);

// Define the Admin schema

const adminSchema = new mongoose.Schema({
    email: String,
    password: String,
});

const Admin = mongoose.model('Admin', adminSchema);

// Define add task schema

const taskSchema = new mongoose.Schema({
    email: String,
    title: String,
    description: String,
});

const Task = mongoose.model('Task', taskSchema);

//use static files

app.use(express.static('public'));

app.use(bp.urlencoded({ extended: true }));;

//root main page

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/main.html");
});

//root signup page

app.get("/signup", (req, res) => {
    res.sendFile(__dirname + "/signup.html");
});

//handle user signup

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the email already exists in the database
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Create a new user
        const newUser = new User({ email, password });
        await newUser.save();

        // Return success response
        //   return res.status(201).json({ message: 'User registered successfully' });
        res.redirect('/login');
    } catch (error) {
        console.error('Error during signup:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

//root login page

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/login.html");
});

//handle user login

app.post("/login", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    // Check if the username exists
    const user = await User.findOne({ email });
    if (!user) {
        res.send('Invalid email or password!');
        return;
    }

    // Compare passwords
    const passwordsMatch = await (password === user.password);
    if (!passwordsMatch) {
        res.send('Invalid email or password!');
        return;
    }

    else {
        res.render('dash', { email });
    }

});

//root main dashboard

app.get("/dash", (req, res) => {

    res.render('dash');
});

//root admin main page

app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/admin.html");
});

//handle admin login

app.post("/admin_login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    // Check if the username exists
    const user = await Admin.findOne({ username });
    if (!user) {
        res.send('Invalid username or password!');
        return;
    }

    // Compare passwords
    const passwordsMatch = await (password === user.password);
    if (!passwordsMatch) {
        res.send('Invalid username or password!');
        return;
    }

    else {
        res.redirect('/admin_dash');
    }
});

//root admin dashboard

app.get("/admin_dash", (req, res) => {
    res.render('admin_dash');
});

//add task

app.post("/addtask", async (req, res) => {
    const email = req.body.email;
    const newtask = new Task({
        email: req.body.email,
        title: req.body.title,
        description: req.body.description,
    });
    await newtask.save();

    res.render('dash', { email });
});

//fetch all data for users

app.post("/fetch", async (req, res) => {
    const email = req.body.email;
    try {
        const data = await Task.find({ email }).select("title description");
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post("/fetch_admin", async (req, res) => {
    let email = req.body.email;
    try {
        const data = await Task.find({ email });
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

//delete a task by id

app.post("/delete", async (req, res) => {
    const id = req.body.id;
    try {
        const data = await Task.findByIdAndRemove(id);
        // res.json(data);
        res.redirect('admin_dash')
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// to update task

app.post("/update", async (req, res) => {
    const id = req.body.id;
    const title = req.body.title;
    const description = req.body.description;
    try {
        await Task.findByIdAndUpdate(id, {
            title: title,
            description: description
        });
        res.send("Successfully updated task.");
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred while updating task.");
    }
});


//Listen

app.listen(3000, (req, res) => {
    console.log("Server is Running on port 3000");
});