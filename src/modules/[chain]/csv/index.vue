<script lang="ts" setup>
import router from '@/router';
import { onMounted, ref, toRaw, watch, watchEffect } from 'vue';
import { getDownloadCSV } from '@/service/assetsService';
import { useRoute } from 'vue-router';

const route = useRoute();
const props = defineProps(['chain']);

// const startTime = ref(new Date(new Date().setDate(new Date().getDate() - 7)));
// const endTime = ref(new Date());
const showCopySuccess = ref(false);
const address = ref('');
const showDownloadSuccess = ref(false);
const isDownloading = ref(false);
const showSuccessSection = ref(false);
const showErrorSection = ref(false);
const errorMessage = ref('');
const isValidAddress = ref(true);
const showAddressCopySuccess = ref(false);

function validateAddress(addr: string): boolean {
    // Validate Oraichain address format
    const addressRegex = /^[a-z\d]+1[a-z\d]{38,48}$/;
    return addressRegex.test(addr);
}

function updateAddress(addr: string) {
    address.value = addr;
    isValidAddress.value = validateAddress(addr);
    if (!isValidAddress.value) {
        errorMessage.value = 'Invalid address format. Please check the address and try again.';
        showErrorSection.value = true;
    } else {
        showErrorSection.value = false;
    }
}

onMounted(() => {
    const queryAddress = route.query.address?.toString() || '';
    updateAddress(queryAddress);
});

async function downloadCSV() {
    if (isDownloading.value) return;
    if (!isValidAddress.value) {
        errorMessage.value = 'Please provide a valid address before downloading.';
        showErrorSection.value = true;
        return;
    }

    try {
        isDownloading.value = true;
        showSuccessSection.value = false;
        showErrorSection.value = false;

        const response = await getDownloadCSV({ account: address.value });

        if (response.msg !== 'success') {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const objectUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `transaction_${address.value}_${new Date().toISOString()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(objectUrl);
        showSuccessSection.value = true;

    } catch (error) {
        console.error('Download failed:', error);
        errorMessage.value = error instanceof Error ? error.message : 'Download failed. Please try again.';
        showErrorSection.value = true;
    } finally {
        isDownloading.value = false;
    }
}

async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    showCopySuccess.value = true;
    setTimeout(() => {
        showCopySuccess.value = false;
    }, 2000);
}

function retryDownload() {
    if (!isValidAddress.value) {
        errorMessage.value = 'Please provide a valid address before downloading.';
        return;
    }
    showErrorSection.value = false;
    downloadCSV();
}

function copyAddress() {
    navigator.clipboard.writeText(address.value);
    showAddressCopySuccess.value = true;
    setTimeout(() => {
        showAddressCopySuccess.value = false;
    }, 2000);
}

// Watch for route query changes
watch(() => route.query.address, (newAddress) => {
    if (newAddress) {
        updateAddress(newAddress.toString());
    }
});
</script>
<template>
    <div>
        <div class="mx-6 section">
            <div class="flex flex-col gap-2 mb-8 pb-4 border-b border-base-400">
                <h2 class="text-2xl font-semibold">
                    Transaction History on {{ chain }} (Last 10,000 transactions)
                </h2>
                <p class="md:w-2/3 text-sm text-gray-500 font-medium">
                    Available message types for download include: Send, Receive, IBC Send, IBC Receive, Multi Send,
                    Delegate, Undelegate, Redelegate, Reward and Commission.
                </p>
                <p class="text-sm text-red-500 font-bold">
                    This feature is currently in BETA.
                </p>
            </div>

            <div class="space-y-6">
                <!-- Address Section with Validation -->
                <div class="border border-base-400 p-4 rounded-lg" :class="{ 'border-red-500': !isValidAddress }">
                    <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <span class="text-gray-700 dark:text-gray-300 font-medium min-w-[120px]">Address:</span>
                        <div class="flex-1">
                            <div class="flex items-center">
                                <div class="font-mono md:p-2 rounded text-sm break-all"
                                    :class="{ 'text-red-500': !isValidAddress }">
                                    {{ address }}
                                </div>
                                <button @click="copyAddress"
                                    class="ml-1 p-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200"
                                    title="Copy address">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                </button>
                            </div>
                            <div v-if="!isValidAddress" class="mt-1 text-sm text-red-500">
                                Invalid address format
                            </div>
                        </div>
                    </div>
                </div>

                <div class="border border-base-400 p-4 rounded-lg" :class="{ 'border-red-500': !isValidAddress }">
                    <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <span class="text-gray-700 dark:text-gray-300 font-medium min-w-[120px]">Created time:</span>
                        <div class="flex-1">
                            <div class="flex items-center">
                                <div class="font-mono md:p-2 rounded text-sm break-all"
                                    :class="{ 'text-red-500': !isValidAddress }">
                                    {{ new Date(Date.now()).toLocaleString('en-US', { timeZone: 'UTC' }) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Date Range Section -->
                <!-- <div class="border border-base-400 p-4 rounded-lg">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div class="flex flex-col space-y-2">
                        <span class="text-gray-700 dark:text-gray-300 font-medium">Start Date:</span>
                        <div class="w-full">
                            <VueDatePicker v-model="startTime" class="w-full" :dark="true" />
                        </div>
                    </div>

                    <div class="flex flex-col space-y-2">
                        <span class="text-gray-700 dark:text-gray-300 font-medium">End Date:</span>
                        <div class="w-full">
                            <VueDatePicker v-model="endTime" class="w-full" :dark="true" />
                        </div>
                    </div>
                </div>
            </div> -->

                <!-- Success Section -->
                <div v-if="showSuccessSection"
                    class="mt-6 p-4 border border-green-500 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div class="flex items-start gap-3">
                        <!-- Success Icon -->
                        <div class="flex-shrink-0 w-5 h-5 mt-1">
                            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>

                        <!-- Content -->
                        <div class="flex-1">
                            <h3 class="text-lg font-medium text-green-800 dark:text-green-300">Success</h3>
                            <p class="mt-1 text-sm text-green-700 dark:text-green-400">
                                Click download for the CSV file or copy the link to share or redownload.
                            </p>
                        </div>

                        <!-- Close Button -->
                        <button @click="showSuccessSection = false"
                            class="flex-shrink-0 text-green-500 hover:text-green-700 dark:hover:text-green-300">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Error Section -->
                <div v-if="showErrorSection"
                    class="mt-6 p-4 border border-red-500 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div class="flex items-start gap-3">
                        <div class="flex-shrink-0 w-5 h-5 mt-1">
                            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div class="flex-1">
                            <h3 class="text-lg font-medium text-red-800 dark:text-red-300">Error</h3>
                            <p class="mt-1 text-sm text-red-700 dark:text-red-400">
                                {{ errorMessage }}
                            </p>
                            <button @click="retryDownload"
                                class="mt-3 inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-300 dark:bg-red-800/50 dark:hover:bg-red-800 rounded-md transition-colors duration-200">
                                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">
                                    </path>
                                </svg>
                                Try Again
                            </button>
                        </div>
                        <button @click="showErrorSection = false"
                            class="flex-shrink-0 text-red-500 hover:text-red-700 dark:hover:text-red-300">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Buttons -->
                <div class="flex flex-col md:flex-row gap-3 mt-6">
                    <button @click="downloadCSV" :disabled="isDownloading || !isValidAddress"
                        class="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg v-if="isDownloading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg"
                            fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                            </path>
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {{ isDownloading ? 'Downloading...' : 'Download CSV' }}
                    </button>
                    <button @click="copyLink"
                        class="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Link
                    </button>
                </div>
            </div>
        </div>

        <!-- Toast Notification - Fixed at bottom right -->
        <div v-if="showCopySuccess"
            class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in z-50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Copied to clipboard!</span>
        </div>

        <!-- Download Success Notification -->
        <div v-if="showDownloadSuccess"
            class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in z-50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Download started!</span>
        </div>

        <!-- Address Copy Success Notification -->
        <div v-if="showAddressCopySuccess"
            class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in z-50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Address copied to clipboard!</span>
        </div>
    </div>
</template>

<style scoped>
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(100%);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.animate-slide-in {
    animation: slideIn 0.3s ease-out forwards;
}
</style>
