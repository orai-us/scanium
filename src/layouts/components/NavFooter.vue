<template>
  <!-- footer -->
  <footer
    class="flex items-center mt-5 px-6 pt-5 text-sm bg-gray-100 dark:bg-base-200 z-10 w-full border-t border-base-300"
  >
    <div class="flex flex-1">
      <!-- &copy;&nbsp; -->
      <!-- {{ new Date().getFullYear() }}&nbsp; Made With&nbsp;
      <img src="../../assets/images/heart.svg" />&nbsp; By&nbsp;
      <a
        class="link link-primary no-underline text-white"
        href="https://ping.pub"
        target="_blank"
        rel="noopener noreferrer"
        >Ping.pub</a
      > -->
    </div>
    <div class="hidden md:!block">
      <a
        class="link link-primary no-underline mr-4 text-white"
        href="https://github.com/orai-us/scanium/blob/master/LICENSE"
        target="noopener noreferrer"
        >{{ $t('footer.license') }}</a
      >
      <a
        class="link link-primary no-underline text-white"
        href="https://github.com/orai-us/scanium"
        target="noopener noreferrer"
        >{{ $t('footer.github') }}</a
      >
    </div>
  </footer>
</template>
