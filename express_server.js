const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs") 

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


var cookieParser = require('cookie-parser')
app.use(cookieParser())


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


const users = {};


class newAccount {

  constructor(id, email, password) {
    this.id = id;
    this.email = email;
    this.password = password
  }

  addUser() {
    users[this.id] = {}

    for (const key in this) {
      users[this.id][key] = this[key];
    }
   
  }

}



app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["userID"]]
  };

  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString()
  urlDatabase[shortURL] = addHTTP(req.body.longURL)

  res.redirect(`/urls/${shortURL}`)
});


//creating a new account
app.get("/register", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["userID"]]
  };

  res.render("register", templateVars);
});


//after creating a new account
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password || !/@{1}/.test(req.body.email)) {
    res.send(`ERROR: 400 Bad Request <br/> Invalid email or password`)
  } 
  
  if (checkExisting(users, 'email', req.body.email)) {
    res.send(`ERROR: 400 Bad Request <br/> Email already registered to an account`)
  } 

  let userID = 'User-' + generateRandomString()
  res.cookie('userID', userID)

  userID = new newAccount (userID, req.body.email, req.body.password)
  //this will add the newAccount to users
  userID.addUser()

  res.redirect('/urls')
})


//after clicking the log in hyperlink
app.get("/login", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[res.cookie["userID"]]
  };

  res.render("login", templateVars)

})



//after logging in
app.post("/login", (req, res) => {
  if (!checkExisting(users, 'email', req.body.email)) {
    res.send(`ERROR: 403 Forbidden <br/> Email not registered <br/> <b>Access Denied<b/>`)
  } else if (!checkExisting(users, 'password', req.body.password)) {
    res.send(`ERROR: 403 Forbidden <br/> Password not recognised <br/> <b>Access Denied<b/>`)
  } 

  const userID = checkExisting(users, 'password', req.body.password, true)

  res.cookie('userID', userID)
  res.redirect('urls/')
});


//after clicking the logout button
app.get("/logout", (req, res) => {
  res.clearCookie('userID')
  res.redirect('/urls')
});


app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["userID"]]
  };
  
  res.render("urls_new", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const templateVars = { 
      shortURL: req.params.shortURL, 
      longURL: urlDatabase[req.params.shortURL], 
      user: users[req.cookies["userID"]] 
    };

    res.render("urls_show", templateVars);
  } else {
    res.send('ERROR: 404 Page Not Found')
  }
});


app.post("/urls/:shortURL", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`)
});


app.post("/urls/:shortURL/edit", (req, res) => {
  urlDatabase[req.params.shortURL] = addHTTP(req.body.editURL)
  res.redirect('/urls')
});


app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect('/urls')
});


app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});



function generateRandomString() {
  let randomString = "";

  /* 0-9 = ASCII codes 48-57
    A-Z = ASCII codes 65-90
    a-z = ASCII codes 97-122 */

  // generates a random number between 48-122, inclusive of min and max, and then converts that into it's corresponding ASCII character.
  // but there are other random punctuations included in this range, including the underscore _
  const randomAlphanumericCharacter = function () {
    return String.fromCharCode(Math.random() * (122 - 48 + 1) + 48);
  }

  while (randomString.length < 6) {
    const character = randomAlphanumericCharacter();

    if (/[0-9A-Za-z]/.test(character)) {
      randomString += character;
    }
  }
  
  return randomString

}

function addHTTP (link) {
  if (!/^http:\/\//.test(link)) {
    return 'http://' + link
  }
  return link
}


// returns true if matching parameter is found in users, returns userID if 4th parameter is true
function checkExisting (users, parameter, newParameter, returnUserID) {
  for (const userID in users) {
    if (users[userID][parameter] === newParameter) {
      if (returnUserID) {
        return userID;
      } else {
        return true
      }
    }
  }

  return false;
}



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

