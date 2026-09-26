<template>
  <div class="portrait">
    <img v-if="可用" class="portrait-image" :src="图源" :alt="名称" @error="加载失败 = true" />
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
  /** 图片文件名或完整链接, 留空或加载失败时显示水墨占位 */
  src?: string;
  名称?: string;
}>();

const 加载失败 = ref(false);

/** 传进来的一般只是文件名, 真正的地址由 `素材链接` 拼出来 */
const 图源 = computed(() => 素材链接(props.src, '立绘'));

const 可用 = computed(() => !!图源.value && !加载失败.value);
const 首字 = computed(() => props.名称?.trim().charAt(0) ?? '仙');

// 换了一张图之后要重新给它一次加载的机会
watch(图源, () => {
  加载失败.value = false;
});
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
