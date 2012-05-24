/**
 * yarn.js - stupid-simple worker "threading" for JS
 * (a.k.a $.deffered is ugly)
 *
 * Copyright 2012 - Kayla Rose Hinz
 * This library is licensed under the MIT License.
 *    http://www.opensource.org/licenses/mit-license.php
 **/
function Yarn() {
  this.VERSION = '0.1';
  this.POLL_SPEED = 50;

  this._stackResults = {last:undefined,all:[]};
  this._stack = [];
  this._fibers = [];
  this._launched = false;
  this._poller = null;
}

Yarn.prototype.stack = function (/* variable arity list of sync worker methods */) {
  var args = Array.prototype.slice.call(arguments);
  return this._register(args, this._stack);
};

Yarn.prototype.fiber = function (/* variable arity list of async worker methods */) {
  var args = Array.prototype.slice.call(arguments);
  return this._register(args, this._fibers);
};

Yarn.prototype.join = function (callback) {
  var self = this;
  if (!self._poller && typeof callback === 'function') {
    self._poller = setInterval(function() {
      try {
         var isDone = self._pollState(callback);
         if (isDone) {
            self._cleanup();
         }
      } catch (e) {
        self._cleanup();
        throw e;
      }
    }, self.POLL_SPEED);
  }
  self._launch();
};

Yarn.prototype.isRunning = function () {
  return (this._isRunning(this._threads) || this._isRunning(this._stack));
};

Yarn.prototype._isRunning = function (collection) {
  var i = 0, l = collection.length;
  for (; i < l; i++) {
    var worker = collection[i];
    if (worker && worker.yarn && worker.yarn.launched && worker.yarn.running === true) {
      return true; // Exit early since at least on process is running
    }
  }
  return false;
};

Yarn.prototype._register = function (fns, collection) {
  console.log(fns);
  // We only need to support simple arrays, so
  // this naive array check is fine for now.
  fns = (fns instanceof Array) ? fns : [fns];
  var i = 0, l = fns.length, workers = fns;
  for (; i < l; i++) {
    var worker = workers[i];
    if (worker) {
      if (typeof worker !== 'function') {
        worker = function () {
          // wrap non-functional values in a function, 
          // and just pass it to the next item
          this.yarn.complete(worker);
        }
      }      
      worker = this._worker(worker);
      collection.push(worker);
    }
  }
  return this;
};

Yarn.prototype._worker = function (fn) {
  if (fn) {
    // Register per-worker methods
    fn.yarn = {};
    fn.yarn.running = false;
    fn.yarn.launched = false;
    fn.yarn.start = function (arg) {
      this.start = function () {};
      this.running = true;
      this.launched = true;
      fn.call(fn, arg);
    };
    fn.yarn.complete = function (result) {
      this.running = false;
      this.result = result;
      this.next(result);
    } ;
    fn.yarn.next = function (result) {
      this.next = function () {};
      if (typeof this.processNext === 'function') {
        this.processNext.call(this, result);
      }
    };
  }
  return fn;
};

Yarn.prototype._launch = function () {
  try {
    this._launched = true;
    if (this._stack.length) {
      // Launch the first sync proccess
      this._launchStack(this._stack[0]);
    }
    // Launch all async processes
    var i = 0, l = this._fibers.length;
    for (; i < l; i++) {
      this._launchThread(this._fibers[i]);
    }
  } catch (e) {
    this._cleanup();
    throw e;
  }
};

Yarn.prototype._launchThread = function (worker, arg) {
    return (worker && worker.yarn) ? worker.yarn.start(arg) : false;
};

Yarn.prototype._launchStack = function (worker, arg) {
  if (worker) {
    var self = this;
    worker.yarn.processNext = function (result) {
      self._stackResults.all.push(result);
      self._stackResults.last = result;
      if (self._stack.length) {
        // Shift the just-executed function off the stack
        self._stack.shift();
        var _next = self._stack[0];
        return self._launchStack(_next, result);
      }
    };
    return worker.yarn.start(arg);
  } else {
    return false;
  }
};

Yarn.prototype._pollState = function (callback) {
  if (this._launched && !this._isRunning(this._fibers)) {
    callback.call(this, this._threadResults);
    return true;
  }
  return false;
};

Yarn.prototype._cleanup = function (callback) {
    clearInterval(this._poller);
};
