# 07. MÃ NGUỒN MẪU CHUẨN HTML_TEMPLATE (HYPERFRAMES + GSAP CHO STUDIO PRO)

Đây là bản mẫu HTML5/CSS/GSAP hoàn chỉnh, tương thích 100% với `composition-generator.js` của MathCA Video Studio Pro. ChatGPT sẽ nhúng đoạn mã này vào trường `html_template` trong JSON khi xuất bản kịch bản cho người dùng.

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>MathCA Video - Mẹo Toán Học Siêu Tốc</title>
    <!-- GSAP nhúng cục bộ cho Studio Pro offline -->
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face {
        font-family: 'Inter';
        src: url('assets/fonts/Inter-Regular.otf') format('opentype');
        font-weight: 400;
      }
      @font-face {
        font-family: 'Inter';
        src: url('assets/fonts/Inter-Bold.otf') format('opentype');
        font-weight: 700;
      }
      @font-face {
        font-family: 'Inter';
        src: url('assets/fonts/Inter-Black.otf') format('opentype');
        font-weight: 900;
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }
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
        margin: 0;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background: var(--bg-soft);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      #root {
        position: relative;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background: var(--bg-soft);
      }

      /* Họa tiết chấm bi hoạt hình MathCA */
      .bg-container {
        position: absolute;
        inset: 0;
        width: 1080px;
        height: 1920px;
        background-color: #fbfbf9;
        background-image: 
          radial-gradient(#12aba0 2px, transparent 2px),
          radial-gradient(#ffbd05 1.5px, transparent 1.5px);
        background-size: 40px 40px, 80px 80px;
        opacity: 0.85;
        z-index: 1;
      }

      /* Header Logo & Top Tag */
      .header-wrapper {
        position: absolute;
        top: 75px;
        left: 0;
        width: 1080px;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 10;
      }
      .logo-brand {
        height: 110px;
        margin-bottom: 20px;
        filter: drop-shadow(0 8px 16px rgba(0,0,0,0.06));
      }
      .header-top-tag {
        background: var(--coral-red);
        color: #ffffff;
        font-size: 30px;
        font-weight: 800;
        padding: 10px 40px;
        border-radius: 9999px;
        letter-spacing: 0.04em;
        box-shadow: 0 10px 24px rgba(255, 82, 57, 0.35);
        text-transform: uppercase;
      }

      /* Stage Card trung tâm (940x1080px) */
      .stage-card {
        position: absolute;
        top: 380px;
        left: 70px;
        width: 940px;
        height: 1080px;
        background: var(--surface-white);
        border-radius: 40px;
        box-shadow: 0 20px 50px rgba(18, 171, 160, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04);
        border: 2.5px solid rgba(18, 171, 160, 0.18);
        overflow: hidden;
        z-index: 10;
      }

      /* Phân cảnh bài toán */
      .stage-scene {
        position: absolute;
        inset: 0;
        padding: 40px 36px;
        opacity: 0;
        visibility: hidden;
      }
      .stage-scene.is-active {
        opacity: 1;
        visibility: visible;
      }

      /* Lớp đối tượng đồ họa MathCA Studio */
      .mathca-element {
        position: absolute;
        white-space: pre-wrap;
      }
      .mathca-text {
        font-weight: 900;
        line-height: 1.1;
        text-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
      }
      .mathca-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 36px;
        border-radius: 9999px;
        background: var(--yellow-vibrant);
        color: var(--navy-dark);
        font-weight: 900;
        letter-spacing: 0.04em;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        white-space: nowrap;
      }
      .mathca-card {
        padding: 22px 28px;
        border: 2.5px solid #c9eee9;
        border-radius: 28px;
        background: #f8fcfb;
        color: var(--teal-dark);
        font-weight: 800;
        text-align: center;
        box-shadow: 0 10px 24px rgba(18, 171, 160, 0.12);
      }
      .mathca-equation {
        padding: 18px 28px;
        border: 3px solid var(--teal-primary);
        border-radius: 24px;
        background: var(--teal-soft);
        color: var(--navy-dark);
        font-weight: 900;
        text-align: center;
      }
      .mathca-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 14px 40px;
        border-radius: 9999px;
        background: linear-gradient(135deg, var(--teal-primary), var(--teal-dark));
        color: #ffffff;
        font-weight: 900;
        box-shadow: 0 10px 24px rgba(0, 106, 99, 0.3);
      }
      .mathca-slots {
        display: flex;
        gap: 20px;
        justify-content: center;
        align-items: center;
      }
      .mathca-slots span {
        display: flex;
        width: 180px;
        height: 180px;
        align-items: center;
        justify-content: center;
        border: 4px solid var(--teal-primary);
        border-radius: 28px;
        background: var(--teal-soft);
        color: var(--teal-dark);
        font-size: inherit;
        font-weight: 900;
        box-shadow: 0 12px 24px rgba(18, 171, 160, 0.18);
      }
      .line-break {
        display: block;
        height: 0.28em;
      }

      /* Mascot Cú con */
      .mascot-stage-box {
        position: absolute;
        left: 720px;
        top: 1380px;
        width: 320px;
        z-index: 25;
      }
      .mascot-stage-box img {
        width: 100%;
        filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.12));
      }

      /* Nút CTA Follow */
      .cta-button {
        position: absolute;
        left: 230px;
        top: 1720px;
        z-index: 20;
        padding: 18px 60px;
        border-radius: 9999px;
        background: linear-gradient(135deg, #ff5239, #e02e16);
        color: #ffffff;
        font-size: 38px;
        font-weight: 900;
        box-shadow: 0 12px 30px rgba(255, 82, 57, 0.45);
        white-space: nowrap;
      }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="29.5"
      data-width="1080"
      data-height="1920"
    >
      <div class="bg-container"></div>
      
      <!-- Audio Soundtrack clip -->
      <audio
        id="soundtrack"
        class="clip"
        src="assets/audio.mp3"
        data-start="0"
        data-duration="29.5"
        data-track-index="0"
        data-volume="1"
      ></audio>

      <!-- Global Header -->
      <div id="elem-header-brand" data-hf-id="elem-header-brand" class="header-wrapper">
        <img class="logo-brand" src="assets/logo.png" alt="MathCA Logo" />
        <div class="header-top-tag">HỆ THỐNG GIÁO DỤC TOÁN MATHCA</div>
      </div>

      <!-- Stage Card trung tâm -->
      <div id="stage" class="stage-card">
        <!-- Scene 1: Hook -->
        <section id="scene-hook" data-hf-id="scene-hook" class="stage-scene is-active">
          <div id="hook-kicker" data-hf-id="hook-kicker" class="mathca-element mathca-badge" style="left:260px;top:60px;font-size:28px;background:#ffbd05;color:#1a1c1c;z-index:101;">⚡ MẸO TOÁN LỚP 3 ⚡</div>
          <div id="hook-title-1" data-hf-id="hook-title-1" class="mathca-element mathca-text" style="left:160px;top:150px;font-size:96px;color:#006a63;z-index:102;">NHÂN VỚI 11</div>
          <div id="hook-title-2" data-hf-id="hook-title-2" class="mathca-element mathca-text" style="left:90px;top:265px;font-size:90px;color:#ff5239;z-index:103;">CHỈ MẤT 2 GIÂY! ⚡</div>
          <div id="hook-vs-box" data-hf-id="hook-vs-box" class="mathca-element mathca-card" style="left:50px;top:410px;width:840px;font-size:32px;z-index:104;">CÁCH CŨ: 60 GIÂY vs MẸO MATHCA: 2 GIÂY</div>
          <div id="hook-bottom" data-hf-id="hook-bottom" class="mathca-element mathca-card" style="left:50px;top:650px;width:840px;font-size:30px;color:#946200;border:2.5px dashed #ffbd05;background:#fffdf5;z-index:105;">🚀 Bí quyết tính nhẩm siêu tốc — Không cần nháp!</div>
        </section>

        <!-- Scene 2: Đặt bài toán -->
        <section id="scene-vidu" data-hf-id="scene-vidu" class="stage-scene">
          <div id="badge-vidu" data-hf-id="badge-vidu" class="mathca-element mathca-badge" style="left:260px;top:60px;font-size:32px;background:#12aba0;color:#ffffff;z-index:101;">BÀI TOÁN TÍNH NHANH</div>
          <div id="equation-display" data-hf-id="equation-display" class="mathca-element mathca-equation" style="left:150px;top:240px;width:640px;font-size:76px;z-index:102;">35 × 11 = ?</div>
          <div id="warning-card" data-hf-id="warning-card" class="mathca-element mathca-card" style="left:90px;top:520px;width:760px;font-size:32px;color:#ff5239;border-color:#ffd4cc;background:#fff5f3;z-index:103;">⚠️ Đừng vội lấy giấy bút đặt tính nhé!</div>
        </section>

        <!-- Scene 3: Bước 1 -->
        <section id="scene-buoc1" data-hf-id="scene-buoc1" class="stage-scene">
          <div id="badge-buoc1" data-hf-id="badge-buoc1" class="mathca-element mathca-badge" style="left:220px;top:60px;font-size:32px;background:#ffbd05;color:#1a1c1c;z-index:101;">BƯỚC 1: TÁCH ĐÔI SỐ 35</div>
          <div id="split-stage" data-hf-id="split-stage" class="mathca-element mathca-slots" style="left:120px;top:300px;font-size:88px;z-index:102;"><span>3</span><span>?</span><span>5</span></div>
        </section>

        <!-- Scene 4: Bước 2 -->
        <section id="scene-buoc2" data-hf-id="scene-buoc2" class="stage-scene">
          <div id="badge-buoc2" data-hf-id="badge-buoc2" class="mathca-element mathca-badge" style="left:160px;top:60px;font-size:32px;background:#ff5239;color:#ffffff;z-index:101;">BƯỚC 2: CỘNG NHÉT GIỮA</div>
          <div id="calc-pill" data-hf-id="calc-pill" class="mathca-element mathca-pill" style="left:270px;top:230px;font-size:48px;z-index:102;">3 + 5 = 8</div>
          <div id="split-filled" data-hf-id="split-filled" class="mathca-element mathca-slots" style="left:120px;top:450px;font-size:88px;z-index:103;"><span>3</span><span style="background:#fff8e1;border-color:#ffbd05;color:#b78103;">8</span><span>5</span></div>
        </section>

        <!-- Scene 5: Kết quả siêu tốc -->
        <section id="scene-ketqua" data-hf-id="scene-ketqua" class="stage-scene">
          <div id="badge-ketqua" data-hf-id="badge-ketqua" class="mathca-element mathca-badge" style="left:260px;top:60px;font-size:32px;background:#12aba0;color:#ffffff;z-index:101;">KẾT QUẢ SIÊU TỐC</div>
          <div id="final-answer" data-hf-id="final-answer" class="mathca-element mathca-text" style="left:290px;top:240px;font-size:148px;color:#006a63;z-index:102;">385</div>
          <div id="speed-badge" data-hf-id="speed-badge" class="mathca-element mathca-badge" style="left:210px;top:500px;font-size:34px;background:#ffbd05;color:#1a1c1c;z-index:103;">⚡ CHỈ MẤT ĐÚNG 2 GIÂY!</div>
        </section>

        <!-- Scene 6: Thử thách & CTA -->
        <section id="scene-thuthach" data-hf-id="scene-thuthach" class="stage-scene">
          <div id="badge-thuthach" data-hf-id="badge-thuthach" class="mathca-element mathca-badge" style="left:230px;top:60px;font-size:32px;background:#ffbd05;color:#1a1c1c;z-index:101;">THỬ THÁCH CHO BẠN</div>
          <div id="quiz-card" data-hf-id="quiz-card" class="mathca-element mathca-card" style="left:60px;top:200px;width:820px;font-size:76px;z-index:102;">42 × 11 = ?</div>
        </section>
      </div>

      <!-- Mascot & CTA -->
      <div id="elem-mascot-wrapper" data-hf-id="elem-mascot-wrapper" class="mascot-stage-box">
        <img src="assets/mascot.png" alt="Mascot MathCA" />
      </div>
      <div id="elem-cta-btn" data-hf-id="elem-cta-btn" class="cta-button">
        FOLLOW MATHCA ✨
      </div>
    </div>

    <!-- GSAP Master Timeline điều khiển HyperFrames -->
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });

      // --- GLOBAL ELEMENTS ENTRY ---
      tl.fromTo("#elem-header-brand", { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 0.05);
      tl.fromTo("#elem-mascot-wrapper", { x: 150, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 0.18);
      tl.to("#elem-mascot-wrapper", { y: -16, duration: 0.7, yoyo: true, repeat: 20, ease: "sine.inOut" }, 0.7);
      tl.fromTo("#elem-cta-btn", { scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.4)" }, 0.5);
      tl.to("#elem-cta-btn", { scale: 1.07, duration: 0.28, yoyo: true, repeat: 20, ease: "sine.inOut" }, 1.0);

      // --- SCENE 1: HOOK (0s - 4.2s) ---
      tl.fromTo("#hook-kicker", { scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.4)" }, 0.2);
      tl.fromTo("#hook-title-1", { scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.4)" }, 0.45);
      tl.fromTo("#hook-title-2", { scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.4)" }, 0.75);
      tl.to("#hook-title-2", { scale: 1.07, duration: 0.28, yoyo: true, repeat: 6, ease: "sine.inOut" }, 1.2);
      tl.fromTo("#hook-vs-box", { y: 150, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 1.05);
      tl.fromTo("#hook-bottom", { y: 150, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, 1.35);

      // Chuyển Scene 1 sang Scene 2 (4.2s)
      tl.to("#scene-hook", { autoAlpha: 0, duration: 0.22 }, 3.98);
      tl.to("#scene-vidu", { autoAlpha: 1, duration: 0.28 }, 4.2);

      // --- SCENE 2: ĐẶT BÀI TOÁN (4.2s - 9.0s) ---
      tl.fromTo("#badge-vidu", { scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.4)" }, 4.3);
      tl.fromTo("#equation-display", { y: -220, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "bounce.out" }, 4.5);
      tl.fromTo("#warning-card", { y: 150, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 6.4);
      tl.to("#warning-card", { rotation: 4, duration: 0.14, yoyo: true, repeat: 8, ease: "sine.inOut" }, 6.8);

      // Chuyển Scene 2 sang Scene 3 (9.0s)
      tl.to("#scene-vidu", { autoAlpha: 0, duration: 0.22 }, 8.78);
      tl.to("#scene-buoc1", { autoAlpha: 1, duration: 0.28 }, 9.0);

      // --- SCENE 3: BƯỚC 1 (9.0s - 13.0s) ---
      tl.fromTo("#badge-buoc1", { scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.4)" }, 9.1);
      tl.fromTo("#split-stage", { scale: 0.1, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.35)" }, 9.4);

      // Chuyển Scene 3 sang Scene 4 (13.0s)
      tl.to("#scene-buoc1", { autoAlpha: 0, duration: 0.22 }, 12.78);
      tl.to("#scene-buoc2", { autoAlpha: 1, duration: 0.28 }, 13.0);

      // --- SCENE 4: BƯỚC 2 (13.0s - 17.4s) ---
      tl.fromTo("#badge-buoc2", { scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.4)" }, 13.1);
      tl.fromTo("#calc-pill", { y: -220, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "bounce.out" }, 13.4);
      tl.fromTo("#split-filled", { scale: 0.1, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.35)" }, 14.8);

      // Chuyển Scene 4 sang Scene 5 (17.4s)
      tl.to("#scene-buoc2", { autoAlpha: 0, duration: 0.22 }, 17.18);
      tl.to("#scene-ketqua", { autoAlpha: 1, duration: 0.28 }, 17.4);

      // --- SCENE 5: KẾT QUẢ SIÊU TỐC (17.4s - 22.4s) ---
      tl.fromTo("#badge-ketqua", { scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.4)" }, 17.5);
      tl.fromTo("#final-answer", { scale: 0.05, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(3.2)" }, 17.75);
      tl.fromTo("#speed-badge", { scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.4)" }, 18.2);
      tl.to("#speed-badge", { scale: 1.07, duration: 0.28, yoyo: true, repeat: 7, ease: "sine.inOut" }, 18.6);

      // Chuyển Scene 5 sang Scene 6 (22.4s)
      tl.to("#scene-ketqua", { autoAlpha: 0, duration: 0.22 }, 22.18);
      tl.to("#scene-thuthach", { autoAlpha: 1, duration: 0.28 }, 22.4);

      // --- SCENE 6: THỬ THÁCH & CTA (22.4s - 29.5s) ---
      tl.fromTo("#badge-thuthach", { scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.4)" }, 22.5);
      tl.fromTo("#quiz-card", { scale: 0.1, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.35)" }, 22.8);

      // Đăng ký Master Timeline vào window.__timelines
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
```
