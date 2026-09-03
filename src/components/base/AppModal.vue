<script setup lang="ts">
/**
 * 基础弹层。只管壳：遮罩、Esc、滚动锁、入场动画与标题栏，
 * 内容由调用方填。表单弹窗、二次确认都用它，免得每个弹层各写一遍遮罩逻辑。
 */
import { computed } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { useOverlay } from '@/composables/useOverlay'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    /** 弹窗最大宽度，窄表单与长列表需要的宽度不同 */
    width?: string
  }>(),
  { width: '420px' },
)
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const open = computed(() => props.modelValue)

function close() {
  emit('update:modelValue', false)
}

// 滚动锁、Esc、点遮罩关闭都在 useOverlay 里，三个弹层共用一套规则
const { onOverlayPointerDown, onOverlayClick } = useOverlay(open, { close })
</script>

<template>
  <Teleport to="body">
    <Transition name="pop">
      <div
        v-if="open"
        class="overlay"
        @pointerdown="onOverlayPointerDown"
        @click="onOverlayClick"
      >
        <div class="modal" role="dialog" aria-modal="true" :aria-label="title" :style="{ maxWidth: width }">
          <header class="modal__head">
            <h2 class="modal__title">{{ title }}</h2>
            <button class="modal__close" type="button" aria-label="关闭" @click="close">
              <AppIcon name="close" :size="18" />
            </button>
          </header>

          <div class="modal__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="modal__foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  z-index: var(--z-modal);
  display: grid;
  padding: var(--space-5);
  background: var(--color-overlay);
  inset: 0;
  place-items: center;
}

.modal {
  display: flex;
  width: 100%;
  max-height: 100%;
  flex-direction: column;
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-md);
}

.modal__head {
  display: flex;
  align-items: center;
  padding: var(--space-5) var(--space-5) var(--space-3);
}

.modal__title {
  font-size: var(--font-lg);
  font-weight: 600;
}

.modal__close {
  display: grid;
  width: 28px;
  height: 28px;
  margin-left: auto;
  border-radius: var(--radius-full);
  color: var(--color-text-tertiary);
  cursor: pointer;
  place-items: center;
  transition: background var(--duration) var(--ease), color var(--duration) var(--ease);
}

.modal__close:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* 内容超长时只滚这一段，标题与底部按钮留在原地 */
.modal__body {
  min-height: 0;
  flex: 1;
  padding: 0 var(--space-5);
  overflow-y: auto;
}

.modal__foot {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding: var(--space-5);
}

.pop-enter-active,
.pop-leave-active {
  transition: opacity var(--duration) var(--ease);
}

.pop-enter-active .modal,
.pop-leave-active .modal {
  transition: translate var(--duration) var(--ease), scale var(--duration) var(--ease);
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
}

.pop-enter-from .modal,
.pop-leave-to .modal {
  translate: 0 var(--space-3);
  scale: 0.96;
}

/* 离场时别挡住底下的点击 */
.pop-leave-active {
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .pop-enter-active .modal,
  .pop-leave-active .modal {
    transition: none;
  }
}
</style>
