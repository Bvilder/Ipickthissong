import Link from 'next/link';

export default function About() {
  return (
    <main className="mx-auto min-h-screen max-w-[430px] px-6 py-8 safe-bottom">
      <Link href="/" className="text-xs text-white/45">
        ← 返回
      </Link>

      <h1 className="mt-8 text-3xl font-black">关于本产品</h1>

      <section className="mt-6 space-y-4 text-sm leading-7 text-white/70">
        <p>
          「我选这首歌」是一个基于<b className="text-white">歌曲元数据</b>的音乐人格选择游戏。
          从 32 首歌里做 31 次二选一，系统根据你的选择路径生成六维音乐人格卡，并支持好友挑战对比默契度。
        </p>
      </section>

      <section className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-base font-black text-white">合规声明</h2>
        <p className="mt-3 text-sm leading-7 text-white/65">
          本产品仅调用歌曲元数据（歌名、歌手、专辑、年份、流派、标签）用于互动选择游戏，
          <b className="text-white">不提供音乐播放、下载或缓存功能</b>，不包含任何音频文件。
          所有音频收听行为均跳转至 QQ 音乐官方平台完成。
        </p>
      </section>

      <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-base font-black text-white">数据与 AI 说明</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-white/60">
          <li>· 当前曲库为演示用预置元数据，接入 QQ 音乐开放平台后将替换为官方数据。</li>
          <li>· 专辑封面为程序生成的视觉占位图，非官方封面。</li>
          <li>
            · 人格结果由本地规则引擎实时计算，完全取决于你的 31 次选择；配置大模型密钥后会自动切换为
            AI 生成。
          </li>
          <li>· 挑战链接只编码歌曲 id 与选择结果，不含任何个人信息或音频。</li>
        </ul>
      </section>

      <p className="mt-8 text-center text-xs text-white/30">腾讯音乐 AI Hackathon · 创新音乐产品方向</p>
    </main>
  );
}
