<script setup lang="ts">
import { themeChange } from 'theme-change';
import { defineAsyncComponent, onMounted } from 'vue';
import TxDialog from './components/TxDialog.vue';
import CreateProposalDialog from './components/CreateProposalDialog.vue';

onMounted(() => {
  themeChange(false);

  // Find the <style> element with id "app-style"
  const appStyle = document.getElementById('app-styles');

  if (appStyle) {
    // Remove the <style> element from its current position
    appStyle.parentNode?.removeChild(appStyle);

    // Append the <style> element to the end of <head>
    document.head.appendChild(appStyle);
  }
});
</script>

<template>
  <div>
    <RouterView />
    <TxDialog />
    <CreateProposalDialog />
  </div>
</template>
