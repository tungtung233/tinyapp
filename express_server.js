const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs") 

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


var cookieParser = require('cookie-parser')
app.use(cookieParser())


const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "User-aJ48lW"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "User-aJ48lW"
  },
  vAJe52: {
    longURL: "https://www.google.ca",
    userID: "75lPbr"
  }
};


const users = {
  'User-aJ48lW': {
    id: 'User-aJ48lW',
    email: 'tungtungleung233@hotmail.com',
    password: '123'
  }
}



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


//displays the page with the table of urls
app.get("/urls", (req, res) => {
  // if (req.cookies['userID']) {
    const listOfUserURLs = urlsForUser(urlDatabase, req.cookies['userID'])

    const templateVars = {
      urls: listOfUserURLs,
      user: users[req.cookies["userID"]]
    };
  // } else {
    res.render("urls_index", templateVars)
  // }



});


// after submitting a new URL - make sure only logged-in users can submit
app.post("/urls", (req, res) => {
  if (req.cookies['userID']) {
    let shortURL = generateRandomString()
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL]['longURL'] = addHTTP(req.body.longURL)
    urlDatabase[shortURL]['userID'] = req.cookies['userID']
    
    res.redirect(`/urls/${shortURL}`)

  } else {
    res.sendStatus(403);

  }

});


//creating a new account
app.get("/register", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["userID"]]
  };

  res.render("register", templateVars);
});


//after registering a new account
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


// create a new URL
app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["userID"]]
  };

  if (!templateVars['user']) {
    res.redirect('/login')

  } else {
    res.render("urls_new", templateVars);

  }
});


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
    res.send('ERROR: 404 Page Not Found')
  }
});


app.post("/urls/:shortURL", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`)
});


app.post("/urls/:shortURL/edit", (req, res) => {
  if (urlDatabase[req.params.shortURL]["userID"] === req.cookies["userID"]) {
    urlDatabase[req.params.shortURL]['longURL'] = addHTTP(req.body.editURL)
    res.redirect('/urls')

  } else {
    res.sendStatus(403)
  }
});


app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL]["userID"] === req.cookies["userID"]) {
    delete urlDatabase[req.params.shortURL]
    res.redirect('/urls')

  } else {
    res.sendStatus(403)
  }
});


app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL]['longURL']
    res.redirect(longURL);
  } else {
    res.send('ERROR: 404 Page Not Found')
  }
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


function urlsForUser(urlDatabase, currentUserID) {
  const userURLs = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url]["userID"] === currentUserID) {
      userURLs[url] = urlDatabase[url]
    }
  }
  return userURLs;
}



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

