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
					if (!$node.properties && $node.parent) {
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
							id: ($node.id || 0) + '-' + $node.children.length,
							label: 'Child ' + $node.children.length,
							properties: $node.prototype,
							parent: $node.id
						};

						children.push(child.id);
						$node.children.push(child);
						save();
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
									$node.children.push(child);
								}, function() {
									children.splice(i, 1);
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
					save: save,
					get: get,
					remove: remove,
					flush: flush
				},
				prefix = 'node.';

			function save(id, node) {
				var d = $q.defer();

				$http
					.post('/node/' + id, node)
					.success(function() {
						d.resolve();
					}, function() {
						d.reject();
					});

				return d.promise;
			}

			function get(id) {
				var d = $q.defer();

				$http
					.get('/node/' + id)
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
				.get(0)
				.then(function(node) {
					$scope.node = node;
				}, function(error) {
					$scope.node = {
						id: 0,
						label: 'Bob',
						children: []
					};
				});

			$scope.flush = function () {
				Nodes.flush();
			};
		}]);
