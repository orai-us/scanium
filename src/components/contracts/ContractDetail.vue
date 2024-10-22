<script lang="ts" setup>
import { computed, ref } from 'vue';
import { Icon } from '@iconify/vue';

let showCopyToast = ref(0);

const tipMsg = computed(() => {
  return showCopyToast.value === 2
    ? { class: 'error', msg: 'Copy Error!' }
    : { class: 'success', msg: 'Copy Success!' };
});

const copyWebsite = async (url: string) => {
  if (!url) {
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    showCopyToast.value = 1;
    setTimeout(() => {
      showCopyToast.value = 0;
    }, 1000);
  } catch (err) {
    showCopyToast.value = 2;
    setTimeout(() => {
      showCopyToast.value = 0;
    }, 1000);
  }
};
</script>

<template>
  <div class="box-content flex flex-col gap-4">
    <h2 class="card-title text-white">Contract Detail</h2>
    <div>
      <table class="table table-compact w-full text-sm">
        <tbody>
          <tr>
            <td class="capitalize whitespace-break-spaces min-w-max">
              Label
            </td>
            <td class="w-4/5">
              <p>Levana Perps Market</p>
            </td>
          </tr>
          <tr>
            <td class="capitalize whitespace-break-spaces min-w-max">
              Contract Address
            </td>
            <td class="w-4/5 flex gap-1">
              <p>orai12349824573489533ftt4565r</p>
              <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" @click="copyWebsite('12312312')" />
            </td>
          </tr>
          <tr>
            <td class="capitalize whitespace-break-spaces min-w-max">
              Creator Account
            </td>
            <td class="w-4/5 flex gap-1">
              <p>orai12349824573489533ftt4565r</p>
              <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" @click="copyWebsite('12312312')" />
            </td>
          </tr>
          <tr>
            <td class="capitalize whitespace-break-spaces min-w-max">
              Initial Block
            </td>
            <td class="w-4/5">
              <p>10408015</p>
            </td>
          </tr>
          <tr>
            <td class="capitalize whitespace-break-spaces min-w-max">
              Admin Account
            </td>
            <td class="w-4/5 flex gap-1">
              <p>orai12349824573489533ftt4565r</p>
              <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" @click="copyWebsite('12312312')" />
            </td>
          </tr>
          <tr>
            <td class="capitalize whitespace-break-spaces min-w-max">
              Code ID
            </td>
            <td class="w-4/5">
              <p>1064</p>
            </td>
          </tr>
          <tr>
            <td class="capitalize whitespace-break-spaces min-w-max">
              Code Checksum
            </td>
            <td class="w-4/5 flex gap-1">
              <p>orai12349824573489533ftt4565r</p>
              <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" @click="copyWebsite('12312312')" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- end -->
    <div class="toast" v-show="showCopyToast === 1">
      <div class="alert alert-success">
        <div class="text-xs md:!text-sm">
          <span>{{ tipMsg.msg }}</span>
        </div>
      </div>
    </div>
    <div class="toast" v-show="showCopyToast === 2">
      <div class="alert alert-error">
        <div class="text-xs md:!text-sm">
          <span>{{ tipMsg.msg }}</span>
        </div>
      </div>
    </div>
  </div>
</template>