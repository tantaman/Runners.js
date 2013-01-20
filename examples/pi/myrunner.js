self.runnables = {
    calculatePi: function(numTerms, reportAt) {
        // Get the invocation context.  
        // This should be done as the first call in your method.
        var invocationContext = workerContext.invocation(); 

        var num = 4;
        var sign = 1;
        var result = 0;
        var i = 0;
        for (var denom = 1; denom < numTerms * 2; denom+=2) {
            result = result + sign * (num/denom);
            sign *= -1;
            ++i;
            if (i % reportAt == 0)
                // Send our progress to the main thread
                invocationContext.progress(result);
        }

        return result;
    }
};