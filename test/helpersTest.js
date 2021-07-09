const { assert } = require('chai');

const { checkExisting, urlsForUser } = require('../helpers.js');


describe('checkExisting', function() {

  const testUsers = {
    "userRandomID": {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur"
    },
    "user2RandomID": {
      id: "user2RandomID",
      email: "user2@example.com",
      password: "dishwasher-funk"
    }
  };

  it('should return a user with valid email', function() {
    const user = checkExisting(testUsers, 'email', "user@example.com", true);
    const expectedOutput = "userRandomID";
    
    assert.strictEqual(user, expectedOutput);
  });

  it('should return false when email is not found in the database', function() {
    assert.isFalse(checkExisting(testUsers, 'email', 'test@example.com'));

  });

  it('should return true when password is found in the database', function() {
    assert.isTrue(checkExisting(testUsers, 'password', 'dishwasher-funk'));
  });
});



describe('urlsForUser', function() {

  const urlDatabase = {
    shortURL1: {
      longURL: "https://www.lighthouselabs.ca",
      userID: "User-1"
    },
  
    shortURL2: {
      longURL: "https://www.google.ca",
      userID: "User-1"
    },

    shortURL3: {
      longURL: "https://www.google.ca",
      userID: "User-2"
    },
  };

  it('for "User-1", it should only return an object containing shortURL1 and shortURL2', function() {
    const userApprovedURLs = urlsForUser(urlDatabase, 'User-1');
    const expectedOutput = {
      shortURL1: {
        longURL: "https://www.lighthouselabs.ca",
        userID: "User-1"
      },
    
      shortURL2: {
        longURL: "https://www.google.ca",
        userID: "User-1"
      }
    };
    
    assert.deepEqual(userApprovedURLs, expectedOutput);
  });

  it('for "User-2", it should only return an object containing shortURL3', function() {
    const userApprovedURLs = urlsForUser(urlDatabase, 'User-2');
    const expectedOutput = {
      shortURL3: {
        longURL: "https://www.google.ca",
        userID: "User-2"
      }
    };
    
    assert.deepEqual(userApprovedURLs, expectedOutput);
  });

});

