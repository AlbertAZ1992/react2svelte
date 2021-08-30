
import React, { useState } from 'react';

function Example(props) {

  const [ name, setName ] = useState('test');

  const content = () => {
    if (name === 'xxx') {
      return <div>{name}</div>
    }
    return <div>hello</div>
  }

  return (
    <div>
      <div>{ content() }</div>
      <input
        css={{
          color: "red",
        }}
        valye={name}
        onChange={(event) => setName(event.target.value)}
      />
      { `Hello World! ${props.title}` }
    </div>
  );
}

export const Component = Example;

export default Example;