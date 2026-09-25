using System;
using System.IO;
using System.Diagnostics;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace MathCAStudioLauncher
{
    public class Program
    {
        [STAThread]
        public static void Main(string[] args)
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
            if (!File.Exists(Path.Combine(baseDir, "package.json")))
            {
                string candidate = Path.Combine(baseDir, "mathca-studio");
                if (File.Exists(Path.Combine(candidate, "package.json")))
                {
                    baseDir = candidate;
                }
            }

            // Kiểm tra node_modules
            string nodeModules = Path.Combine(baseDir, "node_modules");
            string installerExe = Path.Combine(baseDir, "Cai_Dat_MathCA_Studio.exe");

            if (!Directory.Exists(nodeModules) || !File.Exists(Path.Combine(nodeModules, "hyperframes", "bin", "hyperframes.mjs")))
            {
                if (File.Exists(installerExe))
                {
                    DialogResult dr = MessageBox.Show(
                        "Phần mềm MathCA Studio chưa được cài đặt trọn bộ trên máy tính này.\n\nBạn có muốn mở trình cài đặt tự động ngay bây giờ không?",
                        "MathCA Studio - Thông Báo",
                        MessageBoxButtons.YesNo,
                        MessageBoxIcon.Question
                    );
                    if (dr == DialogResult.Yes)
                    {
                        Process.Start(installerExe);
                    }
                    return;
                }
            }

            // Khởi động start_studio.bat
            string startBat = Path.Combine(baseDir, "start_studio.bat");
            if (File.Exists(startBat))
            {
                ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c \"" + startBat + "\"");
                psi.WorkingDirectory = baseDir;
                psi.UseShellExecute = true;
                Process.Start(psi);
            }
            else
            {
                // Fallback nếu không có start_studio.bat
                ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c npm start");
                psi.WorkingDirectory = baseDir;
                psi.UseShellExecute = true;
                Process.Start(psi);

                // Polling mở trình duyệt
                ThreadPool.QueueUserWorkItem((state) =>
                {
                    string url = "http://localhost:3300";
                    for (int i = 0; i < 60; i++)
                    {
                        try
                        {
                            HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url + "/api/health");
                            req.Timeout = 1000;
                            using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                            {
                                if (res.StatusCode == HttpStatusCode.OK)
                                {
                                    Process.Start(url);
                                    break;
                                }
                            }
                        }
                        catch { }
                        Thread.Sleep(1000);
                    }
                });
            }
        }
    }
}
