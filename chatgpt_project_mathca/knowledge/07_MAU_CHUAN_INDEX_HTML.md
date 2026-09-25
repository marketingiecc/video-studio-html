# 07. MÃ NGUỒN MẪU CHUẨN INDEX.HTML (HYPERFRAMES + GSAP)

Đây là bản mẫu HTML5/CSS/GSAP hoàn chỉnh, đã được kiểm thử render thực tế 100% không lỗi. ChatGPT sẽ dùng cấu trúc này và thay đổi nội dung, bài toán và thời gian cho phù hợp với kịch bản mới.

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>MathCA - Video Giáo Dục Toán Hoạt Hình</title>
    <!-- GSAP CDN hoặc file assets/gsap.min.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      :root {
        --teal-primary: #12aba0;
        --teal-dark: #006a63;
        --teal-soft: #e6f7f6;
        --coral-red: #ff5239;
        --coral-dark: #b91e0c;
        --yellow-vibrant: #ffbd05;
        --yellow-light: #fff8e1;
        --navy-dark: #1a1c1c;
        --navy-muted: #3c4947;
        --surface-white: #ffffff;
        --bg-soft: #fbfbf9;
      }
      html, body {
        margin: 0; width: 1080px; height: 1920px; overflow: hidden;
        background-color: var(--bg-soft);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; background: var(--bg-soft); }
      .bg-container {
        position: absolute; inset: 0; width: 100%; height: 100%;
        background-color: #fbfbf9;
        background-image: 
          radial-gradient(#12aba0 2px, transparent 2px),
          radial-gradient(#ffbd05 1.5px, transparent 1.5px);
        background-size: 40px 40px, 80px 80px;
        background-position: 0 0, 20px 20px;
        opacity: 0.85; z-index: 1;
      }
      .math-symbol-watermark {
        position: absolute; font-weight: 900; color: rgba(18, 171, 160, 0.08); user-select: none; pointer-events: none; z-index: 2;
      }
      .header-wrapper {
        position: absolute; top: 75px; left: 0; width: 100%; display: flex; flex-direction: column; align-items: center; z-index: 10;
      }
      .logo-brand { height: 110px; margin-bottom: 20px; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.06)); }
      .header-top-tag {
        background: var(--coral-red); color: #ffffff; font-size: 30px; font-weight: 800; padding: 10px 40px; border-radius: 9999px; letter-spacing: 0.04em; box-shadow: 0 10px 24px rgba(255, 82, 57, 0.35); text-transform: uppercase;
      }
      .stage-card {
        position: absolute; top: 380px; left: 70px; width: 940px; height: 1080px; background: var(--surface-white); border-radius: 40px; box-shadow: 0 20px 50px rgba(18, 171, 160, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04); border: 2.5px solid rgba(18, 171, 160, 0.18); z-index: 10; overflow: hidden;
      }
      .stage-scene {
        position: absolute; inset: 0; padding: 40px 36px; display: flex; flex-direction: column; align-items: center; justify-content: center;
      }
      .step-badge {
        font-size: 32px; font-weight: 800; padding: 12px 40px; border-radius: 9999px; margin-bottom: 28px; display: inline-flex; align-items: center; gap: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.08);
      }
      .step-badge.yellow { background: var(--yellow-vibrant); color: var(--navy-dark); }
      .step-badge.teal { background: var(--teal-primary); color: #ffffff; }
      .step-badge.coral { background: var(--coral-red); color: #ffffff; }

      /* Hook elements */
      .hook-container { display: flex; flex-direction: column; align-items: center; width: 100%; gap: 18px; }
      .hook-kicker-badge {
        background: linear-gradient(135deg, #ffbd05, #f59e0b); color: var(--navy-dark); font-size: 28px; font-weight: 900; padding: 10px 36px; border-radius: 9999px; text-transform: uppercase; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.35); display: inline-flex; align-items: center; gap: 12px;
      }
      .hook-title-box { text-align: center; display: flex; flex-direction: column; align-items: center; margin-top: 6px; }
      .title-line-main { font-size: 96px; font-weight: 900; color: var(--teal-dark); line-height: 1.05; letter-spacing: -0.02em; text-shadow: 0 6px 20px rgba(0, 106, 99, 0.2); }
      .title-line-highlight { font-size: 90px; font-weight: 900; color: var(--coral-red); line-height: 1.1; margin-top: 10px; letter-spacing: -0.01em; text-shadow: 0 8px 26px rgba(255, 82, 57, 0.35); }
      .hook-vs-card {
        width: 840px; background: #f8fcfb; border: 2.5px solid #c9eee9; border-radius: 28px; padding: 20px 28px; box-shadow: 0 10px 24px rgba(18, 171, 160, 0.1); display: flex; align-items: center; justify-content: space-between; margin-top: 8px;
      }
      .vs-box { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }
      .vs-box.target { background: #e6f7f6; border: 2.5px solid var(--teal-primary); border-radius: 20px; padding: 10px 14px; box-shadow: 0 6px 16px rgba(18, 171, 160, 0.18); }
      .vs-tag { font-size: 20px; font-weight: 900; padding: 4px 16px; border-radius: 9999px; }
      .vs-tag.red { background: #ffebe8; color: var(--coral-red); }
      .vs-tag.teal { background: var(--teal-primary); color: #ffffff; }
      .vs-time { font-size: 38px; font-weight: 900; }
      .vs-time.red { color: var(--coral-red); }
      .vs-time.teal { color: var(--teal-dark); }
      .vs-desc { font-size: 21px; font-weight: 700; color: var(--navy-muted); }
      .vs-sep-circle { font-size: 24px; font-weight: 900; color: var(--navy-muted); background: #e8efee; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 10px; }
      .hook-bottom-card {
        margin-top: 8px; width: 840px; background: linear-gradient(135deg, #fffcf5, #fff8e8); border: 2.5px dashed var(--yellow-vibrant); border-radius: 24px; padding: 16px 24px; display: flex; align-items: center; justify-content: center; gap: 14px;
      }
      .hook-bottom-text { font-size: 28px; font-weight: 800; color: #946200; text-align: center; }

      /* Math tiles */
      .equation-display { display: flex; align-items: center; justify-content: center; gap: 22px; margin-top: 20px; }
      .num-tile {
        font-size: 104px; font-weight: 900; color: var(--navy-dark); background: #f4fdfc; border: 4px solid #bcece8; border-radius: 30px; width: 165px; height: 185px; display: flex; align-items: center; justify-content: center; box-shadow: 0 14px 28px rgba(18, 171, 160, 0.16);
      }
      .num-tile.coral { background: #fff4f2; border-color: #ffd0c9; color: var(--coral-red); }
      .num-tile.yellow { background: #fffdf0; border-color: #ffe699; color: #b78103; }
      .op-sign { font-size: 72px; font-weight: 800; color: var(--navy-muted); }
      .warning-card { margin-top: 40px; background: #fff5f3; border: 2px solid #ffd4cc; border-radius: 24px; padding: 18px 40px; display: flex; align-items: center; gap: 16px; }
      .warning-text { font-size: 32px; font-weight: 800; color: var(--coral-red); }

      /* Step slots */
      .split-stage { display: flex; align-items: center; justify-content: center; gap: 30px; margin-top: 30px; width: 100%; }
      .slot-box {
        width: 160px; height: 190px; border-radius: 32px; display: flex; align-items: center; justify-content: center; font-size: 116px; font-weight: 900;
      }
      .slot-box.num-left, .slot-box.num-right { background: #e6f7f6; color: var(--teal-dark); border: 4px solid var(--teal-primary); box-shadow: 0 14px 28px rgba(18, 171, 160, 0.2); }
      .slot-box.num-middle { background: #fff8e1; border: 4px dashed var(--yellow-vibrant); color: #b78103; }
      .calc-pill {
        background: #fff0ed; border: 3.5px solid #ffb5aa; color: var(--coral-red); font-size: 52px; font-weight: 900; padding: 14px 48px; border-radius: 9999px; display: flex; align-items: center; gap: 18px; box-shadow: 0 12px 28px rgba(255, 82, 57, 0.2);
      }
      .big-answer { font-size: 148px; font-weight: 900; color: var(--teal-dark); letter-spacing: 0.04em; text-shadow: 0 8px 24px rgba(18, 171, 160, 0.25); }
      .speed-badge { background: linear-gradient(135deg, #ffbd05, #f59e0b); color: var(--navy-dark); font-size: 34px; font-weight: 900; padding: 14px 44px; border-radius: 9999px; margin-top: 20px; box-shadow: 0 10px 24px rgba(245, 158, 11, 0.35); }

      /* Quiz */
      .quiz-card { background: #fffcf0; border: 3px solid #ffdd80; border-radius: 32px; padding: 36px 40px; display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; box-shadow: 0 12px 30px rgba(255, 189, 5, 0.18); }
      .quiz-title { font-size: 32px; font-weight: 700; color: #855700; }
      .quiz-equation { font-size: 76px; font-weight: 900; color: var(--teal-dark); }

      /* Mascot & Bubble */
      .mascot-stage-box { position: absolute; bottom: 220px; right: 40px; width: 320px; z-index: 25; }
      .mascot-stage-box img { width: 100%; height: auto; filter: drop-shadow(0 12px 24px rgba(0,0,0,0.12)); }
      .speech-bubble {
        position: absolute; bottom: 520px; right: 260px; background: #ffffff; color: var(--navy-dark); border: 3px solid var(--teal-primary); border-radius: 24px; border-bottom-right-radius: 4px; padding: 16px 28px; font-size: 28px; font-weight: 800; box-shadow: 0 10px 25px rgba(18, 171, 160, 0.2); z-index: 30;
      }

      /* Footer CTA & Cursor */
      .footer-wrapper { position: absolute; bottom: 65px; left: 0; width: 100%; display: flex; flex-direction: column; align-items: center; z-index: 20; }
      .cta-button {
        background: linear-gradient(135deg, #ff5239, #e0321a); color: #ffffff; font-size: 38px; font-weight: 900; padding: 18px 60px; border-radius: 9999px; letter-spacing: 0.04em; box-shadow: 0 12px 30px rgba(255, 82, 57, 0.45); display: inline-flex; align-items: center; gap: 16px;
      }
      .footer-brand-text { font-size: 22px; font-weight: 700; color: var(--navy-muted); margin-top: 14px; letter-spacing: 0.05em; }
      .click-cursor { position: absolute; bottom: 95px; left: 680px; width: 64px; height: 64px; z-index: 50; pointer-events: none; }
      .click-cursor svg { width: 100%; height: 100%; filter: drop-shadow(2px 6px 10px rgba(0,0,0,0.35)); }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="29.5" data-width="1080" data-height="1920">
      <div class="bg-container"></div>
      <div class="math-symbol-watermark" style="top: 230px; left: 60px; font-size: 140px;">×</div>
      <div class="math-symbol-watermark" style="top: 320px; right: 80px; font-size: 120px;">+</div>

      <!-- Audio Track -->
      <audio id="soundtrack" class="clip" src="assets/audio.mp3" data-start="0" data-duration="29.5" data-track-index="0" data-volume="1"></audio>

      <!-- Header -->
      <div class="header-wrapper">
        <img class="logo-brand" src="assets/logo.png" alt="MathCA Logo" />
        <div class="header-top-tag">HỆ THỐNG GIÁO DỤC TOÁN MATHCA</div>
      </div>

      <!-- Stage Card -->
      <div id="stage" class="stage-card">
        <!-- Scene 1: Hook -->
        <div id="scene-hook" class="stage-scene">
          <div class="hook-container">
            <div id="hook-kicker" class="hook-kicker-badge"><span>⚡</span><span>MẸO TOÁN LỚP 3</span><span>⚡</span></div>
            <div class="hook-title-box">
              <div id="hook-title-1" class="title-line-main">NHÂN VỚI 11</div>
              <div id="hook-title-2" class="title-line-highlight">CHỈ MẤT 2 GIÂY! ⚡</div>
            </div>
            <div id="hook-vs-box" class="hook-vs-card">
              <div class="vs-box"><span class="vs-tag red">CÁCH CŨ</span><span class="vs-time red">⏳ 60 GIÂY</span><span class="vs-desc">Đặt tính dọc rối mắt</span></div>
              <div class="vs-sep-circle">VS</div>
              <div class="vs-box target"><span class="vs-tag teal">MẸO MATHCA</span><span class="vs-time teal">⚡ 2 GIÂY</span><span class="vs-desc">Nhìn là ra đáp án!</span></div>
            </div>
            <div id="hook-bottom" class="hook-bottom-card"><span style="font-size: 32px;">🚀</span><span class="hook-bottom-text">Bí quyết tính nhẩm siêu tốc — Không cần nháp!</span></div>
          </div>
        </div>

        <!-- Scene 2: Vídụ -->
        <div id="scene-vidu" class="stage-scene" style="opacity: 0;">
          <div class="step-badge teal">BÀI TOÁN TÍNH NHANH</div>
          <div class="equation-display">
            <div id="tile-35" class="num-tile" style="width: 185px;">35</div>
            <div id="op-mult" class="op-sign">×</div>
            <div id="tile-11" class="num-tile coral">11</div>
            <div id="op-eq" class="op-sign">=</div>
            <div id="tile-q" class="num-tile yellow">?</div>
          </div>
          <div class="warning-card"><span style="font-size: 36px;">⚠️</span><span class="warning-text">Đừng vội lấy giấy bút đặt tính nhé!</span></div>
        </div>

        <!-- Scene 3: Bước 1 -->
        <div id="scene-buoc1" class="stage-scene" style="opacity: 0;">
          <div class="step-badge yellow">BƯỚC 1: TÁCH ĐÔI SỐ 35</div>
          <div style="font-size: 34px; font-weight: 600; color: var(--navy-muted); margin-bottom: 10px;">Viết số 3 sang trái, số 5 sang phải:</div>
          <div class="split-stage">
            <div id="slot-left" class="slot-box num-left">3</div>
            <div id="slot-mid-empty" class="slot-box num-middle">?</div>
            <div id="slot-right" class="slot-box num-right">5</div>
          </div>
        </div>

        <!-- Scene 4: Bước 2 -->
        <div id="scene-buoc2" class="stage-scene" style="opacity: 0;">
          <div class="step-badge coral">BƯỚC 2: CỘNG LẠI NHÉT VÀO GIỮA</div>
          <div class="addition-indicator">
            <div id="calc-badge" class="calc-pill"><span>3</span><span>+</span><span>5</span><span>=</span><span style="font-size: 64px; font-weight: 900; color: var(--yellow-vibrant);">8</span></div>
          </div>
          <div class="split-stage" style="margin-top: 40px;">
            <div class="slot-box num-left">3</div>
            <div id="slot-mid-filled" class="slot-box num-middle" style="background: #fff2cc; border-style: solid; color: #b78103;">8</div>
            <div class="slot-box num-right">5</div>
          </div>
        </div>

        <!-- Scene 5: Kết quả -->
        <div id="scene-ketqua" class="stage-scene" style="opacity: 0;">
          <div class="step-badge teal">KẾT QUẢ SIÊU TỐC</div>
          <div style="font-size: 52px; font-weight: 800; color: var(--navy-muted); margin-top: 10px;">35 × 11 =</div>
          <div class="result-hero-box"><div id="final-answer" class="big-answer">385</div><div class="speed-badge">⚡ CHỈ MẤT ĐÚNG 2 GIÂY!</div></div>
        </div>

        <!-- Scene 6: Thử thách -->
        <div id="scene-thuthach" class="stage-scene" style="opacity: 0;">
          <div class="step-badge yellow">THỬ THÁCH CHO BẠN</div>
          <div class="quiz-card"><div class="quiz-title">Áp dụng mẹo trên, tính nhanh:</div><div class="quiz-equation">42 × 11 = ?</div></div>
          <div style="margin-top: 30px; font-size: 34px; color: var(--coral-red); font-weight: 900;">👇 Hãy bình luận ngay đáp án nhé!</div>
        </div>
      </div>

      <!-- Mascot & Bubble -->
      <div id="mascot-wrapper" class="mascot-stage-box"><img src="assets/mascot.png" alt="Mascot" /></div>
      <div id="bubble" class="speech-bubble">Đừng đặt tính vội nhé! 🦉</div>

      <!-- Footer CTA -->
      <div class="footer-wrapper"><div id="cta-btn" class="cta-button"><span>FOLLOW MATHCA</span><span>✨</span></div><div class="footer-brand-text">HỆ THỐNG GIÁO DỤC TOÁN MATHCA</div></div>

      <!-- Cursor -->
      <div id="cursor" class="click-cursor">
        <svg viewBox="0 0 24 24" fill="none"><path d="M3 3L10.07 20.97L12.58 13.58L19.97 11.07L3 3Z" fill="white" stroke="#1a1c1c" stroke-width="2.5" stroke-linejoin="round"/></svg>
      </div>
    </div>

    <!-- GSAP Animation Master Timeline -->
    <script>
      window.__timelines = window.__timelines || {};
      gsap.set("#stage", { scale: 0.95, opacity: 0 });
      gsap.set(".header-wrapper", { y: -50, opacity: 0 });
      gsap.set("#mascot-wrapper", { x: 100, opacity: 0 });
      gsap.set("#bubble", { scale: 0, opacity: 0 });
      gsap.set("#cursor", { opacity: 0 });
      gsap.set("#scene-hook", { opacity: 1 });
      gsap.set("#scene-vidu, #scene-buoc1, #scene-buoc2, #scene-ketqua, #scene-thuthach", { opacity: 0, pointerEvents: "none" });

      const tl = gsap.timeline({ paused: true });

      // BEAT 1: HOOK (0s - 4.2s)
      tl.to(".header-wrapper", { y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.5)" }, 0.05);
      tl.to("#stage", { scale: 1, opacity: 1, duration: 0.45, ease: "power3.out" }, 0.1);
      tl.to("#mascot-wrapper", { x: 0, opacity: 1, duration: 0.5, ease: "back.out(1.6)" }, 0.18);
      tl.from("#hook-kicker", { scale: 0.3, opacity: 0, duration: 0.3, ease: "back.out(2.2)" }, 0.25);
      tl.from("#hook-title-1", { scale: 0.25, y: 35, opacity: 0, duration: 0.45, ease: "back.out(2.4)" }, 0.45);
      tl.from("#hook-title-2", { scale: 0.25, y: 35, opacity: 0, duration: 0.45, ease: "back.out(2.4)" }, 0.75);
      tl.from("#hook-vs-box", { scale: 0.8, y: 30, opacity: 0, duration: 0.4, ease: "back.out(1.8)" }, 1.05);
      tl.from("#hook-bottom", { y: 20, opacity: 0, duration: 0.35, ease: "power2.out" }, 1.35);
      tl.to("#hook-title-2", { scale: 1.06, duration: 0.28, yoyo: true, repeat: 5, ease: "sine.inOut" }, 1.5);
      tl.to("#mascot-wrapper", { y: -18, duration: 0.45, yoyo: true, repeat: 4, ease: "sine.inOut" }, 0.8);

      // BEAT 2: BÀI TOÁN (4.2s - 9.0s)
      tl.to("#scene-hook", { opacity: 0, duration: 0.25 }, 4.1);
      tl.to("#scene-vidu", { opacity: 1, duration: 0.35, ease: "power2.out" }, 4.35);
      tl.from("#tile-35", { scale: 0.3, opacity: 0, duration: 0.3, ease: "back.out(2)" }, 4.55);
      tl.from("#op-mult", { scale: 0, opacity: 0, duration: 0.2, ease: "back.out(2)" }, 4.7);
      tl.from("#tile-11", { scale: 0.3, opacity: 0, duration: 0.3, ease: "back.out(2)" }, 4.85);
      tl.from("#op-eq", { scale: 0, opacity: 0, duration: 0.2, ease: "back.out(2)" }, 5.0);
      tl.from("#tile-q", { scale: 0.2, opacity: 0, rotation: -12, duration: 0.35, ease: "back.out(2.5)" }, 5.15);
      tl.to("#bubble", { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.0)" }, 5.8);
      tl.to("#bubble", { scale: 0, opacity: 0, duration: 0.3, ease: "power2.in" }, 8.3);

      // BEAT 3: BƯỚC 1 (9.0s - 13.0s)
      tl.to("#scene-vidu", { opacity: 0, duration: 0.25 }, 8.9);
      tl.to("#scene-buoc1", { opacity: 1, duration: 0.35, ease: "power2.out" }, 9.15);
      tl.from("#slot-left", { x: 80, duration: 0.55, ease: "back.out(1.7)" }, 9.35);
      tl.from("#slot-right", { x: -80, duration: 0.55, ease: "back.out(1.7)" }, 9.55);
      tl.from("#slot-mid-empty", { scale: 0, duration: 0.45, ease: "back.out(2.2)" }, 9.9);

      // BEAT 4: BƯỚC 2 (13.0s - 17.4s)
      tl.to("#scene-buoc1", { opacity: 0, duration: 0.25 }, 12.9);
      tl.to("#scene-buoc2", { opacity: 1, duration: 0.35, ease: "power2.out" }, 13.15);
      tl.from("#calc-badge", { scale: 0.6, opacity: 0, y: -20, duration: 0.5, ease: "back.out(2.0)" }, 13.35);
      tl.from("#slot-mid-filled", { y: -100, scale: 0.2, duration: 0.6, ease: "bounce.out" }, 14.8);

      // BEAT 5: KẾT QUẢ (17.4s - 22.4s)
      tl.to("#scene-buoc2", { opacity: 0, duration: 0.25 }, 17.3);
      tl.to("#scene-ketqua", { opacity: 1, duration: 0.35, ease: "power2.out" }, 17.55);
      tl.from("#final-answer", { scale: 0.3, opacity: 0, duration: 0.55, ease: "back.out(2.2)" }, 17.7);
      tl.from(".speed-badge", { y: 20, opacity: 0, duration: 0.4, ease: "back.out(1.8)" }, 18.5);
      tl.to("#mascot-wrapper", { y: -50, rotation: -5, duration: 0.3, yoyo: true, repeat: 3, ease: "power2.out" }, 18.2);

      // BEAT 6: THỬ THÁCH (22.4s - 29.5s)
      tl.to("#scene-ketqua", { opacity: 0, duration: 0.25 }, 22.3);
      tl.to("#scene-thuthach", { opacity: 1, duration: 0.35, ease: "power2.out" }, 22.55);
      tl.from(".quiz-card", { scale: 0.8, opacity: 0, duration: 0.5, ease: "back.out(1.6)" }, 22.75);
      tl.fromTo("#cursor", { opacity: 0, x: 250, y: 120 }, { opacity: 1, x: 0, y: 0, duration: 0.6, ease: "power3.out" }, 25.5);
      tl.to("#cursor", { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 }, 26.5);
      tl.to("#cta-btn", { scale: 0.94, duration: 0.1, yoyo: true, repeat: 1 }, 26.5);

      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
```
