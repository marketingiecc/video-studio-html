# PROMPT CHO AGENT — TRIỂN KHAI THẬT MATHCA VIDEO STUDIO PRO

Bạn là **Senior Product Designer + Senior Frontend Engineer + Audio Pipeline Engineer**. Hãy triển khai redesign MathCA Video Studio Pro dựa trên:

- `DESIGN.md` — nguồn quyết định thiết kế.
- `index.html` — prototype tương tác và state-flow tham chiếu.
- `images/mockup_01_premium_overview.png`.
- `images/mockup_02_editor_feature_set.png`.
- `images/mockup_03_audio_timeline.png`.
- `reference/source_original.png` — giao diện hiện tại.
- `docs/FEATURES_UPDATE.md` và `samples/project_with_audio_extension.json`.

## Kết quả cần đạt
Giữ nguyên workflow **Kịch bản -> Canvas 9:16 -> Inspector -> Timeline -> Preview -> Render MP4**, nâng cấp hierarchy/khả dụng và thêm BGM/SFX đầy đủ nhưng không phá schema scene/element/animation hoặc hành vi project cũ.

## Bước 0 — Map codebase trước khi sửa
Tìm và ghi lại file/symbol thật tương ứng với bảng sau. Không tạo component song song nếu codebase đã có trách nhiệm tương đương.

| Surface hiện tại | Component đích | State/service cần nối |
|---|---|---|
| Header/project actions | `Topbar` | project I/O, engine status, dirty/autosave state |
| Script/scene list | `RailNavigation`, `ScenePanel` | scene store, selection, reorder/add/delete |
| Canvas/toolbar | `WorkspaceToolbar`, `CanvasViewport` | element selection, zoom, HyperFrames preview |
| Properties | `Inspector` | selected scene/element + command history |
| Playback scrubber | `Timeline` | canonical playhead, zoom, track clips |
| Voice controls | `AudioInspector` | voice state + preview |
| New audio library | `AudioLibraryModal` | asset manager, upload, preview, search/filter |
| New BGM/SFX tracks | `BgmTrack`, `SfxTrack` | audio block + drag/trim/nudge |
| Render button/dialog | `RenderModal` | audio plan, renderer progress, cancellation |

Trước khi code, báo cáo ngắn:
1. Component/file hiện có.
2. Project store hiện có và cách serialize JSON.
3. Preview clock/playhead hiện có.
4. Render entrypoint và FFmpeg/audio path hiện có.
5. Các test liên quan.

## Thiết kế bắt buộc
- Giữ MathCA Teal `#12ABA0`, Teal Dark `#006A63`, Coral `#FF5239`, Yellow `#FFBD05`, font Inter.
- Desktop 1366x768 trở lên; kiểm tra thêm 1440x900 và 1920x1080.
- Coral chỉ là CTA Render chính; Teal dùng cho active/focus; không lạm dụng glow.
- Dùng icon SVG nhất quán, không dùng emoji làm structural icon.
- Hit area chính >=36px; focus visible; tooltip/accessible name cho icon-only button.
- Track phân biệt bằng icon + label + hình dạng + màu, không chỉ màu.
- Respect `prefers-reduced-motion`.

## Schema audio — backward-compatible
Không đổi scene/element/animation. Thêm optional root block:

```json
{
  "audio": {
    "bgm": {
      "enabled": false,
      "src": "",
      "volume": 0.3,
      "startTime": 0,
      "endTime": 29.5,
      "loop": true,
      "fadeIn": 0.8,
      "fadeOut": 1.2,
      "ducking": {
        "enabled": true,
        "underVoiceDb": -12,
        "attack": 0.12,
        "release": 0.35
      }
    },
    "sfxMasterVolume": 0.5,
    "sfx": [
      {
        "id": "sfx-whoosh-01",
        "src": "preset:whoosh",
        "startTime": 0.08,
        "duration": 1.1,
        "volume": 0.42,
        "pan": 0
      }
    ]
  }
}
```

Migration rule: nếu `audio` không tồn tại, hydrate defaults với BGM OFF, SFX master 0.5 và danh sách SFX rỗng. Export có thể ghi block mới; import cũ phải mở/render bình thường.

## BGM
- On/off mặc định OFF cho project cũ.
- Upload MP3/WAV/M4A và chọn library asset.
- Preview play/pause, volume 0-100%, start/end, loop, fade in/out.
- Auto ducking khi voiceover phát; mặc định -12 dB, attack/release có defaults.
- Clip trên timeline hỗ trợ move/trim; Inspector có input số thay thế drag.
- Asset upload phải có định danh/path bền vững, không serialize blob URL.

## SFX
- Preset Whoosh, Pop, Boing, Chime, Click và upload file riêng.
- Click preset chèn tại playhead canonical.
- Drag để đổi vị trí; nudge bằng keyboard/button; Delete có undo.
- Master volume và per-clip volume/pan/duration.
- Default clip thấp hơn voiceover khoảng 10-14 dB.

## State và command model
- Project JSON/store là nguồn dữ liệu chính; không dùng localStorage làm source of truth.
- Inspector, timeline, preview và render đọc cùng normalized state.
- Mọi edit property/timeline đi qua command/history để undo/redo.
- Autosave sau 5-10 giây khi dirty; vẫn giữ Save thủ công rõ ràng.
- Async operation có idle/loading/progress/success/error/cancel states.

## Preview/audio clock
- Chỉ có một canonical playhead/clock.
- Khi seek/play/pause, voice/BGM/SFX phải đồng bộ.
- Dùng `HTMLAudioElement` hoặc Web Audio cho preview; tránh tạo nhiều clock cạnh tranh.
- Cleanup object URL/audio node/event listener khi thay asset hoặc unmount.
- Không loop animation vô hạn trong Inspector; loop preview chỉ trong Canvas.

## Render pipeline
- Tạo normalized audio plan từ project state.
- Voice, BGM, SFX decode/mix ở float32 với gain automation rõ ràng.
- Không dùng naive `amix` làm tụt perceived volume.
- Apply BGM fade/loop/trim và ducking theo voice segments.
- Apply SFX master, per-clip gain và equal-power pan.
- Resample/output stereo 48kHz đồng nhất với voiceover trước mux MP4.
- Progress phải phản ánh stage thật; chỉ cho Cancel ở stage engine hỗ trợ an toàn.
- Lỗi asset/mix/encode phải có message và Retry.

## Thứ tự triển khai
1. Viết migration/defaulting tests cho project cũ.
2. Layout shell + design tokens + responsive 1366x768.
3. Inspector refactor và shared selection state.
4. Canonical timeline/playhead + command history.
5. Audio library/upload/asset persistence.
6. BGM preview, trim, fade, loop, ducking UI/state.
7. SFX insert/drag/nudge/volume/pan.
8. Preview synchronization.
9. Render audio plan + pipeline integration.
10. Empty/loading/error/progress/cancel states.
11. Accessibility, keyboard, visual regression, console QA.

## Test bắt buộc
- Unit: normalize project thiếu `audio`; serialization round trip; audio plan generation; gain/pan/ducking defaults; command undo/redo.
- Component: BGM toggle; library selection; upload state; insert SFX at playhead; selected-clip inspector sync; render modal states.
- Integration: seek/play/pause đồng bộ; old JSON import; new JSON export; render receives expected audio plan.
- E2E: upload BGM -> set 30% -> fade -> add preset SFX -> preview -> render -> cancel/retry.
- Visual: 1366x768, 1440x900, 1920x1080; no horizontal overflow; canvas remains focal.
- Accessibility: keyboard-only flow, focus trapping/restoration in modal, accessible names, contrast, reduced motion.
- Console: không có error nghiêm trọng hoặc unhandled rejection.

## Definition of done
- Acceptance criteria trong `docs/FEATURES_UPDATE.md` đạt.
- Test/lint/typecheck/build của repo pass.
- Project cũ không audio mở và render như trước.
- BGM/SFX xuất cùng MP4, không che voiceover.
- Inspector/timeline/preview/render dùng cùng state và cùng playhead.
- Báo cáo file thay đổi, migration, test evidence và rủi ro còn lại.
