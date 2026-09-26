import { 灵根表 } from '../修仙恋爱角色卡脚本/schema';
import { 酒馆页面 } from '../全屏前端界面/酒馆页面';

/**
 * 开局流程脚本
 *
 * 修仙恋爱角色卡把主角的出身交给玩家亲自决定, 所以 initvar 里 `主角.姓名` 与
 * `主角.灵根.名称` 都是空的, 由这个脚本在开局依次弹出两步:
 *
 *   1. 输入姓名
 *   2. 从 `灵根表` 里挑一条灵根 (它直接决定修炼速率倍率)
 *
 * 两步都写回所在楼层的 MVU 变量. 只在**还没填**的时候询问: 已经开过局的旧存档不会被
 * 重新打扰, 想改就手动改变量.
 */

/** 这些值都算"还没填", 因此再问一次 */
const 空值 = ['', '无名', '待定', '未命名', '佚名', '未知'];

function 还没填(值: unknown): boolean {
  return typeof 值 !== 'string' || 空值.includes(值.trim());
}

/** 弹窗样式; 直接写进酒馆页面, 免得依赖任何一份界面代码 */
const 样式 = `
.修仙开局-遮罩 {
  position: fixed;
  inset: 0;
  z-index: 2147483002;
  display: grid;
  place-items: center;
  background: rgba(24, 20, 16, 0.52);
  backdrop-filter: blur(2px);
  font-family: 'KaiTi', 'STKaiti', 'Kaiti SC', 'Noto Serif SC', 'Songti SC', serif;
  animation: 修仙开局-淡入 0.24s ease;
}
@keyframes 修仙开局-淡入 { from { opacity: 0 } to { opacity: 1 } }

.修仙开局-框 {
  width: min(460px, 88vw);
  padding: 30px 34px 26px;
  text-align: center;
  color: #2f2c28;
  background-color: #f6f2e9;
  background-image: linear-gradient(180deg, #fbf8f1, #efe9dc);
  border: 1px solid rgba(47, 44, 40, 0.22);
  border-radius: 3px;
  box-shadow: 0 22px 60px rgba(30, 22, 14, 0.36);
}
.修仙开局-题 {
  margin: 0;
  font-size: 21px;
  font-weight: 400;
  letter-spacing: 0.42em;
  text-indent: 0.42em;
}
.修仙开局-线 {
  width: 46px;
  height: 1px;
  margin: 14px auto 16px;
  background: linear-gradient(90deg, transparent, rgba(168, 56, 43, 0.75), transparent);
}
.修仙开局-注 {
  margin: 0 0 20px;
  font-size: 13px;
  line-height: 1.9;
  letter-spacing: 0.06em;
  color: #6b655c;
}
.修仙开局-输入 {
  width: 100%;
  padding: 11px 14px;
  font-family: inherit;
  font-size: 17px;
  letter-spacing: 0.16em;
  text-align: center;
  color: #2f2c28;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(47, 44, 40, 0.24);
  border-radius: 3px;
  outline: none;
  transition: border-color 0.18s ease;
}
.修仙开局-输入:focus { border-color: rgba(168, 56, 43, 0.62); }
.修仙开局-输入::placeholder { color: #b3aca1; letter-spacing: 0.08em; }

.修仙开局-灵根表 {
  display: flex;
  flex-direction: column;
  gap: 7px;
  max-height: 52vh;
  margin: 0 0 18px;
  overflow-y: auto;
  text-align: left;
}
.修仙开局-灵根 {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 10px;
  padding: 9px 12px;
  font-family: inherit;
  text-align: left;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(47, 44, 40, 0.2);
  border-radius: 2px;
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease;
}
.修仙开局-灵根:hover { border-color: rgba(168, 56, 43, 0.55); background: rgba(255, 255, 255, 0.92); }
.修仙开局-灵根.选中 { border-color: #a8382b; background: rgba(168, 56, 43, 0.09); }
.修仙开局-灵根名 {
  font-size: 15px;
  letter-spacing: 0.12em;
  color: #2f2c28;
}
.修仙开局-灵根倍率 {
  justify-self: end;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: #a8382b;
}
.修仙开局-灵根描述 {
  grid-column: 1 / -1;
  font-size: 12px;
  line-height: 1.7;
  color: #6b655c;
}

.修仙开局-按钮行 {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.修仙开局-按钮行 button {
  flex: 1 1 auto;
  padding: 10px 0;
  font-family: inherit;
  font-size: 14px;
  letter-spacing: 0.28em;
  text-indent: 0.28em;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.18s ease, opacity 0.18s ease;
}
.修仙开局-确认 {
  color: #fdfbf6;
  background: #a8382b;
  border: 1px solid #a8382b;
}
.修仙开局-确认:hover { background: #bd4436; }
.修仙开局-确认:disabled { opacity: 0.42; cursor: not-allowed; }
.修仙开局-稍后 {
  color: #6b655c;
  background: transparent;
  border: 1px solid rgba(47, 44, 40, 0.26);
}
.修仙开局-稍后:hover { background: rgba(47, 44, 40, 0.07); }
`;

function 注入样式(): void {
  const { $: $酒馆, document: 酒馆文档 } = 酒馆页面();
  if ($酒馆('#修仙开局-样式').length === 0) {
    $酒馆('<style>').attr('id', '修仙开局-样式').text(样式).appendTo(酒馆文档.head);
  }
}

/** 弹出一层遮罩, 返回遮罩本体与关闭函数 */
function 弹遮罩(内部: string): { $遮罩: JQuery; 关闭: () => void } {
  const { $: $酒馆, document: 酒馆文档 } = 酒馆页面();
  注入样式();

  const $遮罩 = $酒馆(`<div class="修仙开局-遮罩"><div class="修仙开局-框">${内部}</div></div>`);
  $遮罩.on('click', 事件 => {
    // 点遮罩空白处 = 稍后再说
    if (事件.target === $遮罩[0]) {
      $遮罩.remove();
    }
  });
  $酒馆(酒馆文档.body).append($遮罩);

  return { $遮罩, 关闭: () => $遮罩.remove() };
}

/** 第一步: 问姓名 */
function 问姓名(): Promise<string | undefined> {
  const { $: $酒馆 } = 酒馆页面();

  // 已经在问了就别叠第二层
  if ($酒馆('#修仙开局-姓名').length > 0) {
    return Promise.resolve(undefined);
  }

  return new Promise(解决 => {
    let 已结束 = false;
    const 收尾 = (值: string | undefined) => {
      if (已结束) {
        return;
      }
      已结束 = true;
      关闭();
      解决(值);
    };

    const { $遮罩, 关闭 } = 弹遮罩(`
      <div id="修仙开局-姓名">
        <h2 class="修仙开局-题">取 名</h2>
        <div class="修仙开局-线"></div>
        <p class="修仙开局-注">这一笔落下去，便是你在青冥山的名姓。</p>
        <input class="修仙开局-输入" type="text" maxlength="12" placeholder="请输入姓名" />
        <div class="修仙开局-按钮行">
          <button class="修仙开局-稍后" type="button">稍后再说</button>
          <button class="修仙开局-确认" type="button" disabled>落 笔</button>
        </div>
      </div>
    `);

    const $输入 = $遮罩.find('.修仙开局-输入');
    const $确认 = $遮罩.find('.修仙开局-确认');

    $输入.on('input', () => $确认.prop('disabled', $输入.val()?.toString().trim().length === 0));
    $输入.on('keydown', 事件 => {
      if ((事件 as JQuery.KeyDownEvent).key !== 'Enter') {
        return;
      }
      事件.preventDefault();
      if (!$确认.prop('disabled')) {
        $确认.trigger('click');
      }
    });
    $确认.on('click', () => 收尾($输入.val()?.toString().trim() ?? ''));
    $遮罩.find('.修仙开局-稍后').on('click', () => 收尾(undefined));
    // 点空白处时 $遮罩 被移除, 也要把 Promise 收掉
    $遮罩.on('click', 事件 => {
      if (事件.target === $遮罩[0]) {
        收尾(undefined);
      }
    });

    $输入.trigger('focus');
  });
}

/** 第二步: 从灵根表里挑一条 */
function 问灵根(): Promise<string | undefined> {
  const { $: $酒馆 } = 酒馆页面();

  if ($酒馆('#修仙开局-灵根').length > 0) {
    return Promise.resolve(undefined);
  }

  const 选项 = _.entries(灵根表)
    .map(
      ([名称, { 倍率, 描述 }]) => `
        <button class="修仙开局-灵根" type="button" data-名称="${名称}">
          <span class="修仙开局-灵根名">${名称}</span>
          <span class="修仙开局-灵根倍率">修炼 ×${倍率}</span>
          <span class="修仙开局-灵根描述">${描述}</span>
        </button>`,
    )
    .join('');

  return new Promise(解决 => {
    let 已结束 = false;
    let 选中 = '';
    const 收尾 = (值: string | undefined) => {
      if (已结束) {
        return;
      }
      已结束 = true;
      关闭();
      解决(值);
    };

    const { $遮罩, 关闭 } = 弹遮罩(`
      <div id="修仙开局-灵根">
        <h2 class="修仙开局-题">测 灵 根</h2>
        <div class="修仙开局-线"></div>
        <p class="修仙开局-注">灵根天定，测出什么便是什么——只是这一次，由你自己选。</p>
        <div class="修仙开局-灵根表">${选项}</div>
        <div class="修仙开局-按钮行">
          <button class="修仙开局-稍后" type="button">稍后再说</button>
          <button class="修仙开局-确认" type="button" disabled>就 此 定 下</button>
        </div>
      </div>
    `);

    const $确认 = $遮罩.find('.修仙开局-确认');
    $遮罩.find('.修仙开局-灵根').on('click', function (this: HTMLElement) {
      选中 = $酒馆(this).attr('data-名称') ?? '';
      $遮罩.find('.修仙开局-灵根').removeClass('选中');
      $酒馆(this).addClass('选中');
      $确认.prop('disabled', 选中 === '');
    });
    $确认.on('click', () => 收尾(选中 === '' ? undefined : 选中));
    $遮罩.find('.修仙开局-稍后').on('click', () => 收尾(undefined));
    $遮罩.on('click', 事件 => {
      if (事件.target === $遮罩[0]) {
        收尾(undefined);
      }
    });
  });
}

/** 把值写进最新楼层的 MVU 变量 */
async function 写入(路径: string, 值: unknown): Promise<void> {
  const mvu_data = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
  _.set(mvu_data, 路径, 值);
  await Mvu.replaceMvuData(mvu_data, { type: 'message', message_id: 'latest' });
}

async function 走流程(姓名: unknown, 灵根名称: unknown): Promise<void> {
  if (还没填(姓名)) {
    const 新名 = await 问姓名();
    if (新名 === undefined) {
      return;
    }
    await 写入('stat_data.主角.姓名', 新名);
  }

  if (还没填(灵根名称)) {
    const 选择 = await 问灵根();
    if (选择 === undefined) {
      return;
    }
    const 灵根 = 灵根表[选择];
    if (灵根) {
      await 写入('stat_data.主角.灵根', { 名称: 选择, 倍率: 灵根.倍率, 描述: 灵根.描述 });
    }
  }

  酒馆页面().toastr.success('开局已就绪，愿君仙途顺遂', '原来我的仙子母亲不止会哦齁，还会帮我找道侣');
}

let 流程进行中 = false;

function 检查并走流程(): void {
  if (流程进行中) {
    return;
  }

  const mvu_data = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
  const 姓名 = _.get(mvu_data, 'stat_data.主角.姓名');
  const 灵根名称 = _.get(mvu_data, 'stat_data.主角.灵根.名称');

  // `主角` 还不存在说明 initvar 尚未写进楼层, 等下一次事件再检查
  if (姓名 === undefined || 灵根名称 === undefined) {
    return;
  }
  if (!还没填(姓名) && !还没填(灵根名称)) {
    return;
  }

  流程进行中 = true;
  void errorCatched(async () => {
    try {
      await 走流程(姓名, 灵根名称);
    } finally {
      流程进行中 = false;
    }
  })();
}

let 检查定时器: ReturnType<typeof setTimeout> | undefined;

/** 酒馆把变量写进楼层往往晚一拍, 所以稍等一下再读 */
function 稍后检查(延迟 = 300): void {
  clearTimeout(检查定时器);
  检查定时器 = setTimeout(errorCatched(检查并走流程), 延迟);
}

async function 主流程(): Promise<void> {
  await waitGlobalInitialized('Mvu');

  // 新开聊天时 initvar 会被写进去, 这是最准的开局信号
  eventOn(Mvu.events.VARIABLE_INITIALIZED, () => 稍后检查());
  eventOn(tavern_events.CHAT_CHANGED, () => 稍后检查());

  // 脚本可能是中途加载的, 也要自己查一次
  稍后检查();

  $(window).on('pagehide', () => {
    clearTimeout(检查定时器);
    酒馆页面().$('.修仙开局-遮罩, #修仙开局-样式').remove();
  });

  console.info('[修仙开局] 开局流程脚本已加载: 先取名, 再测灵根');
}

$(() => {
  void errorCatched(主流程)();
});
