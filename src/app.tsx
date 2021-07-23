import React, { useState } from 'react';

import styles from './index.css';

export type IProps = {
  enable?: boolean;
};

function App (props: IProps) {
  const [counter, setCounter] = useState(0);
  
  const handleInc = () => {
    console.log(props.enable && 'changes 23');
    setCounter(c => c + 1000);
  };
  
  const handleDec = () => {
    setCounter(c => c - 10);
  };
  
  return (
    <div className={styles.element}>
      <h1>Counter is { counter }</h1>
      
      <button onClick={handleInc}>Inc</button>
      <button onClick={handleDec}>Dec</button>
    </div>
  );
}

export default App;
