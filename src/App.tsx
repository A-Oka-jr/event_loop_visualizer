import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { StepForward, RotateCcw } from 'lucide-react';
import CodeEditor from './components/CodeEditor';
import ExecutionEngine from './ExecutionEngine';
import type { ExecutionContext } from './ExecutionEngine';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
  height: 100vh;
  background-color: #1e1e1e;
  color: #fff;
`;

const EditorContainer = styled.div`
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
  height: 100%;
`;

const VisualizerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const QueueContainer = styled.div<{ isWebApi?: boolean }>`
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 15px;
  min-height: ${props => props.isWebApi ? '150px' : '100px'};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background-color: ${props => props.isWebApi ? '#ff6b6b' : '#61dafb'};
    border-radius: 8px 0 0 8px;
  }
`;

const QueueTitle = styled.h3<{ isWebApi?: boolean }>`
  margin: 0 0 10px 0;
  color: ${props => props.isWebApi ? '#ff6b6b' : '#61dafb'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const QueueItem = styled.div<{ isWebApi?: boolean }>`
  background-color: #3d3d3d;
  padding: 8px;
  margin: 5px 0;
  border-radius: 4px;
  border-left: 3px solid ${props => props.isWebApi ? '#ff6b6b' : '#61dafb'};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const WebApiTimer = styled.span`
  font-size: 0.8em;
  color: #888;
`;

const ControlButton = styled.button`
  background-color: #61dafb;
  color: #1e1e1e;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #4fa8d1;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const Legend = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
  font-size: 0.9em;
`;

const LegendItem = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  gap: 5px;
  
  &::before {
    content: '';
    width: 12px;
    height: 12px;
    background-color: ${props => props.color};
    border-radius: 2px;
  }
`;

const ConsoleOutput = styled.div`
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  border-left: 3px solid #4caf50;
  font-family: monospace;
`;

const ConsoleTitle = styled.h3`
  margin: 0 0 10px 0;
  color: #4caf50;
`;

const OutputLine = styled.div`
  color: #fff;
  padding: 4px 0;
  border-bottom: 1px solid #3d3d3d;
  
  &:last-child {
    border-bottom: none;
  }
`;

function App() {
  const [code, setCode] = useState(`// Write your JavaScript code here
console.log('Hello');
setTimeout(() => {
  console.log('Timeout');
}, 2000);
Promise.resolve().then(() => {
  console.log('Promise');
});
console.log('End');`);

  const [executionEngine, setExecutionEngine] = useState<ExecutionEngine | null>(null);
  const [executionStep, setExecutionStep] = useState<ExecutionContext>({
    stack: [],
    taskQueue: [],
    microTaskQueue: [],
    webApi: [],
    currentLine: 0,
    output: [],
  });

  useEffect(() => {
    const engine = new ExecutionEngine(code);
    setExecutionEngine(engine);
    setExecutionStep(engine.getCurrentStep());
  }, [code]);

  const handleStep = () => {
    if (executionEngine) {
      const nextStep = executionEngine.getNextStep();
      if (nextStep) {
        setExecutionStep(nextStep);
      }
    }
  };

  const handleReset = () => {
    if (executionEngine) {
      executionEngine.reset();
      setExecutionStep(executionEngine.getCurrentStep());
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  return (
    <Container>
      <EditorContainer>
        <CodeEditor 
          code={code} 
          onChange={handleCodeChange}
          currentLine={executionStep.currentLine}
        />
      </EditorContainer>
      <VisualizerContainer>
        <Legend>
          <LegendItem color="#61dafb">Call Stack & Queues</LegendItem>
          <LegendItem color="#ff6b6b">Web APIs</LegendItem>
          <LegendItem color="#4caf50">Console Output</LegendItem>
        </Legend>
        
        <QueueContainer>
          <QueueTitle>Call Stack</QueueTitle>
          {executionStep.stack.map((item, index) => (
            <QueueItem key={index}>{item}</QueueItem>
          ))}
        </QueueContainer>

        <QueueContainer isWebApi>
          <QueueTitle isWebApi>Web APIs</QueueTitle>
          {executionStep.webApi.map((item, index) => (
            <QueueItem key={index} isWebApi>
              <span>{item.operation}</span>
              {item.duration > 0 && (
                <WebApiTimer>{item.duration}ms</WebApiTimer>
              )}
            </QueueItem>
          ))}
        </QueueContainer>

        <QueueContainer>
          <QueueTitle>Microtask Queue</QueueTitle>
          {executionStep.microTaskQueue.map((item, index) => (
            <QueueItem key={index}>{item}</QueueItem>
          ))}
        </QueueContainer>

        <QueueContainer>
          <QueueTitle>Task Queue</QueueTitle>
          {executionStep.taskQueue.map((item, index) => (
            <QueueItem key={index}>{item}</QueueItem>
          ))}
        </QueueContainer>

        <ConsoleOutput>
          <ConsoleTitle>Console Output</ConsoleTitle>
          {executionStep.output.map((line, index) => (
            <OutputLine key={index}>{`> ${line}`}</OutputLine>
          ))}
        </ConsoleOutput>

        <ButtonContainer>
          <ControlButton onClick={handleStep}>
            <StepForward size={16} />
            Step Forward
          </ControlButton>
          <ControlButton onClick={handleReset}>
            <RotateCcw size={16} />
            Reset
          </ControlButton>
        </ButtonContainer>
      </VisualizerContainer>
    </Container>
  );
}

export default App;