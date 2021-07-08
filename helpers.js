// all functions used in express_server.js are currently stored in here - since there are only 4 functions, I confined them all to one file
// if this project grows any bigger, should probably split these functions into their seperate files in a functions folder


//generates a random 6 character string, consisting of only /0-9A-Za-z/
const generateRandomString = function() {
  let randomString = "";

  /* 0-9 = ASCII codes 48-57
    A-Z = ASCII codes 65-90
    a-z = ASCII codes 97-122 */

  // generates a random number between 48-122, inclusive of min and max, and then converts that into it's corresponding ASCII character.
  // but there are other random punctuations included in this range, including the underscore _
  const randomAlphanumericCharacter = function() {
    return String.fromCharCode(Math.random() * (122 - 48 + 1) + 48);
  };

  while (randomString.length < 6) {
    const character = randomAlphanumericCharacter();

    if (/[0-9A-Za-z]/.test(character)) {
      randomString += character;
    }
  }
  
  return randomString;
};


//checks if link has "http://" written at the start, if not, it adds it
const addHTTP = function(link) {
  if (!/^http:\/\//.test(link)) {
    return 'http://' + link;
  }
  return link;
};



// returns true if matching parameter is found in users, returns userID if 4th parameter is true
const checkExisting = function(users, parameter, newParameter, returnUserID) {
  for (const userID in users) {
    if (users[userID][parameter] === newParameter) {
      if (returnUserID) {
        return userID;
      } else {
        return true;
      }
    }
  }

  return false;
};


//checks urlDatabase against the logged in user, returns an object of all the urls they created
const urlsForUser = function(urlDatabase, currentUserID) {
  const userURLs = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url]["userID"] === currentUserID) {
      userURLs[url] = urlDatabase[url];
    }
  }
  return userURLs;
};



module.exports = {
  generateRandomString,
  addHTTP,
  checkExisting,
  urlsForUser
};