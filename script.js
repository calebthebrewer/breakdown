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

					var parent,
						$node = $scope.node,
						children = angular.copy($node.children) || [];

					//properties are inherited from parents prototype
					if (!$node.properties && $node.parent) {
						parent = Nodes.get($node.parent);
						$node.properties = parent.prototype;
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
							id: ($node.id || 0) + '.' + $node.children.length,
							label: 'Child ' + $node.children.length,
							properties: $node.prototype,
							parent: $node.id
						};

						children.push(child.id);
						save();
						addChild(child);
					};

					$scope.remove = function () {
						//first tell all your friends to remove
						$scope.$broadcast('remove', $node.id);
						$scope.$emit('remove-child', $node.id);

						remove();
					};


					function addChild(child) {
						if (typeof child !== 'object') {
							child = Nodes.get(child);
							if (!child) {
								return false;
							}
							child.properties = $node.prototype;
						}

						$node.children.push(child);
						return true;
					}

					function save() {
						Nodes.save($node.id, {
							id: $node.id,
							label: $node.label,
							prototype: $node.prototype,
							children: children
						});
					}

					function remove() {
						if (Nodes.get($node.id)) {
							Nodes.remove($node.id);
						}
					}

					function loadChildren() {
						$scope.node.children = [];
						for (var i = 0, l = children.length; i < l; i++) {
							if (!addChild(children[i])) {
								children.splice(i, 1);
								save();
							}
						}
					}
				}
			};
		}])
	.service('Nodes', function () {
		var prefix = 'node.';

		this.save = function (id, node) {
			var string = JSON.stringify(node);
			localStorage.setItem(prefix + id, string);
		};

		this.get = function (id) {
			var string = localStorage.getItem(prefix + id);
			if (string) {
				return JSON.parse(string);
			} else {
				return false;
			}
		};

		this.remove = function (id) {
			localStorage.removeItem(prefix + id);
		};

		this.flush = function () {
			localStorage.clear();
		};
	})
	.controller('home', [
		'$scope',
		'Nodes',
		function ($scope, Nodes) {

			var node;
			try {
				node = Nodes.get('0');
			} catch (e) {
			}

			$scope.node = node || {
				id: 0,
				label: 'Bob',
				children: []
			};

			$scope.flush = function () {
				Nodes.flush();
			};
		}]);
