<template>
  <!--
    酒馆宏、酒馆正则和 html 化都已经由 store.ts 里的 `formatAsDisplayedMessage` 处理好了,
    这里只把结果放进版面, 不再自己解析或改动正文
  -->
  <!-- eslint-disable-next-line vue/no-v-html -- 内容来自酒馆自己的 formatAsDisplayedMessage, 已由酒馆宏、酒馆正则和酒馆的消毒流程处理过 -->
  <article class="message" :class="{ 'is-user': role === 'user' }" v-html="html"></article>
</template>

<script setup lang="ts">
defineProps<{ html: string; role: ChatMessage['role'] }>();
</script>

<style lang="scss" scoped>
/* 正文不会再套上酒馆的 `.mes_text`, 所以这里按水墨风自己给一套排版 */
.message {
  /* 行宽由中栏的宽度上限控制, 这里不再自己收窄, 免得和对话框的宽度对不齐 */
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--墨);

  &.is-user {
    padding-left: 16px;
    border-left: 2px solid rgba(168, 56, 43, 0.45);
    color: #4a453d;
  }

  :deep(p) {
    margin: 0 0 0.95em;
    /* 首行缩进两格, 读起来像书 */
    text-indent: 2em;
  }

  :deep(p:last-child),
  :deep(ul:last-child),
  :deep(ol:last-child),
  :deep(pre:last-child),
  :deep(blockquote:last-child) {
    margin-bottom: 0;
  }

  :deep(em),
  :deep(i) {
    color: #7d7568;
  }

  :deep(strong),
  :deep(b) {
    color: #1a1815;
    font-weight: 700;
  }

  :deep(code) {
    padding: 0.1em 0.4em;
    border-radius: 3px;
    background: rgba(47, 44, 40, 0.06);
    color: #8a4b34;
    font-family: 'Cascadia Code', 'JetBrains Mono', Consolas, monospace;
    font-size: 0.86em;
    overflow-wrap: anywhere;
  }

  :deep(pre) {
    margin: 0 0 1em;
    padding: 12px 14px;
    border: 1px solid rgba(47, 44, 40, 0.14);
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.6);
    overflow-x: auto;
    white-space: pre-wrap;
  }

  :deep(pre code) {
    padding: 0;
    background: none;
    color: inherit;
  }

  :deep(blockquote) {
    margin: 0 0 1em;
    padding: 2px 0 2px 14px;
    border-left: 3px solid rgba(47, 44, 40, 0.2);
    color: #5f5a52;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0 0 1em;
    padding-left: 1.6em;
  }

  :deep(li) {
    margin-bottom: 0.3em;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 1.3em 0 0.7em;
    font-family: var(--字体题签);
    font-weight: 500;
    letter-spacing: 0.08em;
    line-height: 1.5;
    color: #1a1815;
  }

  :deep(hr) {
    height: 1px;
    margin: 1.6em 0;
    border: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(47, 44, 40, 0.28) 18%,
      rgba(47, 44, 40, 0.28) 82%,
      transparent
    );
  }

  :deep(a) {
    color: var(--朱砂);
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border: 1px solid rgba(47, 44, 40, 0.14);
    border-radius: 3px;
  }

  :deep(table) {
    width: 100%;
    margin: 0 0 1em;
    border-collapse: collapse;
    font-size: 0.94em;
  }

  :deep(th),
  :deep(td) {
    padding: 6px 10px;
    border: 1px solid rgba(47, 44, 40, 0.16);
    text-align: left;
  }

  :deep(th) {
    background: rgba(47, 44, 40, 0.05);
    color: #1a1815;
  }
}
</style>
