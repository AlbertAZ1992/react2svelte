<script>

</script>
<div>
      nihao <span>ssss</span>
      {#if _aaa === 2}{:else}<div style="width:120;height:200">hi</div>{/if}
      {#if () => {
  return true;
}}{/if}
    	{a}
      {
  /* <div>{ content() }</div> */
}
      <input css={{color:"red"}} value={name} on:change={event=>setName(event.target.value)}/>
      w
      Hello World! {props.title}
      {#each comments as comment, index}}{#if _aaa === 2}{:else}<div style="width:120;height:200">hi</div>{/if}{/each}
    </div>