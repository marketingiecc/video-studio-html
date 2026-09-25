# Gemini Antigravity Handoff Plan - MathCA Studio + VieNeu-TTS MCP

> Loai brief: **Continuation brief**
>
> Ngay lap: **2026-09-25**
>
> Workspace chinh: `E:\10. Hyperframe\mathca-studio`

## 1. Vai tro va muc tieu

Ban la Senior Full-stack Engineer + QA Engineer lam viec tren Windows trong Antigravity. Hay tiep quan phan viec dang do, trien khai den khi MathCA Studio hoat dong on dinh tai `http://localhost:3300` voi cac ket qua sau:

1. VieNeu-TTS duoc tich hop thanh mot MCP local qua stdio, co the cung cap giong Viet cho Studio.
2. Studio uu tien VieNeu khi runtime san sang, tu dong fallback sang Edge TTS khi VieNeu loi/khong san sang, khong lam mat JSON hoac Preview.
3. Import JSON moi tu dong tao Voiceover va cap nhat Preview de nguoi dung co the sua ngay.
4. Thanh tien trinh Audio/Render luon hien thi trong Timeline toolbar, phan anh dung trang thai va phan tram.
5. Co thanh chia keo len/xuong de doi chieu cao giua Preview va Timeline; ho tro chuot, ban phim va double-click reset.
6. Tat ca chuc nang goc va cac nang cap da co van hoat dong: Preview zoom/scroll, Inspector scroll, layer kieu CapCut, keo media vao Timeline, BGM/SFX, render MP4.
7. Code, unit test, E2E va tai lieu deu duoc cap nhat; server cuoi cung chay ban source moi tren port 3300.

Khong chi lap ke hoach. Hay sua code, chay test, sua loi, kiem tra E2E va de lai he thong o trang thai san sang cho nguoi dung test.

## 2. Thu tu nguon co tham quyen

Khi co mau thuan, uu tien theo thu tu:

1. Yeu cau trong brief nay va cac yeu cau nguoi dung da neu.
2. `E:\10. Hyperframe\AGENTS.md`.
3. `E:\10. Hyperframe\mathca-studio\DESIGN.md`.
4. `E:\10. Hyperframe\mathca-studio\README.md` va `E:\10. Hyperframe\mathca-studio\docs\*.md`.
5. Source va test hien tai trong `E:\10. Hyperframe\mathca-studio`.
6. API thuc te trong clone upstream `E:\10. Hyperframe\mathca-studio\integrations\VieNeu-TTS`; README upstream chi la tai lieu tham khao, khong duoc ghi de cac rang buoc cua Studio.

Doc toi thieu truoc khi sua:

- `E:\10. Hyperframe\mathca-studio\DESIGN.md`
- `E:\10. Hyperframe\mathca-studio\README.md`
- `E:\10. Hyperframe\mathca-studio\audio-generator.js`
- `E:\10. Hyperframe\mathca-studio\server.js`
- `E:\10. Hyperframe\mathca-studio\public\index.html`
- `E:\10. Hyperframe\mathca-studio\public\css\studio.css`
- `E:\10. Hyperframe\mathca-studio\public\js\app.js`
- `E:\10. Hyperframe\mathca-studio\public\js\premium-ui.js`
- `E:\10. Hyperframe\mathca-studio\tests\*.js`
- `E:\10. Hyperframe\mathca-studio\integrations\VieNeu-TTS\README.md`
- `E:\10. Hyperframe\mathca-studio\integrations\VieNeu-TTS\pyproject.toml`
- `E:\10. Hyperframe\mathca-studio\integrations\VieNeu-TTS\src\vieneu\factory.py`
- `E:\10. Hyperframe\mathca-studio\integrations\VieNeu-TTS\src\vieneu\v3turbo.py`

## 3. Trang thai da xac minh tai thoi diem ban giao

### 3.1 Tai san va fixture

- Backup cu ton tai: `E:\10. Hyperframe\mathca-studio-backup-20260925-081952.zip` - 15,737,948 bytes.
- Fixture lop 4 ton tai: `C:\Users\lexua\Downloads\MathCA_5_dang_toan_lop4_hay_sai.json` - 32,000 bytes.
- Fixture 5 phep tinh ton tai: `C:\Users\lexua\Downloads\MathCA_Lop3_5PhepTinhNangCao.json` - 29,320 bytes.
- Anh loi nguoi dung cung cap: `C:\Users\lexua\AppData\Local\Temp\codex-clipboard-03ddb8fb-952e-4f81-adba-285e727031ea.png`.

### 3.2 VieNeu-TTS

- Repo upstream da duoc clone vao `E:\10. Hyperframe\mathca-studio\integrations\VieNeu-TTS`.
- Commit dang clone: `c1390abbdb2eedcdf58eafb546966c06ce27af71`.
- Package upstream: `vieneu` version `3.8.3`, Python `>=3.10`.
- May da co Git `2.54.0`, uv `0.12.9`, Python `3.12.10`.
- API da xac minh tu source upstream:
  - `from vieneu import Vieneu`
  - `tts = Vieneu(mode="v3turbo", backend="onnx")`
  - `audio = tts.infer(text, voice="Mai Anh")`
  - `tts.save(audio, output_path)`
  - `tts.list_preset_voices()`
- VieNeu v3 Turbo cho audio 48 kHz; CPU mac dinh dung ONNX. Model co the duoc tai o lan chay dau, khong duoc commit model/cache vao Studio.

### 3.3 Source dang do

Da co cac thay doi chua hoan thien:

- `audio-generator.js`
  - retry Edge TTS tang len 5;
  - exponential backoff;
  - cache Voiceover theo tung scene;
  - export `getVoiceSegmentCacheKey`, `isReusableVoiceSegment`.
- `server.js`
  - them progress cho audio job va health;
  - **hien tai khong parse duoc** vi regex tai gan dong 60 dang la `/cảnhs+(d+)/(d+)/i`.
  - Dang ky dung phai la dang tuong duong `/cảnh\s+(\d+)\/(\d+)/i`.
- `public/index.html`
  - da co `#timeline-resizer`;
  - da co persistent strip `#studio-job-progress`.
- `public/css/studio.css`
  - da co style co ban cho resizer va progress strip;
  - Timeline da duoc doi thanh grid 3 hang.
- `public/js/app.js`
  - da co poll `/api/audio-status`;
  - audio error khong con blocking alert trong nhanh generate;
  - con thieu ket noi day du cho import result, render progress, health recovery va toast error style.
- `public/js/premium-ui.js`
  - chua co logic keo `#timeline-resizer`.

### 3.4 Server dang chay

- `http://localhost:3300` dang co listener PID `2936`.
- Health cua process cu tai thoi diem ban giao chi co cac field cu va khong co `audioProgress`, `audioStage`, `renderProgress`, `renderStage`.
- Dieu nay chung minh process dang chay la ban source cu da load truoc cac edit moi.
- Khong duoc dung health cu de ket luan source hien tai da dung.
- Chi restart port 3300 sau khi source parse duoc va unit test muc tieu da qua.

### 3.5 Ket qua truoc cac edit dang do

Truoc dot thay doi progress/VieNeu, cac gate sau tung pass:

- `npm run check`: 42/42.
- `node tests/e2e-import.js`.
- `node tests/e2e-media-layers.js`.
- `node tests/e2e-redesign.js`.
- `node tests/e2e-audio-render.js`.

MP4 E2E cu da ton tai:

`E:\10. Hyperframe\mathca-studio\rendered_output\5_phut_luyen_tap_toan_lop_3_voi_5_phep_tinh_nang_cao_1790304726790.mp4`

Day chi la baseline lich su, khong phai bang chung cho source moi. Phai chay lai gate sau khi sua.

## 4. Pham vi duoc phep va cam

### 4.1 Duoc phep sua

Chi sua trong `E:\10. Hyperframe\mathca-studio`, uu tien cac file/folder:

- `audio-generator.js`
- `server.js`
- `vieneu-mcp-client.js` moi
- `integrations\vieneu-mcp\server.py` moi
- `integrations\vieneu-mcp\README.md` moi
- `public\index.html`
- `public\css\studio.css`
- `public\js\app.js`
- `public\js\premium-ui.js`
- `tests\...`
- `README.md`, `DESIGN.md`, `docs\FEATURES_UPDATE.md`, `docs\UI_UX_AUDIT.md`, `docs\README.md`
- `package.json` chi de them script thuc su can thiet; khong them dependency MCP neu co the dung built-in Node/Python.

### 4.2 Upstream VieNeu la read-only

- Khong sua source trong `integrations\VieNeu-TTS` tru khi mot loi tuong thich bat buoc khong the giai quyet bang wrapper; neu bat buoc, phai ghi ro file, ly do va diff.
- Khong commit `.venv`, model weights, Hugging Face cache, generated WAV/MP3 tam hoac credentials.

### 4.3 Cam

- Khong `git reset --hard`, `git clean`, `git checkout --` hoac xoa de quy.
- Khong revert thay doi co san ma khong hieu ro.
- Khong xoa backup ZIP, JSON fixture, rendered output cu hoac project cua nguoi dung.
- Khong sua file JSON trong Downloads.
- Khong them `metadata.audioFile` vao JSON du an.
- Khong luu `blob:` URL vao JSON.
- Khong sua `html_template` chi vi tao audio.
- Khong lam roi unknown fields trong JSON.
- Khong dung blocking `alert()` cho loi Audio/Render moi; dung progress/status + toast co the hanh dong.
- Khong tuy tien them package manager moi; subproject hien dung `npm` va `package-lock.json`.
- Khong tuyen bo VieNeu da hoat dong neu chi test fallback Edge hoac chi doc source.
- Khong lo secrets/token trong log, screenshot hoac report.

Workspace goc hien khong phai mot git baseline sach; `mathca-studio` co the hien la untracked tu repo cha. Hay ghi lai baseline file truoc/sau va khong dung Git de xoa nhung gi khong thuoc pham vi.

## 5. Hop dong JSON bat bien

Moi luong import/generate/render phai giu cac invariant sau:

1. `sourceProjectSnapshot` phan anh nguyen ban import.
2. Unknown top-level fields, unknown scene fields va unknown element fields phai con nguyen.
3. `html_template` phai byte-preserved neu nguoi dung khong chu dong sua template.
4. Runtime Voiceover/master chi nam trong runtime state/manifest, khong chen `metadata.audioFile` vao project JSON.
5. `audio` block chi serialize sau khi nguoi dung thuc su thay doi audio.
6. Runtime object URL khong duoc persist.
7. Import Audio that bai van phai giu JSON, Scene list va Preview de nguoi dung tiep tuc sua.

Bat buoc them regression test de khoa cac invariant nay cho fixture lop 4.

## 6. Kien truc MCP bat buoc

### 6.1 Cau truc de xuat

```text
mathca-studio/
  integrations/
    VieNeu-TTS/                 # clone upstream, read-only
    vieneu-mcp/
      server.py                 # MCP JSON-RPC stdio local
      README.md
  vieneu-mcp-client.js          # Node client persistent
```

Neu chon cau truc khac, phai giu cung boundary: upstream read-only, wrapper MCP rieng, Node client rieng va co test doc lap.

### 6.2 MCP server

`integrations\vieneu-mcp\server.py` phai:

- Noi chuyen JSON-RPC 2.0 qua stdio, mot message moi dong; stdout chi chua protocol, log chi ghi stderr.
- Ho tro toi thieu:
  - `initialize`
  - `notifications/initialized`
  - `tools/list`
  - `tools/call`
- Cong bo tools:
  - `vieneu_list_voices`
  - `vieneu_synthesize`
- Lazy-load `Vieneu`; `initialize` va `tools/list` khong duoc crash chi vi model chua tai.
- Mac dinh dung env co the cau hinh:
  - `VIENEU_MODE=v3turbo`
  - `VIENEU_BACKEND=onnx`
  - `VIENEU_PRECISION=fp32`
  - `VIENEU_THREADS=0`
- Chi duoc ghi output ben trong `MATHCA_TTS_OUTPUT_ROOT` sau khi resolve absolute path.
- Tu choi absolute/path traversal vuot output root.
- Tao parent directory an toan.
- Validate text khong rong, voice hop le va output extension phu hop (`.wav` khuyen nghi).
- Tra ve JSON co provider, voice, outputPath, sampleRate, bytes, duration neu tinh duoc.
- Bao loi co cau truc, khong in stack trace vao stdout.
- Xu ly SIGTERM/EOF sach.

### 6.3 Node MCP client

`vieneu-mcp-client.js` phai:

- Dung `child_process.spawn`, khong dung shell string.
- Khoi dong persistent process, khong spawn mot model moi cho moi scene.
- Lenh de xuat tren Windows:

```powershell
uv run --project integrations/VieNeu-TTS python integrations/vieneu-mcp/server.py
```

- Co JSON-RPC request id, pending map, timeout va cleanup khi process exit.
- Thuc hien handshake `initialize` -> `notifications/initialized` truoc `tools/call`.
- Khong dua stderr cua child vao JSON parser.
- Khi process/protocol loi, reject ro rang va reset client de lan sau co the khoi dong lai.
- Ho tro dependency injection hoac fake command de unit test ma khong tai model.
- Co ham dong client khi Node server shutdown.

### 6.4 Voice mapping

Khong duoc sua `metadata.voice` cua project. Mapping runtime toi thieu:

- `vi-VN-HoaiMyNeural` -> VieNeu `Mai Anh`
- `vi-VN-NamMinhNeural` -> VieNeu `Hải Đăng`

Neu voice trong JSON da la ten VieNeu thi giu nguyen neu co trong danh sach voice. Neu khong map duoc, dung voice mac dinh co cau hinh va ghi provider/voice thuc te vao runtime response, khong vao JSON.

### 6.5 Provider policy va fallback

Provider order mac dinh:

1. Per-scene cache dung provider/key.
2. VieNeu MCP neu mode `auto` hoac `vieneu` va runtime san sang.
3. Edge TTS fallback trong mode `auto`.
4. Neu ca hai that bai: tra loi co the retry, giu JSON/Preview, khong lam Node process chet.

Yeu cau chi tiet:

- Them env `MATHCA_TTS_PROVIDER=auto|vieneu|edge`, mac dinh `auto`.
- Cache key phai bao gom provider, voice thuc te, text, format va cac tham so anh huong waveform.
- VieNeu output WAV va Edge output MP3 khong duoc gia mao extension.
- Trong mot audio job, neu VieNeu loi he thong/runtime, circuit-break VieNeu cho cac scene con lai va fallback Edge; khong lap lai viec boot model that bai 7 lan.
- Cache scene da thanh cong phai duoc tai su dung sau retry/job moi.
- Edge tiep tuc co 5 lan retry + exponential backoff cho loi WebSocket/ngat stream.
- Response `/api/generate-audio` phai cho biet provider da dung, fallback co xay ra khong va provider theo scene neu mixed.
- `/api/health` hoac endpoint provider rieng phai noi ro `configured`, `available`, `activeProvider`, nhung khong duoc khoi dong/tai model trong moi health poll 5 giay.
- Neu VieNeu can tai model lan dau, UI phai hien thi stage phu hop thay vi dung o 3% khong giai thich.

## 7. Sua backend progress va job state

1. Sua regex `inferAudioProgress` de source parse duoc.
2. `inferAudioProgress(stage, totalScenes, currentProgress)` phai nhan cac stage:
   - tao/dung lai/fallback scene `i/n`;
   - dang khoi dong VieNeu;
   - dang ghép Voiceover;
   - dang tron BGM/SFX;
   - hoan tat;
   - loi.
3. Progress khong duoc lui trong cung mot job.
4. Audio failure phai dat `active=false`, giu `error`, `stage`, `completedAt`; percent khong gia 100.
5. Health phai tra:
   - `audioActive`, `audioProgress`, `audioStage`;
   - `renderActive`, `renderProgress`, `renderStage`;
   - provider status nhe, khong load model.
6. Cho phep inject audio generator/MCP client trong `createApp()` de API tests khong goi mang/model that.
7. Server shutdown phai dong MCP child neu co.

## 8. Hoan thien UI import/progress/toast

### 8.1 Import result

`loadProjectData()` phai tra ve ket qua co it nhat `{ loaded: true, audioReady: boolean }` hoac mot contract tuong duong.

Cac luong sau chi duoc hien “tao Audio thanh cong” neu `audioReady === true`:

- Apply JSON editor.
- Open JSON file.
- Paste JSON.
- Load preset voi regenerate audio.

Neu Audio loi:

- Bao “Da nap JSON va Preview; Voiceover chua san sang”.
- Giu project tren man hinh.
- Nut “Tao lai Voiceover” hoat dong sau khi job ket thuc.
- Khong dong modal/panel mot cach lam nguoi dung tuong audio da thanh cong.

### 8.2 Persistent progress strip

`#studio-job-progress` phai luon visible trong Timeline toolbar o cac viewport 1366x768, 1440x900, 1920x1080.

No phai phan anh:

- Idle/ready.
- Audio preparing/loading model/per-scene/mixing/success/error.
- Render start/capture/post-process/success/error/cancel.
- Khi health phat hien job dang chay sau reload, strip phai tiep tuc hien stage/progress.
- Khong de audio poll va render poll ghi de sai trang thai cua nhau; render dang chay co uu tien hien thi, hoac dung mot coordinator ro rang.

`triggerRenderProcess()`, `pollRenderStatus()` va `cancelPremiumRender()` phai cap nhat strip. Render error dung toast/error state, khong them blocking alert moi.

### 8.3 Toast

Sua `showToast(msg, type = 'success')`:

- `success`, `error`, co the co `info`.
- Mau error ro rang theo Coral.
- Moi timeout cu phai duoc clear de toast moi khong bi toast cu an som.
- Khong dung emoji lam structural icon moi.

## 9. Timeline resizer

Them `bindTimelineResize()` vao `public\js\premium-ui.js` va goi tu `initPremiumStudio()`.

Hanh vi bat buoc:

- Pointer down tren `#timeline-resizer`.
- Keo len -> Timeline cao hon; keo xuong -> Timeline thap hon.
- Cong thuc tham khao: `newHeight = startHeight + startY - currentY`.
- Clamp:
  - min 170 px;
  - max `window.innerHeight - headerHeight - 190` hoac gia tri tuong duong de Preview van dung duoc.
- Set `--timeline-h` tren `document.documentElement`.
- Cap nhat `aria-valuenow`.
- Dispatch `window.resize` de Preview Fit tinh lai.
- `ArrowUp`/`ArrowDown` thay doi 16 px; `Home` ve min; `End` ve max.
- Double-click reset ve gia tri responsive mac dinh.
- Co the luu localStorage preference, nhung khong ghi vao project JSON.
- Pointer capture/release va cleanup event phai dung; khong de body mac ket class `timeline-resizing`.

CSS phai dam bao Inspector van scroll, Timeline tracks scroll doc va global page khong overflow.

## 10. Cai dat runtime VieNeu

Thuc hien theo tung muc co bang chung:

1. Kiem tra `uv --version` va Python.
2. Chay CPU/core install tu clone, khong cai CUDA extras neu khong co yeu cau:

```powershell
uv sync --project integrations/VieNeu-TTS
```

3. Khong commit `.venv`.
4. Chay MCP protocol smoke test truoc khi tai model neu co the.
5. Sau do thu `vieneu_list_voices` va mot synthesis ngan bang `Mai Anh` vao output root test.
6. Xac minh WAV thuc bang FFprobe: sample rate, channels, duration, bytes > 1 KB.
7. Neu model download/runtime bi chan boi mang/dung luong/phan cung:
   - khong gia lap thanh cong;
   - danh dau **Blocked** voi exact error;
   - van phai hoan thien va test MCP protocol bang fake server;
   - van phai chung minh Edge fallback hoat dong.

Khong bien fake audio thanh duong production. Fake chi nam trong test fixture.

## 11. Test bat buoc

### 11.1 Static va unit

Them test cho:

- `getVoiceSegmentCacheKey` on dinh va khac nhau theo provider/voice/text.
- `isReusableVoiceSegment`.
- `inferAudioProgress` voi scene `1/7`, retry, cache, mix, complete, error.
- MCP client handshake, tools list, synth response, timeout, malformed JSON, child exit.
- MCP output-root traversal bi tu choi.
- VieNeu fail -> Edge fallback mot lan/circuit breaker.
- Scene cache tai su dung sau partial failure.
- JSON/html_template/unknown fields khong doi khi audio generation that bai.
- API health/audio status co progress/provider fields.

MCP client tests phai dung fake child/fake Python server, khong tai model.

### 11.2 E2E matrix

Moi dong la mot scenario rieng; khong gom chung de tuyen bo full coverage.

| ID | Fixture/State | Hanh dong | Bang chung pass |
|---|---|---|---|
| E2E-01 | `MathCA_5_dang_toan_lop4_hay_sai.json` | Import file | 7 scenes hien, Preview hien, source JSON va `html_template` preserved |
| E2E-02 | VieNeu san sang | Import/generate | Voiceover tao bang VieNeu; response/provider UI noi ro VieNeu |
| E2E-03 | VieNeu bi vo hieu hoa/loi | Generate | Edge fallback tao Voiceover; UI noi ro fallback; project van edit duoc |
| E2E-04 | Ca hai provider loi | Import | JSON + Preview van hien; progress error; nut retry enabled; khong blocking alert |
| E2E-05 | Audio job dang chay | Quan sat toolbar | Persistent progress strip visible va percent/stage tang |
| E2E-06 | Render job dang chay | Render MP4 | Cung strip hien render progress den 100; modal dong bo |
| E2E-07 | Timeline resize | Keo handle | Timeline height thay doi va Preview fit lai |
| E2E-08 | Timeline resize keyboard | Arrow/Home/End | Height va `aria-valuenow` cap nhat |
| E2E-09 | 1366x768 | Mo Studio | Progress, playback, timeline toolbar, Inspector deu truy cap duoc; khong horizontal body overflow |
| E2E-10 | Media/layers | Add image/video/audio, reorder | Moi object co row; row tren la visual layer tren; keo qua row duoc |
| E2E-11 | BGM/SFX | Chon library va chen | BGM chon duoc; SFX chen tai playhead; Timeline track cap nhat |
| E2E-12 | `MathCA_Lop3_5PhepTinhNangCao.json` | Full import -> audio -> render | MP4 moi hop le, audio 48 kHz stereo, FPS/resolution dung config |

Voi moi E2E:

- Ghi viewport.
- Ghi provider thuc te.
- Luu screenshot co ten on dinh, vi du `tests/artifacts/e2e-05-audio-progress-1366x768.png`.
- Khong dung cung mot screenshot/hash lam bang chung cho hai state khac nhau.
- Screenshot chi chung minh cai nhin thay; provider/audio format phai co API/FFprobe evidence.

### 11.3 Lenh gate cuoi

Chay toi thieu:

```powershell
npm run check
node tests/e2e-import.js
node tests/e2e-media-layers.js
node tests/e2e-redesign.js
node tests/e2e-audio-render.js
```

Them va chay E2E moi cho fixture lop 4, progress/resizer va VieNeu/fallback. Neu doi ten test, liet ke ro lenh thuc te.

Doi voi MP4/WAV moi, dung FFprobe ghi lai:

- codec/container;
- width/height;
- FPS;
- duration;
- audio sample rate;
- audio channels;
- file size.

## 12. Restart server cuoi cung

Chi sau khi `node --check server.js` va unit tests muc tieu pass:

1. Dung dung process dang listen port 3300; khong kill rong cac Node process khac.
2. Khoi dong Studio bang script hien co hoac `npm start` trong `E:\10. Hyperframe\mathca-studio`.
3. Neu chay background tren Windows, an cua so helper.
4. Xac minh process moi da load source moi bang `/api/health` co progress/provider fields moi.
5. Mo/giu `http://localhost:3300` san sang cho nguoi dung.
6. Khong ket thuc MCP child dang duoc Studio su dung khi ban giao.

## 13. Cap nhat tai lieu

Cap nhat:

- `README.md`: provider order, setup VieNeu, Edge fallback, env vars, first-run model download, progress strip, Timeline resize.
- `DESIGN.md`: component/state moi neu can; khong tao design system song song.
- `docs\FEATURES_UPDATE.md`: MCP voice provider va resize/progress.
- `docs\UI_UX_AUDIT.md`: before/after, failure state va accessibility.
- `docs\README.md`: cach cai/chay/test.
- `integrations\vieneu-mcp\README.md`: protocol, tools, env, security boundary, troubleshooting.

Tai lieu phai noi ro VieNeu v3 Turbo la open-source local provider trong clone nay; khong nham voi proprietary v4.

## 14. Quy tac bang chung va phan loai

Moi ket luan cuoi phai gan mot trong cac nhan:

- **Observed/verified:** da tai hien trong runtime voi bang chung truc tiep.
- **Measured:** co gia tri va phuong phap do.
- **Source-informed hypothesis:** chi suy ra tu code/tai lieu, chua chay.
- **Blocked:** khong the vao state can test; ghi exact blocker.
- **Not tested:** trong scope nhung khong co bang chung.
- **Rejected:** claim cu bi bang chung moi bac bo.

Khong dung cac cum “hoan hao”, “production-ready”, “fully verified”, “WCAG compliant” neu khong co scope va bang chung day du.

## 15. Completion gates

Chi duoc ket luan hoan thanh khi tat ca dieu sau dung:

1. `server.js`, `audio-generator.js`, `app.js`, `premium-ui.js` parse duoc.
2. `npm run check` pass voi tong test moi duoc ghi ro.
3. MCP protocol co unit/integration evidence.
4. VieNeu synthesis that co evidence, hoac duoc ghi **Blocked**; khong duoc danh dau verified bang fake.
5. Edge fallback duoc tai hien.
6. Hai JSON fixture import duoc va schema invariant pass.
7. Persistent progress va Timeline resizer duoc test trong browser.
8. Render MP4 moi duoc FFprobe.
9. Tai lieu da cap nhat.
10. Port 3300 dang chay process moi va health co fields moi.
11. Final changed-file audit khong co file ngoai pham vi bi sua/xoa.
12. Khong con TODO/placeholder production cho nhanh VieNeu/progress/resizer.

Neu gate nao khong dat, tiep tuc sua neu co the. Neu thuc su bi chan, bao **Blocked**; khong thay bang claim thanh cong.

## 16. Dinh dang bao cao cuoi cho nguoi dung

Bao cao bang tieng Viet, ngan gon nhung co bang chung, theo schema:

### Ket qua

- Tinh trang MCP VieNeu.
- Provider thuc te va fallback.
- Import/Voiceover/Preview.
- Progress strip/Timeline resize.
- Server URL va PID moi.

### Files changed

- Mot dong cho moi file quan trong va muc dich.

### Verification

- Lenh test + passed/failed count.
- E2E matrix: Verified/Blocked/Not tested cho tung ID.
- FFprobe summary cho audio/video moi.
- Screenshot/artifact paths.

### JSON integrity

- Hash/so sanh cho fixture, `html_template`, unknown fields.
- Xac nhan khong them `metadata.audioFile`, khong persist `blob:`.

### Blockers/remaining risks

- Chi liet ke blocker/risk co bang chung.
- Neu model VieNeu chua tai duoc, ghi exact error va cach retry; khong ha thap muc do hoan thanh cua cac phan khac.

### Final scope audit

- Danh sach file them/sua/xoa.
- Xac nhan backup va fixture khong bi thay doi.
- Xac nhan upstream VieNeu co bi sua hay khong.

Bat dau bang viec chup baseline, sua syntax error trong `server.js`, sau do trien khai MCP theo test-first. Khong dung process cu PID 2936 lam bang chung cho source moi.
