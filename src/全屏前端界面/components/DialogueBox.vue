<template>
  <div
    class="dialogue-box"
    :class="{ 'is-user': 角色 === 'user' }"
    :title="页数 > 1 ? '左键点一下翻到下一句, 右键点一下翻回上一句' : ''"
    @click="下一页"
    @contextmenu.prevent="上一页"
  >
    <!-- eslint-disable-next-line vue/no-v-html -- 内容来自酒馆自己的 formatAsDisplayedMessage, 已由酒馆宏、酒馆正则和酒馆的消毒流程处理过 -->
    <div v-if="当前句" class="dialogue-text" v-html="当前句"></div>
    <p v-else class="dialogue-text dialogue-empty">{{ 生成中 ? '正在生成…' : '暂无对白' }}</p>

    <template v-if="页数 > 1">
      <span class="dialogue-hint">左键下一句 · 右键上一句</span>
      <span class="dialogue-page">{{ 当前页 + 1 }} / {{ 页数 }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { 按句分页 } from '../断句';

const props = defineProps<{ html: string; 角色?: ChatMessage['role']; 生成中?: boolean }>();

/** 一句一页 */
const 分页 = computed(() => 按句分页(props.html));
const 页数 = computed(() => 分页.value.length);
const 当前页 = ref(0);
const 当前句 = computed(() => 分页.value[当前页.value] ?? '');

// 换了楼层、重新生成、切换 swipe 之后都回到第一句
watch(分页, () => {
  当前页.value = 0;
});

// 到底了就停住, 不循环, 免得读者分不清读到哪了
function 下一页() {
  if (当前页.value < 页数.value - 1) {
    当前页.value++;
  }
}

function 上一页() {
  if (当前页.value > 0) {
    当前页.value--;
  }
}
</script>

<style lang="scss" scoped>
@use '../水墨' as *;

/* galgame 那种窄条对话框: 宽度铺满中间区域, 高度只够两三行 */
.dialogue-box {
  position: relative;
  flex: none;
  height: 112px;
  margin-bottom: 13px;
  border: 1px solid rgba(35, 32, 27, 0.22);
  /* 笺纸: 上半泛白, 下半回暖, 像一张裁好的素笺 */
  background:
    radial-gradient(120% 150% at 50% 0%, rgba(255, 255, 255, 0.92), transparent 62%),
    linear-gradient(180deg, #fffdf7, #f6efe2);
  @include 版框(6px, 14px, rgba(35, 32, 27, 0.11), var(--朱砂线));
  @include 墨晕(26px, 0.08);
  cursor: pointer;
  user-select: none;
  overflow: hidden;
  transition: border-color 0.18s ease;

  &:hover {
    border-color: var(--朱砂线);
  }

  /* 玩家自己的发言用朱砂角标出来, 免得翻着翻着分不清是谁在说 */
  &.is-user {
    border-color: rgba(156, 43, 35, 0.32);
    @include 版框(6px, 14px, rgba(156, 43, 35, 0.22), rgba(156, 43, 35, 0.75));

    &::after {
      background: linear-gradient(180deg, transparent, rgba(156, 43, 35, 0.9), transparent);
    }
  }
}

/* 左边一道朱砂起笔 */
.dialogue-box::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 20px;
  bottom: 20px;
  width: 2px;
  background: linear-gradient(180deg, transparent, var(--朱砂线), transparent);
  pointer-events: none;
}

.dialogue-text {
  position: absolute;
  inset: 15px 20px 24px 25px;
  overflow-y: auto;
  font-size: 15px;
  line-height: 1.78;
  color: var(--墨);
  scrollbar-width: thin;
  scrollbar-color: rgba(35, 32, 27, 0.18) transparent;

  /* 一句话不缩进; 也去掉段落自带的外边距, 免得窄框里被顶掉一行 */
  :deep(p) {
    margin: 0;
    text-indent: 0;
  }

  :deep(p + p) {
    margin-top: 0.4em;
  }
}

.dialogue-empty {
  font-family: var(--字体题签);
  color: var(--墨微);
  letter-spacing: 0.2em;
  text-indent: 0.2em;
}

.dialogue-hint,
.dialogue-page {
  position: absolute;
  bottom: 8px;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--赭);
  opacity: 0.72;
  pointer-events: none;
}

.dialogue-hint {
  left: 25px;
}

/* 页码用楷体, 像书口的鱼尾 */
.dialogue-page {
  right: 18px;
  font-family: var(--字体题签);
  font-size: 12px;
  letter-spacing: 0.16em;
  font-variant-numeric: tabular-nums;
}
</style>
