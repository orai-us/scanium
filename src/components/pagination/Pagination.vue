<script setup lang="ts">
import { ref, watchEffect } from "vue";

const props = defineProps(['totalItems', 'limit', 'onPagination', 'page']);

const currentPage = ref(1);

watchEffect(() => {
  currentPage.value = props.page || 1;
});
const onClickHandler = (page: number) => {
  props.onPagination(page)
  currentPage.value = page;
};

</script>
<template>
  <vue-awesome-paginate :total-items="totalItems" v-model="currentPage" :items-per-page="limit" :max-pages-shown="5"
    :show-breakpoint-buttons="false" :show-ending-buttons="true" first-page-content="<<" last-page-content=">>"
    @click="onClickHandler" />
</template>

<style>
.pagination-container {
  display: flex;
  column-gap: 10px;
}

.paginate-buttons {
  height: 35px;
  width: 35px;
  border-radius: 20px;
  cursor: pointer;
  background-color: rgb(20, 17, 17);
  border: 1px solid rgb(84, 83, 83);
  color: rgb(167, 165, 165);
}

.paginate-buttons:hover {
  background-color: #3b3939;
}

.active-page {
  background-color: #c2dee412;
  border: 1px solid #c2dee412;
  color: white;
}

.active-page:hover {
  background-color: #c2dee412;
}

@media (max-width: 768px) {
  .pagination-container {
    display: flex;
    column-gap: 4px;
  }
  .paginate-buttons {
    height: 30px;
    width: 30px;
    border-radius: 20px;
    cursor: pointer;
    background-color: rgb(20, 17, 17);
    border: 1px solid rgb(84, 83, 83);
    color: rgb(167, 165, 165);
  }
}
</style>

<script lang="ts">
export default {
  name: 'Pagination',
};
</script>
