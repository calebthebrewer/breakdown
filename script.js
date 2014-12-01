angular
	.module('breakdown', [])
	.directive('node', function() {
		return {
			scope: {
				node: '=data'
			},
			templateUrl: 'node.html',
			link: function($scope) {

				var parent,
					$node = $scope.node,
					children = angular.copy($node.children) || [];

				//properties are inherited from parents prototype
				if (!$node.properties && $node.parent) {
					parent = JSON.parse(localStorage.getItem('node.' + $node.parent));
					$node.properties = parent.prototype;
				} else if (!$node.properties) {
					$node.properties = {};
				}

				//the prototype is modified locally
				$node.prototype = $node.prototype || {};

				//load children
				loadChildren();

				save();

				$scope.$on('remove', function(event, childId) {
					if (childId === $node.id) return;

					remove(true);
				});

				$scope.$on('remove-child', function(event, childId) {
					var childIndex = children.indexOf(childId);
					if (childIndex > 0) {
						children.splice(childIndex, 1);
						save();
						loadChildren();
					}
				});

				$scope.addPrototype = function() {
					$node.prototype[$scope.property] = $scope.value;
					$scope.property = '';
					$scope.value = '';

					save();
				};

				$scope.removePrototype = function(key) {
					delete $node.prototype[key];

					save();
				};

				$scope.addChild = function() {
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

				$scope.remove = remove;

				function addChild(child) {
					if (typeof child !== 'object') {
						child = JSON.parse(localStorage.getItem('node.' + child));
						if (child === null) {
							return false;
						}
						child.properties = $node.prototype;
					}

					$node.children.push(child);
					return true;
				}

				function save() {
					localStorage.setItem('node.' + $node.id, JSON.stringify({
						id: $node.id,
						label: $node.label,
						prototype: $node.prototype,
						children: children
					}));

					$scope.$emit('change');
				}

				function remove(dontEmit) {
					if (localStorage.getItem('node.' + $node.id)) {
						localStorage.removeItem('node.' + $node.id);
						$scope.$broadcast('remove', $node.id);
					}
					if (!dontEmit) {
						$scope.$emit('remove-child', $node.id);
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
	})
	.controller('home', ['$scope', function($scope) {

		var node;
		try {
			node = JSON.parse(localStorage.getItem('node.0'));
		} catch (e) {
		}

		$scope.node = node || {
			id: 0,
			label: 'Bob',
			children: []
		};

		$scope.flush = function() {
			localStorage.clear();
		};
	}]);
