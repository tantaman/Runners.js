# Runners.js #
A sensible WebWorker interface

With `Runners.js` your WebWorker scripts look something like:

```javascript
self.runnables = {
  heavyMath: function(a1,a2,a3) {
    // code...
  },
  
  simulate: function(world) {
    // code...
  }
};
```

And your client code looks like:

```javascript
var runner = Runners.newRunner('path/to/myRunner.js');
runner.ready(function() {
  
  // Run some CPU bound processing in a new thread
  runner.fns.heavyMath(t1,p1,v);

  // Runners return promises so you know when your task finishes or fails.
  runner.fns.simulate(model).then(function(result) {    
    // update data for renderer
  }, function (failure) {
    // handle failure / exception thrown by the runner
  });
});
```

A WebWorker is created behind the scenes and calls to `heavyMath` and `simulate` are dispatched to and run in that worker.


What about those times where you have a lot of work, several workers and you want to give work to WebWorkers as they become available?

Runners does that too.

```javascript
var runnerPool = Runners.newFixedRunnerPool('path/to/myRunner.js', 3); // A pool of 3 Runners
runnerPool.ready(function() {
      
    // 3 invocations to heavyMath will run immediately.  The remaining two will be picked up and run
    // in whatever WebWorker becomes available first.
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
