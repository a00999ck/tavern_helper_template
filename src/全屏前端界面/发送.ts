import { 酒馆页面 } from './酒馆页面';

/**
 * 把一段文本交给酒馆原生的输入框和发送按钮.
 *
 * 这里不自己调 `generate`, 也不用酒馆的 `/send`: 点酒馆自己的发送按钮, 走的就还是酒馆
 * 那一整套流程, 角色卡、世界书、预设、快速回复、酒馆正则全都照常生效.
 *
 * 玩家的行动 (自己写的, 或点了行旅按钮) 因此都会成为**真正的楼层**, 而不是界面自造的协议;
 * 世界推进脚本也才能照常在 AI 更新变量之后结算赶路与修为.
 *
 * @returns 是否成功交给了酒馆
 */
export function 发送给酒馆(文本: string): boolean {
  // 必须用酒馆页面自己那份 jQuery, 否则选到的是脚本 iframe 里的空文档
  const { $: $酒馆, toastr: 酒馆提示 } = 酒馆页面();
  const $输入框 = $酒馆('#send_textarea');
  const $发送键 = $酒馆('#send_but');

  if ($输入框.length === 0 || $发送键.length === 0) {
    酒馆提示.error('没找到酒馆的输入框或发送按钮, 请先切回酒馆界面确认酒馆是否正常', '全屏前端界面');
    return false;
  }

  $输入框.val(文本).trigger('input');
  $发送键.trigger('click');
  return true;
}
