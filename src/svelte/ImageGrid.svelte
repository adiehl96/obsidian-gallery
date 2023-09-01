<script>
    export let imageList;
    export let maxColumnWidth = 400;
</script>


    {#each imageList as img}
        {#if img.includes(".mp4")}
            <video src={img} controls=true width={maxColumnWidth}> <track kind="captions"> </video>
        {:else}
            <img src={img} class="gallery-grid-img" alt="" width={maxColumnWidth} />
        {/if}
    {/each}


<style>
    /*:global(img) {
        opacity: 0.9;
        transition: 0.1;
    }
    :global(img):hover {
        opacity: 1;
        transform: scale(1.04);
    }*/
</style>
