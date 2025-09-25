let widget = null;
const coins = ["DOGEUSDT", "BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "Change Coin"];

// Default fee (0.04% taker per side)
const feeRate = 0.0004; // 0.04%

function formatNumber(num, decimals = 6) {
  return Number(num).toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function saveInputs() {
  const inputs = ["capital", "entryPrice", "stopLoss", "maxRisk"];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) localStorage.setItem(id, el.value);
  });

  // Save direction radio
  const direction = document.querySelector('input[name="tradeDirection"]:checked').value;
  localStorage.setItem("direction", direction);
}

function loadInputs() {
  const inputs = ["capital", "entryPrice", "stopLoss", "maxRisk"];
  inputs.forEach(id => {
    if (localStorage.getItem(id) && document.getElementById(id)) {
      document.getElementById(id).value = localStorage.getItem(id);
    }
  });

  // Load radio button
  if (localStorage.getItem("direction")) {
    const dir = localStorage.getItem("direction");
    const radio = document.querySelector(`input[name="tradeDirection"][value="${dir}"]`);
    if (radio) radio.checked = true;
  }
}

function calculate() {
  const capital = parseFloat(document.getElementById('capital').value);
  const entryPrice = parseFloat(document.getElementById('entryPrice').value);
  const stopLoss = parseFloat(document.getElementById('stopLoss').value);
  const maxRisk = parseFloat(document.getElementById('maxRisk').value);

  // Radio selection
  const direction = document.querySelector('input[name="tradeDirection"]:checked').value;

  let riskPerCoin, positionSize, requiredCapital, affordableCoins, actualRisk;
  let tp1, tp2, tp3, tp4;

  if (direction === "long") {
    if (stopLoss >= entryPrice) {
      document.getElementById('results').innerText = "⚠️ For LONG: Stop loss must be below entry!";
      return;
    }
    riskPerCoin = entryPrice - stopLoss;

    tp1 = entryPrice + (riskPerCoin * 2);
    tp2 = entryPrice + (riskPerCoin * 3);
    tp3 = entryPrice + (riskPerCoin * 4);
    tp4 = entryPrice + (riskPerCoin * 5);
  } else {
    if (stopLoss <= entryPrice) {
      document.getElementById('results').innerText = "⚠️ For SHORT: Stop loss must be above entry!";
      return;
    }
    riskPerCoin = stopLoss - entryPrice;

    tp1 = entryPrice - (riskPerCoin * 2);
    tp2 = entryPrice - (riskPerCoin * 3);
    tp3 = entryPrice - (riskPerCoin * 4);
    tp4 = entryPrice - (riskPerCoin * 5);
  }

  // Position size for max risk
  positionSize = maxRisk / riskPerCoin; // coins
  requiredCapital = positionSize * entryPrice;
  affordableCoins = capital / entryPrice;
  actualRisk = affordableCoins * riskPerCoin;

  // Required Leverage
  const requiredLeverage = requiredCapital / capital;

  // Helper for profit calc
  function profitData(multiple) {
    const rawProfit = maxRisk * multiple;
    const fees = requiredCapital * feeRate * 2; // entry + exit
    const netProfit = rawProfit - fees;
    return {
      raw: formatNumber(rawProfit, 2),
      fees: formatNumber(fees, 2),
      net: formatNumber(netProfit, 2),
    };
  }

  const p1 = profitData(2);
  const p2 = profitData(3);
  const p3 = profitData(4);
  const p4 = profitData(5);

  const resultText = `
🔢 ${direction.toUpperCase()} Risk Management Summary:

🟡 𝐄𝐧𝐭𝐫𝐲 𝐏𝐫𝐢𝐜𝐞: $${formatNumber(entryPrice, 6)}
🔴 𝐒𝐭𝐨𝐩 𝐋𝐨𝐬𝐬: $${formatNumber(stopLoss, 6)}
⚠️ 𝐑𝐢𝐬𝐤 𝐩𝐞𝐫 𝐂𝐨𝐢𝐧: $${formatNumber(riskPerCoin, 6)}


💰 𝐑𝐞𝐪𝐮𝐢𝐫𝐞𝐝 𝐂𝐚𝐩𝐢𝐭𝐚𝐥: $${formatNumber(requiredCapital, 2)}
⚙️ 𝐑𝐞𝐪𝐮𝐢𝐫𝐞𝐝 𝐋𝐞𝐯𝐞𝐫𝐚𝐠𝐞: ${requiredLeverage.toFixed(2)}x

🎯 Take Profit Targets (after fees):
TP1 (1:2) → 𝐏𝐫𝐢𝐜𝐞: $${formatNumber(tp1, 4)} | ✅𝐏𝐫𝐨𝐟𝐢𝐭: $${p1.raw}
TP2 (1:3) → 𝐏𝐫𝐢𝐜𝐞: $${formatNumber(tp2, 4)} | ✅𝐏𝐫𝐨𝐟𝐢𝐭: $${p2.raw}
TP3 (1:4) → 𝐏𝐫𝐢𝐜𝐞: $${formatNumber(tp3, 4)} | ✅𝐏𝐫𝐨𝐟𝐢𝐭: $${p3.raw}
TP4 (1:5) → 𝐏𝐫𝐢𝐜𝐞: $${formatNumber(tp4, 4)} | ✅𝐏𝐫𝐨𝐟𝐢𝐭: $${p4.raw}

💵 Capital: $${capital}
📦 Position Size (for $${maxRisk} risk): ${formatNumber(positionSize)} coins

⚠️ Note: Fees ≈ ${feeRate * 100}% per side. Funding & liquidation buffer not included.
  `;

  document.getElementById('results').innerText = resultText;
  saveInputs();
}

// 🎯 Take Profit Targets (after fees):
// <b>TP1</b> (1:2) → <b>Price:<b> $${formatNumber(tp1, 4)} | ✅Raw: $${p1.raw} |  Net: $${p1.net}
// <b>TP2</b> (1:3) → <b>Price:<b> $${formatNumber(tp2, 4)} | ✅Raw: $${p2.raw} |  Net: $${p2.net}
// <b>TP3</b> (1:4) → <b>Price:<b> $${formatNumber(tp3, 4)} | ✅Raw: $${p3.raw} |  Net: $${p3.net}
// <b>TP4</b> (1:5) → <b>Price:<b> $${formatNumber(tp4, 4)} | ✅Raw: $${p4.raw} |  Net: $${p4.net}


function createChart(symbol) {
  const container = document.getElementById('chart-container');
  container.innerHTML = '';

  widget = new TradingView.widget({
    "autosize": true,
    "symbol": symbol,
    "interval": "15",
    "timezone": "Etc/UTC",
    "theme": "light",
    "style": "1",
    "locale": "en",
    "toolbar_bg": "#f1f3f6",
    "enable_publishing": false,
    "allow_symbol_change": false,
    "container_id": "chart-container"
  });
}

function switchChart(symbol) {
  createChart(symbol);
}

function loadTabs() {
  const tabs = document.querySelector(".chart-tabs");
  coins.forEach(c => {
    const btn = document.createElement("button");
    btn.innerText = c.replace("USDT", "");
    btn.onclick = () => switchChart("BINANCE:" + c);
    tabs.appendChild(btn);
  });
}

window.onload = function() {
  // Add direction radio buttons if not present
  const form = document.querySelector(".container");

  if (!document.getElementById("direction")) {
    const div = document.createElement("div");
    div.className = "form-group";
    div.innerHTML = `
      <label>Direction</label>
      <div class="radio-group" id="direction">
        <label class="radio-option">
          <input type="radio" name="tradeDirection" value="long" checked>
          <span>📈 Long</span>
        </label>
        <label class="radio-option">
          <input type="radio" name="tradeDirection" value="short">
          <span>📉 Short</span>
        </label>
      </div>
    `;
    form.insertBefore(div, form.querySelector("button"));
  }

  loadInputs();
  loadTabs();
  createChart('BINANCE:DOGEUSDT');
  calculate();
};
