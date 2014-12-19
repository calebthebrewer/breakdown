var express = require('express'),
	bodyParser = require('body-parser'),
	storage = require('node-persist'),
	exec = require('child_process').exec,
	fs = require('node-fs-extra'),
	Nodes = require('./Nodes');

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
	Nodes
		.read(req.params.id)
		.then(function(node) {
			res.send(node);
		}, function () {
			res.status(404).send(req.params.id);
		});
});

app.post('/node', function(req, res) {
	Nodes
		.create(req.body)
		.then(function(node) {
			res.send(node);
		}, function() {
			res.status(500).send();
		});
});

app.put('/node/:id', function(req, res) {
	Nodes
		.update(req.params.id, req.body)
		.then(function(node) {
			res.send(node);
		}, function() {
			res.status(500).send();
		});
});

app.post('/node/:id/dependency', function(req, res) {
	//{library, version, source}
	var dependency = req.body;
});

app.put('/node/:id/plugin/:library', function(req, res) {
	var node = storage.getItem(req.params.id),
		library = req.params.library;

	if(node) {
		if (!node.data) node.data = {plugins: {bower: []}};
		if (!node.data.plugins) node.data.plugins = {bower: []};
		if (!node.data.plugins.bower) node.data.plugins.bower = [];

		node.data.plugins.bower.push(req.params.library);
		exec('bower install ' + req.params.library, function(error, output) {
			if (!error) {
				fs.readJSON('./bower_components/' + library + '/bower.json', function(error, file) {
					if (typeof file.main === 'object') {
						//we've got options
						res.send(file.main);
					} else {
						//the file we want is in file.main
					}
				});
			}
		});
	} else {
		res.status(404).send();
	}
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