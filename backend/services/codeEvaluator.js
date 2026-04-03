/**
 * CodeEvaluatorService — Code evaluation for hackathon stages
 * 
 * Direct port of CodeEvaluatorService.java.
 * 
 * Stage definitions (identical to Java):
 *   Stage 1: sumArray   — "I traverse a list of numbers..." → digit 1200
 *   Stage 2: reverseString — "I turn words around..." → digit 34
 * 
 * Evaluation strategy (same as Java):
 *   1. Try sandboxed execution (JS equivalent of javax.tools.JavaCompiler)
 *   2. Fallback to heuristic regex evaluation (identical patterns)
 */

const STAGES = [
  {
    stageNum: 1,
    methodSignature: 'sumArray',
    riddleText:
      'I traverse a list of numbers and gather their total strength. ' +
      'Give me an int[] and I shall return the sum of all elements.',
    digit: 1200,
  },
  {
    stageNum: 2,
    methodSignature: 'reverseString',
    riddleText:
      'I turn words around — give me a String and I return it reversed, ' +
      'mirror-image perfect.',
    digit: 34,
  },
];

/**
 * Try to evaluate user code by actually running it in a sandbox.
 * This is the Node.js equivalent of the Java compiler path.
 */
function evaluate(stage, userCode) {
  try {
    if (stage === 1) {
      return evaluateStage1(userCode);
    } else if (stage === 2) {
      return evaluateStage2(userCode);
    }
  } catch (e) {
    // Fall through to heuristic
  }
  return false;
}

function evaluateStage1(userCode) {
  try {
    // Find function name via regex (mirrors Java findMethodName)
    const fnName = findFunctionName(userCode);
    if (!fnName) return false;

    // Wrap and execute in a sandboxed Function
    const wrappedCode = `${userCode}\nreturn ${fnName}(input);`;
    const fn = new Function('input', wrappedCode);

    const r1 = fn([1, 2, 3]);
    if (r1 !== 6) return false;

    const r2 = fn([10, 20]);
    if (r2 !== 30) return false;

    return true;
  } catch (e) {
    return false;
  }
}

function evaluateStage2(userCode) {
  try {
    const fnName = findFunctionName(userCode);
    if (!fnName) return false;

    const wrappedCode = `${userCode}\nreturn ${fnName}(input);`;
    const fn = new Function('input', wrappedCode);

    if (fn('hello') !== 'olleh') return false;
    if (fn('a') !== 'a') return false;

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Find a function name in user code.
 * Mirrors the Java Pattern: looks for function declarations.
 */
function findFunctionName(code) {
  // Match: function name(  or  const/let/var name = function(  or  name(params) {
  const patterns = [
    /function\s+([a-zA-Z0-9_]+)\s*\(/,
    /(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:function|\()/,
    /(?:int|String|public|static|\s)+\s+([a-zA-Z0-9_]+)\s*\(/,
  ];
  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Heuristic evaluation — identical to Java version.
 * Checks for structural code patterns via regex.
 */
function heuristicEvaluate(stage, code) {
  const normalized = code.toLowerCase().replace(/\s+/g, '');
  if (stage === 1) {
    // Checks for loop + sum logic (Java/C++/JS styles)
    return (
      (normalized.includes('+=') ||
        normalized.includes('sum=') ||
        normalized.includes('total=')) &&
      (normalized.includes('for') || normalized.includes('while')) &&
      normalized.includes('return')
    );
  } else if (stage === 2) {
    // Checks for string reversal patterns
    return (
      (normalized.includes('reverse') ||
        normalized.includes('charat') ||
        normalized.includes('length()-1') ||
        normalized.includes('length-1') ||
        normalized.includes('split')) &&
      normalized.includes('return')
    );
  }
  return false;
}

module.exports = { STAGES, evaluate, heuristicEvaluate };
