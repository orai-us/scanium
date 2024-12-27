<script lang="ts" setup>
import { Icon } from '@iconify/vue';

const props = defineProps(["height", "chain"]);
</script>
<template>
  <div class="box-content">
    <h2 class="card-title flex flex-row justify-between text-white">
      <p class="">Block #{{ height }}</p>
      <div class="flex" v-if="props.height">
        <RouterLink :to="`/${chain}/block/${height - 1}`" class="btn btn-primary btn-sm p-1 text-2xl mr-2">
          <Icon icon="mdi-arrow-left" class="w-full h-full" />
        </RouterLink>
        <RouterLink :to="`/${chain}/block/${height + 1}`" class="btn btn-primary btn-sm p-1 text-2xl">
          <Icon icon="mdi-arrow-right" class="w-full h-full" />
        </RouterLink>
      </div>
    </h2>
  </div>
</template>
