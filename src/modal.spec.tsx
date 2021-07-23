import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { render, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event'

const modalRoot = document.createElement('div')
modalRoot.setAttribute('id', 'modal-root')
document.body.appendChild(modalRoot)

const Modal = (props: any) => {
  const { onClose, children } = props;
  const [state, setState] = useState(false);
  const [counter, setCounter] = useState(0);
  const el = document.createElement('div');
  
  useEffect(() => {
    modalRoot.appendChild(el);
    
    return () => { modalRoot.removeChild(el) }
  }, undefined);
  
  useEffect(() => {
    console.log('effect state');
    if (state) {
  
      console.log('effect state run timer');
      const sub = setTimeout(() => {
  
        console.log('effect state timer call');
        setCounter((t) => t + 1);
      }, 50000);
      
      return () => clearTimeout(sub);
    }
    
    return undefined;
  }, [state]);
  
  return ReactDOM.createPortal(
    <div onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>
        {children}
        <hr />
        <button onClick={onClose}>Close</button>
        
        <button data-testid={'coutner-button'} onClick={() => setState(true)}>Counter inc</button>
        
        <div data-testid={'coutner'}>{counter}</div>
      </div>
    </div>,
    el
  )
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})

test('modela shows counter', async () => {
  // Act
  const { findByTestId } = render(
    <Modal>
      <div>test</div>
    </Modal>
  );
  
  const button = await findByTestId('coutner-button');
  
  userEvent.click(button);
  
  act(() => {
    jest.runAllTimers();
  });
  
  const counter = await findByTestId('coutner');
  
  expect(counter.textContent).toEqual('1')
});


test('modal shows the children and a close button', () => {
  // Arrange
  const handleClose = jest.fn()
  
  // Act
  const { getByText } = render(
    <Modal onClose={handleClose}>
      <div>test</div>
    </Modal>
  )
  // Assert
  expect(getByText('test')).toBeTruthy()
  
  // Act
  fireEvent.click(getByText(/close/i))
  
  // Assert
  expect(handleClose).toHaveBeenCalledTimes(1)
})
