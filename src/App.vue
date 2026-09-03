<script setup lang="ts">
import AppToast from '@/components/base/AppToast.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
</script>

<template>
  <DefaultLayout>
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
  </DefaultLayout>

  <!-- 提示要浮在弹窗之上，所以放在布局外层 -->
  <AppToast />
</template>
