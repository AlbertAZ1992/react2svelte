
import React, { useState } from 'react';

const e = () => {}

function Example(props) {

  const [ name, setName ] = useState('test');

  const a = 1;

  const b = 2;

  const c = <div>xx</div>;

    const d = a === 1 ? <div>xx</div> : <span>2</span>;

  function CC() {
	return a ===1 ? null : <div style={{ width: 120, height: 200 }}>hi</div>
  }

  const foo = () => {
    return <div>hisss</div>
  }

  const content = () => {
    let c = 1
    if (name === 'xxx') {
      return <div>{name}</div>
    } else if (name === 'x') {
    	return 's';
    }

    return <div>{c}</div>
  }



  return (
    <div>
      nihao <span>ssss</span><CC />
    <foo />
    	{ a }
      <div>{ content() }</div>
      <input
        css={{
          color: "red",
        }}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      { `Hello World! ${props.title}` }
    </div>
  );
}

const fn = function () {
}

export const Component = Example;

//export default function c() {
//}
export default Example;