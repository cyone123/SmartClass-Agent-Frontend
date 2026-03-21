<template>

    <div id="onlyoffice-editor" style="width: 100%; height: 100vh;">

    </div>

</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive } from 'vue';
import { getConfigAPI } from "@/api/file"
import { useRoute } from 'vue-router';

const route = useRoute()
let docEditor = null;

onMounted(async () => {
    const res = await getConfigAPI(route.params.file_id)
    config.value = res
    
    docEditor = new window.DocsAPI.DocEditor('onlyoffice-editor', config.value);
})
let config = reactive({})

onBeforeUnmount(() => {
  if (docEditor) {
    docEditor.destroyEditor();
    docEditor = null;
  }
});
</script>