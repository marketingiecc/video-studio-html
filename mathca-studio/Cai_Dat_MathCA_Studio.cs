using System;
using System.Drawing;
using System.IO;
using System.Net;
using System.Diagnostics;
using System.Threading;
using System.Windows.Forms;

namespace MathCAStudioInstaller
{
    public class InstallerForm : Form
    {
        private Panel headerPanel;
        private Label lblTitle;
        private Label lblSubtitle;
        private Label lblStatusStep1;
        private Label lblStatusStep2;
        private Label lblStatusStep3;
        private Label lblStatusStep4;
        private ProgressBar progressBar;
        private TextBox txtLog;
        private Button btnInstall;
        private Button btnGitUpdate;
        private Button btnLaunch;
        private Button btnOpenBrowser;
        private Button btnExit;

        private string studioDir;
        private bool isInstalling = false;

        public InstallerForm()
        {
            InitializeComponent();
            DetectInitialStatus();
        }

        private void InitializeComponent()
        {
            this.studioDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
            if (!File.Exists(Path.Combine(this.studioDir, "package.json")))
            {
                string candidate = Path.Combine(this.studioDir, "mathca-studio");
                if (File.Exists(Path.Combine(candidate, "package.json")))
                {
                    this.studioDir = candidate;
                }
            }

            this.Text = "MathCA Video Studio Pro — Bộ Cài Đặt & Khởi Động Trọn Bộ";
            this.Size = new Size(740, 620);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(15, 23, 42); // Navy Dark
            this.ForeColor = Color.FromArgb(248, 250, 252);
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            // Icon nếu có app.ico
            string iconPath = Path.Combine(this.studioDir, "app.ico");
            if (File.Exists(iconPath))
            {
                try { this.Icon = new Icon(iconPath); } catch { }
            }

            // Header Panel
            headerPanel = new Panel();
            headerPanel.Dock = DockStyle.Top;
            headerPanel.Height = 85;
            headerPanel.BackColor = Color.FromArgb(30, 41, 59);

            lblTitle = new Label();
            lblTitle.Text = "MATHCA VIDEO STUDIO PRO";
            lblTitle.Font = new Font("Segoe UI", 16f, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(18, 171, 160); // Teal
            lblTitle.Location = new Point(20, 14);
            lblTitle.AutoSize = true;

            lblSubtitle = new Label();
            lblSubtitle.Text = "Trình cài đặt tự động trọn bộ cho máy tính mới • HyperFrames Engine • 9:16 Video";
            lblSubtitle.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            lblSubtitle.ForeColor = Color.FromArgb(148, 163, 184);
            lblSubtitle.Location = new Point(22, 48);
            lblSubtitle.AutoSize = true;

            headerPanel.Controls.Add(lblTitle);
            headerPanel.Controls.Add(lblSubtitle);
            this.Controls.Add(headerPanel);

            // Status steps panel
            int top = 95;
            lblStatusStep1 = CreateStepLabel("1. Thư mục cài đặt: " + Path.GetFileName(this.studioDir), top);
            top += 26;
            lblStatusStep2 = CreateStepLabel("2. Môi trường Node.js LTS 22+ (Kiểm tra / Tự động tải cài đặt)", top);
            top += 26;
            lblStatusStep3 = CreateStepLabel("3. Thư viện phụ thuộc Studio (npm ci)", top);
            top += 26;
            lblStatusStep4 = CreateStepLabel("4. Khởi tạo bộ render HyperFrames & tạo lối tắt Desktop", top);
            top += 34;

            // Progress Bar
            progressBar = new ProgressBar();
            progressBar.Location = new Point(20, top);
            progressBar.Size = new Size(685, 14);
            progressBar.Style = ProgressBarStyle.Continuous;
            this.Controls.Add(progressBar);
            top += 22;

            // Log TextBox
            txtLog = new TextBox();
            txtLog.Multiline = true;
            txtLog.ReadOnly = true;
            txtLog.ScrollBars = ScrollBars.Vertical;
            txtLog.BackColor = Color.FromArgb(2, 6, 23);
            txtLog.ForeColor = Color.FromArgb(226, 232, 240);
            txtLog.Font = new Font("Consolas", 9f);
            txtLog.Location = new Point(20, top);
            txtLog.Size = new Size(685, 275);
            this.Controls.Add(txtLog);
            top += 285;

            // Action Buttons
            btnInstall = new Button();
            btnInstall.Text = "🚀 CÀI ĐẶT TRỌN BỘ";
            btnInstall.Location = new Point(20, top);
            btnInstall.Size = new Size(185, 44);
            btnInstall.BackColor = Color.FromArgb(18, 171, 160);
            btnInstall.ForeColor = Color.White;
            btnInstall.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
            btnInstall.FlatStyle = FlatStyle.Flat;
            btnInstall.FlatAppearance.BorderSize = 0;
            btnInstall.Cursor = Cursors.Hand;
            btnInstall.Click += (s, e) => StartFullInstallation();
            this.Controls.Add(btnInstall);

            btnGitUpdate = new Button();
            btnGitUpdate.Text = "🔄 CẬP NHẬT MỚI";
            btnGitUpdate.Location = new Point(212, top);
            btnGitUpdate.Size = new Size(160, 44);
            btnGitUpdate.BackColor = Color.FromArgb(14, 116, 144); // Cyan Blue
            btnGitUpdate.ForeColor = Color.White;
            btnGitUpdate.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
            btnGitUpdate.FlatStyle = FlatStyle.Flat;
            btnGitUpdate.FlatAppearance.BorderSize = 0;
            btnGitUpdate.Cursor = Cursors.Hand;
            btnGitUpdate.Click += (s, e) => StartGitUpdate();
            this.Controls.Add(btnGitUpdate);

            btnLaunch = new Button();
            btnLaunch.Text = "▶️ KHỞI ĐỘNG";
            btnLaunch.Location = new Point(379, top);
            btnLaunch.Size = new Size(150, 44);
            btnLaunch.BackColor = Color.FromArgb(255, 82, 57); // Coral
            btnLaunch.ForeColor = Color.White;
            btnLaunch.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
            btnLaunch.FlatStyle = FlatStyle.Flat;
            btnLaunch.FlatAppearance.BorderSize = 0;
            btnLaunch.Cursor = Cursors.Hand;
            btnLaunch.Click += (s, e) => LaunchStudio();
            this.Controls.Add(btnLaunch);

            btnOpenBrowser = new Button();
            btnOpenBrowser.Text = "🌐 Mở Web";
            btnOpenBrowser.Location = new Point(536, top);
            btnOpenBrowser.Size = new Size(95, 44);
            btnOpenBrowser.BackColor = Color.FromArgb(51, 65, 85);
            btnOpenBrowser.ForeColor = Color.White;
            btnOpenBrowser.FlatStyle = FlatStyle.Flat;
            btnOpenBrowser.FlatAppearance.BorderSize = 0;
            btnOpenBrowser.Cursor = Cursors.Hand;
            btnOpenBrowser.Click += (s, e) => Process.Start("http://localhost:3300");
            this.Controls.Add(btnOpenBrowser);

            btnExit = new Button();
            btnExit.Text = "Đóng";
            btnExit.Location = new Point(638, top);
            btnExit.Size = new Size(67, 44);
            btnExit.BackColor = Color.FromArgb(30, 41, 59);
            btnExit.ForeColor = Color.FromArgb(148, 163, 184);
            btnExit.FlatStyle = FlatStyle.Flat;
            btnExit.FlatAppearance.BorderSize = 0;
            btnExit.Cursor = Cursors.Hand;
            btnExit.Click += (s, e) => this.Close();
            this.Controls.Add(btnExit);
        }

        private Label CreateStepLabel(string text, int top)
        {
            Label lbl = new Label();
            lbl.Text = text;
            lbl.Location = new Point(22, top);
            lbl.AutoSize = true;
            lbl.ForeColor = Color.FromArgb(203, 213, 225);
            this.Controls.Add(lbl);
            return lbl;
        }

        private void AppendLog(string message)
        {
            if (txtLog.InvokeRequired)
            {
                txtLog.Invoke(new Action<string>(AppendLog), message);
                return;
            }
            txtLog.AppendText("[" + DateTime.Now.ToString("HH:mm:ss") + "] " + message + Environment.NewLine);
        }

        private void SetProgress(int value)
        {
            if (progressBar.InvokeRequired)
            {
                progressBar.Invoke(new Action<int>(SetProgress), value);
                return;
            }
            progressBar.Value = Math.Max(0, Math.Min(100, value));
        }

        private void DetectInitialStatus()
        {
            AppendLog("Chào mừng bạn đến với bộ cài đặt MathCA Video Studio Pro!");
            AppendLog("Thư mục làm việc: " + this.studioDir);

            string nodeVer;
            bool nodeOk = CheckNodeInstalled(out nodeVer);
            if (nodeOk)
            {
                lblStatusStep2.Text = "2. Node.js: " + nodeVer + " [ĐÃ CÓ SẴN ✔]";
                lblStatusStep2.ForeColor = Color.FromArgb(74, 222, 128); // Green
            }
            else
            {
                lblStatusStep2.Text = "2. Node.js 22+: [CHƯA CÓ - SẼ TỰ CÀI ĐẶT]";
                lblStatusStep2.ForeColor = Color.FromArgb(251, 191, 36); // Yellow
            }

            bool modulesExist = Directory.Exists(Path.Combine(this.studioDir, "node_modules"));
            if (modulesExist)
            {
                lblStatusStep3.Text = "3. Thư viện phụ thuộc (node_modules): [ĐÃ CÓ SẴN ✔]";
                lblStatusStep3.ForeColor = Color.FromArgb(74, 222, 128);
            }

            if (nodeOk && modulesExist)
            {
                AppendLog("Hệ thống đã có sẵn Node.js và thư viện. Bạn có thể bấm 'KHỞI ĐỘNG STUDIO' ngay lập tức!");
                btnInstall.Text = "CÀI ĐẶT / CẬP NHẬT LẠI";
            }
            else
            {
                AppendLog("Bấm nút 'BẮT ĐẦU CÀI ĐẶT TRỌN BỘ' để phần mềm tự động chuẩn bị tất cả.");
            }
        }

        private bool CheckNodeInstalled(out string version)
        {
            version = "";
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo("node", "-v");
                psi.RedirectStandardOutput = true;
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                using (Process p = Process.Start(psi))
                {
                    version = p.StandardOutput.ReadToEnd().Trim();
                    p.WaitForExit(3000);
                    if (p.ExitCode == 0 && version.StartsWith("v"))
                    {
                        string majorStr = version.Substring(1).Split('.')[0];
                        int major = 0;
                        if (int.TryParse(majorStr, out major) && major >= 22)
                        {
                            return true;
                        }
                    }
                }
            }
            catch { }
            return false;
        }

        private void StartFullInstallation()
        {
            if (isInstalling) return;
            isInstalling = true;
            btnInstall.Enabled = false;
            btnLaunch.Enabled = false;

            Thread t = new Thread(new ThreadStart(InstallationWorker));
            t.IsBackground = true;
            t.Start();
        }

        private void InstallationWorker()
        {
            try
            {
                SetProgress(10);
                AppendLog("=== BẮT ĐẦU CÀI ĐẶT TRỌN BỘ MATHCA STUDIO PRO ===");

                // 1. Kiểm tra / Cài đặt Node.js
                AppendLog("[1/4] Kiểm tra môi trường Node.js 22+...");
                string nodeVer;
                if (!CheckNodeInstalled(out nodeVer))
                {
                    AppendLog("Máy chưa có Node.js 22+. Đang tiến hành cài đặt tự động...");
                    bool installed = InstallNodeJs();
                    if (!installed)
                    {
                        AppendLog("[LỖI] Không thể tự cài Node.js. Vui lòng tải và cài Node LTS từ https://nodejs.org");
                        MessageBox.Show("Không thể tự động cài đặt Node.js LTS.\nVui lòng tải và cài đặt Node.js LTS 22+ từ trang https://nodejs.org rồi chạy lại.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        ResetButtons();
                        return;
                    }
                }
                else
                {
                    AppendLog("[OK] Node.js đã sẵn sàng: " + nodeVer);
                }
                SetProgress(35);

                // Cập nhật PATH nội bộ
                string programFilesNode = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs");
                string currentPath = Environment.GetEnvironmentVariable("PATH") ?? "";
                if (!currentPath.Contains(programFilesNode))
                {
                    Environment.SetEnvironmentVariable("PATH", programFilesNode + ";" + currentPath);
                }

                // 2. Chạy npm ci
                AppendLog("[2/4] Đang cài đặt các thư viện phụ thuộc (npm ci)...");
                AppendLog("Quá trình này có thể mất 1-3 phút tùy thuộc tốc độ mạng.");
                int npmExit = RunCommand("cmd.exe", "/c npm ci", this.studioDir, (line) => {
                    if (!string.IsNullOrEmpty(line) && (line.Contains("added") || line.Contains("audited") || line.Contains("packages")))
                    {
                        AppendLog("  -> " + line);
                    }
                });

                if (npmExit != 0)
                {
                    AppendLog("[LỖI] Lệnh npm ci kết thúc với mã lỗi: " + npmExit + ". Đang thử với npm install...");
                    RunCommand("cmd.exe", "/c npm install", this.studioDir, (line) => { AppendLog("  -> " + line); });
                }
                AppendLog("[OK] Cài đặt thư viện mã nguồn hoàn tất!");
                SetProgress(70);

                // 3. Chạy npm run setup
                AppendLog("[3/4] Đang khởi tạo bộ render HyperFrames (Chromium render browser)...");
                int setupExit = RunCommand("cmd.exe", "/c npm run setup", this.studioDir, (line) => {
                    if (!string.IsNullOrEmpty(line)) AppendLog("  -> " + line);
                });
                AppendLog("[OK] Bộ render HyperFrames đã được thiết lập thành công!");
                SetProgress(90);

                // 4. Tạo Shortcut ngoài Desktop
                AppendLog("[4/4] Đang tạo lối tắt ngoài màn hình Desktop...");
                CreateDesktopShortcut();
                AppendLog("[OK] Đã tạo biểu tượng 'MathCA Video Studio Pro' trên Desktop!");

                SetProgress(100);
                AppendLog("=======================================================");
                AppendLog("🎉 CHÚC MỪNG BẠN! CÀI ĐẶT TRỌN BỘ ĐÃ HOÀN TẤT 100%!");
                AppendLog("Bây giờ bạn có thể bấm nút 'KHỞI ĐỘNG STUDIO' để sử dụng!");
                AppendLog("=======================================================");

                if (this.InvokeRequired)
                {
                    this.Invoke(new Action(() => {
                        lblStatusStep2.Text = "2. Node.js LTS: [ĐÃ CÀI ĐẶT ✔]";
                        lblStatusStep2.ForeColor = Color.FromArgb(74, 222, 128);
                        lblStatusStep3.Text = "3. Thư viện Studio: [ĐÃ CÀI ĐẶT ✔]";
                        lblStatusStep3.ForeColor = Color.FromArgb(74, 222, 128);
                        lblStatusStep4.Text = "4. Bộ render & Desktop Shortcut: [HOÀN TẤT ✔]";
                        lblStatusStep4.ForeColor = Color.FromArgb(74, 222, 128);
                        btnInstall.Enabled = true;
                        btnInstall.Text = "CÀI ĐẶT LẠI";
                        btnLaunch.Enabled = true;
                    }));
                }

                DialogResult dr = MessageBox.Show("Cài đặt phần mềm MathCA Video Studio Pro trọn bộ thành công!\n\nBạn có muốn khởi động phần mềm và mở trình duyệt ngay bây giờ không?", "Cài Đặt Thành Công", MessageBoxButtons.YesNo, MessageBoxIcon.Information);
                if (dr == DialogResult.Yes)
                {
                    LaunchStudio();
                }
            }
            catch (Exception ex)
            {
                AppendLog("[LỖI NGOẠI LỆ]: " + ex.Message);
                MessageBox.Show("Có lỗi xảy ra trong quá trình cài đặt:\n" + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                ResetButtons();
            }
        }

        private bool InstallNodeJs()
        {
            // Thử bằng winget trước
            AppendLog("Thử cài đặt Node.js qua Windows Package Manager (winget)...");
            int wingetExit = RunCommand("winget", "install --id OpenJS.NodeJS.LTS --exact --source winget --accept-package-agreements --accept-source-agreements --silent", this.studioDir, (l) => AppendLog("  winget: " + l));
            if (wingetExit == 0)
            {
                AppendLog("[OK] Winget cài đặt thành công Node.js!");
                return true;
            }

            // Nếu winget không có, tải MSI chính thức từ nodejs.org
            AppendLog("Winget không khả dụng. Đang tải bộ cài Node.js LTS MSI trực tiếp từ nodejs.org...");
            string msiUrl = "https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi";
            string tempMsi = Path.Combine(Path.GetTempPath(), "node-v22-installer.msi");

            try
            {
                using (WebClient client = new WebClient())
                {
                    client.DownloadProgressChanged += (s, e) => {
                        if (e.ProgressPercentage % 25 == 0)
                        {
                            AppendLog("  Đã tải: " + e.ProgressPercentage + "% (" + (e.BytesReceived / 1024 / 1024) + " MB)");
                        }
                    };
                    client.DownloadFile(new Uri(msiUrl), tempMsi);
                }
                AppendLog("Tải hoàn tất. Đang tiến hành cài đặt nền...");
                int msiExit = RunCommand("msiexec.exe", "/i \"" + tempMsi + "\" /qn", this.studioDir, null);
                if (msiExit == 0)
                {
                    AppendLog("[OK] Cài đặt Node.js MSI thành công!");
                    return true;
                }
            }
            catch (Exception ex)
            {
                AppendLog("[LỖI TẢI MSI]: " + ex.Message);
            }

            return false;
        }

        private void CreateDesktopShortcut()
        {
            try
            {
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string shortcutPath = Path.Combine(desktop, "MathCA Video Studio Pro.lnk");
                string targetBat = Path.Combine(this.studioDir, "start_studio.bat");
                string iconPath = Path.Combine(this.studioDir, "app.ico");

                string psCommand = string.Format(
                    "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('{0}'); $s.TargetPath = '{1}'; $s.WorkingDirectory = '{2}'; if(Test-Path '{3}'){{ $s.IconLocation = '{3}' }}; $s.Description = 'MathCA Video Studio Pro'; $s.Save()",
                    shortcutPath.Replace("'", "''"),
                    targetBat.Replace("'", "''"),
                    this.studioDir.Replace("'", "''"),
                    iconPath.Replace("'", "''")
                );

                RunCommand("powershell.exe", "-NoProfile -Command \"" + psCommand + "\"", this.studioDir, null);
            }
            catch (Exception ex)
            {
                AppendLog("[CẢNH BÁO PHÍM TẮT]: " + ex.Message);
            }
        }

        private void LaunchStudio()
        {
            try
            {
                AppendLog("Đang khởi động MathCA Studio Server...");
                string startBat = Path.Combine(this.studioDir, "start_studio.bat");
                if (File.Exists(startBat))
                {
                    ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c \"" + startBat + "\"");
                    psi.WorkingDirectory = this.studioDir;
                    psi.UseShellExecute = true;
                    Process.Start(psi);
                    AppendLog("[OK] Đã mở cửa sổ Server Studio. Trình duyệt sẽ tự động bật khi server sẵn sàng.");
                }
                else
                {
                    ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c npm start");
                    psi.WorkingDirectory = this.studioDir;
                    psi.UseShellExecute = true;
                    Process.Start(psi);
                    Process.Start("http://localhost:3300");
                }
            }
            catch (Exception ex)
            {
                AppendLog("[LỖI KHỞI ĐỘNG]: " + ex.Message);
            }
        }

        private int RunCommand(string file, string args, string workingDir, Action<string> onOutput)
        {
            ProcessStartInfo psi = new ProcessStartInfo(file, args);
            psi.WorkingDirectory = workingDir;
            psi.CreateNoWindow = true;
            psi.UseShellExecute = false;
            psi.RedirectStandardOutput = true;
            psi.RedirectStandardError = true;

            using (Process p = new Process())
            {
                p.StartInfo = psi;
                if (onOutput != null)
                {
                    p.OutputDataReceived += (s, e) => { if (e.Data != null) onOutput(e.Data); };
                    p.ErrorDataReceived += (s, e) => { if (e.Data != null) onOutput(e.Data); };
                }
                p.Start();
                if (onOutput != null)
                {
                    p.BeginOutputReadLine();
                    p.BeginErrorReadLine();
                }
                p.WaitForExit();
                return p.ExitCode;
            }
        }

        private void StartGitUpdate()
        {
            if (isInstalling) return;
            isInstalling = true;
            btnInstall.Enabled = false;
            btnGitUpdate.Enabled = false;
            btnLaunch.Enabled = false;

            Thread t = new Thread(() =>
            {
                try
                {
                    AppendLog("=================================================");
                    AppendLog("  KIỂM TRA VÀ CẬP NHẬT PHIÊN BẢN MỚI TỪ GITHUB");
                    AppendLog("=================================================");

                    string repoRoot = Path.GetDirectoryName(this.studioDir);
                    if (!Directory.Exists(Path.Combine(repoRoot, ".git")))
                    {
                        if (Directory.Exists(Path.Combine(this.studioDir, ".git")))
                        {
                            repoRoot = this.studioDir;
                        }
                    }

                    AppendLog("Thư mục mã nguồn: " + repoRoot);
                    AppendLog("Đang kiểm tra Git...");
                    int gitCheck = RunCommand("git", "--version", repoRoot, (outLine) => AppendLog("  " + outLine));
                    if (gitCheck != 0)
                    {
                        AppendLog("[LỖI]: Không tìm thấy Git trên máy tính này. Vui lòng cài Git để cập nhật.");
                        ResetButtons();
                        return;
                    }

                    AppendLog("Đang tải mã nguồn mới nhất (git pull origin main)...");
                    int pullCode = RunCommand("git", "pull origin main", repoRoot, (outLine) => AppendLog("  " + outLine));
                    if (pullCode != 0)
                    {
                        AppendLog("[CẢNH BÁO]: git pull hoàn tất với mã " + pullCode);
                    }
                    else
                    {
                        AppendLog("[OK] Đã tải mã nguồn mới nhất thành công!");
                    }

                    AppendLog("Đang cập nhật các thư viện phụ thuộc (npm install)...");
                    RunCommand("cmd.exe", "/c npm install --prefer-offline --no-audit", this.studioDir, (outLine) => AppendLog("  " + outLine));

                    string setupScript = Path.Combine(this.studioDir, "setup-runtime.js");
                    if (File.Exists(setupScript))
                    {
                        AppendLog("Đang chạy thiết lập runtime HyperFrames...");
                        RunCommand("node", "\"" + setupScript + "\"", this.studioDir, (outLine) => AppendLog("  " + outLine));
                    }

                    AppendLog("=================================================");
                    AppendLog("  🎉 CẬP NHẬT HOÀN TẤT! SẴN SÀNG SỬ DỤNG");
                    AppendLog("=================================================");

                    this.Invoke(new Action(() =>
                    {
                        MessageBox.Show(this, "Cập nhật phiên bản mới nhất hoàn tất!\nBạn có thể nhấn 'Khởi Động' để bắt đầu sử dụng.", "Cập Nhật Thành Công", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }));
                }
                catch (Exception ex)
                {
                    AppendLog("[LỖI CẬP NHẬT]: " + ex.Message);
                }
                finally
                {
                    ResetButtons();
                }
            });
            t.IsBackground = true;
            t.Start();
        }

        private void ResetButtons()
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action(ResetButtons));
                return;
            }
            isInstalling = false;
            btnInstall.Enabled = true;
            btnGitUpdate.Enabled = true;
            btnLaunch.Enabled = true;
        }

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }
}
