<script>

</script>
<div>
      {#if () => {
  const {
    count,
    isAll,
    hasMore,
    showLabels
  } = labelInfo;
  return true;
}}<span>
        {#if () => !isAll}{#each showLabels as key}}{#if () => {
  return true;
}}<span class="chosen-label" on:click={()=>deleteLabel(key)}>
                {key} <span style="margin-left:3;font-size:12"></span>
              </span>{/if}{/each}{/if}
        {#if () => !isAll && hasMore}<span>等个</span>{/if}
      </span>{/if}
      {#each comments as comment, index}}{#if () => {
  _ssssss = 7;
  ;
  _aaa = a * 3;
  return true;
}}{#if _aaa === 2}{:else}<div style="width:120;height:200">hi</div>{/if}{/if}{/each}
    </div>