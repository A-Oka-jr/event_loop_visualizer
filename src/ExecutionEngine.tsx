interface ExecutionContext {
  stack: string[];
  taskQueue: string[];
  microTaskQueue: string[];
  webApi: { operation: string; startTime: number; duration: number }[];
  currentLine: number;
  output: string[];
}

class ExecutionEngine {
  private code: string;
  private steps: ExecutionContext[];
  private currentStep: number;
  private functions: Map<string, { body: string[]; start: number; end: number }>;
  private callStack: string[];

  constructor(code: string) {
    this.code = code;
    this.steps = [];
    this.currentStep = -1;
    this.functions = new Map();
    this.callStack = [];
    this.parseAndExecute();
  }

  private createContext(): ExecutionContext {
    const previousContext = this.steps[this.steps.length - 1] || {
      stack: [],
      taskQueue: [],
      microTaskQueue: [],
      webApi: [],
      currentLine: 0,
      output: [],
    };
    return {
      ...previousContext,
      stack: [...previousContext.stack],
      taskQueue: [...previousContext.taskQueue],
      microTaskQueue: [...previousContext.microTaskQueue],
      webApi: [...previousContext.webApi],
      output: [...previousContext.output],
    };
  }

  private parseFunctions() {
    const lines = this.code.split('\n');
    let currentFunction: { name: string; body: string[]; start: number } | null = null;
    let braceCount = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      const match = trimmedLine.match(/const\s+(\w+)\s*=\s*\(\)\s*=>\s*{/);
      if (match) {
        currentFunction = { name: match[1], body: [], start: index };
        braceCount = 1;
      }

      if (currentFunction) {
        currentFunction.body.push(line);
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount === 0) {
          this.functions.set(currentFunction.name, {
            body: currentFunction.body,
            start: currentFunction.start,
            end: index,
          });
          currentFunction = null;
        }
      }
    });
  }

  private executeFunction(name: string, startLine: number) {
    const func = this.functions.get(name);
    if (!func) return;

    this.callStack.push(`${name}()`);
    this.addStep(startLine);

    const lines = func.body;
    lines.forEach((line, i) => {
      const trimmedLine = line.trim();
      const currentLine = func.start + i;

      if (!trimmedLine || trimmedLine.match(/const\s+\w+\s*=\s*\(\)\s*=>\s*{/)) return;

      const logMatch = trimmedLine.match(/console\.log\(['"](.*?)['"]\)/);
      if (logMatch) {
        const context = this.createContext();
        context.currentLine = currentLine;
        context.output.push(logMatch[1]);
        this.steps.push(context);
      }

      const callMatch = trimmedLine.match(/(\w+)\(\);/);
      if (callMatch && this.functions.has(callMatch[1])) {
        this.executeFunction(callMatch[1], currentLine);
      }

      if (trimmedLine.includes('setTimeout')) {
        const context = this.createContext();
        context.currentLine = currentLine;
        context.webApi.push({ operation: 'setTimeout', startTime: Date.now(), duration: 2000 });
        context.taskQueue.push('setTimeout callback');
        this.steps.push(context);
      }

      if (trimmedLine.includes('Promise.resolve')) {
        const context = this.createContext();
        context.currentLine = currentLine;
        context.microTaskQueue.push('Promise callback');
        this.steps.push(context);
      }
    });

    this.callStack.pop();
    this.addStep(func.end);
  }

  private addStep(line: number) {
    const context = this.createContext();
    context.currentLine = line;
    this.steps.push(context);
  }

  private parseAndExecute() {
    this.parseFunctions();

    const lines = this.code.split('\n');
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      const match = trimmedLine.match(/^(\w+)\(\);$/);
      if (match && this.functions.has(match[1])) {
        this.executeFunction(match[1], index);
      }

      const logMatch = trimmedLine.match(/console\.log\(['"](.*?)['"]\)/);
      if (logMatch) {
        const context = this.createContext();
        context.currentLine = index;
        context.output.push(logMatch[1]);
        this.steps.push(context);
      }

      if (trimmedLine.includes('setTimeout')) {
        const context = this.createContext();
        context.currentLine = index;
        context.webApi.push({ operation: 'setTimeout', startTime: Date.now(), duration: 2000 });
        context.taskQueue.push('setTimeout callback');
        this.steps.push(context);
      }

      if (trimmedLine.includes('Promise.resolve')) {
        const context = this.createContext();
        context.currentLine = index;
        context.microTaskQueue.push('Promise callback');
        this.steps.push(context);
      }
    });
  }

  public getNextStep(): ExecutionContext | null {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      return this.steps[this.currentStep];
    }
    return null;
  }

  public getCurrentStep(): ExecutionContext {
    return this.steps[this.currentStep] || this.createContext();
  }

  public reset() {
    this.currentStep = -1;
  }
}

export default ExecutionEngine;
export type { ExecutionContext };
