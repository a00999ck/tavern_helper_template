<template>
  <div class="portrait" :class="{ 'portrait-plain': plain }">
    <img v-if="可用" class="portrait-image" :src="图源" :alt="名称" @error="加载出错" />
    <div v-else class="portrait-blank">
      <span class="portrait-frame"></span>
      <span class="portrait-word">{{ 首字 }}</span>
      <span v-if="名称" class="portrait-name">{{ 名称 }}</span>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { 素材链接 } from '../../修仙恋爱角色卡脚本/schema';

const props = defineProps<{
  /** 基础立绘的文件名或完整链接, 留空或加载失败时显示水墨占位 */
  src?: string;
  /** 差分表情; '默认' 或不填就用基础立绘那张 */
  表情?: string;
  名称?: string;
  /** 素: 不裱框、不铺纸底、图整张放下 —— 叠在背景图上的"说话人立绘"用这个 */
  plain?: boolean;
}>();

/** 差分没画（404）就退回基础立绘; 基础也没有才显示水墨占位 */
const 差分不可用 = ref(false);
const 基础不可用 = ref(false);

/** 想用的差分名; 没有基础立绘、或表情就是默认档, 就不去试差分 */
const 差分名 = computed(() =>
  props.src && props.表情 && props.表情 !== '默认' ? `${props.src}·${props.表情}` : '',
);

/** 实际去取的那张: 先差分, 差分不行退回基础立绘 */
const 实际名 = computed(() => (差分名.value && !差分不可用.value ? 差分名.value : props.src));

/** 传进来的一般只是文件名, 真正的地址由 `素材链接` 拼出来 */
const 图源 = computed(() => 素材链接(实际名.value, '立绘'));

const 可用 = computed(() => !!图源.value && !(实际名.value === props.src && 基础不可用.value));
const 首字 = computed(() => props.名称?.trim().charAt(0) ?? '仙');

/** 两级退让: 差分 404 → 换基础立绘再试一次; 基础也 404 → 水墨占位 */
function 加载出错() {
  if (差分名.value && !差分不可用.value) {
    差分不可用.value = true;
    return;
  }
  基础不可用.value = true;
}

// 换了立绘或表情, 就重新给两张图各一次机会
watch(
  () => [props.src, props.表情],
  () => {
    差分不可用.value = false;
    基础不可用.value = false;
  },
);
</script>

<style lang="scss" scoped>
@use '../水墨' as *;

/* 立绘按挂轴的样式裱一下: 一圈细线, 四角压角线 */
.portrait {
  position: relative;
  overflow: hidden;
  background: linear-gradient(165deg, #f1ebdd 0%, #ddd2bd 100%);
  /* 角线取短一点: 周遭栏的头像是 48×64 的小图, 角线太长会顶满整条边 */
  @include 版框(3px, 7px, rgba(35, 32, 27, 0.13), rgba(138, 106, 68, 0.55));
}

.portrait-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/*
 * 素: 舞台上的「说话人立绘」用这一档.
 *
 * 它要直接叠在背景图上, 所以不能裱框、不能铺纸底; 图也改成整张放下 (contain) ——
 * 小头像裁一裁无所谓, 立绘裁掉头可不行.
 */
.portrait-plain {
  background: none;

  &::before {
    display: none;
  }

  .portrait-image {
    object-fit: contain;
  }

  .portrait-blank {
    background: none;
  }
}

.portrait-blank {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background:
    radial-gradient(circle at 50% 34%, rgba(156, 43, 35, 0.09), transparent 64%),
    linear-gradient(165deg, #f4eee1 0%, #ddd2bd 100%);
}

/* 空位用一枚虚圈示意 */
.portrait-frame {
  position: absolute;
  inset: 13% 17%;
  border: 1px dashed rgba(35, 32, 27, 0.22);
  border-radius: 50%;
  pointer-events: none;
}

.portrait-word {
  font-family: var(--字体题签);
  font-size: 3em;
  line-height: 1;
  color: rgba(156, 43, 35, 0.4);
}

.portrait-name {
  font-family: var(--字体题签);
  font-size: 0.78em;
  letter-spacing: 0.26em;
  text-indent: 0.26em;
  color: var(--墨微);
}
</style>
