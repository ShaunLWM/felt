module.exports = {
  "setup": false,
  "title": "Felt",
  "host": "http://localhost",
  "port": 8081,
  "admin": {
    "username": "admin",
    "password": "sm3llycat"
  },
  "passwordProtected": {
    "enabled": false,
    "password": "123",
    "salt": "fZ5lh4OGkHxBzIqsnAv3pNSsxc5pJBMeFT0aJ33Exf3cyf7wX3",
    "hint": "",
    "maxDays": "3"
  },
  "plugins": {
    "telegram": {
      "enabled": false,
      "token": "",
      "adminId": ""
    }
  },
  "actions": {
    "wrongPassword": [],
    "correctPassword": []
  }
};