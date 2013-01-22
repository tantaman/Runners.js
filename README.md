# Runners.js #
A sensible WebWorker interface

Usage information can be found in this readme as well as in the **[docs](http://tantaman.github.com/Runners.js/examples/usage.html).**

*A full example that uses a few of Runners.js's introductory features can be found* **[here](http://tantaman.github.com/Runners.js/examples/pi/).**

- - -

With `Runners.js` your WebWorker scripts look something like:

```javascript
self.runnables = {
  heavyMath: function(a1,a2,a3) {
    // code...
  },
  
  simulate: function(step) {
    // code...
  },
  
  ... // any other function you'd like to expose
};

// non-exposed worker code
```

And your client code looks like:

```javascript
var runner = Runners.newRunner('path/to/myRunner.js');
runner.ready(function() {
  
  // Run some CPU bound processing in a new thread
  runner.fns.heavyMath(t1,p1,v);

  // Runners return promises so you know when your task finishes or fails.
  var promise = runner.fns.simulate(step);
  
  promise.then(function(result) {    
    // update data for renderer
  }, function (failure) {
    // handle failure / exception thrown by the runner
  });
  
  // Runners also provide mechanisms for monitoring progress.  More on that later.
  promise.progress(function(data) {
    
  });
});
```

A WebWorker is created behind the scenes and calls to `heavyMath` and `simulate` (or other runnables) are dispatched to and run in that worker.


What about those times where you have a lot of work and several workers? You'd like to give work to WebWorkers as soon as they become available, right?

`Runners.js` handles that too via `RunnerPools`.

```javascript
var runnerPool = Runners.newFixedRunnerPool('path/to/myRunner.js', 3); // A pool of 3 Runners
runnerPool.ready(function() {
      
    // 3 invocations to heavyMath will run immediately.  The remaining two will be picked up and run
    // in whatever Runner/WebWorker becomes available first.
    for (var i = 0; i < 5; ++i) {
      // runnerPools also return promises
      runnerPool.fns.heavyMath().then(function() {
        // any success code
      });
    }
});
```

`Runners.js` also lets you submit functions that don't exist in your WebWorker script.

Check this out:

```javascript
var rp = Runners.newFixedRunnerPool(2); // A pool of 2 runners.  The below also works with a regular Runner
var promise = rp.submit([arg1,arg2], function(arg1, arg2) {
  // this function will be sent to and run in the WebWorker.
  // arguments will also be passed in.
  // this function cannot close over variables in the current scope, however.
});

// submit returns a promise too
```

The promises returned by a Runner let you:
* Monitor the state of the task (pending, rejected, completed)
* Receive progress updatess from your worker code
* Interrupt the task if it is running
* Cancel the task and remove it from the queue if it is not yet running
* Be called back on completion
* Be called back on failure
* Be called back in either case
* Pipe returned Runner data

Inside the 'WebWorker' code of a Runner you have acces to a variable called `workerContext`.

`workerContext` allows you to get the current `invocation` which lets you send progress information back to the main 
event loop.  `workerContext.invocation()` also allows you to monitor your task's interrupted status and put your background task into `async` mode.
