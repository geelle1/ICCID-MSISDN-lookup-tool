// content.js - ICCID Lookup + Progress + Top-up + Console Table
(() => {
  const waitForResult = (selector, timeout = 8000) => {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el && /7\d{8}/.test(el.innerText)) {
          clearInterval(interval);
          resolve(el);
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);
          resolve(null);
        }
      }, 200);
    });
  };

  function showIccidInputDialog() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.75); display: flex; justify-content: center; align-items: center;
      z-index: 2147483647; font-family: -apple-system, sans-serif; padding: 10px; box-sizing: border-box;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white; padding: 20px; border-radius: 16px;
      width: 100%; max-width: 420px; box-shadow: 0 15px 35px rgba(0,0,0,0.3);
      max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;
    `;

    modal.innerHTML = `
      <h3 style="margin: 0 0 8px 0; font-size: 1.25rem;">ICCID Lookup</h3>
      <p style="margin: 0 0 15px 0; font-size: 0.85rem; color: #666;">Prefix 8925263790000 added automatically.</p>
      
      <textarea id="iccidInput" placeholder="Enter partials..." 
        style="width: 100%; flex: 1; min-height: 120px; padding: 12px; border: 2px solid #eee; border-radius: 10px; font-family: monospace; font-size: 16px; box-sizing: border-box; outline: none;"></textarea>
      
      <div id="progressContainer" style="display: none; margin-top: 15px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px; font-weight: bold; color: #17a2b8;">
          <span id="statusUpdate">Processing...</span>
          <span id="percentUpdate">0%</span>
        </div>
        <div style="width: 100%; background: #eee; height: 10px; border-radius: 5px; overflow: hidden;">
          <div id="progressBar" style="width: 0%; height: 100%; background: #17a2b8; transition: width 0.3s ease;"></div>
        </div>
      </div>

      <div style="margin-top: 18px; display: flex; gap: 10px;">
        <button id="cancelBtn" style="flex: 1; padding: 14px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 10px; cursor: pointer;">Cancel</button>
        <button id="startBtn" style="flex: 2; padding: 14px; background: #007bff; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">Start Lookup</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const textarea = modal.querySelector('#iccidInput');
    const startBtn = modal.querySelector('#startBtn');
    const progressContainer = modal.querySelector('#progressContainer');
    const progressBar = modal.querySelector('#progressBar');
    const statusDiv = modal.querySelector('#statusUpdate');
    const percentDiv = modal.querySelector('#percentUpdate');

    modal.querySelector('#cancelBtn').onclick = () => document.body.removeChild(overlay);
    
    startBtn.onclick = async () => {
      const input = textarea.value.trim();
      if (!input) return;
      const partialList = input.split('\n').map(l => l.trim()).filter(l => l);
      const fullList = partialList.map(p => '8925263790000' + p);
      
      textarea.disabled = true;
      startBtn.disabled = true;
      startBtn.style.opacity = '0.5';
      progressContainer.style.display = 'block';

      const results = [];
      for (let i = 0; i < fullList.length; i++) {
        const progress = Math.round(((i) / fullList.length) * 100);
        progressBar.style.width = `${progress}%`;
        percentDiv.textContent = `${progress}%`;
        statusDiv.textContent = `⚡ Item ${i + 1} of ${fullList.length}`;

        const res = await performLookup(partialList[i], fullList[i]);
        results.push(res);
      }

      progressBar.style.width = `100%`;
      percentDiv.textContent = `100%`;

      // LOG TO CONSOLE TABLE
      console.log("%c📊 BATCH LOOKUP COMPLETE", "color: #17a2b8; font-weight: bold; font-size: 14px;");
      console.table(results.map((r, idx) => ({
        "#": idx + 1,
        "Partial ICCID": r.partial,
        "MSISDN": r.msisdn || "Not Found",
        "Last Top-up": r.topup
      })));

      setTimeout(() => {
        document.body.removeChild(overlay);
        showResultsModal(results);
      }, 500);
    };
  }

  async function performLookup(partial, fullIccid) {
    const logo = document.querySelector("img.logoImg");
    if (logo) logo.click();
    await new Promise(r => setTimeout(r, 700)); 
    const dropdown = document.querySelector("select#idtype");
    if (!dropdown) return { partial, msisdn: "", topup: "N/A" };

    dropdown.value = [...dropdown.options].find(o => o.text.toUpperCase().includes('ICCID'))?.value || "ICCID";
    dropdown.dispatchEvent(new Event("change", { bubbles: true }));

    const inputField = document.querySelector("input#number");
    if (inputField) {
      inputField.value = fullIccid;
      inputField.dispatchEvent(new Event("input", { bubbles: true }));
    }
    
    const searchBtn = [...document.querySelectorAll("button")].find(b => b.innerText.toUpperCase().includes('SEARCH'));
    if (searchBtn) searchBtn.click();

    const resultHeader = await waitForResult("h6.red", 7000);
    
    let msisdn = "";
    let topup = "Not Found";

    if (resultHeader) {
      const match = resultHeader.innerText.match(/7\d{8}/);
      if (match) msisdn = match[0];

      const pTags = document.querySelectorAll('p');
      for (const p of pTags) {
        if (p.textContent.includes("Last Top-up Amount")) {
          const valueEl = p.nextElementSibling || p.parentElement.querySelector('h6, span, b');
          if (valueEl) topup = valueEl.textContent.trim();
          break;
        }
      }
    }

    return { partial, msisdn, topup };
  }

  function showResultsModal(results) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center;
      z-index: 2147483647; padding: 10px; box-sizing: border-box;
    `;

    const msisdnColumn = results.map(r => r.msisdn).join('\n');

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white; width: 100%; max-width: 550px; border-radius: 16px;
      padding: 20px; max-height: 90vh; display: flex; flex-direction: column; box-sizing: border-box;
    `;

    const tableRows = results.map((r, i) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px; font-size: 13px; color: #888;">${i + 1}</td>
        <td style="padding: 10px; font-size: 13px; font-family: monospace;">${r.partial}</td>
        <td style="padding: 10px; font-size: 13px; font-weight: bold; color: ${r.msisdn ? '#28a745' : '#dc3545'};">
          ${r.msisdn || 'Not Found'}
        </td>
        <td style="padding: 10px; font-size: 13px; color: #555; text-align: right;">
          ${r.topup}
        </td>
      </tr>
    `).join('');

    modal.innerHTML = `
      <h3 style="margin: 0 0 10px 0; font-size: 1.2rem;">Lookup Results</h3>
      <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: #666;">Check Console (F12) for detailed log table.</p>
      
      <div style="flex: 1; overflow-y: auto; margin-bottom: 15px; border: 1px solid #eee; border-radius: 10px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead style="background: #f8f9fa; position: sticky; top: 0; z-index: 1;">
            <tr>
              <th style="padding: 10px; font-size: 11px; color: #999; border-bottom: 2px solid #eee;">#</th>
              <th style="padding: 10px; font-size: 11px; color: #999; border-bottom: 2px solid #eee;">ICCID</th>
              <th style="padding: 10px; font-size: 11px; color: #999; border-bottom: 2px solid #eee;">MSISDN</th>
              <th style="padding: 10px; font-size: 11px; color: #999; border-bottom: 2px solid #eee; text-align: right;">TOP-UP</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>

      <button id="copyBtn" style="width:100%; padding: 16px; background: #28a745; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 1rem;">📋 Copy MSISDN Column</button>
      <button id="closeBtn" style="width:100%; margin-top:10px; padding: 10px; background: transparent; color: #999; border: none; cursor: pointer; font-size: 0.9rem;">Close</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector('#copyBtn').onclick = () => {
      navigator.clipboard.writeText(msisdnColumn);
      modal.querySelector('#copyBtn').textContent = '✅ MSISDNs Copied!';
      setTimeout(() => { modal.querySelector('#copyBtn').textContent = '📋 Copy MSISDN Column'; }, 2000);
    };
    modal.querySelector('#closeBtn').onclick = () => document.body.removeChild(overlay);
  }

  showIccidInputDialog();
})();
