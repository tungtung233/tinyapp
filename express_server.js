const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


let cookieParser = require('cookie-parser');
app.use(cookieParser());


const {
  generateRandomString,
  addHTTP,
  checkExisting,
  urlsForUser
} = require('./functions');


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



app.get("/", (req, res) => {
  res.send("Hello!");
});


//displays the page with the table of urls
app.get("/urls", (req, res) => {
  const listOfUserURLs = urlsForUser(urlDatabase, req.cookies['userID']);

  const templateVars = {
    urls: listOfUserURLs,
    user: users[req.cookies["userID"]]
  };
  
  res.render("urls_index", templateVars);
});


//after clicking on the register button, it will display the 'register' page
app.get("/register", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["userID"]]
  };

  res.render("register", templateVars);
});


//after registering a new account - tests that email and password are not blank, and that the email constains an @ symbol
//also checks if the 'new' email already exists in the database
//if data passes these tests, new account and a cookie containing their userID is created
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password || !/@{1}/.test(req.body.email)) {
    res.send(`ERROR: 400 Bad Request <br/> Invalid email or password`);
  }
  
  if (checkExisting(users, 'email', req.body.email)) {
    res.send(`ERROR: 400 Bad Request <br/> Email already registered to an account`);
  }

  let userID = 'User-' + generateRandomString();
  res.cookie('userID', userID);

  userID = new newAccount(userID, req.body.email, req.body.password);
  //this will add the newAccount to users
  userID.addUser();

  console.log(users);
  res.redirect('/urls');
});


//after clicking the log in hyperlink, will display the login page
app.get("/login", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[res.cookie["userID"]]
  };

  res.render("login", templateVars);

});


//after logging in - tests that email exists in the database, then checks if email's password also matches
app.post("/login", (req, res) => {
  let userID = '';

  if (!checkExisting(users, 'email', req.body.email)) {
    res.send(`ERROR: 403 Forbidden <br/> Email not registered <br/> <b>Access Denied<b/>`);
  } else {
    userID = checkExisting(users, 'email', req.body.email, true);
  }
  
  console.log(userID);
  
  if (users[userID]['password'] !== req.body.password) {
    res.send(`ERROR: 403 Forbidden <br/> Password not recognised <br/> <b>Access Denied<b/>`);
  } else {
    res.cookie('userID', userID);
    res.redirect('urls/');

  }
});


//after clicking the logout button
app.get("/logout", (req, res) => {
  res.clearCookie('userID');
  res.redirect('/urls');
});


// create a new URL - checks if you are logged in
app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["userID"]]
  };

  if (!templateVars['user']) {
    res.redirect('/login');

  } else {
    res.render("urls_new", templateVars);

  }
});


// after submitting a new URL (from urls_new) - make sure only logged-in users can submit
app.post("/urls", (req, res) => {
  if (req.cookies['userID']) {
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL]['longURL'] = addHTTP(req.body.longURL);
    urlDatabase[shortURL]['userID'] = req.cookies['userID'];

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
      user: users[req.cookies["userID"]]
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
  if (urlDatabase[req.params.shortURL]["userID"] === req.cookies["userID"]) {
    urlDatabase[req.params.shortURL]['longURL'] = addHTTP(req.body.editURL);
    res.redirect('/urls');

  } else {
    res.sendStatus(403);
  }
});

//after clicking the delete button in urls_show - checks to see if the user is the creator of the url, only then does it allow the deletion to go through
app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL]["userID"] === req.cookies["userID"]) {
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

