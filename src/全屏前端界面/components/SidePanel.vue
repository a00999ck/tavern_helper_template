<template>
  <aside class="side-panel">
    <h2 class="side-panel-title">{{ title }}</h2>

    <div class="side-panel-body">
      <!-- 不传默认插槽时显示提示语, 之后往插槽里塞内容就会自动顶掉它 -->
      <slot>
        <p class="side-panel-hint">{{ hint }}</p>
      </slot>
    </div>
  </aside>
</template>

<script setup lang="ts">
defineProps<{ title: string; hint?: string }>();
</script>

<style lang="scss" scoped>
@use '../水墨' as *;

.side-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 18px 15px 18px;
  border: 1px solid var(--墨线);
  background: linear-gradient(180deg, rgba(255, 253, 247, 0.84), rgba(255, 252, 244, 0.46));
  @include 版框;
  @include 墨晕(26px, 0.07);
  overflow: hidden;
}

/* 匾额式的小题: 双线小框, 楷体宽字距 */
.side-panel-title {
  position: relative;
  flex: none;
  align-self: center;
  margin: 0 0 15px;
  padding: 3px 15px 4px;
  border: 1px solid var(--墨线);
  background: rgba(255, 254, 250, 0.92);
  /* 第一道阴影压在第二道上, 于是露出 2px 处的一条细线, 凑成双线框 */
  box-shadow:
    inset 0 0 0 2px #fffdf8,
    inset 0 0 0 3px rgba(34, 32, 28, 0.09);
  font-family: var(--字体题签);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.3em;
  /* 字距会在右侧多出一格, 补回来才是视觉居中 */
  text-indent: 0.3em;
  color: var(--墨淡);
}

.side-panel-body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.85;
  color: var(--墨淡);
  scrollbar-width: thin;
  scrollbar-color: rgba(34, 32, 28, 0.18) transparent;
}

.side-panel-hint {
  margin: 0;
  font-family: var(--字体题签);
  font-size: 12px;
  letter-spacing: 0.26em;
  text-indent: 0.26em;
  text-align: center;
  color: var(--墨微);
}
</style>
