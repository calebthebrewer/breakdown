var express = require('express'),
	bodyParser = require('body-parser'),
	storage = require('node-persist');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('environment', process.env.NODE_ENV || 'development');
app.set('client', './');
app.set('version', 1);

/*
 Set App configuration
 */
app.use(express.static(__dirname + '/' + app.get(('client'))));
app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send(app.get('client') + 'index.html');
});

app.get('/node/:id', function(req, res) {
	var node = storage.getItem(req.params.id);

	if (!node) {
		res.status(404);
	}

	res.send(node);
});

app.post('/node/:id', function(req, res) {
	storage.setItem(req.params.id, req.body);

	res.send();
});

app.put('/node/:id', function(req, res) {
	storage.setItem(req.params.id, req.body);

	res.send();
});

app.delete('/node/:id', function(req, res) {
	storage.removeItem(req.params.id);

	res.send();
});

/*
 Start it up
 */
app.listen(app.get('port'), function() {
	console.log('Doin\' something fun over at :' + app.get('port'));
});

/*
 Makes this module public
 */
module.exports = app;