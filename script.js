angular
	.module('breakdown', [])
	.directive('node', [
		'Nodes',
		function (Nodes) {
			return {
				scope: {
					node: '=data'
				},
				templateUrl: 'node.html',
				link: function ($scope) {

					var $node = $scope.node,
						children = angular.copy($node.children) || [];

					//properties are inherited from parents prototype
					if ($node.parent !== undefined) {
						Nodes
							.get($node.parent)
							.then(function(parent) {
								$node.properties = parent.prototype;
							}, function() {
								$node.properties = {};
							});
					} else if (!$node.properties) {
						$node.properties = {};
					}

					//the prototype is modified locally
					$node.prototype = $node.prototype || {};

					//load children
					loadChildren();

					//save yourself
					save();

					$scope.$on('remove', function (event, childId) {
						//if I triggered the remove, don't make me do it again
						if (childId === $node.id) {
							return;
						}

						remove();
					});

					$scope.$on('remove-child', function (event, childId) {
						//if I triggered the remove-child, I should ignore it
						if (childId === $node.id) {
							return;
						}
						//these events are targetted to a parent and should be captured
						event.stopPropagation();
						var childIndex = children.indexOf(childId);
						if (childIndex > 0) {
							children.splice(childIndex, 1);
							save();
							//slice it out of the scope manually
							for (var i = 0, l = $node.children.length; i < l; i++) {
								if ($node.children[i].id === childId) {
									$node.children.splice(i, 1);
								}
							}
						}
					});

					$scope.addPlugin = function() {
						Nodes.plugin($node.id, $scope.plugin);
					};

					$scope.addPrototype = function () {
						$node.prototype[$scope.property] = $scope.value;
						$scope.property = '';
						$scope.value = '';

						save();
					};

					$scope.removePrototype = function (key) {
						delete $node.prototype[key];

						save();
					};

					$scope.addChild = function () {
						var child = {
							label: 'Child ' + $node.children.length,
							properties: $node.prototype,
							parent: $node.id
						};

						Nodes
							.create(child)
							.then(function(node) {
								children.push(node.id);
								$node.children.push(node);
								save();
							}, function() {
								//uh what?
							});
					};

					$scope.remove = function () {
						//first tell all your friends to remove
						$scope.$broadcast('remove', $node.id);
						$scope.$emit('remove-child', $node.id);

						remove();
					};

					function save() {
						Nodes.save($node.id, {
							id: $node.id,
							label: $node.label,
							prototype: $node.prototype,
							children: children
						});
					}

					function remove() {
						Nodes.remove($node.id);
					}

					function loadChildren() {
						$scope.node.children = [];
						for (var i = 0, l = children.length; i < l; i++) {
							Nodes
								.get(children[i])
								.then(function(child) {
									child.properties = $node.prototype;
									$node.children.push(child);
								}, function(id) {
									children.splice(children.indexOf(id), 1);
									save();
								});
						}
					}
				}
			};
		}])
	.factory('Nodes', [
		'$q',
		'$http',
		function ($q, $http) {
			var Nodes = {
					create: create,
					save: save,
					get: get,
					plugin: plugin,
					remove: remove,
					flush: flush
				};

			var _nodes = {};

			function create(node) {
				var d = $q.defer();

				$http
					.post('/node', node)
					.success(function(node) {
						_nodes[node.id] = node;
						d.resolve(node);
					}, function() {
						d.reject();
					});

				return d.promise;
			}

			function save(id, node) {
				var d = $q.defer();

				_nodes[node.id] = node;
				$http
					.put('/node/' + id, node)
					.success(function() {
						d.resolve();
					}, function() {
						d.reject();
					});

				return d.promise;
			}

			function get(id) {
				var d = $q.defer();

				if (_nodes[id]) {
					d.resolve(_nodes[id]);
				} else {
					$http
						.get('/node/' + id)
						.success(function(node) {
							d.resolve(node);
						})
						.error(function() {
							d.reject();
						});
				}

				return d.promise;
			}

			function plugin(id, library) {
				var d = $q.defer();

				$http
					.put('/node/' + id + '/plugin/' + library)
					.success(function(node) {
						d.resolve(node);
					})
					.error(function() {
						d.reject();
					});

				return d.promise;
			}

			function remove(id) {
				var d = $q.defer();

				_nodes[id] = undefined;
				$http
					.delete('/node/' + id)
					.success(function(node) {
						d.resolve(node);
					})
					.error(function() {
						d.reject();
					});

				return d.promise;
			}

			function flush() {
				var d = $q.defer();

				localStorage.clear();
				d.resolve();

				return d.promise;
			}

			return Nodes;
		}])
	.controller('home', [
		'$scope',
		'Nodes',
		function ($scope, Nodes) {

			Nodes
				.get(1)
				.then(function(node) {
					$scope.node = node;
				}, function(error) {
					$scope.node = {
						id: 1,
						label: 'Bob',
						children: [],
						prototype: {}
					};
				});

			$scope.flush = function () {
				Nodes.flush();
			};
		}]);
