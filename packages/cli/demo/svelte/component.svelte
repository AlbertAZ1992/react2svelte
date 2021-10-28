<script>
let a = 1;
let b = 2;
let comments = [1, 2, 3];

let _ssssss;

let _ttt;

let _ttt3;

let _aaa;

let name;

let _ttt2;

let _ttt4;

let aaa;

let _c;

let deleteLabel = key => {
  console.log(key);
};

let _labelInfo;

let {
  count: {
    test: _test
  },
  isAll: _isALL2,
  hasMore: _hasMore,
  showLabels: _showLabels,
  ..._args
} = _labelInfo;
</script>
<div>
      nihao <span>ssss</span>
      {#if () => {
  _ssssss = 7;
  ;
  _aaa = a * 3;
  return true;
}}{#if _aaa === 2}{:else}<div style="width:120;height:200">hi</div>{/if}{/if}
      {#if (() => {
  return true;
}) && (() => {
  return true;
})}<div>hisss</div>{/if}
    	{a}
      <div>{#if a === 4 && (() => {
  a += 2;
  return true;
})}<div>{a}</div>{:else}{#if a === 1 && (() => {
  name = 5;
  return true;
})}{:else}{#if a === 3 && (() => {
  ;
  aaa = a * 3;
  return true;
})}{#if aaa === 2}{:else}<div style="width:120;height:200">hi</div>{/if}{:else}<div>{_c}</div>{/if}{/if}{/if}</div>
      <input css={{color:"red"}} value={name} on:change={event=>setName(event.target.value)}/>
      w
      Hello World! {props.title}
      {#if () => {
  _labelInfo = {};
  console.log(_args);
  return true;
}}<span>
        {#if () => !isAll}{#each _showLabels as key}}{#if () => {
  return true;
}}<span class="chosen-label" on:click={()=>deleteLabel(key)}>
                {key} <span style="margin-left:3;font-size:12"></span>
              </span>{/if}{/each}{/if}
        {#if () => !isAll && _hasMore && _test}<span>等个</span>{/if}
      </span>{/if}
      {#each comments as comment, index}}{#if () => {
  _ssssss = 7;
  ;
  _aaa = a * 3;
  return true;
}}{#if _aaa === 2}{:else}<div style="width:120;height:200">hi</div>{/if}{/if}{/each}
    </div>