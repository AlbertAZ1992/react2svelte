
import React from 'react';

function Example(props) {

  const title = 'hi';

  const a = 1;

  const b = 2;

  const c = 3;

  let showLabels = 111;
  // const c = <div>1234</div>;

  const d = a === 1 ? <div>xx</div> : <span>2</span>;

  const comments = [1, 2, 3];



  function CC() {
    let ssssss = 7

    const render = () => {
      let ttt = b * ssssss;

      const render2 = () => {
        let ttt = 4 * ssssss;

        return <div>{ttt}</div>;
      };

      return <div><div>{ttt}</div>{ render2() }</div>;
    };

    let aaa = a * 3;
  	return aaa === 2 ? render() : <div style={{ width: 120, height: 200 }}>hi</div>
  }

  const Foo = () => {
    if (() => { return true }) {

    	return <div>hisss</div>
    }

  }

  const content = () => {
    let a = 1
    if (c === 4) {
      a += 2
      return <div>{a}</div>
    } else if (c === 1) {
      let name = 5
    	return <span>{name}</span>;
    } else if (c === 3) {
      let ssssss = 7;
      const render = () => {
        let ttt = b * ssssss;

        const render2 = () => {
          let ttt = 4 * ssssss;

          return <div>{ttt}</div>;
        };

        return <div><div>{ttt}</div>{ render2() }</div>;
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
    const labelInfo = {
      count: {}
    };
    const {
      count,
      isAll: _isALL,
      hasMore,
      showLabels = [],
      ...args
    } = labelInfo;
    console.log(args);
    return (
      <span>
        {!_isALL && d &&
          showLabels.map((key) => {
            return (
              <span className="chosen-label" onClick={() => deleteLabel(key)} key={key}>
                {key} <span style={{ marginLeft: 3, fontSize: 12 }} ></span>
              </span>
            );
          })}
        {!_isALL && hasMore && <span>{`等${count}个`}</span>}
      </span>
    );
  };



  return (
    <div>
      <span>nihao</span> <span>ssss</span>
      <CC />
      <Foo />
    	{ a }
      <div>{ content() }</div>
      <input
        css={{
          color: "red",
        }}
        value={a}
        onChange={(event) => console.log(event.target.value)}
      />
      w
      { `Hello World! ${title}` }
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

export default Example;