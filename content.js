// content.js - Precise MSISDN Extraction & Responsive UI
(() => {
  const waitForResult = (selector, timeout = 8000) => {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        // Look for the element AND ensure it contains a number starting with 7
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
      z-index: 2147483647; font-family: -apple-system, system-ui, sans-serif; padding: 10px; box-sizing: border-box;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white; padding: 20px; border-radius: 16px;
      width: 100%; max-width: 420px; box-shadow: 0 15px 35px rgba(0,0,0,0.3);
      max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;
    `;

    modal.innerHTML = `
      <h3 style="margin: 0 0 8px 0; font-size: 1.25rem; color: #333;">ICCID Lookup</h3>
      <p style="margin: 0 0 15px 0; font-size: 0.85rem; color: #666;">Prefix 8925263790000 is auto-added.</p>
      
      <textarea id="iccidInput" placeholder="Enter partial ICCIDs...&#10;6651908&#10;6652336" 
        style="width: 100%; flex: 1; min-height: 150px; padding: 12px; border: 2px solid #eee; border-radius: 10px; font-family: 'Courier New', monospace; font-size: 16px; box-sizing: border-box; outline: none; transition: border 0.2s;"></textarea>
      
      <div id="statusUpdate" style="margin-top: 12px; font-size: 0.9rem; color: #17a2b8; font-weight: 600; text-align: center;">Ready to start</div>
      
      <div style="margin-top: 18px; display: flex; gap: 10px;">
        <button id="cancelBtn" style="flex: 1; padding: 14px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 10px; cursor: pointer; font-weight: 600; color: #444;">Cancel</button>
        <button id="startBtn" style="flex: 2; padding: 14px; background: #007bff; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 6px rgba(0,123,255,0.2);">Start Lookup</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const textarea = modal.querySelector('#iccidInput');
    const statusDiv = modal.querySelector('#statusUpdate');
    const startBtn = modal.querySelector('#startBtn');

    modal.querySelector('#cancelBtn').onclick = () => document.body.removeChild(overlay);
    
    startBtn.onclick = async () => {
      const input = textarea.value.trim();
      if (!input) return;

      const partialList = input.split('\n').map(l => l.trim()).filter(l => l);
      const fullList = partialList.map(p => '8925263790000' + p);

      textarea.disabled = true;
      startBtn.disabled = true;
      startBtn.style.opacity = '0.5';

      const results = [];
      for (let i = 0; i < fullList.length; i++) {
        statusDiv.textContent = `⚡ Processing ${i + 1} of ${fullList.length}`;
        const res = await performLookup(partialList[i], fullList[i]);
        results.push(res);
      }

      document.body.removeChild(overlay);
      showResultsModal(results);
    };
  }

  async function performLookup(partial, fullIccid) {
    // 1. Trigger Home Navigation
    const logo = document.querySelector("img.logoImg");
    if (logo) logo.click();
    
    // 2. Wait for form to exist
    await new Promise(r => setTimeout(r, 700)); 
    const dropdown = document.querySelector("select#idtype");
    if (!dropdown) return { partial, msisdn: "" };

    // 3. Select ICCID & Input Number
    dropdown.value = [...dropdown.options].find(o => o.text.toUpperCase().includes('ICCID'))?.value || "ICCID";
    dropdown.dispatchEvent(new Event("change", { bubbles: true }));

    const inputField = document.querySelector("input#number");
    if (inputField) {
      inputField.value = fullIccid;
      inputField.dispatchEvent(new Event("input", { bubbles: true }));
    }
    
    const searchBtn = [...document.querySelectorAll("button")].find(b => b.innerText.toUpperCase().includes('SEARCH'));
    if (searchBtn) searchBtn.click();

    // 4. PRECISE EXTRACTION
    // Specifically looking for the <h6> with class "red"
    const resultHeader = await waitForResult("h6.red", 7000);
    
    let msisdn = "";
    if (resultHeader) {
      const text = resultHeader.innerText;
      // REGEX: Look for a number starting with 7 followed by 8 more digits
      const match = text.match(/7\d{8}/);
      if (match) {
        msisdn = match[0];
        console.log(`✅ Extracted: ${msisdn}`);
      }
    }

    return { partial, msisdn };
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
      background: white; width: 100%; max-width: 400px; border-radius: 16px;
      padding: 24px; max-height: 85vh; display: flex; flex-direction: column; box-sizing: border-box;
    `;

    modal.innerHTML = `
      <h3 style="margin: 0 0 5px 0; font-size: 1.2rem;">Lookup Complete</h3>
      <p style="margin: 0 0 15px 0; font-size: 0.85rem; color: #666;">Copy the column below for Excel:</p>
      
      <textarea readonly style="width: 100%; flex: 1; font-family: 'Courier New', monospace; padding: 12px; border: 2px solid #e8f0fe; border-radius: 10px; font-size: 16px; line-height: 1.6; box-sizing: border-box; background: #fbfcfe;">${msisdnColumn}</textarea>
      
      <button id="copyBtn" style="width:100%; margin-top:15px; padding: 16px; background: #28a745; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 10px rgba(40,167,69,0.3);">📋 Copy MSISDN Column</button>
      <button id="closeBtn" style="width:100%; margin-top:10px; padding: 10px; background: transparent; color: #888; border: none; cursor: pointer; font-size: 0.9rem;">Close window</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector('#copyBtn').onclick = () => {
      navigator.clipboard.writeText(msisdnColumn);
      modal.querySelector('#copyBtn').textContent = '✅ Copied to Clipboard';
      modal.querySelector('#copyBtn').style.background = '#1e7e34';
    };
    modal.querySelector('#closeBtn').onclick = () => document.body.removeChild(overlay);
  }

  showIccidInputDialog();
})();
