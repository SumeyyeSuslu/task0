"use strict";
//var Promise = require('bluebird');
var _ = require('underscore');
//var ChromeTesterClient = require('../tester/chrome-tester-client');
var ConcreteMemory = require('./memory/concrete-memory');
//var cUtils = require('../context/coverage/coverage-utils');
//var loop_record_1 = require('./loop-summarization/loop-record');
var ParserExpression = require('./smt-wrapper/parser-expression');
var SMTSolver = require('./smt-wrapper/smt-solver');
var sUtils = require('./symbolic-execution-utils');
var SymEval = require('./symbolic-evaluation');
var SymbolicMemory = require('./memory/symbolic-memory');
var SymbolicExecution = (function () {
    function SymbolicExecution(uParameters,solver) {
       // this.functionName = functionName;
        
        this.M = new ConcreteMemory();
        this.S = new SymbolicMemory();
        this.response = {};
        this.response.errors = [];
        this.response.testCases = [];
        this.response.results = [];
        this.uParameters = uParameters;
		this.smtSolver = new SMTSolver(solver.name, solver.path, solver.tmpPath);    
    };

    
    SymbolicExecution.prototype.solvePathConstraint = function (pathConstraint,  cb) {
        var that = this;
            var newPathConstraint = [];
            for (var k = 0; k < pathConstraint.length; k++) {
                newPathConstraint.push({
                    'constraint': '!(' + pathConstraint[k] + ')',
                    'M': this.M,
                    'S': this.S
                });
            }
            //var s = [];
            for (var k = 0; k < newPathConstraint.length; k++) {
                console.log(newPathConstraint[k].constraint);
            }

            this.getPathConstraintSolution(newPathConstraint, function (err, res) {
                if (err) {
                    cb(new Error('Unable to get the solution of the path constraint. Reason: ' + err.message), null);
                }
                else
                cb(false,res);
                
            });
        
    };
    SymbolicExecution.prototype.getPathConstraintSolution = function (pathConstraint, cb) {
        var params = [];
        for (var pName in this.uParameters) {
            if (this.uParameters.hasOwnProperty(pName)) {
                params.push({
                    'id': pName,
                    'type': this.uParameters[pName].type,
                    'value': this.uParameters[pName].value,
                    'symbolicallyExecute': true
                });
            }
        }
        var parserExpression = new ParserExpression(pathConstraint, params, this.smtSolver.getName(), null, null);
        var that = this;
        
        try {
            parserExpression.parse(function (err, smtExpression) {
                if (err) {
                    var errorMessage;
                    if (err instanceof Error) {
                        errorMessage = err.message;
                    }
                    else {
                        errorMessage = 'Error while parsing expression';
                    }
                    that.response.errors.push(errorMessage);
                    cb(errorMessage, null);
                }
                else {
                    that.smtSolver.run(smtExpression, function (err, res) {
                        if (err) {
                            that.response.errors.push('Unable to run SMT expression');
                            
                           // console.log(that.response.errors[0]);
                            cb(true, null);
                        }
                        else {
                            var smtResponse = that.smtSolver.parseResponse(res);
                           
                            if(smtResponse.isSAT)
                                console.log("Satisfied");
							
                            else
                                console.log("Unsatisfied");
                           
                            cb(false,res);
                        }
                    });
                }
            });
          //  that.mkEx.push(smtResponse);
        }
        catch (e) {
            that.response.errors.push(e.message);
            cb(true, null);
        }
    };
    return SymbolicExecution;
}());
module.exports = SymbolicExecution;
