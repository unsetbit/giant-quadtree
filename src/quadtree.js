var Node = require("./Node.js");

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
   it's position in space.

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
	api.hasObject = quadtree.hasObject.bind(quadtree);
	api.prune = quadtree.prune.bind(quadtree);

	return api;
};

Quadtree.prototype.width = 10000;
Quadtree.prototype.height = 10000;

Quadtree.prototype.reset = function(x, y){
	x = x || 0;
	y = y || 0;

	var negHalfWidth = -(this.width / 2);
	var negHalfHeight = -(this.height / 2);
	this.top = new Node(x + negHalfWidth, y + negHalfHeight, this.width, this.height);
};

Quadtree.prototype.insert = function(obj){
	this.top = this.top.insert(obj);
};

Quadtree.prototype.getObjects = function(left, top, width, height){
	if(left){
		return this.top.getInteractableObjects(left, top, width, height);
	}

	return this.top.getObjects();
};

Quadtree.prototype.prune = function(left, top, width, height){
	var right = left + width,
		bottom = top + height,
		candidate,
		rejectedObjects = [];
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


// Checks for collisions against a quadree
Quadtree.prototype.hasObject = function(left, top, width, height){
	var rectangles = this.top.getInteractableObjects(left, top, width, height),
		length = rectangles.length,
		index = 0,
		rectangle;

	for(; index < length; index++){
		rectangle = rectangles[index];
		
		// If there is intersection along the y-axis
		if((top < rectangle.top ?
			((top + height) > rectangle.top) :
			((rectangle.top + rectangle.height) > top)) && 
				// And if there is intersection along the x-axis
				(left < rectangle.left ?
					((left + width) > rectangle.left) :
					((rectangle.left + rectangle.width) > left))){
			
			// Then we have a collision
			return rectangle;
		}
	}
	
	return false;
};
