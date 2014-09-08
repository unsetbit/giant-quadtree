!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.GiantQuadtree=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

module.exports = Node;

function Node(left, top, width, height, parent){
	this.objects = [];

	this.left = left;
	this.top = top;
	this.width = width;
	this.height = height;
	this.right = this.left + this.width;
	this.bottom = this.top + this.height;
	this.isBase = (this.width / 2) < this.minimumSize;

	this.parent = parent;
}

Node.prototype.tl = void 0;
Node.prototype.tr = void 0;
Node.prototype.br = void 0;
Node.prototype.bl = void 0;

Node.prototype.objectLimit = 200;
Node.prototype.minimumSize = 3000;

Node.prototype.clear = function(){
	this.objects = [];

	if(this.tl){
		this.tl.clear();
		this.tr.clear();
		this.br.clear();
		this.bl.clear();
	}
};

Node.prototype.getObjects = function(){
	if(this.tl){
		return this.objects.concat(this.tl.getObjects(), this.tr.getObjects(), this.br.getObjects(), this.bl.getObjects());
	} else {
		return this.objects.slice();
	}
};

Node.prototype.split = function(){
	var childWidth = this.width / 2,
		childHeight = this.height / 2,
		left = this.left,
		top = this.top;

	this.tl = new Node(left, top, childWidth, childHeight, this);
	this.tr = new Node(left + childWidth, top, childWidth, childHeight, this);
	this.br = new Node(left + childWidth, top + childHeight, childWidth, childHeight, this);
	this.bl = new Node(left, top + childHeight, childWidth, childHeight, this);
};

// This can be called from ANY node in the tree, it'll return the top most node of the tree
// that can contain the element (it will grow the tree if nescessary)
Node.prototype.parentNode = function(obj){
	var node = this,
		parent;

	// If object is left of this node
	if(obj.left < node.left){
		// If object is to the top of this node
		if(obj.top < node.top){
			// Grow towards top left
			parent = node.grow(node.width, node.height);
		} else {
			// Grow towards bottom left
			parent = node.grow(node.width, 0);
		}
	// If object is right of this node
	} else if(obj.left + obj.width > node.left + node.width){
		// If object is to the top of this node
		if(obj.top < node.top){
			// Grow towards top right
			parent = node.grow(0, node.height);
		} else {
			// Grow towards bottom right
			parent = node.grow(0, 0);
		} 

	// If object is within x-axis but top of node
	} else if(obj.top < node.top){
		// Grow towards top right (top left is just as valid though)
		parent = node.grow(0, node.height);
	// If object is within x-axis but bottom of node
	} else if(obj.top + obj.height > node.top + node.height){
		// Grow towards bottom right (bottom left is just as valid though)
		parent = node.grow(0, 0);
	}
	
	// If we had to grow, find the quadrant in the parent
	if(parent){
		return parent.parentNode(obj);
	}

	return node;
};

// Helper function which gets the quadrant node at a given x/y position
// caller function has to check to see if this node is split before calling this
Node.prototype.getQuadrantAt = function(x, y){
	if(!this.tl) return this;

	var xMid = this.left + this.width / 2,
		yMid = this.top + this.height / 2;

	if(x < xMid){
		if(y < yMid){
			return this.tl.tl && this.tl.getQuadrantAt(x, y) || this.tl;
		} else {
			return this.bl.tl && this.bl.getQuadrantAt(x, y) || this.bl;
		}
	} else {
		if(y < yMid){
			return this.tr.tl && this.tr.getQuadrantAt(x, y) || this.tr;
		} else {
			return this.br.tl && this.br.getQuadrantAt(x, y) || this.br;
		}
	}
};

// Gets all the objects in quadrants within the given dimensions. 
// This assumes that the given dimensions can't be larger than a quadrant, 
// meaning it can at most touch 4 quadrants
Node.prototype.getInteractableObjects = function(left, top, width, height){
	if(!this.tl) return this.objects.slice();	

	var node = this.getQuadrant(left, top, width, height),
		objectsList = [node.objects],
		quadrants = [node], // Keeps track to prevent dupes
		parent = node.parent;

	while(parent){
		objectsList.push(parent.objects);
		quadrants.push(parent);
		parent = parent.parent;
	}

	if(node.tl){
		// top left corner
		var quadrant = node.getQuadrantAt(left, top);
		if(!~quadrants.indexOf(quadrant)){
			quadrants.push(quadrant);
			objectsList.push(quadrant.objects);

			if(quadrant.parent && !~quadrants.indexOf(quadrant.parent)){
				quadrants.push(quadrant.parent);
				objectsList.push(quadrant.parent.objects);	
			}
		}
		
		// top right corner
		quadrant = node.getQuadrantAt(left + width, top);
		if(!~quadrants.indexOf(quadrant)){
			quadrants.push(quadrant);
			objectsList.push(quadrant.objects);

			if(quadrant.parent && !~quadrants.indexOf(quadrant.parent)){
				quadrants.push(quadrant.parent);
				objectsList.push(quadrant.parent.objects);	
			}
		}

		// bottom right corner
		quadrant = node.getQuadrantAt(left + width, top + height);
		if(!~quadrants.indexOf(quadrant)){
			quadrants.push(quadrant);
			objectsList.push(quadrant.objects);

			if(quadrant.parent && !~quadrants.indexOf(quadrant.parent)){
				quadrants.push(quadrant.parent);
				objectsList.push(quadrant.parent.objects);	
			}
		}

		// bottom left corner
		quadrant = node.getQuadrantAt(left, top + height);
		if(!~quadrants.indexOf(quadrant)){
			quadrants.push(quadrant);
			objectsList.push(quadrant.objects);
			if(quadrant.parent && !~quadrants.indexOf(quadrant.parent)) objectsList.push(quadrant.parent.objects);
		}
	}

	return Array.prototype.concat.apply([], objectsList);
};

// Gets the quadrant a given bounding box dimensions would be inserted into
Node.prototype.getQuadrant = function(left, top, width, height){
	if(!this.tl) return this;

	var	xMid = this.left + this.width / 2,
		yMid = this.top + this.height / 2,
		topQuadrant = (top < yMid) && ((top + height) < yMid),
		bottomQuadrand = top > yMid;

	if((left < xMid) && ((left + width) < xMid)){
		if(topQuadrant){
			return this.tl.tl && this.tl.getQuadrant(left, top, width, height) || this.tl;
		} else if(bottomQuadrand){
			return this.bl.tl && this.bl.getQuadrant(left, top, width, height) || this.bl;
		}
	} else if(left > xMid){
		if(topQuadrant){
			return this.tr.tl && this.tr.getQuadrant(left, top, width, height) || this.tr;
		} else if(bottomQuadrand) {
			return this.br.tl && this.br.getQuadrant(left, top, width, height) || this.br;
		}
	}

	return this;
};

// Inserts the object to the Node, spliting or growing the tree if nescessary
// Returns the top-most node of this tree
Node.prototype.insert = function(obj){
	var quadrant,
		index,
		length,
		remainingObjects,
		objects,
		node;

	// This call will grow the tree if nescessary and return the parent node
	// if the tree doesn't need to grow, `node` will be `this`.
	node = this.parentNode(obj);
	quadrant = node.getQuadrant(obj.left, obj.top, obj.width, obj.height);

	if(quadrant !== node){
		quadrant.insert(obj);
	} else {
		objects = node.objects;
		objects.push(obj);

		index = 0;
		length = objects.length;
		if(!this.isBase && length > node.objectLimit){
			// Split if not already split
			if(!node.tl) node.split();

			// For objects that don't fit to quadrants
			remainingObjects = [];
		
			// Iterate through all object and try to put them in a
			// Quadrant node, if that doesn't work, retain them	
			for(; index < length; index++){

				// Reusing the obj var
				obj = node.objects[index];
				quadrant = node.getQuadrant(obj.left, obj.top, obj.width, obj.height);
				if(quadrant !== node){
					quadrant.insert(obj);
				} else {
					remainingObjects.push(obj);
				}
			}

			node.objects = remainingObjects;
		}
	}

	return node;
};

// Creates a pre-split parent Node and attaches this Node as a
// node at the given x/y offset (so 0,0 would make this Node the top left node)
Node.prototype.grow = function(xOffset, yOffset){
	var left = this.left - xOffset,
		top = this.top - yOffset,
		parent = new Node(left, top, this.width * 2, this.height * 2);
	
	this.parent = parent;

	if(xOffset){
		if(yOffset){
			parent.br = this;
		} else {
			parent.tr = this;
		}
	} else if(yOffset) {
		parent.bl = this;
	} else {
		parent.tl = this;
	}

	parent.tl = parent.tl || new Node(left, top, this.width, this.height, this);
	parent.tr = parent.tr || new Node(left + this.width, top, this.width, this.height, this);
	parent.br = parent.br || new Node(left + this.width, top + this.height, this.width, this.height, this);
	parent.bl = parent.bl || new Node(left, top + this.height, this.width, this.height, this);

	return parent;
};


},{}],2:[function(_dereq_,module,exports){
'use strict';

var TreeNode = _dereq_('./node');

/* Quadtree by Ozan Turgut (ozanturgut@gmail.com)

   A Quadtree is a structure for managing many nodes interacting in space by
   organizing them within a tree, where each node contains elements which may
   interact with other elements within the node. This is particularly useful in
   collision detection, in which a brute-force algorithm requires the checking of
   every element against every other element, regardless of their distance in space.

   This quadtree handles object in 2d space by their bounding boxes. It splits
   a node once it exceeds the object limit per-node. When a node is split, it's
   contents are divied up in to 4 smaller nodes to fulfill the per-node object limit.
   Nodes are infinitely divisible.

   If an object is inserted which exceeds the bounds of this quadtree, the quadtree
   will grow in the direction the object was inserted in order to encapsulate it. This is
   similar to a node split, except in this case we create a parent node and assign the existing
   quadtree as a quadrant within it. This allows the quadtree to contain any object, regardless of
   its position in space.

   One function is exported which creates a quadtree given a width and height.

   The quadtree api has two methods:

   insert(bounds)
   		Inserts a bounding box (it should contain an left, top, width, and height property).

   	retrieve(bounds)
   		Retrieves a list of bounding boxes that share a node with the given bounds object.
*/

var Quadtree = module.exports = function(width, height){
	if(width){
		this.width = width;
		this.height = height? height : width;
	}
	
	this.reset();
};

Quadtree.create = function(width, height){
	var quadtree = new Quadtree(width, height);
	return Quadtree.getApi(quadtree);
};

Quadtree.getApi = function(quadtree){
	var api = {};
	api.insert = quadtree.insert.bind(quadtree);
	api.reset = quadtree.reset.bind(quadtree);
	api.getObjects = quadtree.getObjects.bind(quadtree);
	api.get = api.getObjects; // alias
	api.prune = quadtree.prune.bind(quadtree);

	return api;
};

Quadtree.prototype.width = 10000;
Quadtree.prototype.height = 10000;

Quadtree.prototype.reset = function(x, y){
	x = x || 0;
	y = y || 0;

	this.top = new TreeNode(x, y, this.width, this.height);
};

Quadtree.prototype.insert = function(obj){
	this.top = this.top.insert(obj);
};

/*
function isInNode(node, left, top, right, bottom){
	return node.left <= left && node.top <= top && node.right >= right && node.bottom >= bottom;
}
*/

function getContainingNodeHelper(left, top, right, bottom, node){
	if(!node.tl) return node;

	if(left < node.tr.left){
		if(right < node.tr.left){
			if(bottom < node.bl.top){
				return getContainingNodeHelper(left, top, right, bottom, node.tl);
			} else if(top > node.bl.top) {
				return getContainingNodeHelper(left, top, right, bottom, node.bl);
			}
		}
	} else {
		if(bottom < node.br.top){
			return getContainingNodeHelper(left, top, right, bottom, node.tr);
		} else if(top > node.br.top) {
			return getContainingNodeHelper(left, top, right, bottom, node.br);
		}
	}

	return node;
}

Quadtree.prototype.getContainingNode = function(left, top, right, bottom){
	if(left < this.top.left || 
		top < this.top.top || 
		right > this.top.right || 
		bottom > this.top.bottom){
		return;	
	}

	return getContainingNodeHelper(left, top, right, bottom, this.top);
};

Quadtree.prototype.minimumSize = 3000;
Quadtree.prototype.getInteractableObjects = function(left, top, right, bottom){
	var self = this,
		minimumSize = this.minimumSize,
		tl = this.getContainingNode(left, top, left + 1, top + 1),
		tr,
		bl,
		br,
		objectsList = tl ? [tl.getObjects()] : [];

	function addAncestorElements(left, top, right, bottom){
		var ancestor = self.getContainingNode(left, top, right, bottom);
		if(ancestor && !~objectsList.indexOf(ancestor.objects)) objectsList.push(ancestor.objects);
	}

	if(!tl || tl.right < right){
		tr = this.getContainingNode(right - 1, top, right, top + 1);
		if(tr) objectsList.push(tr.getObjects());
		else tr = tl;
	} else {
		tr = tl;
	}

	if(!tl || tl.bottom < bottom){
		bl = this.getContainingNode(left, bottom - 1, left + 1, bottom);
		if(bl) objectsList.push(bl.getObjects());
		else bl = tl;
	} else {
		bl = tl;
	}

	if(!tr || tr.bottom < bottom){
		if(!bl || bl.right < right){
			br = this.getContainingNode(right - 1, bottom - 1, right, bottom);
			if(br) objectsList.push(br.getObjects());
			else br = bl;
		} else {
			br = bl;
		}
	} else {
		br = tr;
	}
	
	if(tl !== tr) addAncestorElements(left, top, right, top + 1);
	if(tr !== br) addAncestorElements(right - 1, top, right, bottom);
	if(br !== bl) addAncestorElements(left, bottom - 1, right, bottom);
	if(bl !== tl) addAncestorElements(left, top, left + 1, bottom);
		
	// Intersections towards top left
	if(tl){
		if((left - minimumSize) < tl.left){
			addAncestorElements(left - minimumSize, top, left + 1, top + 1);
		}

		if((top - minimumSize) < tl.top){
			addAncestorElements(left, top - minimumSize, left + 1, top + 1);
		}
	}
	
	// Intersections towards top right
	if(tr){
		if(tr !== tl && (top - minimumSize) < tr.top){
			addAncestorElements(right - 1, top - minimumSize, right, top + 1);
		}

		if((right + minimumSize) > tr.right){
			addAncestorElements(right - 1, top, right + minimumSize, top + 1);
		}
	}

	// Intersections towards bottom right
	if(br){
		if(br !== tr && (right + minimumSize) > br.right){
			addAncestorElements(right - 1, bottom - 1, right + minimumSize, bottom);
		}

		if((bottom + minimumSize) > br.bottom){
			addAncestorElements(right - 1, bottom - 1, right, bottom + minimumSize);
		}
	}

	// Intersections towards bottom left
	if(bl){
		if(bl !== br && (bottom + minimumSize) > bl.bottom){
			addAncestorElements(left, bottom - 1, left + 1, bottom + minimumSize);
		}

		if(bl !== tl && (left - minimumSize) < bl.left){
			addAncestorElements(left - minimumSize, bottom - 1, left + 1, bottom);
		}
	}

	return Array.prototype.concat.apply([], objectsList);
};

Quadtree.prototype.getObjects = function(left, top, width, height){
	if(left !== void 0){
		var bottom = top + height,
			right = left + width,
			rectangles = this.getInteractableObjects(left, top, right, bottom),
			rectangleIndex = rectangles.length,
			result = [],
			rectangle;

		while(rectangleIndex--){
			rectangle = rectangles[rectangleIndex];
			
			// If there is intersection along the y-axis
			if(	(top <= rectangle.top ?
					(bottom >= rectangle.top) :
					(rectangle.bottom >= top)) && 
				// And if there is intersection along the x-axis
				(left <= rectangle.left ? 
					(right >= rectangle.left) :
					(rectangle.right >= left))){

				
				result.push(rectangle);
			}
		}
		
		return result;
	}

	return this.top.getObjects();
};

Quadtree.prototype.prune = function(left, top, width, height){
	var right = left + width,
		bottom = top + height,
		candidate,
		rejectedObjects = [],
		keptObjects = [];

	var objects = this.top.getObjects(),
		index = 0,
		length = objects.length;

	for(; index < length; index++){
		candidate = objects[index];

		if(	candidate.left < left || 
			candidate.top < top || 
			(candidate.left + candidate.width) > right ||
			(candidate.top + candidate.height) > bottom){
			rejectedObjects.push(candidate);
		} else {
			keptObjects.push(candidate);
		}
	}
	if(keptObjects.length){
		this.reset(keptObjects[0].left, keptObjects[0].top);
		index = 0;
		length = keptObjects.length;
		for(; index < length; index++){
			this.insert(keptObjects[index]);
		}
	} else {
		this.reset();
	}
	
	return rejectedObjects;
};

},{"./node":1}]},{},[2])

(2)
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9vemFuL2NvZGUvZ2lhbnQtcXVhZHRyZWUvbm9kZV9tb2R1bGVzL2JvaWxlcnBsYXRlLWd1bHAvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9vemFuL2NvZGUvZ2lhbnQtcXVhZHRyZWUvc3JjL25vZGUuanMiLCIvVXNlcnMvb3phbi9jb2RlL2dpYW50LXF1YWR0cmVlL3NyYy9xdWFkdHJlZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiR2lhbnRRdWFkdHJlZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5vZGU7XG5cbmZ1bmN0aW9uIE5vZGUobGVmdCwgdG9wLCB3aWR0aCwgaGVpZ2h0LCBwYXJlbnQpe1xuXHR0aGlzLm9iamVjdHMgPSBbXTtcblxuXHR0aGlzLmxlZnQgPSBsZWZ0O1xuXHR0aGlzLnRvcCA9IHRvcDtcblx0dGhpcy53aWR0aCA9IHdpZHRoO1xuXHR0aGlzLmhlaWdodCA9IGhlaWdodDtcblx0dGhpcy5yaWdodCA9IHRoaXMubGVmdCArIHRoaXMud2lkdGg7XG5cdHRoaXMuYm90dG9tID0gdGhpcy50b3AgKyB0aGlzLmhlaWdodDtcblx0dGhpcy5pc0Jhc2UgPSAodGhpcy53aWR0aCAvIDIpIDwgdGhpcy5taW5pbXVtU2l6ZTtcblxuXHR0aGlzLnBhcmVudCA9IHBhcmVudDtcbn1cblxuTm9kZS5wcm90b3R5cGUudGwgPSB2b2lkIDA7XG5Ob2RlLnByb3RvdHlwZS50ciA9IHZvaWQgMDtcbk5vZGUucHJvdG90eXBlLmJyID0gdm9pZCAwO1xuTm9kZS5wcm90b3R5cGUuYmwgPSB2b2lkIDA7XG5cbk5vZGUucHJvdG90eXBlLm9iamVjdExpbWl0ID0gMjAwO1xuTm9kZS5wcm90b3R5cGUubWluaW11bVNpemUgPSAzMDAwO1xuXG5Ob2RlLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCl7XG5cdHRoaXMub2JqZWN0cyA9IFtdO1xuXG5cdGlmKHRoaXMudGwpe1xuXHRcdHRoaXMudGwuY2xlYXIoKTtcblx0XHR0aGlzLnRyLmNsZWFyKCk7XG5cdFx0dGhpcy5ici5jbGVhcigpO1xuXHRcdHRoaXMuYmwuY2xlYXIoKTtcblx0fVxufTtcblxuTm9kZS5wcm90b3R5cGUuZ2V0T2JqZWN0cyA9IGZ1bmN0aW9uKCl7XG5cdGlmKHRoaXMudGwpe1xuXHRcdHJldHVybiB0aGlzLm9iamVjdHMuY29uY2F0KHRoaXMudGwuZ2V0T2JqZWN0cygpLCB0aGlzLnRyLmdldE9iamVjdHMoKSwgdGhpcy5ici5nZXRPYmplY3RzKCksIHRoaXMuYmwuZ2V0T2JqZWN0cygpKTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gdGhpcy5vYmplY3RzLnNsaWNlKCk7XG5cdH1cbn07XG5cbk5vZGUucHJvdG90eXBlLnNwbGl0ID0gZnVuY3Rpb24oKXtcblx0dmFyIGNoaWxkV2lkdGggPSB0aGlzLndpZHRoIC8gMixcblx0XHRjaGlsZEhlaWdodCA9IHRoaXMuaGVpZ2h0IC8gMixcblx0XHRsZWZ0ID0gdGhpcy5sZWZ0LFxuXHRcdHRvcCA9IHRoaXMudG9wO1xuXG5cdHRoaXMudGwgPSBuZXcgTm9kZShsZWZ0LCB0b3AsIGNoaWxkV2lkdGgsIGNoaWxkSGVpZ2h0LCB0aGlzKTtcblx0dGhpcy50ciA9IG5ldyBOb2RlKGxlZnQgKyBjaGlsZFdpZHRoLCB0b3AsIGNoaWxkV2lkdGgsIGNoaWxkSGVpZ2h0LCB0aGlzKTtcblx0dGhpcy5iciA9IG5ldyBOb2RlKGxlZnQgKyBjaGlsZFdpZHRoLCB0b3AgKyBjaGlsZEhlaWdodCwgY2hpbGRXaWR0aCwgY2hpbGRIZWlnaHQsIHRoaXMpO1xuXHR0aGlzLmJsID0gbmV3IE5vZGUobGVmdCwgdG9wICsgY2hpbGRIZWlnaHQsIGNoaWxkV2lkdGgsIGNoaWxkSGVpZ2h0LCB0aGlzKTtcbn07XG5cbi8vIFRoaXMgY2FuIGJlIGNhbGxlZCBmcm9tIEFOWSBub2RlIGluIHRoZSB0cmVlLCBpdCdsbCByZXR1cm4gdGhlIHRvcCBtb3N0IG5vZGUgb2YgdGhlIHRyZWVcbi8vIHRoYXQgY2FuIGNvbnRhaW4gdGhlIGVsZW1lbnQgKGl0IHdpbGwgZ3JvdyB0aGUgdHJlZSBpZiBuZXNjZXNzYXJ5KVxuTm9kZS5wcm90b3R5cGUucGFyZW50Tm9kZSA9IGZ1bmN0aW9uKG9iail7XG5cdHZhciBub2RlID0gdGhpcyxcblx0XHRwYXJlbnQ7XG5cblx0Ly8gSWYgb2JqZWN0IGlzIGxlZnQgb2YgdGhpcyBub2RlXG5cdGlmKG9iai5sZWZ0IDwgbm9kZS5sZWZ0KXtcblx0XHQvLyBJZiBvYmplY3QgaXMgdG8gdGhlIHRvcCBvZiB0aGlzIG5vZGVcblx0XHRpZihvYmoudG9wIDwgbm9kZS50b3Ape1xuXHRcdFx0Ly8gR3JvdyB0b3dhcmRzIHRvcCBsZWZ0XG5cdFx0XHRwYXJlbnQgPSBub2RlLmdyb3cobm9kZS53aWR0aCwgbm9kZS5oZWlnaHQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBHcm93IHRvd2FyZHMgYm90dG9tIGxlZnRcblx0XHRcdHBhcmVudCA9IG5vZGUuZ3Jvdyhub2RlLndpZHRoLCAwKTtcblx0XHR9XG5cdC8vIElmIG9iamVjdCBpcyByaWdodCBvZiB0aGlzIG5vZGVcblx0fSBlbHNlIGlmKG9iai5sZWZ0ICsgb2JqLndpZHRoID4gbm9kZS5sZWZ0ICsgbm9kZS53aWR0aCl7XG5cdFx0Ly8gSWYgb2JqZWN0IGlzIHRvIHRoZSB0b3Agb2YgdGhpcyBub2RlXG5cdFx0aWYob2JqLnRvcCA8IG5vZGUudG9wKXtcblx0XHRcdC8vIEdyb3cgdG93YXJkcyB0b3AgcmlnaHRcblx0XHRcdHBhcmVudCA9IG5vZGUuZ3JvdygwLCBub2RlLmhlaWdodCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIEdyb3cgdG93YXJkcyBib3R0b20gcmlnaHRcblx0XHRcdHBhcmVudCA9IG5vZGUuZ3JvdygwLCAwKTtcblx0XHR9IFxuXG5cdC8vIElmIG9iamVjdCBpcyB3aXRoaW4geC1heGlzIGJ1dCB0b3Agb2Ygbm9kZVxuXHR9IGVsc2UgaWYob2JqLnRvcCA8IG5vZGUudG9wKXtcblx0XHQvLyBHcm93IHRvd2FyZHMgdG9wIHJpZ2h0ICh0b3AgbGVmdCBpcyBqdXN0IGFzIHZhbGlkIHRob3VnaClcblx0XHRwYXJlbnQgPSBub2RlLmdyb3coMCwgbm9kZS5oZWlnaHQpO1xuXHQvLyBJZiBvYmplY3QgaXMgd2l0aGluIHgtYXhpcyBidXQgYm90dG9tIG9mIG5vZGVcblx0fSBlbHNlIGlmKG9iai50b3AgKyBvYmouaGVpZ2h0ID4gbm9kZS50b3AgKyBub2RlLmhlaWdodCl7XG5cdFx0Ly8gR3JvdyB0b3dhcmRzIGJvdHRvbSByaWdodCAoYm90dG9tIGxlZnQgaXMganVzdCBhcyB2YWxpZCB0aG91Z2gpXG5cdFx0cGFyZW50ID0gbm9kZS5ncm93KDAsIDApO1xuXHR9XG5cdFxuXHQvLyBJZiB3ZSBoYWQgdG8gZ3JvdywgZmluZCB0aGUgcXVhZHJhbnQgaW4gdGhlIHBhcmVudFxuXHRpZihwYXJlbnQpe1xuXHRcdHJldHVybiBwYXJlbnQucGFyZW50Tm9kZShvYmopO1xuXHR9XG5cblx0cmV0dXJuIG5vZGU7XG59O1xuXG4vLyBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggZ2V0cyB0aGUgcXVhZHJhbnQgbm9kZSBhdCBhIGdpdmVuIHgveSBwb3NpdGlvblxuLy8gY2FsbGVyIGZ1bmN0aW9uIGhhcyB0byBjaGVjayB0byBzZWUgaWYgdGhpcyBub2RlIGlzIHNwbGl0IGJlZm9yZSBjYWxsaW5nIHRoaXNcbk5vZGUucHJvdG90eXBlLmdldFF1YWRyYW50QXQgPSBmdW5jdGlvbih4LCB5KXtcblx0aWYoIXRoaXMudGwpIHJldHVybiB0aGlzO1xuXG5cdHZhciB4TWlkID0gdGhpcy5sZWZ0ICsgdGhpcy53aWR0aCAvIDIsXG5cdFx0eU1pZCA9IHRoaXMudG9wICsgdGhpcy5oZWlnaHQgLyAyO1xuXG5cdGlmKHggPCB4TWlkKXtcblx0XHRpZih5IDwgeU1pZCl7XG5cdFx0XHRyZXR1cm4gdGhpcy50bC50bCAmJiB0aGlzLnRsLmdldFF1YWRyYW50QXQoeCwgeSkgfHwgdGhpcy50bDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRoaXMuYmwudGwgJiYgdGhpcy5ibC5nZXRRdWFkcmFudEF0KHgsIHkpIHx8IHRoaXMuYmw7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGlmKHkgPCB5TWlkKXtcblx0XHRcdHJldHVybiB0aGlzLnRyLnRsICYmIHRoaXMudHIuZ2V0UXVhZHJhbnRBdCh4LCB5KSB8fCB0aGlzLnRyO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5ici50bCAmJiB0aGlzLmJyLmdldFF1YWRyYW50QXQoeCwgeSkgfHwgdGhpcy5icjtcblx0XHR9XG5cdH1cbn07XG5cbi8vIEdldHMgYWxsIHRoZSBvYmplY3RzIGluIHF1YWRyYW50cyB3aXRoaW4gdGhlIGdpdmVuIGRpbWVuc2lvbnMuIFxuLy8gVGhpcyBhc3N1bWVzIHRoYXQgdGhlIGdpdmVuIGRpbWVuc2lvbnMgY2FuJ3QgYmUgbGFyZ2VyIHRoYW4gYSBxdWFkcmFudCwgXG4vLyBtZWFuaW5nIGl0IGNhbiBhdCBtb3N0IHRvdWNoIDQgcXVhZHJhbnRzXG5Ob2RlLnByb3RvdHlwZS5nZXRJbnRlcmFjdGFibGVPYmplY3RzID0gZnVuY3Rpb24obGVmdCwgdG9wLCB3aWR0aCwgaGVpZ2h0KXtcblx0aWYoIXRoaXMudGwpIHJldHVybiB0aGlzLm9iamVjdHMuc2xpY2UoKTtcdFxuXG5cdHZhciBub2RlID0gdGhpcy5nZXRRdWFkcmFudChsZWZ0LCB0b3AsIHdpZHRoLCBoZWlnaHQpLFxuXHRcdG9iamVjdHNMaXN0ID0gW25vZGUub2JqZWN0c10sXG5cdFx0cXVhZHJhbnRzID0gW25vZGVdLCAvLyBLZWVwcyB0cmFjayB0byBwcmV2ZW50IGR1cGVzXG5cdFx0cGFyZW50ID0gbm9kZS5wYXJlbnQ7XG5cblx0d2hpbGUocGFyZW50KXtcblx0XHRvYmplY3RzTGlzdC5wdXNoKHBhcmVudC5vYmplY3RzKTtcblx0XHRxdWFkcmFudHMucHVzaChwYXJlbnQpO1xuXHRcdHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG5cdH1cblxuXHRpZihub2RlLnRsKXtcblx0XHQvLyB0b3AgbGVmdCBjb3JuZXJcblx0XHR2YXIgcXVhZHJhbnQgPSBub2RlLmdldFF1YWRyYW50QXQobGVmdCwgdG9wKTtcblx0XHRpZighfnF1YWRyYW50cy5pbmRleE9mKHF1YWRyYW50KSl7XG5cdFx0XHRxdWFkcmFudHMucHVzaChxdWFkcmFudCk7XG5cdFx0XHRvYmplY3RzTGlzdC5wdXNoKHF1YWRyYW50Lm9iamVjdHMpO1xuXG5cdFx0XHRpZihxdWFkcmFudC5wYXJlbnQgJiYgIX5xdWFkcmFudHMuaW5kZXhPZihxdWFkcmFudC5wYXJlbnQpKXtcblx0XHRcdFx0cXVhZHJhbnRzLnB1c2gocXVhZHJhbnQucGFyZW50KTtcblx0XHRcdFx0b2JqZWN0c0xpc3QucHVzaChxdWFkcmFudC5wYXJlbnQub2JqZWN0cyk7XHRcblx0XHRcdH1cblx0XHR9XG5cdFx0XG5cdFx0Ly8gdG9wIHJpZ2h0IGNvcm5lclxuXHRcdHF1YWRyYW50ID0gbm9kZS5nZXRRdWFkcmFudEF0KGxlZnQgKyB3aWR0aCwgdG9wKTtcblx0XHRpZighfnF1YWRyYW50cy5pbmRleE9mKHF1YWRyYW50KSl7XG5cdFx0XHRxdWFkcmFudHMucHVzaChxdWFkcmFudCk7XG5cdFx0XHRvYmplY3RzTGlzdC5wdXNoKHF1YWRyYW50Lm9iamVjdHMpO1xuXG5cdFx0XHRpZihxdWFkcmFudC5wYXJlbnQgJiYgIX5xdWFkcmFudHMuaW5kZXhPZihxdWFkcmFudC5wYXJlbnQpKXtcblx0XHRcdFx0cXVhZHJhbnRzLnB1c2gocXVhZHJhbnQucGFyZW50KTtcblx0XHRcdFx0b2JqZWN0c0xpc3QucHVzaChxdWFkcmFudC5wYXJlbnQub2JqZWN0cyk7XHRcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBib3R0b20gcmlnaHQgY29ybmVyXG5cdFx0cXVhZHJhbnQgPSBub2RlLmdldFF1YWRyYW50QXQobGVmdCArIHdpZHRoLCB0b3AgKyBoZWlnaHQpO1xuXHRcdGlmKCF+cXVhZHJhbnRzLmluZGV4T2YocXVhZHJhbnQpKXtcblx0XHRcdHF1YWRyYW50cy5wdXNoKHF1YWRyYW50KTtcblx0XHRcdG9iamVjdHNMaXN0LnB1c2gocXVhZHJhbnQub2JqZWN0cyk7XG5cblx0XHRcdGlmKHF1YWRyYW50LnBhcmVudCAmJiAhfnF1YWRyYW50cy5pbmRleE9mKHF1YWRyYW50LnBhcmVudCkpe1xuXHRcdFx0XHRxdWFkcmFudHMucHVzaChxdWFkcmFudC5wYXJlbnQpO1xuXHRcdFx0XHRvYmplY3RzTGlzdC5wdXNoKHF1YWRyYW50LnBhcmVudC5vYmplY3RzKTtcdFxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIGJvdHRvbSBsZWZ0IGNvcm5lclxuXHRcdHF1YWRyYW50ID0gbm9kZS5nZXRRdWFkcmFudEF0KGxlZnQsIHRvcCArIGhlaWdodCk7XG5cdFx0aWYoIX5xdWFkcmFudHMuaW5kZXhPZihxdWFkcmFudCkpe1xuXHRcdFx0cXVhZHJhbnRzLnB1c2gocXVhZHJhbnQpO1xuXHRcdFx0b2JqZWN0c0xpc3QucHVzaChxdWFkcmFudC5vYmplY3RzKTtcblx0XHRcdGlmKHF1YWRyYW50LnBhcmVudCAmJiAhfnF1YWRyYW50cy5pbmRleE9mKHF1YWRyYW50LnBhcmVudCkpIG9iamVjdHNMaXN0LnB1c2gocXVhZHJhbnQucGFyZW50Lm9iamVjdHMpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBvYmplY3RzTGlzdCk7XG59O1xuXG4vLyBHZXRzIHRoZSBxdWFkcmFudCBhIGdpdmVuIGJvdW5kaW5nIGJveCBkaW1lbnNpb25zIHdvdWxkIGJlIGluc2VydGVkIGludG9cbk5vZGUucHJvdG90eXBlLmdldFF1YWRyYW50ID0gZnVuY3Rpb24obGVmdCwgdG9wLCB3aWR0aCwgaGVpZ2h0KXtcblx0aWYoIXRoaXMudGwpIHJldHVybiB0aGlzO1xuXG5cdHZhclx0eE1pZCA9IHRoaXMubGVmdCArIHRoaXMud2lkdGggLyAyLFxuXHRcdHlNaWQgPSB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0IC8gMixcblx0XHR0b3BRdWFkcmFudCA9ICh0b3AgPCB5TWlkKSAmJiAoKHRvcCArIGhlaWdodCkgPCB5TWlkKSxcblx0XHRib3R0b21RdWFkcmFuZCA9IHRvcCA+IHlNaWQ7XG5cblx0aWYoKGxlZnQgPCB4TWlkKSAmJiAoKGxlZnQgKyB3aWR0aCkgPCB4TWlkKSl7XG5cdFx0aWYodG9wUXVhZHJhbnQpe1xuXHRcdFx0cmV0dXJuIHRoaXMudGwudGwgJiYgdGhpcy50bC5nZXRRdWFkcmFudChsZWZ0LCB0b3AsIHdpZHRoLCBoZWlnaHQpIHx8IHRoaXMudGw7XG5cdFx0fSBlbHNlIGlmKGJvdHRvbVF1YWRyYW5kKXtcblx0XHRcdHJldHVybiB0aGlzLmJsLnRsICYmIHRoaXMuYmwuZ2V0UXVhZHJhbnQobGVmdCwgdG9wLCB3aWR0aCwgaGVpZ2h0KSB8fCB0aGlzLmJsO1xuXHRcdH1cblx0fSBlbHNlIGlmKGxlZnQgPiB4TWlkKXtcblx0XHRpZih0b3BRdWFkcmFudCl7XG5cdFx0XHRyZXR1cm4gdGhpcy50ci50bCAmJiB0aGlzLnRyLmdldFF1YWRyYW50KGxlZnQsIHRvcCwgd2lkdGgsIGhlaWdodCkgfHwgdGhpcy50cjtcblx0XHR9IGVsc2UgaWYoYm90dG9tUXVhZHJhbmQpIHtcblx0XHRcdHJldHVybiB0aGlzLmJyLnRsICYmIHRoaXMuYnIuZ2V0UXVhZHJhbnQobGVmdCwgdG9wLCB3aWR0aCwgaGVpZ2h0KSB8fCB0aGlzLmJyO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuLy8gSW5zZXJ0cyB0aGUgb2JqZWN0IHRvIHRoZSBOb2RlLCBzcGxpdGluZyBvciBncm93aW5nIHRoZSB0cmVlIGlmIG5lc2Nlc3Nhcnlcbi8vIFJldHVybnMgdGhlIHRvcC1tb3N0IG5vZGUgb2YgdGhpcyB0cmVlXG5Ob2RlLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbihvYmope1xuXHR2YXIgcXVhZHJhbnQsXG5cdFx0aW5kZXgsXG5cdFx0bGVuZ3RoLFxuXHRcdHJlbWFpbmluZ09iamVjdHMsXG5cdFx0b2JqZWN0cyxcblx0XHRub2RlO1xuXG5cdC8vIFRoaXMgY2FsbCB3aWxsIGdyb3cgdGhlIHRyZWUgaWYgbmVzY2Vzc2FyeSBhbmQgcmV0dXJuIHRoZSBwYXJlbnQgbm9kZVxuXHQvLyBpZiB0aGUgdHJlZSBkb2Vzbid0IG5lZWQgdG8gZ3JvdywgYG5vZGVgIHdpbGwgYmUgYHRoaXNgLlxuXHRub2RlID0gdGhpcy5wYXJlbnROb2RlKG9iaik7XG5cdHF1YWRyYW50ID0gbm9kZS5nZXRRdWFkcmFudChvYmoubGVmdCwgb2JqLnRvcCwgb2JqLndpZHRoLCBvYmouaGVpZ2h0KTtcblxuXHRpZihxdWFkcmFudCAhPT0gbm9kZSl7XG5cdFx0cXVhZHJhbnQuaW5zZXJ0KG9iaik7XG5cdH0gZWxzZSB7XG5cdFx0b2JqZWN0cyA9IG5vZGUub2JqZWN0cztcblx0XHRvYmplY3RzLnB1c2gob2JqKTtcblxuXHRcdGluZGV4ID0gMDtcblx0XHRsZW5ndGggPSBvYmplY3RzLmxlbmd0aDtcblx0XHRpZighdGhpcy5pc0Jhc2UgJiYgbGVuZ3RoID4gbm9kZS5vYmplY3RMaW1pdCl7XG5cdFx0XHQvLyBTcGxpdCBpZiBub3QgYWxyZWFkeSBzcGxpdFxuXHRcdFx0aWYoIW5vZGUudGwpIG5vZGUuc3BsaXQoKTtcblxuXHRcdFx0Ly8gRm9yIG9iamVjdHMgdGhhdCBkb24ndCBmaXQgdG8gcXVhZHJhbnRzXG5cdFx0XHRyZW1haW5pbmdPYmplY3RzID0gW107XG5cdFx0XG5cdFx0XHQvLyBJdGVyYXRlIHRocm91Z2ggYWxsIG9iamVjdCBhbmQgdHJ5IHRvIHB1dCB0aGVtIGluIGFcblx0XHRcdC8vIFF1YWRyYW50IG5vZGUsIGlmIHRoYXQgZG9lc24ndCB3b3JrLCByZXRhaW4gdGhlbVx0XG5cdFx0XHRmb3IoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKyl7XG5cblx0XHRcdFx0Ly8gUmV1c2luZyB0aGUgb2JqIHZhclxuXHRcdFx0XHRvYmogPSBub2RlLm9iamVjdHNbaW5kZXhdO1xuXHRcdFx0XHRxdWFkcmFudCA9IG5vZGUuZ2V0UXVhZHJhbnQob2JqLmxlZnQsIG9iai50b3AsIG9iai53aWR0aCwgb2JqLmhlaWdodCk7XG5cdFx0XHRcdGlmKHF1YWRyYW50ICE9PSBub2RlKXtcblx0XHRcdFx0XHRxdWFkcmFudC5pbnNlcnQob2JqKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZW1haW5pbmdPYmplY3RzLnB1c2gob2JqKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRub2RlLm9iamVjdHMgPSByZW1haW5pbmdPYmplY3RzO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBub2RlO1xufTtcblxuLy8gQ3JlYXRlcyBhIHByZS1zcGxpdCBwYXJlbnQgTm9kZSBhbmQgYXR0YWNoZXMgdGhpcyBOb2RlIGFzIGFcbi8vIG5vZGUgYXQgdGhlIGdpdmVuIHgveSBvZmZzZXQgKHNvIDAsMCB3b3VsZCBtYWtlIHRoaXMgTm9kZSB0aGUgdG9wIGxlZnQgbm9kZSlcbk5vZGUucHJvdG90eXBlLmdyb3cgPSBmdW5jdGlvbih4T2Zmc2V0LCB5T2Zmc2V0KXtcblx0dmFyIGxlZnQgPSB0aGlzLmxlZnQgLSB4T2Zmc2V0LFxuXHRcdHRvcCA9IHRoaXMudG9wIC0geU9mZnNldCxcblx0XHRwYXJlbnQgPSBuZXcgTm9kZShsZWZ0LCB0b3AsIHRoaXMud2lkdGggKiAyLCB0aGlzLmhlaWdodCAqIDIpO1xuXHRcblx0dGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG5cblx0aWYoeE9mZnNldCl7XG5cdFx0aWYoeU9mZnNldCl7XG5cdFx0XHRwYXJlbnQuYnIgPSB0aGlzO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwYXJlbnQudHIgPSB0aGlzO1xuXHRcdH1cblx0fSBlbHNlIGlmKHlPZmZzZXQpIHtcblx0XHRwYXJlbnQuYmwgPSB0aGlzO1xuXHR9IGVsc2Uge1xuXHRcdHBhcmVudC50bCA9IHRoaXM7XG5cdH1cblxuXHRwYXJlbnQudGwgPSBwYXJlbnQudGwgfHwgbmV3IE5vZGUobGVmdCwgdG9wLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgdGhpcyk7XG5cdHBhcmVudC50ciA9IHBhcmVudC50ciB8fCBuZXcgTm9kZShsZWZ0ICsgdGhpcy53aWR0aCwgdG9wLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgdGhpcyk7XG5cdHBhcmVudC5iciA9IHBhcmVudC5iciB8fCBuZXcgTm9kZShsZWZ0ICsgdGhpcy53aWR0aCwgdG9wICsgdGhpcy5oZWlnaHQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzKTtcblx0cGFyZW50LmJsID0gcGFyZW50LmJsIHx8IG5ldyBOb2RlKGxlZnQsIHRvcCArIHRoaXMuaGVpZ2h0LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgdGhpcyk7XG5cblx0cmV0dXJuIHBhcmVudDtcbn07XG5cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFRyZWVOb2RlID0gcmVxdWlyZSgnLi9ub2RlJyk7XG5cbi8qIFF1YWR0cmVlIGJ5IE96YW4gVHVyZ3V0IChvemFudHVyZ3V0QGdtYWlsLmNvbSlcblxuICAgQSBRdWFkdHJlZSBpcyBhIHN0cnVjdHVyZSBmb3IgbWFuYWdpbmcgbWFueSBub2RlcyBpbnRlcmFjdGluZyBpbiBzcGFjZSBieVxuICAgb3JnYW5pemluZyB0aGVtIHdpdGhpbiBhIHRyZWUsIHdoZXJlIGVhY2ggbm9kZSBjb250YWlucyBlbGVtZW50cyB3aGljaCBtYXlcbiAgIGludGVyYWN0IHdpdGggb3RoZXIgZWxlbWVudHMgd2l0aGluIHRoZSBub2RlLiBUaGlzIGlzIHBhcnRpY3VsYXJseSB1c2VmdWwgaW5cbiAgIGNvbGxpc2lvbiBkZXRlY3Rpb24sIGluIHdoaWNoIGEgYnJ1dGUtZm9yY2UgYWxnb3JpdGhtIHJlcXVpcmVzIHRoZSBjaGVja2luZyBvZlxuICAgZXZlcnkgZWxlbWVudCBhZ2FpbnN0IGV2ZXJ5IG90aGVyIGVsZW1lbnQsIHJlZ2FyZGxlc3Mgb2YgdGhlaXIgZGlzdGFuY2UgaW4gc3BhY2UuXG5cbiAgIFRoaXMgcXVhZHRyZWUgaGFuZGxlcyBvYmplY3QgaW4gMmQgc3BhY2UgYnkgdGhlaXIgYm91bmRpbmcgYm94ZXMuIEl0IHNwbGl0c1xuICAgYSBub2RlIG9uY2UgaXQgZXhjZWVkcyB0aGUgb2JqZWN0IGxpbWl0IHBlci1ub2RlLiBXaGVuIGEgbm9kZSBpcyBzcGxpdCwgaXQnc1xuICAgY29udGVudHMgYXJlIGRpdmllZCB1cCBpbiB0byA0IHNtYWxsZXIgbm9kZXMgdG8gZnVsZmlsbCB0aGUgcGVyLW5vZGUgb2JqZWN0IGxpbWl0LlxuICAgTm9kZXMgYXJlIGluZmluaXRlbHkgZGl2aXNpYmxlLlxuXG4gICBJZiBhbiBvYmplY3QgaXMgaW5zZXJ0ZWQgd2hpY2ggZXhjZWVkcyB0aGUgYm91bmRzIG9mIHRoaXMgcXVhZHRyZWUsIHRoZSBxdWFkdHJlZVxuICAgd2lsbCBncm93IGluIHRoZSBkaXJlY3Rpb24gdGhlIG9iamVjdCB3YXMgaW5zZXJ0ZWQgaW4gb3JkZXIgdG8gZW5jYXBzdWxhdGUgaXQuIFRoaXMgaXNcbiAgIHNpbWlsYXIgdG8gYSBub2RlIHNwbGl0LCBleGNlcHQgaW4gdGhpcyBjYXNlIHdlIGNyZWF0ZSBhIHBhcmVudCBub2RlIGFuZCBhc3NpZ24gdGhlIGV4aXN0aW5nXG4gICBxdWFkdHJlZSBhcyBhIHF1YWRyYW50IHdpdGhpbiBpdC4gVGhpcyBhbGxvd3MgdGhlIHF1YWR0cmVlIHRvIGNvbnRhaW4gYW55IG9iamVjdCwgcmVnYXJkbGVzcyBvZlxuICAgaXRzIHBvc2l0aW9uIGluIHNwYWNlLlxuXG4gICBPbmUgZnVuY3Rpb24gaXMgZXhwb3J0ZWQgd2hpY2ggY3JlYXRlcyBhIHF1YWR0cmVlIGdpdmVuIGEgd2lkdGggYW5kIGhlaWdodC5cblxuICAgVGhlIHF1YWR0cmVlIGFwaSBoYXMgdHdvIG1ldGhvZHM6XG5cbiAgIGluc2VydChib3VuZHMpXG4gICBcdFx0SW5zZXJ0cyBhIGJvdW5kaW5nIGJveCAoaXQgc2hvdWxkIGNvbnRhaW4gYW4gbGVmdCwgdG9wLCB3aWR0aCwgYW5kIGhlaWdodCBwcm9wZXJ0eSkuXG5cbiAgIFx0cmV0cmlldmUoYm91bmRzKVxuICAgXHRcdFJldHJpZXZlcyBhIGxpc3Qgb2YgYm91bmRpbmcgYm94ZXMgdGhhdCBzaGFyZSBhIG5vZGUgd2l0aCB0aGUgZ2l2ZW4gYm91bmRzIG9iamVjdC5cbiovXG5cbnZhciBRdWFkdHJlZSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCl7XG5cdGlmKHdpZHRoKXtcblx0XHR0aGlzLndpZHRoID0gd2lkdGg7XG5cdFx0dGhpcy5oZWlnaHQgPSBoZWlnaHQ/IGhlaWdodCA6IHdpZHRoO1xuXHR9XG5cdFxuXHR0aGlzLnJlc2V0KCk7XG59O1xuXG5RdWFkdHJlZS5jcmVhdGUgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KXtcblx0dmFyIHF1YWR0cmVlID0gbmV3IFF1YWR0cmVlKHdpZHRoLCBoZWlnaHQpO1xuXHRyZXR1cm4gUXVhZHRyZWUuZ2V0QXBpKHF1YWR0cmVlKTtcbn07XG5cblF1YWR0cmVlLmdldEFwaSA9IGZ1bmN0aW9uKHF1YWR0cmVlKXtcblx0dmFyIGFwaSA9IHt9O1xuXHRhcGkuaW5zZXJ0ID0gcXVhZHRyZWUuaW5zZXJ0LmJpbmQocXVhZHRyZWUpO1xuXHRhcGkucmVzZXQgPSBxdWFkdHJlZS5yZXNldC5iaW5kKHF1YWR0cmVlKTtcblx0YXBpLmdldE9iamVjdHMgPSBxdWFkdHJlZS5nZXRPYmplY3RzLmJpbmQocXVhZHRyZWUpO1xuXHRhcGkuZ2V0ID0gYXBpLmdldE9iamVjdHM7IC8vIGFsaWFzXG5cdGFwaS5wcnVuZSA9IHF1YWR0cmVlLnBydW5lLmJpbmQocXVhZHRyZWUpO1xuXG5cdHJldHVybiBhcGk7XG59O1xuXG5RdWFkdHJlZS5wcm90b3R5cGUud2lkdGggPSAxMDAwMDtcblF1YWR0cmVlLnByb3RvdHlwZS5oZWlnaHQgPSAxMDAwMDtcblxuUXVhZHRyZWUucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oeCwgeSl7XG5cdHggPSB4IHx8IDA7XG5cdHkgPSB5IHx8IDA7XG5cblx0dGhpcy50b3AgPSBuZXcgVHJlZU5vZGUoeCwgeSwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xufTtcblxuUXVhZHRyZWUucHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uKG9iail7XG5cdHRoaXMudG9wID0gdGhpcy50b3AuaW5zZXJ0KG9iaik7XG59O1xuXG4vKlxuZnVuY3Rpb24gaXNJbk5vZGUobm9kZSwgbGVmdCwgdG9wLCByaWdodCwgYm90dG9tKXtcblx0cmV0dXJuIG5vZGUubGVmdCA8PSBsZWZ0ICYmIG5vZGUudG9wIDw9IHRvcCAmJiBub2RlLnJpZ2h0ID49IHJpZ2h0ICYmIG5vZGUuYm90dG9tID49IGJvdHRvbTtcbn1cbiovXG5cbmZ1bmN0aW9uIGdldENvbnRhaW5pbmdOb2RlSGVscGVyKGxlZnQsIHRvcCwgcmlnaHQsIGJvdHRvbSwgbm9kZSl7XG5cdGlmKCFub2RlLnRsKSByZXR1cm4gbm9kZTtcblxuXHRpZihsZWZ0IDwgbm9kZS50ci5sZWZ0KXtcblx0XHRpZihyaWdodCA8IG5vZGUudHIubGVmdCl7XG5cdFx0XHRpZihib3R0b20gPCBub2RlLmJsLnRvcCl7XG5cdFx0XHRcdHJldHVybiBnZXRDb250YWluaW5nTm9kZUhlbHBlcihsZWZ0LCB0b3AsIHJpZ2h0LCBib3R0b20sIG5vZGUudGwpO1xuXHRcdFx0fSBlbHNlIGlmKHRvcCA+IG5vZGUuYmwudG9wKSB7XG5cdFx0XHRcdHJldHVybiBnZXRDb250YWluaW5nTm9kZUhlbHBlcihsZWZ0LCB0b3AsIHJpZ2h0LCBib3R0b20sIG5vZGUuYmwpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRpZihib3R0b20gPCBub2RlLmJyLnRvcCl7XG5cdFx0XHRyZXR1cm4gZ2V0Q29udGFpbmluZ05vZGVIZWxwZXIobGVmdCwgdG9wLCByaWdodCwgYm90dG9tLCBub2RlLnRyKTtcblx0XHR9IGVsc2UgaWYodG9wID4gbm9kZS5ici50b3ApIHtcblx0XHRcdHJldHVybiBnZXRDb250YWluaW5nTm9kZUhlbHBlcihsZWZ0LCB0b3AsIHJpZ2h0LCBib3R0b20sIG5vZGUuYnIpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBub2RlO1xufVxuXG5RdWFkdHJlZS5wcm90b3R5cGUuZ2V0Q29udGFpbmluZ05vZGUgPSBmdW5jdGlvbihsZWZ0LCB0b3AsIHJpZ2h0LCBib3R0b20pe1xuXHRpZihsZWZ0IDwgdGhpcy50b3AubGVmdCB8fCBcblx0XHR0b3AgPCB0aGlzLnRvcC50b3AgfHwgXG5cdFx0cmlnaHQgPiB0aGlzLnRvcC5yaWdodCB8fCBcblx0XHRib3R0b20gPiB0aGlzLnRvcC5ib3R0b20pe1xuXHRcdHJldHVybjtcdFxuXHR9XG5cblx0cmV0dXJuIGdldENvbnRhaW5pbmdOb2RlSGVscGVyKGxlZnQsIHRvcCwgcmlnaHQsIGJvdHRvbSwgdGhpcy50b3ApO1xufTtcblxuUXVhZHRyZWUucHJvdG90eXBlLm1pbmltdW1TaXplID0gMzAwMDtcblF1YWR0cmVlLnByb3RvdHlwZS5nZXRJbnRlcmFjdGFibGVPYmplY3RzID0gZnVuY3Rpb24obGVmdCwgdG9wLCByaWdodCwgYm90dG9tKXtcblx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdG1pbmltdW1TaXplID0gdGhpcy5taW5pbXVtU2l6ZSxcblx0XHR0bCA9IHRoaXMuZ2V0Q29udGFpbmluZ05vZGUobGVmdCwgdG9wLCBsZWZ0ICsgMSwgdG9wICsgMSksXG5cdFx0dHIsXG5cdFx0YmwsXG5cdFx0YnIsXG5cdFx0b2JqZWN0c0xpc3QgPSB0bCA/IFt0bC5nZXRPYmplY3RzKCldIDogW107XG5cblx0ZnVuY3Rpb24gYWRkQW5jZXN0b3JFbGVtZW50cyhsZWZ0LCB0b3AsIHJpZ2h0LCBib3R0b20pe1xuXHRcdHZhciBhbmNlc3RvciA9IHNlbGYuZ2V0Q29udGFpbmluZ05vZGUobGVmdCwgdG9wLCByaWdodCwgYm90dG9tKTtcblx0XHRpZihhbmNlc3RvciAmJiAhfm9iamVjdHNMaXN0LmluZGV4T2YoYW5jZXN0b3Iub2JqZWN0cykpIG9iamVjdHNMaXN0LnB1c2goYW5jZXN0b3Iub2JqZWN0cyk7XG5cdH1cblxuXHRpZighdGwgfHwgdGwucmlnaHQgPCByaWdodCl7XG5cdFx0dHIgPSB0aGlzLmdldENvbnRhaW5pbmdOb2RlKHJpZ2h0IC0gMSwgdG9wLCByaWdodCwgdG9wICsgMSk7XG5cdFx0aWYodHIpIG9iamVjdHNMaXN0LnB1c2godHIuZ2V0T2JqZWN0cygpKTtcblx0XHRlbHNlIHRyID0gdGw7XG5cdH0gZWxzZSB7XG5cdFx0dHIgPSB0bDtcblx0fVxuXG5cdGlmKCF0bCB8fCB0bC5ib3R0b20gPCBib3R0b20pe1xuXHRcdGJsID0gdGhpcy5nZXRDb250YWluaW5nTm9kZShsZWZ0LCBib3R0b20gLSAxLCBsZWZ0ICsgMSwgYm90dG9tKTtcblx0XHRpZihibCkgb2JqZWN0c0xpc3QucHVzaChibC5nZXRPYmplY3RzKCkpO1xuXHRcdGVsc2UgYmwgPSB0bDtcblx0fSBlbHNlIHtcblx0XHRibCA9IHRsO1xuXHR9XG5cblx0aWYoIXRyIHx8IHRyLmJvdHRvbSA8IGJvdHRvbSl7XG5cdFx0aWYoIWJsIHx8IGJsLnJpZ2h0IDwgcmlnaHQpe1xuXHRcdFx0YnIgPSB0aGlzLmdldENvbnRhaW5pbmdOb2RlKHJpZ2h0IC0gMSwgYm90dG9tIC0gMSwgcmlnaHQsIGJvdHRvbSk7XG5cdFx0XHRpZihicikgb2JqZWN0c0xpc3QucHVzaChici5nZXRPYmplY3RzKCkpO1xuXHRcdFx0ZWxzZSBiciA9IGJsO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRiciA9IGJsO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRiciA9IHRyO1xuXHR9XG5cdFxuXHRpZih0bCAhPT0gdHIpIGFkZEFuY2VzdG9yRWxlbWVudHMobGVmdCwgdG9wLCByaWdodCwgdG9wICsgMSk7XG5cdGlmKHRyICE9PSBicikgYWRkQW5jZXN0b3JFbGVtZW50cyhyaWdodCAtIDEsIHRvcCwgcmlnaHQsIGJvdHRvbSk7XG5cdGlmKGJyICE9PSBibCkgYWRkQW5jZXN0b3JFbGVtZW50cyhsZWZ0LCBib3R0b20gLSAxLCByaWdodCwgYm90dG9tKTtcblx0aWYoYmwgIT09IHRsKSBhZGRBbmNlc3RvckVsZW1lbnRzKGxlZnQsIHRvcCwgbGVmdCArIDEsIGJvdHRvbSk7XG5cdFx0XG5cdC8vIEludGVyc2VjdGlvbnMgdG93YXJkcyB0b3AgbGVmdFxuXHRpZih0bCl7XG5cdFx0aWYoKGxlZnQgLSBtaW5pbXVtU2l6ZSkgPCB0bC5sZWZ0KXtcblx0XHRcdGFkZEFuY2VzdG9yRWxlbWVudHMobGVmdCAtIG1pbmltdW1TaXplLCB0b3AsIGxlZnQgKyAxLCB0b3AgKyAxKTtcblx0XHR9XG5cblx0XHRpZigodG9wIC0gbWluaW11bVNpemUpIDwgdGwudG9wKXtcblx0XHRcdGFkZEFuY2VzdG9yRWxlbWVudHMobGVmdCwgdG9wIC0gbWluaW11bVNpemUsIGxlZnQgKyAxLCB0b3AgKyAxKTtcblx0XHR9XG5cdH1cblx0XG5cdC8vIEludGVyc2VjdGlvbnMgdG93YXJkcyB0b3AgcmlnaHRcblx0aWYodHIpe1xuXHRcdGlmKHRyICE9PSB0bCAmJiAodG9wIC0gbWluaW11bVNpemUpIDwgdHIudG9wKXtcblx0XHRcdGFkZEFuY2VzdG9yRWxlbWVudHMocmlnaHQgLSAxLCB0b3AgLSBtaW5pbXVtU2l6ZSwgcmlnaHQsIHRvcCArIDEpO1xuXHRcdH1cblxuXHRcdGlmKChyaWdodCArIG1pbmltdW1TaXplKSA+IHRyLnJpZ2h0KXtcblx0XHRcdGFkZEFuY2VzdG9yRWxlbWVudHMocmlnaHQgLSAxLCB0b3AsIHJpZ2h0ICsgbWluaW11bVNpemUsIHRvcCArIDEpO1xuXHRcdH1cblx0fVxuXG5cdC8vIEludGVyc2VjdGlvbnMgdG93YXJkcyBib3R0b20gcmlnaHRcblx0aWYoYnIpe1xuXHRcdGlmKGJyICE9PSB0ciAmJiAocmlnaHQgKyBtaW5pbXVtU2l6ZSkgPiBici5yaWdodCl7XG5cdFx0XHRhZGRBbmNlc3RvckVsZW1lbnRzKHJpZ2h0IC0gMSwgYm90dG9tIC0gMSwgcmlnaHQgKyBtaW5pbXVtU2l6ZSwgYm90dG9tKTtcblx0XHR9XG5cblx0XHRpZigoYm90dG9tICsgbWluaW11bVNpemUpID4gYnIuYm90dG9tKXtcblx0XHRcdGFkZEFuY2VzdG9yRWxlbWVudHMocmlnaHQgLSAxLCBib3R0b20gLSAxLCByaWdodCwgYm90dG9tICsgbWluaW11bVNpemUpO1xuXHRcdH1cblx0fVxuXG5cdC8vIEludGVyc2VjdGlvbnMgdG93YXJkcyBib3R0b20gbGVmdFxuXHRpZihibCl7XG5cdFx0aWYoYmwgIT09IGJyICYmIChib3R0b20gKyBtaW5pbXVtU2l6ZSkgPiBibC5ib3R0b20pe1xuXHRcdFx0YWRkQW5jZXN0b3JFbGVtZW50cyhsZWZ0LCBib3R0b20gLSAxLCBsZWZ0ICsgMSwgYm90dG9tICsgbWluaW11bVNpemUpO1xuXHRcdH1cblxuXHRcdGlmKGJsICE9PSB0bCAmJiAobGVmdCAtIG1pbmltdW1TaXplKSA8IGJsLmxlZnQpe1xuXHRcdFx0YWRkQW5jZXN0b3JFbGVtZW50cyhsZWZ0IC0gbWluaW11bVNpemUsIGJvdHRvbSAtIDEsIGxlZnQgKyAxLCBib3R0b20pO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBvYmplY3RzTGlzdCk7XG59O1xuXG5RdWFkdHJlZS5wcm90b3R5cGUuZ2V0T2JqZWN0cyA9IGZ1bmN0aW9uKGxlZnQsIHRvcCwgd2lkdGgsIGhlaWdodCl7XG5cdGlmKGxlZnQgIT09IHZvaWQgMCl7XG5cdFx0dmFyIGJvdHRvbSA9IHRvcCArIGhlaWdodCxcblx0XHRcdHJpZ2h0ID0gbGVmdCArIHdpZHRoLFxuXHRcdFx0cmVjdGFuZ2xlcyA9IHRoaXMuZ2V0SW50ZXJhY3RhYmxlT2JqZWN0cyhsZWZ0LCB0b3AsIHJpZ2h0LCBib3R0b20pLFxuXHRcdFx0cmVjdGFuZ2xlSW5kZXggPSByZWN0YW5nbGVzLmxlbmd0aCxcblx0XHRcdHJlc3VsdCA9IFtdLFxuXHRcdFx0cmVjdGFuZ2xlO1xuXG5cdFx0d2hpbGUocmVjdGFuZ2xlSW5kZXgtLSl7XG5cdFx0XHRyZWN0YW5nbGUgPSByZWN0YW5nbGVzW3JlY3RhbmdsZUluZGV4XTtcblx0XHRcdFxuXHRcdFx0Ly8gSWYgdGhlcmUgaXMgaW50ZXJzZWN0aW9uIGFsb25nIHRoZSB5LWF4aXNcblx0XHRcdGlmKFx0KHRvcCA8PSByZWN0YW5nbGUudG9wID9cblx0XHRcdFx0XHQoYm90dG9tID49IHJlY3RhbmdsZS50b3ApIDpcblx0XHRcdFx0XHQocmVjdGFuZ2xlLmJvdHRvbSA+PSB0b3ApKSAmJiBcblx0XHRcdFx0Ly8gQW5kIGlmIHRoZXJlIGlzIGludGVyc2VjdGlvbiBhbG9uZyB0aGUgeC1heGlzXG5cdFx0XHRcdChsZWZ0IDw9IHJlY3RhbmdsZS5sZWZ0ID8gXG5cdFx0XHRcdFx0KHJpZ2h0ID49IHJlY3RhbmdsZS5sZWZ0KSA6XG5cdFx0XHRcdFx0KHJlY3RhbmdsZS5yaWdodCA+PSBsZWZ0KSkpe1xuXG5cdFx0XHRcdFxuXHRcdFx0XHRyZXN1bHQucHVzaChyZWN0YW5nbGUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0cmV0dXJuIHRoaXMudG9wLmdldE9iamVjdHMoKTtcbn07XG5cblF1YWR0cmVlLnByb3RvdHlwZS5wcnVuZSA9IGZ1bmN0aW9uKGxlZnQsIHRvcCwgd2lkdGgsIGhlaWdodCl7XG5cdHZhciByaWdodCA9IGxlZnQgKyB3aWR0aCxcblx0XHRib3R0b20gPSB0b3AgKyBoZWlnaHQsXG5cdFx0Y2FuZGlkYXRlLFxuXHRcdHJlamVjdGVkT2JqZWN0cyA9IFtdLFxuXHRcdGtlcHRPYmplY3RzID0gW107XG5cblx0dmFyIG9iamVjdHMgPSB0aGlzLnRvcC5nZXRPYmplY3RzKCksXG5cdFx0aW5kZXggPSAwLFxuXHRcdGxlbmd0aCA9IG9iamVjdHMubGVuZ3RoO1xuXG5cdGZvcig7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKXtcblx0XHRjYW5kaWRhdGUgPSBvYmplY3RzW2luZGV4XTtcblxuXHRcdGlmKFx0Y2FuZGlkYXRlLmxlZnQgPCBsZWZ0IHx8IFxuXHRcdFx0Y2FuZGlkYXRlLnRvcCA8IHRvcCB8fCBcblx0XHRcdChjYW5kaWRhdGUubGVmdCArIGNhbmRpZGF0ZS53aWR0aCkgPiByaWdodCB8fFxuXHRcdFx0KGNhbmRpZGF0ZS50b3AgKyBjYW5kaWRhdGUuaGVpZ2h0KSA+IGJvdHRvbSl7XG5cdFx0XHRyZWplY3RlZE9iamVjdHMucHVzaChjYW5kaWRhdGUpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRrZXB0T2JqZWN0cy5wdXNoKGNhbmRpZGF0ZSk7XG5cdFx0fVxuXHR9XG5cdGlmKGtlcHRPYmplY3RzLmxlbmd0aCl7XG5cdFx0dGhpcy5yZXNldChrZXB0T2JqZWN0c1swXS5sZWZ0LCBrZXB0T2JqZWN0c1swXS50b3ApO1xuXHRcdGluZGV4ID0gMDtcblx0XHRsZW5ndGggPSBrZXB0T2JqZWN0cy5sZW5ndGg7XG5cdFx0Zm9yKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4Kyspe1xuXHRcdFx0dGhpcy5pbnNlcnQoa2VwdE9iamVjdHNbaW5kZXhdKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0dGhpcy5yZXNldCgpO1xuXHR9XG5cdFxuXHRyZXR1cm4gcmVqZWN0ZWRPYmplY3RzO1xufTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==