<div>
      nihao <span>ssss</span>{#if a === 1}{:else}<div style="width:120;height:200">hi</div>{/if}
    <div>hisss</div>
    	{a}
      <div>{content()}</div>
      <input css={{color:"red"}} value={name} on:change={event=>setName(event.target.value)}/>
      {`Hello World! ${props.title}`}
    </div>