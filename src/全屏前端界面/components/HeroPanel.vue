<template>
  <div class="hero">
    <!-- 立绘 + 境界徽章 + 姓名 -->
    <div class="hero-portrait">
      <Portrait class="hero-portrait-image" :src="主角.立绘" :名称="主角.姓名" />
      <div class="hero-fade"></div>
      <span v-if="主角.境界" class="hero-badge">{{ 主角.境界 }}</span>
      <div class="hero-name">
        <p class="hero-name-main">{{ 主角.姓名 || '尚未取名' }}</p>
        <p v-if="主角.道号" class="hero-name-sub">道号 · {{ 主角.道号 }}</p>
      </div>
    </div>

    <p v-if="主角.身份" class="hero-identity">{{ 主角.身份 }}</p>
    <p v-if="主角.简介" class="hero-intro">{{ 主角.简介 }}</p>
    <p v-if="!主角.姓名" class="hero-empty">开局时填写姓名后，此处会记下你的道途。</p>

    <!-- 境界: 名称 + 描述 + 能力范围, 取代原来的属性条 -->
    <template v-if="主角.境界">
      <h3 class="hero-title">境 界</h3>
      <p class="hero-realm">{{ 主角.境界 }}</p>
      <p v-if="主角.$境界描述" class="hero-realm-desc">{{ 主角.$境界描述 }}</p>
      <p v-if="主角.$境界能力范围" class="hero-realm-power">
        <span class="hero-realm-power-tag">能耐</span>{{ 主角.$境界能力范围 }}
      </p>

      <div class="hero-cultivation">
        <span class="hero-cultivation-name">修为</span>
        <span class="hero-bar"><span class="hero-bar-fill" :style="{ width: 修为百分比 + '%' }"></span></span>
        <span class="hero-cultivation-value">
          {{ 说数值(主角.修为) }}<i>/{{ 说数值(修为上限) }}</i>
        </span>
      </div>
      <p v-if="主角.$修为增速" class="hero-rate">
        每过一日 +{{ 主角.$修为增速 }}<i>（境界速率 {{ 主角.$境界速率 }} × 修炼倍率 {{ 主角.$修炼倍率 }}）</i>
      </p>
      <p v-if="主角.$纯修年" class="hero-rate">
        <i>这一境靠纯修炼要 {{ 主角.$纯修年 }} 年</i>
      </p>
      <p v-if="主角._修行日志" class="hero-log">{{ 主角._修行日志 }}</p>
    </template>

    <!-- 灵根 / 功法 / 双修: 只影响修为增速 -->
    <h3 class="hero-title">修 行</h3>
    <dl class="hero-rows">
      <template v-for="行 in 修行" :key="行.名称">
        <dt>{{ 行.名称 }}</dt>
        <dd>
          <span class="hero-rows-text">{{ 行.内容 }}</span>
          <!-- 倍率恰好是 1 就是没有加成, 显示「×1」只是噪音 (和行囊的 ×N 一个道理) -->
          <em v-if="行.倍率 !== 1" class="hero-times">×{{ 行.倍率 }}</em>
        </dd>
      </template>
    </dl>

    <!-- 双修倍率 = 1 + 各对象按其好感度阶段给出的加成之和 -->
    <ul v-if="双修列表.length" class="hero-dual">
      <li v-for="对象 in 双修列表" :key="对象.姓名">
        <span class="hero-dual-name">{{ 对象.姓名 }}</span>
        <span class="hero-dual-stage">{{ 对象.阶段 }}</span>
        <em class="hero-times">+{{ 对象.加成 }}</em>
      </li>
    </ul>

    <template v-if="状态列表.length">
      <h3 class="hero-title">身 上</h3>
      <div class="hero-tags">
        <span v-for="状态 in 状态列表" :key="状态.名称" class="hero-tag" :title="状态.说明">{{ 状态.名称 }}</span>
      </div>
    </template>

    <template v-if="物品列表.length">
      <h3 class="hero-title">行 囊</h3>
      <ul class="hero-items">
        <li v-for="物品 in 物品列表" :key="物品.名称" :title="物品.描述">
          {{ 物品.名称 }}
          <em v-if="物品.数量 > 1">×{{ 物品.数量 }}</em>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import { 双修加成, 说数值 } from '../../修仙恋爱角色卡脚本/schema';
import { 空主角 } from '../schema';
import { use修仙数据 } from '../修仙数据';
import Portrait from './Portrait.vue';

const store = use修仙数据();
const 主角 = computed(() => store.data.主角 ?? 空主角);
const 人物 = computed(() => store.data.人物 ?? {});

/** 上限随境界一路上涨, 由角色卡算好; 卡还没给出来时退回 100 免得除零 */
const 修为上限 = computed(() => 主角.value.$修为上限 ?? 100);
const 修为百分比 = computed(() => _.clamp((主角.value.修为 / (修为上限.value || 1)) * 100, 0, 100));

/** 主修功法只取倍率最高的一门, 和角色卡的算法一致 */
const 主修功法 = computed(() =>
  _(主角.value.功法)
    .entries()
    .maxBy(([, 值]) => 值.倍率),
);

/** 每个双修对象按好感度阶段给出的加成; 倍率是它们的和再加 1, 由角色卡算好 */
const 双修列表 = computed(() =>
  _(主角.value.双修)
    .keys()
    .map(姓名 => {
      const 阶段 = 人物.value[姓名]?.$好感阶段 ?? '陌路';
      return { 姓名, 阶段, 加成: 双修加成[阶段] ?? 0 };
    })
    .value(),
);

const 修行 = computed(() => [
  { 名称: '灵根', 内容: 主角.value.灵根.名称, 倍率: 主角.value.灵根.倍率 },
  {
    名称: '功法',
    内容: 主修功法.value ? `${主修功法.value[0]} · ${主修功法.value[1].品阶}` : '尚未习得',
    倍率: 主修功法.value?.[1].倍率 ?? 1,
  },
  {
    名称: '双修',
    内容: 双修列表.value.length > 0 ? 双修列表.value.map(对象 => 对象.姓名).join('、') : '—',
    倍率: 主角.value.$双修倍率 ?? 1,
  },
]);

const 状态列表 = computed(() => _.map(主角.value.状态, (说明, 名称) => ({ 名称, 说明 })));

const 物品列表 = computed(() =>
  _(主角.value.物品栏)
    .map((物品, 名称) => ({ 名称, 描述: 物品.描述, 数量: 物品.数量 }))
    .filter(物品 => 物品.数量 > 0)
    .value(),
);
</script>

<style lang="scss" scoped>
@use '../水墨' as *;

.hero {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/*
 * 立绘: 按挂轴裱一下.
 *
 * 立绘是竖构图的人像, 所以框子按 3:4 走, 并限一个最大宽度 ——
 * 左右两栏是 `1fr`, 在宽屏上会被拉得很宽, 不限宽的话立绘会被抻得过高.
 */
.hero-portrait {
  position: relative;
  width: min(100%, 300px);
  aspect-ratio: 3 / 4;
  margin: 0 auto 12px;
  border: 1px solid var(--墨线);
  /* 里圈的细线和四角角线由 Portrait 自己画, 这里不再叠一层 */
  overflow: hidden;
}

.hero-portrait-image {
  width: 100%;
  height: 100%;
  font-size: 12px;
}

.hero-fade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, transparent 44%, rgba(28, 24, 20, 0.82) 100%);
}

.hero-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  font-family: var(--字体题签);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: #f6efe2;
  background: rgba(156, 43, 35, 0.86);
  border-radius: 2px;
}

.hero-name {
  position: absolute;
  right: 10px;
  bottom: 8px;
  left: 10px;
  text-align: center;
}

.hero-name-main {
  margin: 0;
  font-family: var(--字体题签);
  font-size: 19px;
  letter-spacing: 0.16em;
  text-indent: 0.16em;
  color: #fbf7ee;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
}

.hero-name-sub {
  margin: 2px 0 0;
  font-size: 11px;
  letter-spacing: 0.18em;
  color: rgba(246, 239, 226, 0.82);
}

/* --- 身份 / 简介 --- */
.hero-identity {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-align: center;
  color: var(--朱砂);
}

.hero-intro {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.85;
  color: var(--墨淡);
  text-indent: 2em;
}

.hero-empty {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.8;
  text-align: center;
  color: var(--墨微);
}

/* --- 小标题: 两侧各一条淡出的细线, 中间是楷体题字 --- */
.hero-title {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  margin: 15px 0 8px;
  font-family: var(--字体题签);
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.3em;
  text-indent: 0.3em;
  text-align: center;
  color: var(--墨淡);

  &::before,
  &::after {
    content: '';
    height: 1px;
  }

  &::before {
    background: linear-gradient(90deg, transparent, rgba(35, 32, 27, 0.26));
  }

  &::after {
    background: linear-gradient(90deg, rgba(35, 32, 27, 0.26), transparent);
  }
}

/* --- 境界 --- */
.hero-realm {
  margin: 0;
  font-family: var(--字体题签);
  font-size: 15px;
  letter-spacing: 0.2em;
  text-indent: 0.2em;
  text-align: center;
  color: var(--墨);
}

.hero-realm-desc {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.85;
  color: var(--墨淡);
  text-indent: 2em;
}

.hero-realm-power {
  margin: 6px 0 0;
  padding: 7px 9px;
  font-size: 12px;
  line-height: 1.8;
  color: var(--墨淡);
  background: rgba(156, 43, 35, 0.05);
  border-left: 2px solid rgba(156, 43, 35, 0.45);
  border-radius: 2px;
}

.hero-realm-power-tag {
  margin-right: 6px;
  font-family: var(--字体题签);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--朱砂);
  white-space: nowrap;
}

/* --- 修为 --- */
.hero-cultivation {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 12px;
}

.hero-cultivation-name {
  font-family: var(--字体题签);
  letter-spacing: 0.12em;
  color: var(--墨淡);
}

.hero-bar {
  height: 6px;
  background: rgba(35, 32, 27, 0.08);
  border: 1px solid var(--墨线);
  border-radius: 4px;
  overflow: hidden;
}

.hero-bar-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, rgba(156, 43, 35, 0.6), var(--朱砂));
  transition: width 0.6s ease;
}

.hero-cultivation-value {
  color: var(--墨);
  font-variant-numeric: tabular-nums;

  i {
    font-style: normal;
    font-size: 0.9em;
    color: var(--墨微);
  }
}

.hero-rate {
  margin: 6px 0 0;
  font-size: 11px;
  line-height: 1.7;
  text-align: center;
  color: var(--墨微);

  i {
    font-style: normal;
  }
}

/* --- 脚本上一轮做了什么 --- */
.hero-log {
  margin: 8px 0 0;
  padding: 6px 8px;
  font-size: 10px;
  line-height: 1.7;
  color: var(--墨微);
  background: rgba(35, 32, 27, 0.04);
  border-left: 2px solid rgba(35, 32, 27, 0.22);
  border-radius: 2px;
}

/* --- 双修对象及其加成 --- */
.hero-dual {
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
  font-size: 11px;

  li {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding-left: 10px;
    color: var(--墨淡);
  }
}

.hero-dual-name {
  flex: none;
  color: var(--墨);
}

.hero-dual-stage {
  flex: 1 1 auto;
  overflow: hidden;
  color: var(--朱砂);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* --- 修行 --- */
.hero-rows {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 10px;
  margin: 0;
  font-size: 12px;

  dt {
    font-family: var(--字体题签);
    letter-spacing: 0.12em;
    color: var(--墨淡);
  }

  dd {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
    margin: 0;
  }
}

.hero-rows-text {
  overflow: hidden;
  color: var(--墨);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-times {
  flex: none;
  font-style: normal;
  font-variant-numeric: tabular-nums;
  color: var(--朱砂);
}

/* --- 状态 --- */
.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.hero-tag {
  padding: 2px 8px;
  font-size: 11px;
  color: var(--墨);
  background: rgba(156, 43, 35, 0.08);
  border: 1px solid rgba(156, 43, 35, 0.34);
  border-radius: 2px;
  cursor: help;
}

/* --- 物品 --- */
.hero-items {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 12px;

  li {
    position: relative;
    padding-left: 12px;
    color: var(--墨);

    &::before {
      content: '·';
      position: absolute;
      left: 3px;
      color: var(--朱砂);
    }
  }

  em {
    font-style: normal;
    color: var(--墨微);
  }
}
</style>
