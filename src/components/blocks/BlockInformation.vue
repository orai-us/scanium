<script lang="ts" setup>
const props = defineProps(['blockInformation']);
</script>
<template>
  <div class="box-content">
    <h2 class="card-title flex flex-row justify-between text-white">
      <p class="">Block Information</p>
    </h2>
    <div class="w-full h-[1px] bg-[#242627] my-2"></div>
    <div class="overflow-auto">
      <table class="table table-compact w-full text-sm">
        <tbody>
          <tr v-for="(v, k) of blockInformation">
            <td class="capitalize whitespace-break-spaces min-w-max">
              {{ k }}
            </td>
            <td class="w-4/5">
              <div class="overflow-hidden w-auto whitespace-normal">
                <p>{{ v }}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
