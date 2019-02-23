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
    "enabled": true,
    "password": "123",
    "salt": "Mt0yK08kHYxjdfgHNOxmZzlPP42ljkXJeZbJOnOcelJ1KsUN4W",
    "hint": "",
    "maxDays": "3"
  },
  "plugins": {
    "telegram": {
      "token": "",
      "adminId": ""
    }
  }
};