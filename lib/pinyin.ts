/**
 * 歌名首字母索引
 *
 * 预置曲库在 data/gem.json 中已标注 letter 字段（人工核对，100% 准确）。
 * 这里提供兜底算法，供未来接入真实歌单（QQ 音乐开放平台）时使用。
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** 常用汉字 → 拼音首字母（覆盖曲库与常见歌名用字） */
const CHAR_MAP: Record<string, string> = {
  阿: 'A', 爱: 'A', 安: 'A', 暗: 'A', 八: 'B', 白: 'B', 百: 'B', 半: 'B', 伴: 'B', 不: 'B', 别: 'B', 冰: 'B',
  才: 'C', 彩: 'C', 曾: 'C', 差: 'C', 长: 'C', 超: 'C', 沉: 'C', 城: 'C', 初: 'C', 春: 'C', 此: 'C', 从: 'C', 存: 'C',
  大: 'D', 大话: 'D', 代: 'D', 单: 'D', 但: 'D', 当: 'D', 倒: 'D', 到: 'D', 的: 'D', 等: 'D', 第: 'D', 电: 'D', 冬: 'D',
  都: 'D', 独: 'D', 多: 'D', 而: 'E', 二: 'E', 发: 'F', 反: 'F', 飞: 'F', 非: 'F', 分: 'F', 风: 'F', 疯: 'F', 复: 'F',
  改: 'G', 感: 'G', 高: 'G', 告: 'G', 歌: 'G', 给: 'G', 更: 'G', 宫: 'G', 光: 'G', 过: 'G', 孤: 'G', 故: 'G', 还: 'H',
  海: 'H', 好: 'H', 何: 'H', 和: 'H', 黑: 'H', 很: 'H', 红: 'H', 后: 'H', 花: 'H', 画: 'H', 化: 'H', 坏: 'H', 灰: 'H',
  回: 'H', 会: 'H', 火: 'H', 几: 'J', 记: 'J', 寂: 'J', 家: 'J', 见: 'J', 江: 'J', 将: 'J', 叫: 'J', 结: 'J', 今: 'J',
  金: 'J', 近: 'J', 就: 'J', 句: 'J', 绝: 'J', 开: 'K', 看: 'K', 空: 'K', 快: 'K', 来: 'L', 蓝: 'L', 老: 'L', 冷: 'L',
  离: 'L', 里: 'L', 力: 'L', 连: 'L', 两: 'L', 灵: 'L', 流: 'L', 龙: 'L', 旅: 'L', 落: 'L', 妈: 'M', 马: 'M', 慢: 'M',
  盲: 'M', 没: 'M', 每: 'M', 美: 'M', 梦: 'M', 迷: 'M', 秒: 'M', 明: 'M', 命: 'M', 摩: 'M', 默: 'M', 拿: 'N', 那: 'N',
  男: 'N', 难: 'N', 你: 'N', 年: 'N', 鸟: 'N', 暖: 'N', 偶: 'O', 怕: 'P', 拍: 'P', 泡: 'P', 陪: 'P', 朋: 'P', 平: 'P',
  破: 'P', 七: 'Q', 期: 'Q', 其: 'Q', 起: 'Q', 千: 'Q', 前: 'Q', 亲: 'Q', 青: 'Q', 轻: 'Q', 秋: 'Q', 去: 'Q', 全: 'Q',
  然: 'R', 让: 'R', 热: 'R', 人: 'R', 认: 'R', 日: 'R', 如: 'R', 三: 'S', 山: 'S', 上: 'S', 少: 'S', 深: 'S', 神: 'S',
  生: 'S', 声: 'S', 十: 'S', 时: 'S', 世: 'S', 是: 'S', 手: 'S', 首: 'S', 树: 'S', 双: 'S', 睡: 'S', 说: 'S', 死: 'S',
  他: 'T', 太: 'T', 谈: 'T', 天: 'T', 甜: 'T', 听: 'T', 停: 'T', 同: 'T', 透: 'T', 突: 'T', 外: 'W', 完: 'W', 晚: 'W',
  万: 'W', 王: 'W', 为: 'W', 未: 'W', 温: 'W', 我: 'W', 无: 'W', 五: 'W', 舞: 'W', 希: 'X', 喜: 'X', 下: 'X', 夏: 'X',
  先: 'X', 现: 'X', 相: 'X', 想: 'X', 小: 'X', 笑: 'X', 心: 'X', 新: 'X', 星: 'X', 行: 'X', 幸: 'X', 兄: 'X', 写: 'X',
  学: 'X', 雪: 'X', 呀: 'Y', 烟: 'Y', 岩: 'Y', 眼: 'Y', 演: 'Y', 阳: 'Y', 也: 'Y', 夜: 'Y', 一: 'Y', 依: 'Y', 以: 'Y',
  因: 'Y', 音: 'Y', 影: 'Y', 永: 'Y', 用: 'Y', 忧: 'Y', 由: 'Y', 有: 'Y', 又: 'Y', 雨: 'Y', 语: 'Y', 愿: 'Y', 月: 'Y',
  再: 'Z', 在: 'Z', 早: 'Z', 怎: 'Z', 张: 'Z', 找: 'Z', 这: 'Z', 真: 'Z', 整: 'Z', 只: 'Z', 中: 'Z', 重: 'Z', 周: 'Z',
  主: 'Z', 转: 'Z', 装: 'Z', 追: 'Z', 准: 'Z', 着: 'Z', 自: 'Z', 走: 'Z', 最: 'Z', 昨: 'Z', 左: 'Z', 做: 'Z',
};

const OTHER = '#';

/** 取一个字符的首字母 */
export function initialOfChar(ch: string): string {
  if (/[a-zA-Z]/.test(ch)) return ch.toUpperCase();
  if (CHAR_MAP[ch]) return CHAR_MAP[ch];
  return OTHER;
}

/** 取歌名的索引字母：优先用数据里标注的 letter */
export function letterOf(title: string, annotated?: string): string {
  if (annotated && annotated.length === 1) return annotated.toUpperCase();
  const first = title.trim().charAt(0);
  const letter = initialOfChar(first);
  return ALPHABET.includes(letter) ? letter : OTHER;
}

export const LETTERS = [...ALPHABET, OTHER];
