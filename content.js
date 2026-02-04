// content.js - ICCID → MSISDN Lookup Tool
(() => {
// =========================================
// ICCID → MSISDN LOOKUP TOOL
// 1. Accepts partial ICCID numbers (e.g., 6651908)
// 2. Adds "8925263790000" prefix automatically
// 3. Searches by ICCID in the dropdown
// 4. Extracts MSISDN from results
// 5. Returns single-column MSISDN results for Excel
// =========================================

function showIccidInputDialog() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center;
    z-index: 2147483647; font-family: Arial, sans-serif;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white; padding: 20px; border-radius: 8px;
    width: 90%; max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  `;

  const title = document.createElement('h3');
  title.textContent = 'Enter ICCID List (Partial Numbers)';
  title.style.marginTop = '0';

  const instructions = document.createElement('p');
  instructions.innerHTML = 'Enter partial ICCID numbers (one per line).<br>Prefix <code>8925263790000</code> will be added automatically.<br><br>Example:<br><code>6651908<br>6652336<br>6652435</code>';
  instructions.style.fontSize = '14px';
  instructions.style.color = '#555';
  instructions.style.fontFamily = 'monospace';

  const textarea = document.createElement('textarea');
  textarea.placeholder = '6651908\n6652336\n6652435\n6652633';
  textarea.rows = 10;
  textarea.style.cssText = `
    width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;
    font-family: monospace; font-size: 14px; margin: 10px 0;
  `;

  const buttonContainer = document.createElement('div');
  buttonContainer.style.textAlign = 'right';

  const startBtn = document.createElement('button');
  startBtn.textContent = 'Start Lookup';
  startBtn.style.cssText = `
    background: #17a2b8; color: white; border: none; padding: 8px 16px;
    border-radius: 4px; cursor: pointer; font-size: 14px;
  `;
  startBtn.onclick = () => {
    const input = textarea.value.trim();
    if (!input) {
      alert('Please enter at least one ICCID number.');
      return;
    }

    // Split by newline and process
    const partialIccidList = input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');

    if (partialIccidList.length === 0) {
      alert('No valid ICCID numbers found.');
      return;
    }

    // Add prefix to create full ICCID
    const fullIccidList = partialIccidList.map(partial => 
      '8925263790000' + partial
    );

    document.body.removeChild(overlay);
    batchIccidToMsisdnLookup(partialIccidList, fullIccidList);
  };

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = `
    background: #6c757d; color: white; border: none; padding: 8px 16px;
    border-radius: 4px; cursor: pointer; font-size: 14px; margin-right: 8px;
  `;
  cancelBtn.onclick = () => {
    document.body.removeChild(overlay);
  };

  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(startBtn);

  modal.appendChild(title);
  modal.appendChild(instructions);
  modal.appendChild(textarea);
  modal.appendChild(buttonContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  textarea.focus();
}

// =========================================
// BATCH ICCID → MSISDN LOOKUP FUNCTION
// =========================================
async function batchIccidToMsisdnLookup(partialIccidList, fullIccidList) {
  const wait = (ms) => new Promise(res => setTimeout(res, ms));

  function clickHomeLogo() {
    const logo = document.querySelector("img.logoImg");
    if (!logo) {
      console.warn("⚠️ Home logo not found.");
      return false;
    }
    logo.click();
    console.log("🏠 Home logo clicked.");
    return true;
  }

  console.log("🚀 Starting batch ICCID → MSISDN lookup...");
  
  // Start from home page
  if (!clickHomeLogo()) {
    console.error("❌ Failed to navigate to home. Aborting.");
    return;
  }
  await wait(1500); // Increased wait for page load

  const results = [];

  for (let i = 0; i < fullIccidList.length; i++) {
    const partial = partialIccidList[i];
    const fullIccid = fullIccidList[i];
    
    console.log(`\n🔍 Processing: ${partial} → ${fullIccid}`);

    // 1. Select ICCID from dropdown
    const select = document.querySelector("select#idtype");
    if (!select) {
      results.push({ partial, fullIccid, msisdn: "" });
      console.warn("❌ Search dropdown not found");
      continue;
    }
    
    // Find ICCID option
    const option = [...select.options].find(
      opt => opt.textContent.trim().toLowerCase() === "iccid"
    );
    if (!option) {
      results.push({ partial, fullIccid, msisdn: "" });
      console.warn("❌ ICCID option not found in dropdown");
      continue;
    }
    
    select.value = option.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await wait(500); // Increased wait for dropdown change

    // 2. Fill search input with FULL ICCID
    const input = document.querySelector("input#number");
    if (!input) {
      results.push({ partial, fullIccid, msisdn: "" });
      console.warn("❌ Search input not found");
      continue;
    }
    
    input.value = fullIccid;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(300);

    // 3. Click search button
    const searchBtn = [...document.querySelectorAll("button.btn.btn-info")]
      .find(btn => btn.textContent.trim().toLowerCase().includes("search"));
    if (!searchBtn) {
      results.push({ partial, fullIccid, msisdn: "" });
      console.warn("❌ Search button not found");
      continue;
    }
    
    searchBtn.click();
    await wait(1200); // Increased wait for search results

    // 4. Wait for results and extract MSISDN
    let msisdn = "";
    let notFoundDetected = false;
    let success = false;
    const timeout = 8000; // Increased timeout to 8 seconds
    const start = performance.now();
    let pageLoadChecks = 0;
    const maxPageLoadChecks = 10; // Check 10 times for page load

    while (performance.now() - start < timeout) {
      pageLoadChecks++;
      
      // Wait longer on initial load
      if (pageLoadChecks < 3) {
        await wait(800); // Longer wait for initial page load
      } else {
        await wait(400);
      }

      // Check for "not found" messages
      const bodyText = document.body.innerText.toLowerCase();
      if (bodyText.includes('subscriber not found') || 
          bodyText.includes('no record') || 
          bodyText.includes('not found')) {
        notFoundDetected = true;
        console.log(`⚠️ "Not found" detected for ${fullIccid}`);
        break;
      }

      const errorEl = document.querySelector('.alert-danger, .text-danger, .modal.show .modal-body');
      if (errorEl && /not found|no record|subscriber not found/i.test(errorEl.textContent)) {
        notFoundDetected = true;
        console.log(`⚠️ Error element found for ${fullIccid}`);
        break;
      }

      // Look for MSISDN in the format: "Summary for: 717711075"
      const summaryHeaders = document.querySelectorAll('h6.red');
      for (const header of summaryHeaders) {
        const text = header.textContent.trim();
        if (text.startsWith('Summary for:')) {
          // Extract just the number (remove "Summary for: ")
          msisdn = text.replace('Summary for:', '').trim();
          success = true;
          console.log(`✅ Found MSISDN in summary header: ${msisdn}`);
          break;
        }
      }
      
      // Also check for MSISDN in other common elements
      if (!success) {
        // Check for any element containing MSISDN pattern
        const msisdnElements = document.querySelectorAll('*');
        for (const el of msisdnElements) {
          if (el.textContent && /^7\d{8}$/.test(el.textContent.trim())) {
            msisdn = el.textContent.trim();
            success = true;
            console.log(`✅ Found MSISDN in element: ${msisdn}`);
            break;
          }
        }
      }
      
      if (success) break;
      
      // Check if page is still loading
      const loadingIndicator = document.querySelector('.loading, .spinner, [aria-busy="true"]');
      if (loadingIndicator) {
        console.log(`⏳ Page still loading for ${fullIccid}, waiting...`);
        await wait(500);
        continue;
      }
    }

    if (notFoundDetected) {
      console.log(`❌ Subscriber not found: ${fullIccid}`);
      results.push({ partial, fullIccid, msisdn: "" });
    } else if (success) {
      console.log(`✅ Found MSISDN: ${msisdn}`);
      results.push({ partial, fullIccid, msisdn });
    } else {
      console.warn(`⚠️ Timeout for ${fullIccid} after ${timeout}ms`);
      results.push({ partial, fullIccid, msisdn: "" });
    }

    // 5. Return to home for next search
    if (!clickHomeLogo()) {
      console.warn("⚠️ Could not return to home.");
    }
    await wait(1500); // Increased wait for homepage load
  }

  // =========================================
  // DISPLAY RESULTS (SINGLE COLUMN MSISDN FOR EXCEL)
  // =========================================
  const resultsOverlay = document.createElement('div');
  resultsOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center;
    z-index: 2147483647; font-family: Arial, sans-serif;
  `;

  const resultsModal = document.createElement('div');
  resultsModal.style.cssText = `
    background: white; padding: 25px; border-radius: 10px;
    width: 92%; max-width: 700px; box-shadow: 0 5px 30px rgba(0,0,0,0.5);
    max-height: 90vh; overflow: auto;
  `;

  // Header
  const header = document.createElement('div');
  header.innerHTML = `<h2 style="margin:0 0 15px 0; color:#1a5fb4">✅ ICCID → MSISDN Lookup Complete!</h2>
    <p style="margin:0 0 20px 0; color:#555">
      <strong>${partialIccidList.length}</strong> ICCIDs processed •
      Empty lines mean "not found"
    </p>`;
  resultsModal.appendChild(header);

  // ===== SINGLE COLUMN MSISDN OUTPUT =====
  const singleColumnSection = document.createElement('div');
  singleColumnSection.style.cssText = 'margin-bottom: 25px;';
  
  const singleColumnTitle = document.createElement('h3');
  singleColumnTitle.textContent = '📋 MSISDN Column (Paste directly into Excel):';
  singleColumnTitle.style.cssText = 'margin:0 0 12px 0; color:#28a745; font-size:18px;';
  singleColumnSection.appendChild(singleColumnTitle);
  
  // Create single column of MSISDNs (empty lines for not found)
  const msisdnColumn = results.map(r => r.msisdn || '').join('\n');
  
  const singleColumnPre = document.createElement('pre');
  singleColumnPre.textContent = msisdnColumn;
  singleColumnPre.style.cssText = `
    background: #f0f8ff; border: 2px solid #28a745; border-radius: 8px;
    padding: 20px; font-family: 'Courier New', monospace; font-size: 16px; line-height: 1.8;
    white-space: pre; margin-bottom: 20px; max-height: 400px; overflow: auto;
    text-align: center;
  `;
  singleColumnSection.appendChild(singleColumnPre);
  
  // Copy single column button
  const copySingleColumnBtn = document.createElement('button');
  copySingleColumnBtn.innerHTML = '📋 Copy MSISDN Column';
  copySingleColumnBtn.style.cssText = `
    background: #28a745; color: white; border: none; padding: 12px 24px;
    border-radius: 6px; font-size: 16px; font-weight: 500; cursor: pointer;
    display: inline-flex; align-items: center; gap: 8px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15); transition: all 0.2s;
    width: 100%;
  `;
  copySingleColumnBtn.onmouseover = () => copySingleColumnBtn.style.background = '#218838';
  copySingleColumnBtn.onmouseout = () => copySingleColumnBtn.style.background = '#28a745';
  copySingleColumnBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(msisdnColumn);
      showFeedback('✅ MSISDN column copied! Paste directly into Excel.', '#d4edda', '#155724');
    } catch (err) {
      const temp = document.createElement('textarea');
      temp.value = msisdnColumn;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      showFeedback('✅ Copied (fallback method)', '#d1ecf1', '#0c5460');
    }
  };
  singleColumnSection.appendChild(copySingleColumnBtn);
  
  resultsModal.appendChild(singleColumnSection);

  // ===== DETAILED VIEW (COLLAPSIBLE) =====
  const detailsSection = document.createElement('details');
  detailsSection.style.cssText = 'margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 6px;';
  
  const detailsSummary = document.createElement('summary');
  detailsSummary.textContent = '📊 Detailed Results View';
  detailsSummary.style.cssText = 'font-weight: bold; cursor: pointer; color: #6f42c1;';
  detailsSection.appendChild(detailsSummary);
  
  // Create detailed table
  const detailsTable = document.createElement('table');
  detailsTable.style.cssText = `
    width: 100%; border-collapse: collapse; margin-top: 15px;
    font-family: Arial, sans-serif; font-size: 14px;
  `;
  
  // Table header
  const detailsThead = document.createElement('thead');
  detailsThead.innerHTML = `
    <tr style="background: #f8f9fa;">
      <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">#</th>
      <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Partial ICCID</th>
      <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">MSISDN</th>
      <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Status</th>
    </tr>
  `;
  detailsTable.appendChild(detailsThead);
  
  // Table body
  const detailsTbody = document.createElement('tbody');
  results.forEach((result, index) => {
    const row = document.createElement('tr');
    const status = result.msisdn ? '✅ Found' : '❌ Not Found';
    const statusColor = result.msisdn ? '#28a745' : '#dc3545';
    
    row.innerHTML = `
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
      <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace;">${result.partial}</td>
      <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; font-weight: bold;">${result.msisdn || '(empty)'}</td>
      <td style="padding: 8px; border: 1px solid #ddd; color: ${statusColor}; font-weight: bold;">${status}</td>
    `;
    detailsTbody.appendChild(row);
  });
  detailsTable.appendChild(detailsTbody);
  detailsSection.appendChild(detailsTable);
  
  resultsModal.appendChild(detailsSection);

  // ===== ACTION BUTTONS =====
  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = `
    display: flex; gap: 12px; justify-content: space-between; 
    margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;
  `;

  // Download TXT button (MSISDN only)
  const downloadBtn = document.createElement('button');
  downloadBtn.innerHTML = '📥 Download MSISDN List';
  downloadBtn.style.cssText = `
    flex: 1; padding: 12px; background: #17a2b8; color: white; border: none;
    border-radius: 6px; font-size: 16px; font-weight: 500; cursor: pointer;
    transition: all 0.2s;
  `;
  downloadBtn.onmouseover = () => downloadBtn.style.background = '#138496';
  downloadBtn.onmouseout = () => downloadBtn.style.background = '#17a2b8';
  downloadBtn.onclick = () => {
    // Create simple text file with MSISDNs only
    const blob = new Blob([msisdnColumn], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `msisdn_results_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showFeedback('✅ MSISDN list downloaded!', '#d4edda', '#155724');
  };

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = 'Close Operation';
  closeBtn.style.cssText = `
    flex: 1; padding: 12px; background: #6c757d; color: white; border: none;
    border-radius: 6px; font-size: 16px; font-weight: 500; cursor: pointer;
    transition: all 0.2s;
  `;
  closeBtn.onmouseover = () => closeBtn.style.background = '#5a6268';
  closeBtn.onmouseout = () => closeBtn.style.background = '#6c757d';
  closeBtn.onclick = () => document.body.removeChild(resultsOverlay);

  btnContainer.appendChild(downloadBtn);
  btnContainer.appendChild(closeBtn);
  resultsModal.appendChild(btnContainer);

  // Feedback helper
  function showFeedback(message, bg, color) {
    if (document.getElementById('result-feedback')) {
      document.getElementById('result-feedback').remove();
    }
    const fb = document.createElement('div');
    fb.id = 'result-feedback';
    fb.innerHTML = message;
    fb.style.cssText = `
      position: fixed; bottom: 25px; right: 25px; padding: 12px 24px; border-radius: 8px;
      background: ${bg}; color: ${color}; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 2147483647; animation: fadeFeedback 3s forwards;
      max-width: 350px; text-align: center;
    `;
    document.head.insertAdjacentHTML('beforeend', `
      <style>
        @keyframes fadeFeedback { 
          0% { opacity: 1; transform: translateY(0); } 
          70% { opacity: 1; } 
          100% { opacity: 0; transform: translateY(-15px); } 
        }
      </style>
    `);
    document.body.appendChild(fb);
    setTimeout(() => {
      if (fb.parentNode) fb.parentNode.removeChild(fb);
    }, 3000);
  }

  resultsOverlay.appendChild(resultsModal);
  document.body.appendChild(resultsOverlay);

  console.log("📊 Results ready. Single MSISDN column with empty lines for not found.");
  console.log("MSISDN Column:");
  console.log(msisdnColumn);

  // 👇 ADD THIS BLOCK 👇
  // Output detailed results as a table in the console
  console.table(results.map((r, i) => ({
    "#": i + 1,
    "Partial ICCID": r.partial,
    "Full ICCID": r.fullIccid,
    "MSISDN": r.msisdn || "(not found)",
    "Status": r.msisdn ? "✅ Found" : "❌ Not Found"
  })));
  // 👆 END OF ADDITION 👆

  resultsOverlay.appendChild(resultsModal);
  document.body.appendChild(resultsOverlay);
  
}

// =========================================
// LAUNCH INPUT DIALOG
// =========================================
showIccidInputDialog();
})();
