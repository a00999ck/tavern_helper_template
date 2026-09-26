<template>
  <div class="fullscreen-root">
    <section v-show="设置.启用" class="fullscreen-panel">
      <!-- 生成中时顶部走一条笔痕: 界面还活着, 只是暂时不显示新输出 -->
      <div v-if="生成中" class="fullscreen-progress"></div>

      <header class="fullscreen-header">
        <span class="fullscreen-speaker">
          <span class="fullscreen-seal">卷</span>
          {{ 说话人 || '全屏界面' }}
        </span>

        <span class="fullscreen-meta">
          <template v-if="生成中">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>生成中…</span>
            <button class="fullscreen-stop" type="button" title="停止生成" @click="停止生成">止</button>
          </template>
          <span v-else-if="楼层号 >= 0" class="fullscreen-floor">第 {{ 楼层号 }} 楼</span>
        </span>
      </header>

      <div class="fullscreen-columns">
        <!-- 左栏: 主角的立绘、境界与修行 -->
        <SidePanel class="fullscreen-side-panel" title="主 角">
          <HeroPanel />
        </SidePanel>

        <!-- 中栏: 上面留白, 底下是对话框和输入框 -->
        <section class="fullscreen-center">
          <!-- 上方留白: 场景画面 + 一行时间地点; 想放立绘、场景 CG 也往这里加 -->
          <div class="fullscreen-stage" :style="舞台样式">
            <!-- 场面画: 世界.CG 填了文件名的才出现, 盖在背景之上、场景条之下 -->
            <img
              v-if="CG显示"
              class="fullscreen-stage-cg"
              :src="CG链接"
              :alt="世界.CG说明"
              @error="CG加载失败 = true"
            />

            <div class="fullscreen-scene">
              <span v-if="地点" class="fullscreen-scene-place">{{ 地点 }}</span>
              <span class="fullscreen-scene-time">{{ 世界.$当前时间 || '——' }}</span>
              <span v-if="世界.天气" class="fullscreen-scene-weather">{{ 世界.天气 }}</span>
              <button class="fullscreen-scene-map" type="button" title="行旅" @click="地图打开 = true">
                <i class="fa-solid fa-map-location-dot"></i>
                行旅
              </button>
            </div>
          </div>

          <!-- 正文不再整段显示, 改由这个对话框一句一页地读: 左键下一句、右键上一句 -->
          <DialogueBox :html="正文" :角色="角色" :生成中="生成中" />

          <footer v-if="设置.显示输入框" class="fullscreen-footer">
            <Composer :disabled="生成中" />
          </footer>
        </section>

        <!-- 右栏: 出场人物; 可以整栏收成一条竖签, 把地方让给正文 -->
        <div class="fullscreen-side">
          <SidePanel v-if="!右栏收起" class="fullscreen-side-panel" title="周 遭">
            <NpcPanel />
          </SidePanel>

          <button
            v-if="右栏收起"
            class="fullscreen-side-strip"
            type="button"
            title="展开右栏"
            @click="右栏收起 = false"
          >
            <i class="fa-solid fa-angle-double-left"></i>
            <span class="fullscreen-side-strip-text">周 遭</span>
          </button>

          <button v-else class="fullscreen-fold" type="button" title="收起右栏" @click="右栏收起 = true">
            <i class="fa-solid fa-angle-double-right"></i>
          </button>
        </div>
      </div>

      <!-- 行旅: 点一处便动身前往, 由世界推进脚本结算赶路天数 -->
      <div v-if="地图打开" class="fullscreen-map-layer">
        <MapPanel :disabled="生成中" @关闭="地图打开 = false" @前往="前往" />
      </div>
    </section>

    <button
      ref="切换按钮"
      class="fullscreen-toggle"
      type="button"
      :style="切换按钮样式"
      :title="设置.启用 ? '切回酒馆界面 (可拖动)' : '切换到全屏界面 (可拖动)'"
      @click="切换"
    >
      <i class="fa-solid" :class="设置.启用 ? 'fa-compress' : 'fa-expand'"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import Composer from './components/Composer.vue';
import DialogueBox from './components/DialogueBox.vue';
import HeroPanel from './components/HeroPanel.vue';
import MapPanel from './components/MapPanel.vue';
import NpcPanel from './components/NpcPanel.vue';
import SidePanel from './components/SidePanel.vue';
import { 素材链接 } from '../修仙恋爱角色卡脚本/schema';
import { 空世界 } from './schema';
import { 发送给酒馆 } from './发送';
import { use全屏界面Store } from './store';
import { use修仙数据 } from './修仙数据';
import { 酒馆页面 } from './酒馆页面';

const store = use全屏界面Store();
const { 设置, 楼层号, 说话人, 角色, 正文, 生成中 } = storeToRefs(store);

/** 中栏上方那一条场景信息, 取自最新楼层的 MVU 变量 */
const 修仙 = use修仙数据();
const 世界 = computed(() => 修仙.data.世界 ?? 空世界);
const 地点 = computed(() => [世界.value.当前大区, 世界.value.当前地点].filter(Boolean).join(' · '));

/**
 * 舞台背景: `世界.背景` 留空时自动用当前大区那张（`素材/背景/<大区>.png`）,
 * 所以丢进六张大区图就能一路跟着走; 两者都没有则退回样式里的远山.
 */
const 背景链接 = computed(() => 素材链接(世界.value.背景 || 世界.value.当前大区, '背景'));

const 舞台样式 = computed(() =>
  背景链接.value
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(252, 250, 245, 0.3), rgba(252, 250, 245, 0.94)), url("${背景链接.value}")`,
      }
    : undefined,
);

/** 事件 CG: 和立绘一样, 文件不在就悄悄不显示, 不会开天窗 */
const CG链接 = computed(() => 素材链接(世界.value.CG, 'CG'));
const CG加载失败 = ref(false);
const CG显示 = computed(() => !!CG链接.value && !CG加载失败.value);

watch(CG链接, () => {
  CG加载失败.value = false;
});

const 切换按钮 = ref<HTMLElement>();

/** 右栏收起时只留一条竖签, 让正文区域更宽; 只影响观感, 不写进设置 */
const 右栏收起 = ref(false);

/** 行旅面板开合 */
const 地图打开 = ref(false);

/**
 * 从行旅面板动身前往某处.
 *
 * 界面不自己改 `当前大区`/`当前地点`, 也不自己算赶路天数 —— 那两件事分别属于 AI 和
 * 世界推进脚本. 这里只把"我要去某处"作为**一条真正的玩家楼层**发进聊天记录,
 * 于是角色卡、世界书、预设照常生效, 脚本也照常在下一轮结算跨区耗时与修为.
 */
function 前往(目的地: { 大区: string; 地点: string }) {
  地图打开.value = false;
  发送给酒馆(`（我动身前往 ${目的地.大区} · ${目的地.地点}）`);
}

/** 记住拖动后的位置: 按视口比例换算, 免得改变窗口大小后按钮跑到屏幕外 */
const 切换按钮样式 = computed(() => {
  const 位置 = 设置.value.按钮位置;
  if (!位置) {
    return undefined;
  }
  return {
    left: `${位置.x * 100}%`,
    top: `${位置.y * 100}%`,
    right: 'auto',
    bottom: 'auto',
  };
});

let 拖动结束时刻 = 0;

/** 把按钮限制在视口内, 别让它被拖到看不见的地方 */
function 夹取(值: number, 最小: number, 最大: number) {
  return Math.min(Math.max(值, 最小), Math.max(最小, 最大));
}

function 切换() {
  // 刚把按钮拖到别处时不要顺手把界面也切了
  if (Date.now() - 拖动结束时刻 < 300) {
    return;
  }
  设置.value.启用 = !设置.value.启用;
}

const 停止生成 = errorCatched(async () => {
  await triggerSlash('/stop');
});

/**
 * 让角落按钮可以被拖走, 免得它挡住酒馆或界面本身的东西.
 *
 * 不用 `click` 的坐标判断而用 `pointercapture`, 这样手指或鼠标移出按钮后拖拽也不会断.
 */
onMounted(() => {
  const 元素 = 切换按钮.value;
  if (!元素) {
    return;
  }

  let 起点 = { x: 0, y: 0 };
  let 起始 = { x: 0, y: 0 };
  let 在拖动 = false;

  元素.addEventListener('pointerdown', 事件 => {
    const 矩形 = 元素.getBoundingClientRect();
    起点 = { x: 事件.clientX, y: 事件.clientY };
    起始 = { x: 矩形.left, y: 矩形.top };
    在拖动 = false;
    元素.setPointerCapture(事件.pointerId);
  });

  元素.addEventListener('pointermove', 事件 => {
    if (!元素.hasPointerCapture(事件.pointerId)) {
      return;
    }

    const 横向偏移 = 事件.clientX - 起点.x;
    const 纵向偏移 = 事件.clientY - 起点.y;
    if (!在拖动 && Math.hypot(横向偏移, 纵向偏移) < 4) {
      return;
    }

    在拖动 = true;
    // 用酒馆页面的视口来夹取, 而不是脚本自己 iframe 的视口
    const { innerWidth, innerHeight } = 酒馆页面().window;
    元素.style.left = `${夹取(起始.x + 横向偏移, 0, innerWidth - 元素.offsetWidth)}px`;
    元素.style.top = `${夹取(起始.y + 纵向偏移, 0, innerHeight - 元素.offsetHeight)}px`;
    元素.style.right = 'auto';
    元素.style.bottom = 'auto';
  });

  const 结束拖动 = (事件: PointerEvent) => {
    if (!元素.hasPointerCapture(事件.pointerId)) {
      return;
    }
    元素.releasePointerCapture(事件.pointerId);

    if (在拖动) {
      拖动结束时刻 = Date.now();
      const { innerWidth, innerHeight } = 酒馆页面().window;
      const 矩形 = 元素.getBoundingClientRect();
      设置.value.按钮位置 = { x: 矩形.left / innerWidth, y: 矩形.top / innerHeight };
    }
    在拖动 = false;
  };

  元素.addEventListener('pointerup', 结束拖动);
  元素.addEventListener('pointercancel', 结束拖动);
});
</script>

<style lang="scss" scoped>
@use './水墨' as *;

/* 水墨配色与字体: 定义在根节点上, 各子组件直接 var() 继承 */
.fullscreen-root {
  /* 宣纸 */
  --纸: #f1eade;
  --纸亮: #fdfaf3;
  /* 墨: 松烟偏暖, 不用纯黑 */
  --墨: #23201b;
  --墨淡: #6b6255;
  --墨微: #a1968a;
  /* 印泥朱砂 */
  --朱砂: #9c2b23;
  /* 赭石: 次级线条与数字, 比墨淡更暖 */
  --赭: #8a6a44;
  --墨线: rgba(35, 32, 27, 0.17);
  --墨线淡: rgba(35, 32, 27, 0.1);
  --朱砂线: rgba(156, 43, 35, 0.42);
  --朱砂淡: rgba(156, 43, 35, 0.07);
  --字体正文: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'STSong', SimSun, 'Times New Roman', serif;
  --字体题签: 'KaiTi', 'STKaiti', 'Kaiti SC', 'Noto Serif SC', 'Songti SC', serif;

  position: fixed;
  inset: 0;
  z-index: 2147483000;
  /* 只有面板和按钮接收点击, 其余位置透给酒馆 */
  pointer-events: none;
  font-family: var(--字体正文);
  font-size: 16px;
  line-height: 1.95;
  color: var(--墨);
  text-align: left;
}

/*
 * 宣纸底. 从上往下叠了四层:
 *   四周做旧(边缘泛起茶色) → 帘纹(宣纸特有的细密横纹) → 三团淡墨晕染 → 纸色渐变
 */
.fullscreen-panel {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  background-color: var(--纸);
  background-image:
    radial-gradient(132% 120% at 50% 46%, transparent 54%, rgba(126, 98, 58, 0.14) 100%),
    repeating-linear-gradient(0deg, rgba(126, 104, 74, 0.042) 0 1px, transparent 1px 4px),
    radial-gradient(900px 520px at 8% -12%, rgba(74, 96, 118, 0.12), transparent 62%),
    radial-gradient(760px 460px at 96% 2%, rgba(96, 78, 60, 0.11), transparent 64%),
    radial-gradient(880px 600px at 46% 114%, rgba(66, 84, 102, 0.12), transparent 66%),
    linear-gradient(180deg, #fcf8f0, #eee5d5);
}

/* 纸纹: 一层极淡的噪点, 让底色不是纯色块 */
.fullscreen-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.26;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23p)'/%3E%3C/svg%3E");
}

/* 生成中时的一道笔痕: 赭石扫向朱砂 */
.fullscreen-progress {
  position: relative;
  flex: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(138, 106, 68, 0.45), rgba(156, 43, 35, 0.65), transparent);
  background-size: 42% 100%;
  background-repeat: no-repeat;
  animation: fullscreen-progress 1.7s ease-in-out infinite;
}

@keyframes fullscreen-progress {
  from {
    background-position: -42% 0;
  }
  to {
    background-position: 142% 0;
  }
}

.fullscreen-header {
  position: relative;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 64px 15px 26px;
  font-family: var(--字体题签);
  font-size: 15px;
  letter-spacing: 0.12em;
}

/* 书眉线: 一深一浅两道, 两端化开 */
.fullscreen-header::after {
  content: '';
  position: absolute;
  left: 22px;
  right: 22px;
  bottom: 0;
  @include 双线;
}

.fullscreen-speaker {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: #35312a;
}

/* 钤印: 印泥不匀, 再压一圈内白线做成阳文印 */
.fullscreen-seal {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 23px;
  height: 23px;
  background-color: var(--朱砂);
  background-image: radial-gradient(circle at 34% 30%, rgba(255, 255, 255, 0.17), transparent 62%);
  color: #fdf8ef;
  font-family: var(--字体题签);
  font-size: 13px;
  line-height: 1;
  letter-spacing: 0;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.26),
    inset 0 0 6px rgba(58, 12, 8, 0.3);
}

.fullscreen-meta {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  flex: none;
  color: var(--墨淡);
  letter-spacing: 0.06em;
}

/* 楼层号用小字赭色, 不抢戏 */
.fullscreen-floor {
  font-size: 12.5px;
  letter-spacing: 0.16em;
  color: var(--赭);
  font-variant-numeric: tabular-nums;
}

/* 停止: 一个朱砂小印, 里面一个「止」字 */
.fullscreen-stop {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--朱砂线);
  background: var(--朱砂淡);
  color: var(--朱砂);
  font-family: var(--字体题签);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease;

  &:hover {
    background: rgba(156, 43, 35, 0.18);
  }
}

/*
 * 左中右三栏.
 *
 * 中栏宽度上限就是正文的行宽, 因此正文和对话框的左端一定贴在左边栏右端;
 * 左右两栏用 `1fr` 把剩下的宽度全部吃干净, 这样它们的左端、右端会一直顶到容器边缘,
 * 不会在屏幕最左/最右留下空白.
 */
.fullscreen-columns {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(190px, 1fr) minmax(340px, 760px) minmax(190px, 1fr);
  gap: 16px;
  padding: 16px 22px 20px;
  overflow: hidden;
}

.fullscreen-center {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

/* 左栏的面板铺满整列 */
.fullscreen-side-panel {
  flex: 1 1 auto;
  min-height: 0;
}

/*
 * 右栏.
 *
 * 展开时是普通的一栏面板; 收起时整栏换成一个 46px 宽的竖签 —— 竖签贴住中栏那一侧,
 * 因此三栏的宽度分配不变, 正文字区域仍然居中, 只是右边多出一片留白.
 */
.fullscreen-side {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.fullscreen-fold {
  flex: none;
  align-self: flex-end;
  display: grid;
  place-items: center;
  width: 26px;
  height: 22px;
  border: 1px solid var(--墨线);
  background: rgba(255, 253, 247, 0.72);
  color: var(--墨淡);
  font-size: 10px;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    color 0.18s ease;

  &:hover {
    border-color: var(--朱砂线);
    color: var(--朱砂);
  }
}

/* 收起后的竖签: 像书脊上的一块题签 */
.fullscreen-side-strip {
  position: relative;
  flex: 1 1 auto;
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 46px;
  padding: 16px 0;
  border: 1px solid var(--墨线);
  background: linear-gradient(180deg, rgba(255, 253, 247, 0.8), rgba(255, 252, 244, 0.44));
  color: var(--墨淡);
  font-size: 10px;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    color 0.18s ease;

  &:hover {
    border-color: var(--朱砂线);
    color: var(--朱砂);
  }
}

.fullscreen-side-strip-text {
  font-family: var(--字体题签);
  font-size: 13px;
  letter-spacing: 0.3em;
  writing-mode: vertical-rl;
}

/*
 * 正文收进对话框之后空出来的地方.
 *
 * 留白, 不摆任何东西 —— 想放立绘、场景 CG 之类的内容, 直接往这个容器里加即可.
 * 它把下面的对话框和输入框顶到中栏底部, 也就是 galgame 那种"画面在上、对白在下"的布局.
 */
.fullscreen-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  /*
   * 没设背景图时, 留白处透出几重远山(几团压在底边上的淡墨).
   * 世界.背景 一旦填了图片, 内联的 background-image 会把整条覆盖掉, 远山自然让位给 CG.
   */
  background-image:
    radial-gradient(62% 58% at 14% 92%, rgba(35, 32, 27, 0.055), transparent 72%),
    radial-gradient(48% 46% at 38% 97%, rgba(35, 32, 27, 0.042), transparent 74%),
    radial-gradient(72% 62% at 72% 90%, rgba(35, 32, 27, 0.05), transparent 72%),
    radial-gradient(44% 40% at 95% 99%, rgba(35, 32, 27, 0.036), transparent 76%);
  transition: background-image 0.4s ease;
}

/*
 * 场面画(事件 CG).
 *
 * `contain` 而不是 `cover`: 背景被裁掉一点无所谓, CG 是画给人看的, 宁可留白边也不能裁构图.
 * 它压在背景之上、场景条之下, 所以下面的场景条仍然读得清.
 */
.fullscreen-stage-cg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

/* 场景信息条: 贴在留白区底部, 上面的空间留给背景图、立绘或 CG */
.fullscreen-scene {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  gap: 12px;
  width: 100%;
  padding: 26px 16px 10px;
  font-size: 12px;
  letter-spacing: 0.14em;
  color: var(--墨淡);
  background: linear-gradient(180deg, transparent, rgba(250, 246, 237, 0.9) 46%, rgba(250, 246, 237, 0.97));
}

.fullscreen-scene-place {
  flex: none;
  font-family: var(--字体题签);
  font-size: 15px;
  letter-spacing: 0.18em;
  color: var(--墨);
}

.fullscreen-scene-time {
  flex: 1 1 auto;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--赭);
}

.fullscreen-scene-weather {
  flex: none;
  padding-left: 12px;
  border-left: 1px solid var(--墨线淡);
  color: var(--墨微);
}

.fullscreen-scene-map {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-family: var(--字体题签);
  font-size: 12px;
  letter-spacing: 0.18em;
  color: var(--墨淡);
  background: rgba(255, 254, 250, 0.82);
  border: 1px solid var(--墨线);
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    color 0.18s ease;

  &:hover {
    color: var(--朱砂);
    border-color: var(--朱砂线);
  }
}

/* 行旅面板: 盖住整块面板区, 让地图有地方摊开 */
.fullscreen-map-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(30, 23, 14, 0.46);
  backdrop-filter: blur(2px);
  animation: fullscreen-map-in 0.2s ease;
}

@keyframes fullscreen-map-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fullscreen-footer {
  position: relative;
  flex: none;
  padding-top: 12px;
}

.fullscreen-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10px;
  right: 10px;
  @include 双线(rgba(35, 32, 27, 0.26), rgba(35, 32, 27, 0.1));
}

/* 切换按钮: 做成玉璧的样子, 双环, 悬停时转朱砂 */
.fullscreen-toggle {
  position: absolute;
  top: 16px;
  right: 16px;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(35, 32, 27, 0.3);
  border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, #fffdf8, #f1eade);
  color: #3b362e;
  font-size: 14px;
  cursor: grab;
  pointer-events: auto;
  /* 别让拖拽变成选中文字或触发触摸滚动 */
  touch-action: none;
  user-select: none;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.75),
    inset 0 0 0 2px rgba(35, 32, 27, 0.1),
    0 3px 12px rgba(74, 58, 38, 0.22);
  opacity: 0.9;
  transition:
    opacity 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;

  &:hover {
    opacity: 1;
    color: var(--朱砂);
    border-color: var(--朱砂线);
  }

  &:active {
    cursor: grabbing;
  }
}

/* 窄屏时收掉两栏, 保证中间的正文区域可用 */
@media (max-width: 900px) {
  .fullscreen-columns {
    grid-template-columns: minmax(0, 1fr);
  }

  .fullscreen-columns > :not(.fullscreen-center) {
    display: none;
  }
}
</style>

<style lang="scss">
/**
 * 覆盖全屏时藏掉酒馆的历史楼层, 只留最新楼层.
 *
 * 这条规则只在 `<body>` 带上类名时生效 (类名见 store.ts 的 `隐藏历史楼层类名`),
 * 因此平时不会影响酒馆本身; 切回酒馆界面时类名会被移除, 楼层也就恢复显示.
 */
body.TH-fullscreen-hide-history #chat > .mes:not(.last_mes) {
  display: none !important;
}

/* 覆盖层几乎盖住一切, 但酒馆的 toastr 提示得留在最上面, 不然出错时看不到原因 */
body.TH-fullscreen-on #toast-container {
  z-index: 2147483001 !important;
}
</style>
