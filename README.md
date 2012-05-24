### What is yarn.js?
*This little project spawned from a personal dislike of the `[$.deferred API|http://api.jquery.com/category/deferred-object/]` syntax. It is meant to be a very very simple no-frills way to spin off worker processes (either synchronous or asynchronous) and then "do something" when they are all finished. 

* I would recommend looking at `$.deferred` or similar if you need something more complex.

### Using yarn.js
TODO

### Fibers (asynchronous worker "threads")
```
var yarn = new Yarn;
var results = {};
yarn.fiber(function() {
  // Do some heavy processing here .. 
  results.threadA = data;
  this.yarn.complete();
});
yarn.fiber(function() {
  // Do service queries here ..
  results.threadB = data;
  this.yarn.complete();
});
yarn.join(function() {
  // Wait for all processes to complete
  // and then process the results....
});
```
### Stacks (synchronous workers)
```
// Add some synchronous anonymous workers
yarn.stack(function() {
  // Do some processing here .. 
  this.yarn.complete(firstResult);
},
function(firstResult) {
  // Do some processing here ..
  this.yarn.complete(secondResult);
},
function(thirdResult) {
  // Do some processing here ..
  this.yarn.complete(lastResult);
});
```

### Dependencies.
yarn.js is written in Vanilla JS, there is not 3rd-party libraries required. yarn.js unit tests are written in QUnit (which is bundled with the src).

### Possible Future Enhancements
* Web-worker support
* Nested Fibers
* More consistent Stack vs. Fiber Handling
* Late binding of workers
* `$.reject`-type `die()` method for quick-exits.

### Support or Contact
Having trouble with yarn.js? Feel free to PM or email me (@kaylarose). Open to contributions/pull-requests. Not tested in IE - but should be compatible. Willing to patch any IE issues asap.

