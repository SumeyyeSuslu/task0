"use strict";
var childProcess = require('child_process');
var path = require('path');
var _ = require('underscore');
var utils = require('../utils');
var SMTSolver = (function () {
    function SMTSolver(name, path, tempPath) {
        if (SMTSolver.availableSolvers.indexOf(name) === -1) {
            throw new Error('Unknown solver "' + name + '"');
        }
        this.name = name;
        this.path = path;
        this.tempPath = tempPath;
        try {
            this.setPathFile();
        }
        catch (e) {
            throw e;
        }
    }
    SMTSolver.prototype.run = function (expression, cb) {
        utils.writeOnFile(this.pathFile, expression);
        this.executeExpression(this.pathFile, function (err, res) {
            if (err) {
                cb(err, null);
            }
            else {
                cb(null, res);
            }
        });
    };
    SMTSolver.prototype.executeExpression = function (pathFile, cb) {
        var exec;
        var args;
        var res = '';
        var appPath = this.path;
        if (this.name === 'cvc4') {
            args = [
                '-L',
                'smt2',
                pathFile
            ];
        }
        else if (this.name === 'z3') {
            args = [
                '-smt2',
                pathFile
            ];
        }
        else if (this.name === 'z3-str') {
            args = [
                this.path,
                '-f',
                pathFile
            ];
            appPath = 'python';
        }
        exec = childProcess.spawn(appPath, args);
        exec.stdout.setEncoding('utf8');
        exec.stdout.on('data', function (data) {
            res += data.toString().trim() + '\n';
        });
        exec.on('close', function (code) {
            if (code === 0) {
                cb(null, res);
            }
            else {
                cb(new Error('Exit code different from 0'), null);
            }
        });
    };
    SMTSolver.prototype.parseResponse = function (response) {
        var ret = {
            isSAT: false,
            values: {}
        };
        var tokensResponse = response.match(/\"(.+)\"|\S+/g);
        ret.isSAT = this.isSAT(tokensResponse);
        if (ret.isSAT) {
            ret.values = this.getValues(tokensResponse);
        }
        return ret;
    };
    SMTSolver.prototype.isSAT = function (tokens) {
        var index;
        if (!_.isArray(tokens)) {
            return false;
        }
        for (var k = 0; k < tokens.length; k++) {
            index = SMTSolver.SMTSatisfiabilityResponses.indexOf(tokens[k].toLowerCase());
            if (index !== -1) {
                return (index === 0);
            }
        }
        return false;
    };
    SMTSolver.prototype.getValues = function (tokens) {
        var obj = {};
        var t = tokens.slice(0);
        var identifier;
        var value;
        if (this.name === 'cvc4' || this.name === 'z3') {
            for (var k = 1; k < t.length; k++) {
                t[k] = t[k].replace(/\(/g, '').replace(/\)/g, '');
            }
            for (var k = 1; k < t.length; k++) {
                if (t[k].match(/[a-zA-Z0-9_]/) !== null) {
                    identifier = t[k];
                    if (++k < t.length) {
                        if (t[k] === '-') {
                            if (++k < t.length) {
                                obj[identifier] = parseInt('-' + t[k]);
                            }
                        }
                        else if (t[k].length > 0 && t[k].charAt(0) === '"' &&
                            t[k].charAt(t[k].length - 1) === '"') {
                            t[k] = t[k].substring(1, t[k].length - 1);
                            obj[identifier] = t[k];
                        }
                        else {
                            obj[identifier] = parseInt(t[k]);
                        }
                    }
                }
            }
        }
        else if (this.name === 'z3-str') {
            for (var k = 0; k < t.length; k++) {
                if (t[k] === ':') {
                    if (k - 1 >= 0 && k + 3 < t.length) {
                        identifier = t[k - 1];
                        value = t[k + 3];
                        if (value.length > 0 && value.charAt(0) === '"' &&
                            value.charAt(value.length - 1) === '"') {
                            value = value.substring(1, value.length - 1);
                            obj[identifier] = value;
                        }
                        else {
                            obj[identifier] = parseInt(value);
                        }
                    }
                    k += 4;
                }
            }
        }
        return obj;
    };
    SMTSolver.prototype.setPathFile = function () {
        var maxIterations = 100;
        var pathFile;
        var randomName;
        for (var k = 0; k < maxIterations; k++) {
            randomName = Math.random().toString(36).substring(10);
            pathFile = path.join(this.tempPath, randomName + '.smt2');
            if (!utils.fileExists(pathFile)) {
                this.pathFile = pathFile;
                return;
            }
        }
        throw new Error('Unable to set filename of SMT file');
    };
    SMTSolver.prototype.getName = function () {
        return this.name;
    };
    SMTSolver.availableSolvers = [
        'z3',
        'z3-str',
        'cvc4'
    ];
    SMTSolver.SMTSatisfiabilityResponses = [
        'sat',
        'unsat',
        'unknown'
    ];
    return SMTSolver;
}());
module.exports = SMTSolver;
