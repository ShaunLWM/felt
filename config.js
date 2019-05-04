module.exports = {
  "setup": true,
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
    "salt": "QiLWCepvVc9UX6H7n9YQ1nkOBr2zK4glIdJFJJTkCK3A2IYfII",
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
    "wrongPassword": [""],
    "correctPassword": [""]
  }
};