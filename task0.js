
var SymbolicExecution = require('./symbolic-execution');

var solver = {name:"z3",path:"/usr/bin/z3",tmpPath:"/home/sumeyye/Desktop/task1/tmp"};


var constraints = ['x<=-1 && x>3'];
//var constraints = ['x>=0 && x<1', 'x<=-1 && x>3'];
//var constraints = ['x>0 && x>-1' ];

parameters= { x:{'type': "Int"} 
                };

var symExec;

symExec = new SymbolicExecution(parameters,solver);
        
var check_SAT; 


check_SAT = symExec.solvePathConstraint(constraints,  function (err, res) {
                    if (err) {
                        var errorMessage = (err instanceof Error)
                            ? err.message
                            : 'Uknown error';
                       symExec.response.errors.push(errorMessage);
                       //console.log(symExec.response.errors);
                       // cb();
                    }
   /* else { 
        symExec.smtSolver.run(res, function (err, res) {
                        if (err) {
                            symExec.response.errors.push('Unable to run SMT expression');
                            
                           // console.log(that.response.errors[0]);
                          //  cb(true, null);
                        }
                        else {
                            var smtResponse = symExec.smtSolver.parseResponse(res);
                           
                            if(smtResponse.isSAT)
                                console.log("WWWWSatisfied");
							
                            else
                                console.log("WWWUnsatisfied");
                           
                           // cb(false,res);
                        }
                    });
    }    */           
                   
                });

//console.log(symExec.response.results[0]);
//console.log(check_SAT);
 /*   if(check_SAT)
    console.log("Satisfied");
    else
    console.log("Unsatisfied");*/

/*if (symExec.response.results.length!=0){
    if(symExec.response.results.isSAT)
    console.log("Satisfied");
    else
    console.log("Unsatisfied");
}*/






