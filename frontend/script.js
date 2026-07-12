// 反诈人生 前端逻辑

const inputText = document.getElementById("input-text");
const analyzeBtn = document.getElementById("analyze-btn");
const resultArea = document.getElementById("result");

// 后端 API 地址（开发环境下后端默认运行在 3000 端口）
const API_BASE = "http://localhost:3000";

analyzeBtn.addEventListener("click", async () => {
  const text = inputText.value.trim();
  if (!text) {
    alert("请先输入可疑内容");
    return;
  }

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "分析中...";
  resultArea.hidden = true;

  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`请求失败，状态码：${response.status}`);
    }

    const data = await response.json();
    resultArea.textContent = data.result || "暂无分析结果";
    resultArea.hidden = false;
  } catch (err) {
    resultArea.textContent = `出错了：${err.message}`;
    resultArea.hidden = false;
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "开始分析";
  }
});
