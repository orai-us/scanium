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
let showCopyToast = ref(0);

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

const tipMsg = computed(() => {
  return showCopyToast.value === 2
    ? { class: 'error', msg: 'Copy Error!' }
    : { class: 'success', msg: 'Copy Success!' };
});

watchEffect(() => {
  const contract = /^[a-z\d]+1[a-z\d]{49,69}$/;
  const addr = /^[a-z\d]+1[a-z\d]{38,48}$/;
  const key = props.contract;
  if (addr.test(key)) {
    urlContract.value = `/${props.chain}/account/${key}`;
  } else if (contract.test(key)) {
    wasmStore.wasmClient.getWasmContractInfo(key).then((x) => {
      urlContract.value = `/${props.chain}/cosmwasm/${Number(x?.codeId)}/transactions/?contract=${key}`;
      labelContracts.value = x?.label;
    });
  }
});

</script>
<template>
  <div>
    <div class="flex flex-row justify-center items-center">
      <RouterLink :to="urlContract" class="text-link hover:cursor-pointer">
        {{ contract }}
      </RouterLink>
      <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" v-show="contract"
        @click="copyWebsite(contract || '')" />
      <div>
        <span class="text-xs truncate relative py-1 px-2 p2-4 w-fit ml-2 rounded text-success tooltip"
          v-if="labelContracts">
          <span class="inset-x-0 inset-y-0 opacity-10 absolute bg-success"></span>
          <button>{{ labelContracts }}</button>
        </span>
      </div>
    </div>

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
