
import React, { useState } from 'react';


function CC () {
  return <div>hi</div>
}

export default function Example(props) {

  const [ name, setName ] = useState('test');

  const a = 1;

  const b = 2;

  // const content = () => {
  //   if (name === 'xxx') {
  //     return <div>{name}</div>
  //   }
  //   return <div>hello</div>
  // }

  return (
    <div>
      <CC />
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

// export default Example;