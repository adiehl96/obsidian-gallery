<script> 
    export let columns;
    export let maxColumnWidth = 400;
    export let tempImg;
</script>

{#each columns as images}
    <div class="gallery-grid-column">
    {#each images as img}
        {#if img.includes(".mp4") || img.includes(".webm")}
            <video src={img} controls=true width={maxColumnWidth} class="gallery-grid-vid"> <track kind="captions"> </video>
        {:else}
            <img src={tempImg} data-src={img} loading="lazy" class="gallery-grid-img lazy" alt="" width={maxColumnWidth} />
        {/if}
    {/each}
    </div>
{/each}