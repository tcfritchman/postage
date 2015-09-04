var express = require('express')

/* Create App */

var app = express.createServer();

/* Config */

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
var port = 3000;

/* Routes */

app.get('/', function (req, res) {
    res.render('index');
});

/* Listen */

app.listen(port);
