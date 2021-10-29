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
