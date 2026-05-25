/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

const FIGMA_PLUGIN_URL = "https://www.figma.com/community/plugin/1545144879515549356/";

export default function Home() {
  return (
    <main
      className="relative h-svh min-h-[350px] overflow-hidden bg-[#050506] text-white"
      style={{
        backgroundImage: "url('/landing/hero-bg.png')",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% auto",
      }}
    >
      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1026px] flex-col px-5 sm:px-8">
        <header className="flex h-[clamp(52px,8.9vh,80px)] shrink-0 items-center justify-between">
          <Link className="flex items-center gap-[7px]" href="/" aria-label="Spectro home">
            <img
              alt=""
              className="h-7 w-7 rounded-[8px]"
              src="/landing/spectro-icon.png"
            />
            <span className="text-[17px] font-bold leading-none tracking-[-0.02em] text-white">
              SPECTRO
            </span>
          </Link>
          <a
            className="flex items-center gap-2 text-sm font-medium text-white/95 transition hover:text-white"
            href={FIGMA_PLUGIN_URL}
            target="_blank"
            rel="noreferrer"
          >
            <span>Figma Plugin</span>
            <img alt="" className="h-4 w-4" src="/landing/external-link.svg" />
          </a>
        </header>

        <section className="flex min-h-0 flex-1 flex-col items-center overflow-hidden pt-[clamp(10px,4.45vh,40px)]">
          <div className="flex w-full max-w-[600px] shrink-0 flex-col items-center gap-[clamp(16px,2.7vh,24px)] text-center">
            <div className="flex flex-col items-center gap-[clamp(8px,1.8vh,16px)]">
              <h1 className="whitespace-nowrap text-[clamp(26px,2.78vw,40px)] font-semibold leading-[1.18] tracking-[-0.025em] text-[#eef7ff] max-[680px]:whitespace-normal">
                Your Smart UI Color Solution
              </h1>
              <p className="max-w-[590px] text-[clamp(12px,0.98vw,14px)] font-normal leading-[1.58] text-white/92">
                Spectro generates balanced neutral and status colors for modern UI in seconds.
                <br className="hidden sm:block" />
                Create smarter palettes for light and dark mode directly in Figma.
              </p>
            </div>
            <a
              className="flex h-[44px] items-center justify-center gap-2 rounded-full bg-white py-2 pl-3 pr-5 text-sm font-semibold text-[#050506] shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition hover:scale-[1.015] hover:bg-white"
              href={FIGMA_PLUGIN_URL}
              target="_blank"
              rel="noreferrer"
            >
              <img alt="" className="h-7 w-7" src="/landing/figma-logo.svg" />
              <span>Get Figma Plugin</span>
            </a>
          </div>

          <div className="relative mt-[clamp(18px,5.2vh,47px)] h-[clamp(170px,58.3vh,525px)] w-full shrink-0">
            <div className="absolute left-[max(0px,calc(50%-447px))] top-[clamp(12px,2.7vh,24px)] h-full w-[min(43vw,439px)] min-w-[220px] overflow-hidden rounded-[14px] bg-[#2c2c2c] shadow-[0_24px_70px_rgba(0,0,0,0.42)] max-[720px]:left-[calc(50%-225px)] max-[720px]:w-[300px] max-[520px]:left-[calc(50%-188px)] max-[520px]:w-[250px]">
              <div className="flex h-[7.55%] min-h-[20px] items-center gap-[14px] border-b border-[#383838] bg-[#2c2c2c] px-[14px]">
                <img alt="" className="h-[25px] w-[25px] rounded-[7px]" src="/landing/spectro-icon.png" />
                <span className="text-[11px] font-medium leading-none text-white">
                  Spectro
                </span>
              </div>
              <div className="relative h-[102.75%] overflow-hidden">
                <img
                  alt="Spectro neutral color generator interface"
                  className="absolute left-[-14.4%] top-[-14.7%] h-[124%] max-w-none object-cover"
                  src="/landing/neutral-panel.png"
                />
              </div>
              <div className="pointer-events-none absolute inset-x-[-8%] bottom-0 h-[45%] bg-gradient-to-b from-[#05050600] to-[#050506]" />
            </div>

            <div className="absolute left-[min(calc(50%+8px),calc(100%-439px))] top-0 h-full w-[min(43vw,439px)] min-w-[220px] overflow-hidden rounded-[14px] bg-[#2c2c2c] shadow-[-60px_20px_30px_rgba(0,0,0,0.6)] max-[720px]:left-[calc(50%-10px)] max-[720px]:w-[300px] max-[520px]:left-[calc(50%-2px)] max-[520px]:w-[250px]">
              <div className="flex h-[7.55%] min-h-[20px] items-center gap-[14px] border-b border-[#383838] bg-[#2c2c2c] px-[14px]">
                <img alt="" className="h-[25px] w-[25px] rounded-[7px]" src="/landing/spectro-icon.png" />
                <span className="text-[11px] font-medium leading-none text-white">
                  Spectro
                </span>
              </div>
              <div className="relative aspect-[486/599] w-full overflow-hidden">
                <img
                  alt="Spectro status palette generator interface"
                  className="absolute left-[-15.8%] top-[-16.2%] h-[126%] max-w-none object-cover"
                  src="/landing/status-panel.png"
                />
              </div>
              <div className="pointer-events-none absolute inset-x-[-8%] bottom-0 h-[45%] bg-gradient-to-b from-[#05050600] to-[#050506]" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
