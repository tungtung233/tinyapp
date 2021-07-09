const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//kept cookieParser for cookies that don't need encryption (e.g. error messages)
let cookieParser = require('cookie-parser');
app.use(cookieParser());

let cookieSession = require('cookie-session');

app.use(cookieSession({
  name: 'session',
  keys: ['dontTouchMyCookies!!'],
}));

const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);

const {
  generateRandomString,
  addHTTP,
  checkExisting,
  urlsForUser
} = require('./helpers');


const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.lighthouselabs.ca",
    userID: "User-aJ48lW"
  },

  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "User-aJ48lW"
  },
};


const users = {};

class newAccount {

  constructor(id, email, password) {
    this.id = id;
    this.email = email;
    this.password = password;
  }

  // this function adds all the user information to the users object
  addUser() {
    users[this.id] = {};

    for (const key in this) {
      users[this.id][key] = this[key];
    }
  }
}

app.use('/', (req, res, next) => {

  // clears error cookies from the registration and login form every time you go to a different page
  res.clearCookie('registrationError');
  res.clearCookie('loginError');
  return next();

});


// redirects the user depending on whether they are logged in or not
app.get("/", (req, res) => {
  if (!req.session.userID) {
    res.redirect('/login');

  } else {
    res.redirect("/urls");
  }
});


//displays the page with the table of urls
app.get("/urls", (req, res) => {
  const listOfUserURLs = urlsForUser(urlDatabase, req.session.userID);

  const templateVars = {
    urls: listOfUserURLs,
    user: users[req.session.userID]
  };
  
  res.render("urls_index", templateVars);
});


//after clicking on the register button, it will display the 'register' page
app.get("/register", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.userID],
    registrationError: req.cookies.registrationError ? req.cookies.registrationError : null
  };

  res.render("register", templateVars);
});


//after registering a new account - tests that email and password are not blank, and that the email constains an @ symbol
//also checks if the 'new' email already exists in the database
//if data passes these tests, new account and a cookie containing their userID is created
app.post("/register", (req, res) => {
  const {email, password} = req.body;

  if (!email || !password || !/@{1}/.test(email)) {
    res.cookie('registrationError', 'Invalid email or password!');
    res.redirect('/register');

  } else if (checkExisting(users, 'email', email)) {
    res.cookie('registrationError', 'Email already registered to an account!');
    res.redirect('/register');

  } else {
    let userID = 'User-' + generateRandomString();
    req.session.userID = userID;
  
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    userID = new newAccount(userID, email, hashedPassword);
    //this will add the newAccount to users
    userID.addUser();
  
    res.redirect('/urls');
  }

});


//after clicking the log in hyperlink, will display the login page
app.get("/login", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.userID],
    loginError: req.cookies.loginError ? req.cookies.loginError : null
  };

  res.render("login", templateVars);
});


//when logging in - tests that email exists in the database, then checks if email's password also matches
app.post("/login", (req, res) => {
  let userID = checkExisting(users, 'email', req.body.email, true);

  if (!userID) {
    res.cookie('loginError', 'Email not registered');
    res.redirect('/login');
    
  } else if (!bcrypt.compareSync(req.body.password, users[userID]['password'])) {
    res.cookie('loginError', 'Password not recognised');
    res.redirect('/login');

  } else {
    req.session.userID = userID;
    res.redirect('urls/');

  }
});


//after clicking the logout button
app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});


// create a new URL - checks if you are logged in
app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.userID]
  };

  if (!templateVars['user']) {
    res.redirect('/login');

  } else {
    res.render("urls_new", templateVars);

  }
});


// after submitting a new URL (from urls_new) - make sure only logged-in users can submit
app.post("/urls", (req, res) => {
  if (req.session.userID) {
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL]['longURL'] = addHTTP(req.body.longURL);
    urlDatabase[shortURL]['userID'] = req.session.userID;

    res.redirect(`/urls/${shortURL}`);

  } else {
    res.sendStatus(403);
  }
});


//after verifying that a user can submit a new URL, they get redirected here - this checks to see if the new shortURL is valid in the database
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const templateVars = {
      // needed to specify which shortURL and longURL to show, rather than pass in the usual 'urls: urlsDatabase'
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]['longURL'],
      user: users[req.session.userID]
    };

    res.render("urls_show", templateVars);
  } else {
    res.send('ERROR: 404 Page Not Found');
    
  }
});


//after clicking the edit buttons in urls_index
app.post("/urls/:shortURL", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});


//after clicking the edit button in urls_show - checks to see if the user is the creator of the url, only then does it allow the edit to go through
app.post("/urls/:shortURL/edit", (req, res) => {
  if (urlDatabase[req.params.shortURL]["userID"] === req.session.userID) {
    urlDatabase[req.params.shortURL]['longURL'] = addHTTP(req.body.editURL);
    res.redirect('/urls');

  } else {
    res.sendStatus(403);
  }
});

//after clicking the delete button in urls_show - checks to see if the user is the creator of the url, only then does it allow the deletion to go through
app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL]["userID"] === req.session.userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');

  } else {
    res.sendStatus(403);
  }
});


//the final goal! clicking a valid shortURL should redirect the user to the intended longURL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL]['longURL'];
    res.redirect(longURL);
  } else {
    res.send('ERROR: 404 Page Not Found');
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

