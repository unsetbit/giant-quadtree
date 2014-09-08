'use strict';

var TreeNode = require('./node');

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
