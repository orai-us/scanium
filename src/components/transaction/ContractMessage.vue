<script lang="ts" setup>
import { useWasmStore } from '@/modules/[chain]/cosmwasm/WasmStore';
import { computed, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';

const props = defineProps(['contract', 'chain']);
const vueRouters = useRouter();
const wasmStore = useWasmStore();
const labelContracts = ref(null as any);
const urlContract = ref("");
let showCopyToast = ref(null as any);

const copyWebsite = async (url: string) => {
  if (!url) {
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    showCopyToast.value = true;
    setTimeout(() => {
      showCopyToast.value = null;
    }, 1000);
  } catch (err) {
    showCopyToast.value = false;
    setTimeout(() => {
      showCopyToast.value = null;
    }, 1000);
  }
};

const tipMsg = computed(() => {
  return showCopyToast.value === false
    ? { class: 'error', msg: 'Copy Error!' }
    : { class: 'success', msg: 'Copy Success!' };
});

watchEffect(() => {
  const key = props.contract;
  wasmStore.wasmClient.getWasmContractInfo(key).then((x) => {
    urlContract.value = `/${props.chain}/cosmwasm/${Number(x?.codeId)}/transactions/?contract=${key}`;
    labelContracts.value = x?.label;
  });
});

</script>
<template>
  <div>
    <div class="flex flex-row xl:items-center justify-start break-words xl:flex-nowrap flex-wrap">
      <RouterLink :to="urlContract" class="text-link hover:cursor-pointer xl:text-sm text-[12px] w-full">
        {{ contract }}
      </RouterLink>
      <div class="xl:flex items-center hidden">
        <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer xl:w-5 w-3" v-show="contract"
          @click="copyWebsite(contract || '')" />
        <div>
          <span class="text-xs truncate relative py-1 px-2 w-fit ml-2 rounded-lg text-success" v-if="labelContracts">
            <span class="inset-x-0 inset-y-0 opacity-10 absolute bg-success"></span>
            <button>{{ labelContracts }}</button>
          </span>
        </div>
      </div>
    </div>

    <div class="toast" v-show="showCopyToast === true">
      <div class="alert alert-success">
        <div class="text-xs md:!text-sm">
          <span>{{ tipMsg.msg }}</span>
        </div>
      </div>
    </div>
    <div class="toast" v-show="showCopyToast === false">
      <div class="alert alert-error">
        <div class="text-xs md:!text-sm">
          <span>{{ tipMsg.msg }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
