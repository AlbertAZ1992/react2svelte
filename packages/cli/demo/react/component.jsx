
import React from 'react';

function Example(props) {

  const a = 1;

  const b = 2;

  const c = <div>1234</div>;

  const d = a === 1 ? <div>xx</div> : <span>2</span>;

  const comments = [1, 2, 3];



  function CC() {
    let ssssss = 7

    const render = () => {
      let ttt = 2 * ssssss;

      const render = () => {
        let ttt = 4 * ssssss;

        return <div>{ttt}</div>;
      };

      return <div><div>ttt</div>{ render() }</div>;
    };

    let aaa = a * 3;
  	return aaa === 2 ? render() : <div style={{ width: 120, height: 200 }}>hi</div>
  }

  const foo = () => {
    if (() => { return true }) {

    	return <div>hisss</div>
    }

  }

  const content = () => {
    let c = 1
    if (a === 4) {
      a += 2
      return <div>{a}</div>
    } else if (a === 1) {
      let name = 5
    	return name;
    } else if (a === 3) {

      const render = () => {
        let ttt = 2 * ssssss;

        const render = () => {
          let ttt = 4 * ssssss;

          return <div>{ttt}</div>;
        };

        return <div><div>ttt</div>{ render() }</div>;
      };

      let aaa = a * 3;
      return aaa === 2 ? render() : <div style={{ width: 120, height: 200 }}>hi</div>
    }

    return <div>{c}</div>
  }

  const deleteLabel = (key) => {
    console.log(key);
  }



  const renderLabel = () => {
    const labelInfo = {};
    const {
      count: { test },
      isAll: _isALL,
      hasMore,
      showLabels,
      ...args
    } = labelInfo;
    console.log(args);
    return (
      <span>
        {!isAll &&
          showLabels.map((key) => {
            return (
              <span className="chosen-label" onClick={() => deleteLabel(key)} key={key}>
                {key} <span style={{ marginLeft: 3, fontSize: 12 }} ></span>
              </span>
            );
          })}
        {!isAll && hasMore && test && <span>{`等${count}个`}</span>}
      </span>
    );
  };



  return (
    <div>
      nihao <span>ssss</span>
      <CC />
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
      w
      { `Hello World! ${props.title}` }
      { renderLabel() }
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

export const Component = Example;

//export default function c() {
//}
export default Example;