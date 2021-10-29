# react2svelte

## Installation

```
yarn install
```

## development

### build core
```
yarn run build:core
```
### dev with cli
```
yarn run dev:cli
```

## Supported Dynamic JSX Features
* Single-file Component
* Component with exportDefaultDeclaration
* Function component
* Render JSXElement in FunctionDeclaration without props
* Render JSXElement in ArrowFunctionExpression without props
* Render JSXElement in FunctionExpression without props
* JSXExpressionContainer
* TemplateLiteral
* JSXElement with LogicalExpression
* JSXElement with ConditionalExpression
* JSXElement with IfStatement
* ObjectPatternAssignment

## Features todo
* Component with exportNamedDeclarations
* Class component
* Render JSXElement in FunctionDeclaration with props
* Render JSXElement in ArrowFunctionExpression with props
* Render JSXElement in FunctionExpression with props
* Hooks
## Demo
### React component input

```jsx
// cli/demo/react/component.jsx

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
```


### Svelte component output

```svelte
// cli/demo/svelte/component.svelte
<script>
  let title = 'hi';
  let a = 1;
  let b = 2;
  let c = 3;
  let showLabels = 111; // const c = <div>1234</div>;

  let comments = [1, 2, 3];

  let _ssssss;

  let _ttt;

  let _ttt3;

  let _aaa;

  let name;
  let ssssss;

  let _ttt2;

  let _ttt4;

  let aaa;

  let _a;

  let deleteLabel = (key) => {
    console.log(key);
  };

  let _labelInfo;

  $: ({
    count: _count,
    isAll: _isALL2,
    hasMore: _hasMore,
    showLabels: _showLabels = [],
    ..._args
  } = _labelInfo || {});
</script>

<div>
  <span>nihao</span> <span>ssss</span>

  {#if () => {
    _ssssss = 7;
    _aaa = a * 3;
    return true;
  }}
    {#if _aaa === 2}
      {#if () => {
        _ttt = b * _ssssss;
        return true;
      }}
        <div>
          <div>{_ttt}</div>
          {#if () => {
            _ttt3 = 4 * _ssssss;
            return true;
          }}
            <div>{_ttt3}</div>
          {/if}
        </div>
      {/if}
    {:else}
      <div style="width:120;height:200">hi</div>
    {/if}
  {/if}

  {#if (() => {
    return true;
  }) && (() => {
      return true;
    })}
    <div>hisss</div>
  {/if}

  {a}
  <div>
    {#if c === 4 && (() => {
        _a += 2;
        return true;
      })}
      <div>{_a}</div>
    {:else if c === 1 && (() => {
        name = 5;
        return true;
      })}
      <span>{name}</span>
    {:else if c === 3 && (() => {
        ssssss = 7;
        aaa = _a * 3;
        return true;
      })}
      {#if aaa === 2}
        {#if () => {
          _ttt2 = b * ssssss;
          return true;
        }}
          <div>
            <div>{_ttt2}</div>
            {#if () => {
              _ttt4 = 4 * ssssss;
              return true;
            }}
              <div>{_ttt4}</div>
            {/if}
          </div>
        {/if}
      {:else}
        <div style="width:120;height:200">hi</div>
      {/if}
    {:else}
      <div>{c}</div>
    {/if}
  </div>
  <input
    css="{{ color: 'red' }}"
    value="{a}"
    on:change="{(event) => console.log(event.target.value)}"
  />
  w Hello World! {title}

  {#if () => {
    _labelInfo = { count: {} };
    console.log(_args);
    return true;
  }}
    <span>
      {#if () => !_isALL2 && d}
        {#each _showLabels as key}}

          {#if () => {
            return true;
          }}
            <span class="chosen-label" on:click="{() => deleteLabel(key)}">
              {key} <span style="margin-left:3;font-size:12"></span>
            </span>
          {/if}
        {/each}
      {/if}

      {#if () => !_isALL2 && _hasMore}
        <span>等个</span>
      {/if}
    </span>
  {/if}

  {#each comments as comment, index}}

    {#if () => {
      _ssssss = 7;
      _aaa = a * 3;
      return true;
    }}
      {#if _aaa === 2}
        {#if () => {
          _ttt = b * _ssssss;
          return true;
        }}
          <div>
            <div>{_ttt}</div>
            {#if () => {
              _ttt3 = 4 * _ssssss;
              return true;
            }}
              <div>{_ttt3}</div>
            {/if}
          </div>
        {/if}
      {:else}
        <div style="width:120;height:200">hi</div>
      {/if}
    {/if}
  {/each}
</div>
```

