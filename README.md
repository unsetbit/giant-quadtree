# Giant Quadtree is 2D collision Detection Without Boundaries

A quadtree is a data structure which segments 2D space to reduce the cost of collision detection.
Generally, a quadtree subdivides space as more elements occupy it. Giant Quadtree does this and adds a little twist:
it grows outwards whenever an element is added outside the current boundaries. This means collision detection
without boundaries.

## An Example
In this example, we'll insert a box to the quadtree, and then check an area which the box overlaps for objects
to retrieve it again.

```javascript
var tree = GiantQuadtree.create();
var myBox = { left: 0, top: 0, width: 100, height:100 };
tree.insert(myBox);
var objs = tree.get(0, 0, 10, 10);
console.log(objs[0] === myBox); // outputs true 
```
## Use
For plain JavaScript applications, use [dist/GiantQuadtree.js](https://raw.github.com/oztu/giant-quadtree/master/dist/GiantQuadtree.js), which will inject the Quadtree object to the global
scope. You can also use the file as an AMD or CommonJS module.

## API
In the API `GiantQuadtree` (capitalized) refers to the module object and `quadtree` (lowercase) refers to a 
GiantQuadtree instance which is created via `GiantQuadtree.create`.

### `GiantQuadtree.create(opt_width, opt_height)`
Constructor function which returns a new GiantQuadtree instance. By default, the starting height and width are 
10,000 pixels.

```javascript
var myTree = GiantQuadtree.create();
// 1. add a bunch of rectangles using myTree.insert
// 2. find a bunch of collisions using myTree.get
// 3. clear the tree for the next step using myTree.clear
// repeat steps 1 to 3
```

### `quadtree.insert(rectangle)`
Inserts a rectangle to the quadtree. A rectange is any object which has a `width`, `height`, `left`, and `top` 
property. This object may have any other properties (none of them will be modified by the GiantQuadtree).

```javascript
var myTree = GiantQuadtree.create();
// Add a 100x100 box with the top left corner at 0,0
myTree.insert({left: 0, top: 0, width: 100, height: 100});
// Add a 100x100 box overlapping the previous with the top left corner at 50,50
myTree.insert({left: 50, top: 50, width: 100, height: 100});
```

### `quadtree.get(left, top, width, height)`
Returns all rectangles which intersect the given dimensions. This method useful for finding collisions.

```javascript
var myTree = Quadtree.create();
myTree.insert({left: 0, top: 0, width: 100, height: 100});
myTree.insert({left: 50, top: 50, width: 100, height: 100});
var boxes = myTree.get(60, 60, 100, 100);
// boxes will contain both of the inserted boxes since they intersect the boundaries of the get query
```

### `quadtree.reset()`
Clears the quadtree of all objects.

```javascript
var myTree = GiantQuadtree.create();
myTree.insert({left: 0, top: 0, width: 100, height: 100});
myTree.insert({left: 50, top: 50, width: 100, height: 100});
var boxes = myTree.get(60, 60, 100, 100);
console.log(boxes.length); // 2
myTree.reset();
var boxes = myTree.get(60, 60, 100, 100);
console.log(boxes.length); // 0
```

### `quadtree.prune(left, top, width, height)`
Clears the quadtree, but retains any elements that fall within the given dimensions.

```javascript
var myTree = GiantQuadtree.create();
myTree.insert({left: 0, top: 0, width: 100, height: 100});
myTree.insert({left: 50, top: 50, width: 100, height: 100});
var boxes = myTree.get(60, 60, 100, 100);
console.log(boxes.length); // 2
myTree.prune(-10, -10, 120, 120); // keep everything that's contained in these boundaries
var boxes = myTree.get(60, 60, 100, 100);
console.log(boxes.length); // 1 (the first box that was inserted)
```
## Developing
This project uses [boilerplate-gulp](https://github.com/oztu/boilerplate-gulp). Run 'gulp dev' to develop and have incremental builds, continuous testing, etc. Run 'gulp' to run regenerate the dist files. 