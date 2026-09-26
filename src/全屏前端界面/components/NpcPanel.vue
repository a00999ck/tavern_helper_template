<template>
  <div class="npc">
    <p v-if="人物列表.length === 0" class="npc-empty">四 下 无 人</p>

    <article
      v-for="角色 in 人物列表"
      :key="角色.姓名"
      class="npc-card"
      :class="{ 'npc-card-open': 展开姓名 === 角色.姓名 }"
      @click="展开姓名 = 展开姓名 === 角色.姓名 ? '' : 角色.姓名"
    >
      <Portrait class="npc-portrait" :src="角色.立绘" :表情="角色.表情" :名称="角色.姓名" />

      <div class="npc-body">
        <div class="npc-head">
          <span class="npc-name">{{ 角色.姓名 }}</span>
          <span v-if="角色.身份" class="npc-identity">{{ 角色.身份 }}</span>
        </div>

        <div class="npc-meta">
          <span v-if="角色.境界" class="npc-realm">{{ 角色.境界 }}</span>
          <span class="npc-favor">
            <i class="npc-favor-track"><i class="npc-favor-fill" :style="{ width: 好感宽度(角色.好感度) }"></i></i>
            <em>{{ 角色.好感度 }}</em>
          </span>
        </div>

        <div v-if="角色.$好感阶段" class="npc-stage-row">
          <span class="npc-stage">{{ 角色.$好感阶段 }}</span>
          <!-- 她此刻接受到哪一级: 0~5, 鼠标悬停看这一级是什么 -->
          <span v-if="角色.$尺度 !== undefined" class="npc-scale" :title="尺度提示(角色.$尺度)">
            可到 {{ 角色.$尺度 }}·{{ 角色.$尺度名 }}
          </span>
        </div>

        <!-- 折叠时才显示的情报, 展开卡片才占高度 -->
        <!-- 心结不在这里: 那是要玩家自己从戏里看出来的, 直接摊开就没意思了 -->
        <div v-if="展开姓名 === 角色.姓名" class="npc-more" @click.stop>
          <p v-if="角色.关系" class="npc-entry"><b>关系</b>{{ 角色.关系 }}</p>
          <p v-if="角色.情愫" class="npc-entry npc-entry-mind"><b>情愫</b>{{ 角色.情愫 }}</p>
          <p v-if="角色.简介" class="npc-intro">{{ 角色.简介 }}</p>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { 尺度名, 尺度说明 } from '../../修仙恋爱角色卡脚本/schema';
import { use修仙数据 } from '../修仙数据';
import Portrait from './Portrait.vue';

/** 悬停提示: 这一级尺度具体到哪一步 */
const 尺度提示 = (级: number) => `${级}·${尺度名[级] ?? ''}：${尺度说明[级] ?? ''}`;

const store = use修仙数据();
const 人物 = computed(() => store.data.人物 ?? {});
const 展开姓名 = ref('');

const 人物列表 = computed(() =>
  _(人物.value)
    .map((角色, 姓名) => ({ 姓名, ...角色 }))
    .orderBy(角色 => 角色.好感度, 'desc')
    .value(),
);

const 好感宽度 = (好感度: number) => `${_.clamp(好感度, 0, 100)}%`;
</script>

<style lang="scss" scoped>
.npc {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.npc-empty {
  margin: 30px 0;
  font-family: var(--字体题签);
  font-size: 12px;
  letter-spacing: 0.3em;
  text-align: center;
  color: var(--墨微);
}

.npc-card {
  display: flex;
  gap: 8px;
  padding: 7px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--墨线);
  border-radius: 2px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;

  &:hover {
    border-color: rgba(156, 43, 35, 0.42);
  }

  &.npc-card-open {
    background: rgba(255, 255, 255, 0.82);
    border-color: rgba(156, 43, 35, 0.55);
  }
}

.npc-portrait {
  flex: none;
  width: 48px;
  height: 64px;
  font-size: 10px;
  border: 1px solid var(--墨线);
}

.npc-body {
  flex: 1 1 auto;
  min-width: 0;
}

.npc-head {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.npc-name {
  font-family: var(--字体题签);
  font-size: 13px;
  letter-spacing: 0.1em;
  color: var(--墨);
}

.npc-identity {
  overflow: hidden;
  font-size: 11px;
  color: var(--墨微);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.npc-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
}

.npc-realm {
  flex: none;
  font-size: 11px;
  color: #4a6076;
}

.npc-favor {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 4px;
  min-width: 0;

  em {
    flex: none;
    font-style: normal;
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    color: var(--墨微);
  }
}

.npc-favor-track {
  flex: 1 1 auto;
  height: 4px;
  background: rgba(35, 32, 27, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.npc-favor-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, rgba(156, 43, 35, 0.5), var(--朱砂));
  transition: width 0.5s ease;
}

/* 好感阶段 + 当前尺度: 栏窄, 放不下就换行 */
.npc-stage-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 6px;
  margin-top: 3px;
}

.npc-stage {
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--朱砂);
}

/* 她此刻接受到哪一级尺度; 悬停看这一级具体是什么 */
.npc-scale {
  flex: none;
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--墨微);
  cursor: help;
}

/* --- 展开后的情报 --- */
.npc-more {
  margin-top: 7px;
  padding-top: 7px;
  border-top: 1px dashed rgba(35, 32, 27, 0.18);
}

.npc-entry {
  display: flex;
  gap: 6px;
  margin: 0 0 4px;
  font-size: 11px;
  line-height: 1.75;
  color: var(--墨淡);

  b {
    flex: none;
    font-family: var(--字体题签);
    font-weight: 400;
    letter-spacing: 0.08em;
    color: var(--朱砂);
  }
}

.npc-entry-mind {
  color: #5b5348;
  font-style: italic;
}

.npc-intro {
  margin: 5px 0 0;
  font-size: 11px;
  line-height: 1.75;
  color: var(--墨淡);
  text-indent: 2em;
}
</style>
