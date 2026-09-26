import { 酒馆页面 } from './酒馆页面';

/**
 * 全屏界面要用到的设置, 会持久化保存在本脚本的脚本变量里.
 */
const 设置结构 = z
  .object({
    /** 是否用全屏界面盖住酒馆界面 */
    启用: z.boolean().default(true),
    /** 覆盖时把酒馆的历史楼层藏起来, 免得它们继续占着渲染开销 */
    隐藏历史楼层: z.boolean().default(true),
    /** 在界面底部显示输入框, 输入的内容会转发给酒馆原生输入框 */
    显示输入框: z.boolean().default(true),
    /** 切换按钮被拖到过哪里, 用视口宽高的比例记录; `null` 表示还在默认位置 */
    按钮位置: z.object({ x: z.number(), y: z.number() }).nullable().default(null),
  })
  .prefault({});

/** 在脚本变量表里占用的键名, 避免以后往同一张表里放别的东西时互相覆盖 */
const 变量键 = '全屏前端界面';

/** 全屏覆盖生效时加在 `<body>` 上的类名, 对应 App.vue 里的样式 */
export const 启用类名 = 'TH-fullscreen-on';

/** 覆盖全屏且要隐藏历史楼层时加在 `<body>` 上的类名, 对应 App.vue 里的样式 */
export const 隐藏历史楼层类名 = 'TH-fullscreen-hide-history';

/** 酒馆不会把 quiet 生成的楼层显示出来, 因此这种生成不该让界面进入"生成中" */
const 不显示楼层的生成类型 = ['quiet'];

/**
 * 是不是第一次运行本界面.
 *
 * 要在 store 建立 (进而把默认设置写进脚本变量) 之前调用才有意义.
 */
export function 是首次运行(): boolean {
  return getVariables({ type: 'script', script_id: getScriptId() })[变量键] === undefined;
}

/**
 * 全屏界面的数据源.
 *
 * 界面只负责显示, 不参与生成: 楼层内容由 `formatAsDisplayedMessage` 按酒馆自己的流程
 * (替换宏 → 应用酒馆正则 → 转 html) 渲染出来, 因此角色卡正则、世界书、预设全都照常生效.
 */
export const use全屏界面Store = defineStore('全屏前端界面', () => {
  // #region 设置
  const 设置 = ref(设置结构.parse(getVariables({ type: 'script', script_id: getScriptId() })[变量键]));

  watchEffect(() => {
    insertOrAssignVariables(klona({ [变量键]: 设置.value }), { type: 'script', script_id: getScriptId() });
  });

  watch(
    [() => 设置.value.启用, () => 设置.value.隐藏历史楼层],
    () => {
      // 类名要加在酒馆页面的 body 上, 而不是脚本自己 iframe 的 body
      const 酒馆body = 酒馆页面().document.body;
      酒馆body.classList.toggle(启用类名, 设置.value.启用);
      酒馆body.classList.toggle(隐藏历史楼层类名, 设置.value.启用 && 设置.value.隐藏历史楼层);
    },
    { immediate: true },
  );
  // #endregion

  // #region 界面正在显示的最新楼层
  const 楼层号 = ref(-1);
  const 说话人 = ref('');
  const 角色 = ref<ChatMessage['role']>('assistant');
  /** 已经按酒馆风格渲染好的 html */
  const 正文 = ref('');
  /** AI 正在输出: 这期间保持画面不动, 先不显示还没写完的最新输出 */
  const 生成中 = ref(builtin.duringGenerating());

  /** 从最后一楼往前找, 跳过被隐藏的楼层 */
  function 找最新楼层(): number {
    for (let 楼层 = getLastMessageId(); 楼层 >= 0; 楼层--) {
      const 消息 = getChatMessages(楼层)[0];
      if (消息 && !消息.is_hidden) {
        return 楼层;
      }
    }
    return -1;
  }

  function 刷新() {
    const 楼层 = 找最新楼层();
    const 消息 = 楼层 < 0 ? undefined : getChatMessages(楼层)[0];
    if (!消息) {
      楼层号.value = -1;
      说话人.value = '';
      正文.value = '';
      return;
    }

    楼层号.value = 楼层;
    说话人.value = 消息.name;
    角色.value = 消息.role;
    正文.value = formatAsDisplayedMessage(消息.message, { message_id: 楼层 });
  }

  /** 生成期间跳过刷新, 等酒馆把整个楼层写完再显示 */
  function 刷新除非生成中() {
    if (!生成中.value) {
      刷新();
    }
  }

  let 刷新定时器: ReturnType<typeof setTimeout> | undefined;
  /** 酒馆把楼层写进聊天记录往往比事件本身晚一拍, 稍等一下再读 */
  function 稍后刷新(延迟 = 50) {
    clearTimeout(刷新定时器);
    刷新定时器 = setTimeout(errorCatched(刷新), 延迟);
  }

  /** 和酒馆自己的生成状态对齐, 免得漏掉事件后一直卡在"生成中" */
  function 同步生成状态() {
    生成中.value = builtin.duringGenerating();
  }
  // #endregion

  // #region 跟随酒馆事件
  let 最后一次输出 = 0;

  const 监听 = [
    eventOn(tavern_events.GENERATION_STARTED, (类型, _选项, 试运行) => {
      if (试运行 || 不显示楼层的生成类型.includes(类型)) {
        return;
      }
      生成中.value = true;
    }),
    // 只要还有 token 在流进来就一定处于生成中, 顺便记下时间给兜底判断用
    eventOn(tavern_events.STREAM_TOKEN_RECEIVED, () => {
      最后一次输出 = Date.now();
      生成中.value = true;
    }),

    // 输出完毕或被打断: 这时才把新楼层换到界面上
    eventOn(tavern_events.GENERATION_ENDED, () => {
      同步生成状态();
      稍后刷新();
    }),
    eventOn(tavern_events.GENERATION_STOPPED, () => {
      同步生成状态();
      稍后刷新();
    }),

    // 玩家自己的发言立刻显示, 不必等生成
    eventOn(tavern_events.USER_MESSAGE_RENDERED, () => {
      同步生成状态();
      刷新();
    }),

    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, () => {
      同步生成状态();
      刷新除非生成中();
    }),
    eventOn(tavern_events.MESSAGE_RECEIVED, () => {
      同步生成状态();
      刷新除非生成中();
    }),
    eventOn(tavern_events.MESSAGE_UPDATED, 刷新除非生成中),
    eventOn(tavern_events.MESSAGE_EDITED, 刷新除非生成中),
    eventOn(tavern_events.MESSAGE_SWIPED, 刷新除非生成中),
    eventOn(tavern_events.MESSAGE_DELETED, 刷新除非生成中),

    eventOn(tavern_events.CHAT_CHANGED, () => {
      生成中.value = false;
      刷新();
    }),
  ];

  // 兜底: 万一生成结束事件没有送达, 只要酒馆确实不在生成、且三秒内没有新 token, 就解除冻结
  const 兜底定时器 = setInterval(() => {
    if (!生成中.value || builtin.duringGenerating() || Date.now() - 最后一次输出 < 3000) {
      return;
    }
    生成中.value = false;
    刷新();
  }, 1000);
  // #endregion

  $(() => 刷新());

  $(window).on('pagehide', () => {
    监听.forEach(返回值 => 返回值.stop());
    clearInterval(兜底定时器);
    clearTimeout(刷新定时器);
    酒馆页面().document.body.classList.remove(启用类名, 隐藏历史楼层类名);
  });

  return { 设置, 楼层号, 说话人, 角色, 正文, 生成中, 刷新 };
});
