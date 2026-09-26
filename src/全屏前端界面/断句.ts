/** 句末标点 */
const 句末 = /[。！？!?…]/;

/** 跟在句末标点后面的收尾符号, 应当算在这一句里面 */
const 收尾 = /["'”’」』）)】\]]/;

/** 块级标签: 它们之间即使没有句末标点也应该断开, 例如一行没有句号的短句 */
const 块级标签 = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'BR',
  'DD',
  'DIV',
  'DL',
  'DT',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'HR',
  'LI',
  'MAIN',
  'NAV',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'TR',
  'UL',
]);

/**
 * 不靠文字表达意义的标签.
 *
 * 它们本身没有文字, 因此切文本切不到它们 —— 必须另外按位置判断该留在哪一页,
 * 否则换行和图片会在每一页里都重复出现.
 */
const 空标签 = new Set([
  'AREA',
  'AUDIO',
  'BR',
  'COL',
  'EMBED',
  'HR',
  'IFRAME',
  'IMG',
  'INPUT',
  'SOURCE',
  'TRACK',
  'VIDEO',
  'WBR',
]);

/** 去掉句子两端的空白, 句内的空白保持原样 */
function 裁剪(全文: string, 起: number, 止: number): [number, number] {
  let 左 = 起;
  let 右 = 止;
  while (左 < 右 && /\s/.test(全文[左]!)) {
    左++;
  }
  while (右 > 左 && /\s/.test(全文[右 - 1]!)) {
    右--;
  }
  return [左, 右];
}

/**
 * 把渲染好的 html 按句子拆成一页一句.
 *
 * 直接对 html 字符串按标点切会把标签切坏 (例如 `<em>` 被切掉一半), 所以这里先解析成 DOM:
 * 把所有文本节点按文档顺序拼成一整串, 在整串上找句子边界, 再按边界把每个节点属于这一句的
 * 部分填回一份克隆里 —— 标签结构因此始终是完整的.
 *
 * @param html 已经由 `formatAsDisplayedMessage` 渲染好的正文
 * @returns 每句一段 html; 一句都分不出来时返回整段原文
 */
export function 按句分页(html: string): string[] {
  if (!html.trim()) {
    return [];
  }

  const 源 = document.createElement('div');
  源.innerHTML = html;

  // 1. 拼出全文, 同时记下每个文本节点和每个空标签在全文里的位置
  const 文本节点: Text[] = [];
  const 文本起点: number[] = [];
  const 空元素: Element[] = [];
  const 空元素起点: number[] = [];
  let 全文 = '';

  const 收集 = (节点: Node) => {
    for (const 子 of Array.from(节点.childNodes)) {
      if (子.nodeType === Node.TEXT_NODE) {
        文本节点.push(子 as Text);
        文本起点.push(全文.length);
        全文 += 子.textContent ?? '';
        continue;
      }
      if (子.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }

      const 元素 = 子 as Element;
      if (空标签.has(元素.tagName)) {
        空元素.push(元素);
        空元素起点.push(全文.length);
      }
      收集(元素);
      if (块级标签.has(元素.tagName)) {
        全文 += '\n';
      }
    }
  };
  收集(源);

  // 2. 在全文上找句子边界
  const 范围: Array<[number, number]> = [];
  let 句首 = 0;
  for (let 位置 = 0; 位置 < 全文.length; 位置++) {
    const 字符 = 全文[位置]!;
    if (字符 === '\n') {
      范围.push([句首, 位置]);
      句首 = 位置 + 1;
      continue;
    }
    if (!句末.test(字符)) {
      continue;
    }
    let 末尾 = 位置 + 1;
    while (末尾 < 全文.length && 收尾.test(全文[末尾]!)) {
      末尾++;
    }
    范围.push([句首, 末尾]);
    句首 = 末尾;
    位置 = 末尾 - 1;
  }
  范围.push([句首, 全文.length]);

  // 3. 按边界把每一句该保留的节点填回一份克隆
  const 有内容的范围 = 范围.map(([起, 止]) => 裁剪(全文, 起, 止)).filter(([左, 右]) => 右 > 左);

  // 压在两句之间的空标签归前一句: 既不会两边都出现, 也不会被丢掉
  const 已认领 = new Set<number>();
  const 空标签选择器 = [...空标签].join(',').toLowerCase();

  const 页 = 有内容的范围
    .map(([左, 右], 下标) => {
      const 认领止 = 有内容的范围[下标 + 1]?.[0] ?? 全文.length + 1;
      const 克隆 = 源.cloneNode(true) as HTMLElement;

      // 文本: 不属于这一句的直接删掉, 属于这一句的只留这一句的部分
      // (先把克隆里的文本节点收集成数组再改结构, 免得一边遍历一边删节点把遍历走乱)
      const 克隆文本: Text[] = [];
      const 遍历器 = document.createTreeWalker(克隆, NodeFilter.SHOW_TEXT);
      let 节点 = 遍历器.nextNode();
      while (节点) {
        克隆文本.push(节点 as Text);
        节点 = 遍历器.nextNode();
      }

      克隆文本.forEach((文本, 序号) => {
        const 原节点 = 文本节点[序号];
        if (!原节点) {
          return;
        }
        const 局部起 = Math.max(0, 左 - 文本起点[序号]!);
        const 局部止 = Math.min(原节点.data.length, 右 - 文本起点[序号]!);
        if (局部起 < 局部止) {
          文本.data = 原节点.data.slice(局部起, 局部止);
        } else {
          文本.parentNode?.removeChild(文本);
        }
      });

      // 空标签本身没有文字, 切文本切不到它们, 所以改按位置认领
      Array.from(克隆.querySelectorAll(空标签选择器)).forEach((元素, 空序号) => {
        const 位置 = 空元素起点[空序号];
        if (位置 === undefined || 位置 < 左 || 位置 >= 认领止 || 已认领.has(空序号)) {
          元素.remove();
          return;
        }
        已认领.add(空序号);
      });

      // 被掏空的标签(例如空 <em>)从里往外清掉; 空标签本身不按这条清, 否则 <br>、<hr> 会被误删
      for (const 元素 of Array.from(克隆.querySelectorAll('*')).reverse()) {
        if (!空标签.has(元素.tagName) && 元素.childNodes.length === 0) {
          元素.remove();
        }
      }

      return 克隆.innerHTML.trim();
    })
    .filter(句 => 句.length > 0);

  return 页.length > 0 ? 页 : [html];
}
