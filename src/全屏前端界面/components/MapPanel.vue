<template>
  <div class="地图">
    <header class="地图-头">
      <div class="地图-题块">
        <p class="地图-题">行 旅</p>
        <p class="地图-现在">此刻身在 {{ 世界.当前大区 }} · {{ 世界.当前地点 }}</p>
      </div>
      <button class="地图-收起" type="button" @click="emit('关闭')">收 起</button>
    </header>

    <p class="地图-注">
      点一处便动身前往。同区之内移步不费时日；跨大区要按脚程跳过若干天，这几天由世界推进脚本自动结算。
    </p>

    <div class="地图-区列表">
      <section
        v-for="(地点们, 大区) in 地图"
        :key="大区"
        class="地图-区"
        :class="{ '地图-区在此': 大区 === 世界.当前大区 }"
      >
        <h4 class="地图-区名">
          <span>{{ 大区 }}</span>
          <em>{{ 大区 === 世界.当前大区 ? '同 区' : `${跨区耗时(世界.当前大区, 大区)} 日` }}</em>
        </h4>

        <div class="地图-地点列表">
          <button
            v-for="地点 in 地点们"
            :key="地点"
            class="地图-地点"
            type="button"
            :class="{ '地图-地点在此': 大区 === 世界.当前大区 && 地点 === 世界.当前地点 }"
            :disabled="disabled"
            @click="emit('前往', { 大区, 地点 })"
          >
            {{ 地点 }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 地图, 跨区耗时 } from '../../修仙恋爱角色卡脚本/schema';
import { 空世界 } from '../schema';
import { use修仙数据 } from '../修仙数据';

defineProps<{ disabled?: boolean }>();
const emit = defineEmits<{ 关闭: []; 前往: [{ 大区: string; 地点: string }] }>();

const store = use修仙数据();
const 世界 = computed(() => store.data.世界 ?? 空世界);
</script>

<style lang="scss" scoped>
@use '../水墨' as *;

/* 行旅图: 摊开的一页纸, 也走版框 */
.地图 {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(880px, 92vw);
  max-height: 84vh;
  padding: 22px 26px 20px;
  border: 1px solid var(--墨线);
  background-color: var(--纸);
  background-image: linear-gradient(180deg, #fcf9f2, #f0e9db);
  @include 版框(9px, 20px, rgba(35, 32, 27, 0.1), var(--朱砂线));
  box-shadow: 0 24px 64px rgba(40, 28, 14, 0.42);
}

.地图-头 {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--墨线);
}

.地图-题 {
  margin: 0;
  font-family: var(--字体题签);
  font-size: 19px;
  letter-spacing: 0.42em;
  text-indent: 0.42em;
  color: var(--墨);
}

.地图-现在 {
  margin: 5px 0 0;
  font-size: 12px;
  letter-spacing: 0.12em;
  color: var(--朱砂);
}

.地图-收起 {
  flex: none;
  padding: 6px 14px;
  font-family: var(--字体题签);
  font-size: 12px;
  letter-spacing: 0.2em;
  text-indent: 0.2em;
  color: var(--墨淡);
  background: transparent;
  border: 1px solid var(--墨线);
  border-radius: 2px;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    color 0.18s ease;

  &:hover {
    color: var(--朱砂);
    border-color: rgba(156, 43, 35, 0.5);
  }
}

.地图-注 {
  margin: 12px 0 14px;
  font-size: 12px;
  line-height: 1.8;
  color: var(--墨微);
}

.地图-区列表 {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(35, 32, 27, 0.18) transparent;
}

.地图-区 {
  padding: 10px 12px 12px;
  border: 1px solid var(--墨线);
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.5);

  &.地图-区在此 {
    border-color: rgba(156, 43, 35, 0.5);
    background: rgba(156, 43, 35, 0.05);
  }
}

.地图-区名 {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 8px;
  font-family: var(--字体题签);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.18em;
  color: var(--墨);

  em {
    font-style: normal;
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--墨微);
  }
}

.地图-地点列表 {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.地图-地点 {
  padding: 5px 11px;
  font-family: inherit;
  font-size: 12.5px;
  letter-spacing: 0.06em;
  color: var(--墨);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--墨线);
  border-radius: 2px;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background 0.16s ease,
    color 0.16s ease;

  &:hover:not(:disabled) {
    color: var(--朱砂);
    background: rgba(255, 255, 255, 0.96);
    border-color: rgba(156, 43, 35, 0.5);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.地图-地点在此 {
    color: #fdfbf6;
    background: var(--朱砂);
    border-color: var(--朱砂);

    &:hover:not(:disabled) {
      color: #fdfbf6;
      background: #ac342a;
    }
  }
}
</style>
