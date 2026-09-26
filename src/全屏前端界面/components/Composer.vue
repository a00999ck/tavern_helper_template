<template>
  <div class="composer">
    <textarea
      ref="草稿框"
      v-model="草稿"
      class="composer-input"
      rows="1"
      :placeholder="disabled ? 'AI 正在输出…' : '说点什么… (Enter 发送, Shift + Enter 换行)'"
      @keydown.enter.exact.prevent="发送"
    ></textarea>

    <button
      class="composer-send"
      type="button"
      :disabled="Boolean(disabled) || !草稿.trim()"
      title="发送"
      @click="发送"
    >
      <span class="composer-send-word">寄</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { 发送给酒馆 } from '../发送';

const props = defineProps<{ disabled?: boolean }>();

const 草稿 = ref('');
const 草稿框 = ref<HTMLTextAreaElement>();

/** 把草稿交给酒馆原生的输入框和发送按钮, 具体见 `../发送` */
const 发送 = errorCatched(() => {
  const 文本 = 草稿.value.trim();
  if (!文本 || props.disabled) {
    return;
  }

  if (发送给酒馆(文本)) {
    草稿.value = '';
    草稿框.value?.focus();
  }
});
</script>

<style lang="scss" scoped>
.composer {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  /* 宽度跟着中栏走, 和正文、对话框保持一致 */
  margin: 0;
}

/* 素笺: 上白下暖, 压一层浅浅的内阴影, 像纸被按下去一点 */
.composer-input {
  flex: 1 1 auto;
  min-height: 44px;
  max-height: 128px;
  padding: 11px 15px;
  border: 1px solid rgba(35, 32, 27, 0.2);
  background: linear-gradient(180deg, #fffdf8, #faf5ea);
  box-shadow: inset 0 1px 3px rgba(74, 58, 38, 0.06);
  color: var(--墨);
  font: inherit;
  line-height: 1.65;
  resize: none;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  &::placeholder {
    color: var(--墨微);
    letter-spacing: 0.06em;
  }

  &:focus {
    border-color: var(--朱砂线);
    box-shadow:
      inset 0 1px 3px rgba(74, 58, 38, 0.06),
      0 0 0 1px rgba(156, 43, 35, 0.14);
  }
}

/* 发送做成一方朱砂小印 */
.composer-send {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--朱砂);
  background-color: var(--朱砂);
  background-image: radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.16), transparent 62%);
  color: #fdf8ef;
  font-size: 17px;
  cursor: pointer;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.22),
    0 4px 12px rgba(120, 40, 30, 0.22);
  transition:
    background-color 0.18s ease,
    opacity 0.18s ease;

  &:hover:not(:disabled) {
    background-color: #ac342a;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.composer-send-word {
  font-family: var(--字体题签);
  line-height: 1;
}
</style>
