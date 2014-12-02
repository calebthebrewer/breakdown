var q = require('q'),
	_ = require('lodash'),
	storage = require('node-fs-extra');

var _node = {
	parent: 0,
	children: [],
	prototype: {},
	dependencies: {}
};

module.exports = {
	create: create,
	read: read,
	update: update,
	remove: remove
};

function create(node) {
	var d = q.defer();

	_node.id = new Date().getTime();
	node = _.default(node, _node);
	storage.setItem(id, node);
	d.resolve(node);

	return d.promise;
}

function read(id) {
	var d = q.defer();

	var node = storage.getItem(id);
	if (node) {
		d.resolve(node);
	} else {
		d.reject();
	}

	return d.promise;

}

function update(id, node) {
	var d = q.defer();

	storage.setItem(id, node);
	d.resolve(node);

	return d.promise;
}

function remove(id) {
	var d = q.defer();

	storage.removeItem(id);
	d.resolve();

	return d.promise;
}