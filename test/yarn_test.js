module("API Usability");
asyncTest("Worker Additions are Chainable", function() {
	expect(5); // 1 asserts for each Worker + 1 for join callback
	var callstack = new Yarn;
  callstack
    .fiber(function() {
      ok(true, 'Fiber A Called');
      this.yarn.complete();
    })
    .fiber(function() {
      ok(true, 'Fiber B Called');
      this.yarn.complete();
    })
    .stack(function() {
      ok(true, 'Stack A Called');
      this.yarn.complete();
    })
    .stack(function() {
      ok(true, 'Stack B Called');
      this.yarn.complete();
    });

  callstack.join(function(){
     start();
     ok(true, 'The final join callback was called.');
  });
});

asyncTest("Worker Additions accept Variable Arity", function() {
	expect(6); // 1 asserts for each Worker + 1 for join callback
	var callstack = new Yarn;
  callstack
    .fiber(function() {
      ok(true, 'Fiber A Called');
      this.yarn.complete();
    }, function() {
      ok(true, 'Fiber B Called');
      this.yarn.complete();
    },  function() {
      ok(true, 'Fiber B Called');
      this.yarn.complete();
    });

  callstack
    .stack(function() {
      ok(true, 'Stack A Called');
      this.yarn.complete();
    }, function() {
      ok(true, 'Stack B Called');
      this.yarn.complete();
    });

  callstack.join(function(){
     start();
     ok(true, 'The final join callback was called.');
  });
});


/* @TODO Determine why QUnit is not playing nice here
asyncTest("Exception exits poller, bubbles Exception", function() {
	expect(5); // 1 asserts for each Fiber + 1 for join callback
	var callstack = new Yarn;
  callstack.fiber(function() {
    ok(true, 'Fiber A Called');
    this.yarn.complete();
  });
  callstack.fiber(function() {
    ok(true, 'Fiber B Called');
    throw 'Exception occurred during Fiber run.';
    this.yarn.complete();

  });
  callstack.fiber(function() {
    ok(true, 'Fiber C Called');
    this.yarn.complete();
  });
  equal(callstack._fibers.length, 3, '3 Fibers were added');

  raises(callstack.join(function(){
     start();
     ok(true, 'The final join callback was called.');
  }), 'Callback');
});*/

module("Synchronous Call Stack");
test("Adding Synchronous Workers", function() {
	expect(1); // Two asserts for each callback
	var callstack = new Yarn;
  callstack.stack(function(results) {
    this.yarn.complete();
  });
  callstack.stack(function(results) {
    this.yarn.complete();
  });

  equal(callstack._stack.length, 2);
});

test("Calling Synchronous Methods with Join launches the workers", function() {
	expect(2); // Two asserts for each callback
	var callstack = new Yarn;
  callstack.stack(function(results) {
    ok(true, 'Stack Item A called');
    this.yarn.complete();
  });
  callstack.stack(function(results) {
    ok(true, 'Stack Item B called');
    this.yarn.complete();

  });

  callstack.join();
});

test("The results of the previous Item are passed down the stack", function() {
	expect(3); // 1 asserts for each callback
	var callstack = new Yarn;
  callstack.stack(function(results) {
    equal(results, undefined, 'First call in stack get passed undefined as as a result');
    this.yarn.complete(2);
  });
  callstack.stack(function(results) {
    equal(results, 2, 'Result passed is result of last callback in the stack');
    this.yarn.complete({foo:4});

  });
  callstack.stack(function(results) {
    equal(results.foo, 4, 'Result passed is result of last callback in the stack');
    this.yarn.complete(5);
  });

  callstack.join();
});

module("Asynchronous Fibers");
test("Adding Asynchronous Workers", function() {
	expect(1); 	
  var callstack = new Yarn;
  callstack.fiber(function() {
    this.yarn.complete();
  });
  callstack.fiber(function() {
    this.yarn.complete();
  });

  equal(callstack._fibers.length, 2);
});

asyncTest("Final Callback is Called on Join", function() {
	expect(1); // 1 assert for join callback
	var yarn = new Yarn;
  yarn.fiber(function() {
    this.yarn.complete();
  });
  yarn.fiber(function() {
    this.yarn.complete();
  });

  yarn.join(function(){
     start();
     ok(true, 'The final join callback was called.');
  });
});

asyncTest("Test Long-Running Fibers", function() {
	expect(4); // 1 asserts for each Fiber + 1 for join callback
	var queue = new Yarn;
  queue.fiber(function() {
    ok(true, 'Fiber A Called');
    this.yarn.complete();
  });
  queue.fiber(function() {
    var self = this;
        // Long-running process
    setTimeout(function() {
      ok(true, 'Fiber B Called');
      self.yarn.complete();
    }, 2000);
  });

  queue.fiber(function() {
    ok(true, 'Fiber C Called');
    this.yarn.complete();
  });

  queue.join(function(){
     start();
     ok(true, 'The final join callback was called.');
  });
});

module("Mixin' it Up!");
asyncTest("Fibers and Stack Methods can co-exist", function() {
	expect(7); 
  // + 1 for Join callback
  // + 1 (x5) assert for each Fiber/Stack Item (4)
  // + 1 assert for Stack result-passing
	var callstack = new Yarn;
  callstack.stack(function(){
    ok(true, 'Stack A Called'); 
    this.yarn.complete('stack result');
  });
  callstack.fiber(function() {
    ok(true, 'Fiber A Called');
    this.yarn.complete(2);
  });
  callstack.fiber(function() {
    ok(true, 'Fiber B Called');
    var self = this;
    // Long-running process
    setTimeout(function() {
      self.yarn.complete(5);
    }, 200);
  });
  callstack.stack(function(result){
     equal(result, 'stack result', 'Result from last stack passed in');    
     ok(true, 'Stack B Called');
     this.yarn.complete('stack result');     
  });
  callstack.fiber(function() {
    ok(true, 'Fiber C Called');
    this.yarn.complete({foo:4});
  });
  callstack.join(function(){
     start();
     ok(true, 'The final join callback was called.');
  });
});

module("Worker Helpers");
asyncTest("Worker function extended with state-change methods", function() {
	expect(5); 
  // + 1 for Join callback
  // + 2 (x2) assert for each Fiber/Stack Item
	var callstack = new Yarn;
  callstack.stack(function(){
    ok(this.yarn, 'The callback was extended to include yarn helper');
    ok(typeof this.yarn.complete === 'function',
       'The worker-helper includes a complete method');
    this.yarn.complete();
  });
  callstack.fiber(function(){
    ok(this.yarn, 'The callback was extended to include yarn helper');
    ok(typeof this.yarn.complete === 'function',
       'The worker-helper includes a complete method');
    this.yarn.complete();
  });

  callstack.join(function(){
     start();
     ok(true, 'The final join callback was called.');
  });
});

asyncTest("Worker function extended with utilities  (these may change, not reccomended to program against)", function() {
	expect(14); 
  // + 1 for Join callback
  // + 6 assert for each Fiber/Stack Item (x2)
  // + 1 asser for the Stacks extra doNext util
	var callstack = new Yarn;
  callstack.stack(function(){
    ok(this.yarn, 'The callback was extended to include yarn helper');
    ok(typeof this.yarn.start === 'function',
       'The worker-helper includes a start method');
    ok(typeof this.yarn.next === 'function',
       'The worker-helper includes a next method');
    ok(typeof this.yarn.processNext === 'function',
       'The worker-helper includes a processNext method');
    ok(this.yarn.running, 'The worker is currently running');
    ok(this.yarn.launched, 'The worker has been launched');

    ok(true, 'Stack A Called'); 
    this.yarn.complete('stack result');
  });
  callstack.fiber(function(){
    ok(this.yarn, 'The callback was extended to include yarn helper');
    ok(typeof this.yarn.start === 'function',
       'The worker-helper includes a start method');
    ok(typeof this.yarn.next === 'function',
       'The worker-helper includes a next method');
    ok(this.yarn.running, 'The worker is currently running');
    ok(this.yarn.launched, 'The worker has been launched');

    ok(true, 'Stack A Called'); 
    this.yarn.complete('stack result');
  });

  callstack.join(function(){
     start();
     ok(true, 'The final join callback was called.');
  });
});


