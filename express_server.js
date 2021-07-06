const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs") 

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});


app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});




// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });


// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });


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


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

