var fs=require('fs');


function readFormula(fileName) {
    // To read the file, it is possible to use the 'fs' module.
    // Use function readFileSync and not readFile. (ex: var content=fs.readFileSync("a.json", "utf8"))
    // First read the lines of text of the file and only afterward use the auxiliary functions.
    let text = fs.readFileSync(fileName, "utf8")// = ...  //  an array containing lines of text extracted from the file.
    let linhas = text.split("\r\n")
    let quantVariaveis = 0;
    let quantClausulas = 0;
    var achou = false;
    for (var i = 0; i < linhas.length; i++) {
        if (linhas[i][0] == "p") {
            let membros=[];
            membros = linhas[i].split(' ');
            quantVariaveis = membros[2];
            quantClausulas = membros[3];
            achou = true;
        }
    }
    if (!achou) {
        for (var i = 0; i < linhas.length && !achou; i++) {
            let aux7 = [];
            aux7 = linhas[i].split(' ');
            if (aux7[1] == "cnf") {
                quantVariaveis = aux7[2];
                quantClausulas = aux7[3];
                achou = true;
            }
        }
    }

    let clauses = readClauses(linhas);

    let variables = readVariables(clauses);


    function readClauses (linhas) {
        let aux = [];
        let aux2 = [];
        var clausulaMaisDeUmaLinha = false;
        for (var i = 0; i < linhas.length; i++) {
            if (linhas[i][0] != "c" && linhas[i][0] != "p" && linhas[i][0] != undefined) {
                if (linhas[i][linhas[i].length -1] == 0) {
                    linhas[i] = linhas[i].toString().replace(' 0', '');
                    aux = linhas[i].split(/\s+/);
                    if (clausulaMaisDeUmaLinha) {
                        for (var k=0;k<aux.length;k++) {
                            aux2[aux2.length-1].push(aux[k]);
                        }
                        clausulaMaisDeUmaLinha = false;
                    }
                    else if (!clausulaMaisDeUmaLinha) {
                        aux2.push(aux);
                        clausulaMaisDeUmaLinha = false;
                    }
                }
                else {
                    for (var j=i;linhas[j][linhas[j].length - 1] != 0; j++) {
                        aux = linhas[i].split(/\s+/);
                        aux2.push(aux);
                        clausulaMaisDeUmaLinha = true;
                    }
                }
            }
        }
        return aux2;
    }

    function readVariables (clauses) {
        let aux3 = [];
        aux3[0] = [];
        var aux4;
        for (var i=0;i<clauses.length;i++) {
            for (var j=0;j<clauses[i].length;j++) {
                if (clauses[i][j] !== "" ) {
                    aux4 = Math.abs(clauses[i][j]);
                }
                if (i === 0 && j === 0) {
                    aux3[0].push(aux4);
                }

                else if (aux3[0].indexOf(aux4) === -1 && aux4 !== undefined) {
                    aux3[0].push(aux4);
                }
            }
        }
        for (var m = 0; m < aux3[0].length; m++) {
            aux3[0].splice(m,1,0);
        }
        return aux3;
    }

    // In the following line, text is passed as an argument so that the function
    // is able to extract the problem specification.
    let specOk = checkProblemSpecification(quantVariaveis, quantClausulas, clauses, variables);

    function checkProblemSpecification(quantVariaveis, quantClausulas, clauses, variables) {
        if (quantClausulas == clauses.length && quantVariaveis == variables[0].length) {
            return true;
        }
        else return false;
    }


    let result = { 'clauses': [], 'variables': [] }
    if (specOk) {
        result.clauses = clauses
        result.variables = variables
    }
    return result
}

function nextAssignment(currentAssignment) {
    let newAssignment = [];
    newAssignment[0] = [];

    for (var i = 0;i<currentAssignment[0].length;i++) {
        newAssignment[0][i] = currentAssignment[0][i];
    }
    for (var i = 0; i < newAssignment[0].length; i++) {
        if (newAssignment[0][i] == 0) {
            newAssignment[0][i] = 1;
            break;
        }
        else {
            newAssignment[0][i] = 0;
        }
    }
    return newAssignment;
}

function arraysIguais(array1, array2) {
    var i = array1.length;
    while (i--) {
        if (array1[i] !== array2[i]) return false;
    }
    return true;
}

function doSolve(clauses, assignment) {
    let isSat = false;
    var parar = false;
    var aux6 = 0;
    let assignment1 = assignment;
    let clausulas = [];

    while ((!isSat) && (!parar)) {
        if (aux6 === 1) {
            if (arraysIguais(assignment[0],assignment1[0])) {
                parar = true;
            }
        }
        aux6 = 1;
        if (!parar) {
            for (var i=0;i<clauses.length;i++) {
                clausulas[i] = [];
                for (var j=0;j<clauses[i].length;j++) {
                    let aux5 = Math.abs(clauses[i][j]);
                    if (parseInt(clauses[i][j])>0) {
                        clausulas[i][j]=assignment[0][aux5-1];
                    }
                    else if (parseInt(clauses[i][j])<0) {
                        if(assignment[0][aux5-1] == 0) {
                            clausulas[i][j] = 1;
                        }
                        else if (assignment[0][aux5 -1] == 1) {
                            clausulas[i][j] = 0;
                        }
                    }
                }
            }
            var clausulaTrue = true;
            for (var x=0;(x<clausulas.length)&&(clausulaTrue);x++) {
                clausulaTrue = false;
                for (var y=0;y<clausulas[x].length;y++) {
                    if (clausulas[x][y] == 1) {
                        clausulaTrue = true;
                    }
                }
            }

            if (clausulaTrue) {
                isSat = true;
            }
            // does this assignment satisfy the formula? If so, make isSat true.
            // if not, get the next assignment and try again.
            if (!clausulaTrue) {
                assignment = nextAssignment(assignment);
            }
        }
    }
    let result = {'isSat': isSat, satisfyingAssignment: null}
    if (isSat) {
        result.satisfyingAssignment = assignment;
    }
    return result
}

exports.solve = function(fileName) {
    let formula = readFormula(fileName);
    let result = doSolve(formula.clauses, formula.variables);
    return result; // two fields: isSat and satisfyingAssignment
}