
import React, { useState } from 'react';

const e = () => {}

function Example(props) {


  const [ name, setName ] = useState('test');

  const a = 1;

  const b = 2;

  const c = <div>1234</div>;

  const d = a === 1 ? <div>xx</div> : <span>2</span>;

  const comments = [1, 2, 3];

  function CC() {
    let aaa = a * 3;
  	return aaa === 2 ? <div>hihi</div> : <div style={{ width: 120, height: 200 }}>hi</div>
  }

  const foo = () => {
    if (() => { return true }) {
    	return <div>hisss</div>
    }

  }

  // const content = () => {
  //   let c = 1
  //   if (a === 4) {
  //     a += 2
  //     return <div>{a}</div>
  //   } else if (a === 1) {
  //     let name = 5
  //   	return name;
  //   }

  //   return <div>{c}</div>
  // }



  return (
    <div>
      nihao <span>ssss</span>
      <CC />
      <foo />
    	{ a }
      {/* <div>{ content() }</div> */}
      <input
        css={{
          color: "red",
        }}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      w
      { `Hello World! ${props.title}` }
      {
	      comments.map((comment, index) => {
          let content = comment;
          return (
            <CC content={content} key={index} />
          )
        })
      }
    </div>
  );
}

const fn = function () {
}

export const Component = Example;

//export default function c() {
//}
export default Example;