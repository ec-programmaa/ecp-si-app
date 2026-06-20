document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const siForm = document.getElementById('siForm');
  const btnAddContainer = document.getElementById('btnAddContainer');
  const containerTableBody = document.getElementById('containerTableBody');
  const btnCalculate = document.getElementById('btnCalculate');
  const btnCopyConsignee = document.getElementById('btnCopyConsignee');
  const btnToggleEditPort = document.getElementById('btnToggleEditPort');
  const portDetailsContainer = document.getElementById('portDetailsContainer');
  
  // Textareas
  const shipperDetailsTop = document.getElementById('shipperDetailsTop');
  const shipperDetailsBottom = document.getElementById('shipperDetailsBottom');
  const consigneeDetailsTop = document.getElementById('consigneeDetailsTop');
  const consigneeDetailsBottom = document.getElementById('consigneeDetailsBottom');
  const notifyDetails = document.getElementById('notifyDetails');
  
  // Toggles
  const syncShipperToggle = document.getElementById('syncShipperToggle');
  const syncConsigneeToggle = document.getElementById('syncConsigneeToggle');
  const shipperSyncBadge = document.getElementById('shipperSyncBadge');
  const consigneeSyncBadge = document.getElementById('consigneeSyncBadge');

  // Volume Details Inputs
  const volumeGrossWeight = document.getElementById('volumeGrossWeight');
  const volumeNetWeight = document.getElementById('volumeNetWeight');
  const volumeCBM = document.getElementById('volumeCBM');
  const totalNoContainers = document.getElementById('totalNoContainers');
  const volumeNoOfPackages = document.getElementById('volumeNoOfPackages');
  const volumePackageUnit = document.getElementById('volumePackageUnit');

  // Modal elements
  const successModal = document.getElementById('successModal');
  const modalJobNo = document.getElementById('modalJobNo');
  const jsonSummaryContent = document.getElementById('jsonSummaryContent');
  const btnCopyToClipboard = document.getElementById('btnCopyToClipboard');
  const btnDismissModal = document.getElementById('btnDismissModal');
  const toastContainer = document.getElementById('toastContainer');

  // --- Constants for validation ---
  const MAX_ROWS = 5;
  const MAX_CHARS_PER_ROW = 45;

  // --- State Variables ---
  let isEditingPort = false;

  // --- Initial SI Information Dataset ---
  const initialSiData = {
    jobNo: "TCRNE60020",
    bookingParty: "E-SHIP GLOBAL LOGISTICS INDIA PRIVATE L",
    shipperDetails: "OCEAN GENERATION SHIPPING PVT LTD\nNO 12 NEW SHORELINE BLDG\nPORT ROAD COCHIN INDIA\nPIN 682003",
    consigneeDetails: "E-SHIP GLOBAL LOGISTICS INDIA PVT L\nBUILDING 4B PLOT 12\nINDUSTRIAL SECTOR 3 CHENNAI\nPIN 600001",
    notifyDetails: "E-SHIP GLOBAL LOGISTICS INDIA PVT L\nBUILDING 4B PLOT 12\nINDUSTRIAL SECTOR 3 CHENNAI\nPIN 600001",
    blConfiguration: {
      noOfOriginalBL: "3",
      blType: "ORIGINAL"
    },
    containers: [
      {
        containerNo: "OCGU20334",
        type: "40HC",
        sealNo: "SL998877",
        noOfPkgs: 120,
        pkgUnit: "CART",
        grossWt: 12450.500,
        netWt: 11800.000,
        wtUnit: "KGS",
        volume: 68.200
      },
      {
        containerNo: "MSKU8877665",
        type: "20GP",
        sealNo: "SL112233",
        noOfPkgs: 85,
        pkgUnit: "CART",
        grossWt: 8400.000,
        netWt: 7950.000,
        wtUnit: "KGS",
        volume: 32.500
      }
    ],
    portAndVessel: {
      portReceipt: "TUTICORIN",
      portLoading: "TUTICORIN",
      portDischarge: "WEST PORT KLANG, MAL",
      finalDestination: "WEST PORT KLANG, MAL",
      vessel: "ZHONG PENG YOU YI",
      voyage: "26041"
    }
  };

  // --- Initialize Textareas & Counters ---
  const textareasToManage = [
    { el: shipperDetailsTop, counter: document.getElementById('shipperCounterTop') },
    { el: consigneeDetailsTop, counter: document.getElementById('consigneeCounterTop') },
    { el: notifyDetails, counter: document.getElementById('notifyCounter') },
    { el: shipperDetailsBottom, counter: document.getElementById('shipperCounterBottom') },
    { el: consigneeDetailsBottom, counter: document.getElementById('consigneeCounterBottom') }
  ];

  // --- Helper: Create Toast Notification ---
  function showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, duration);
  }

  // --- Logic for enforce 5 lines & 45 chars limit ---
  function enforceConstraints(textarea, e) {
    const val = textarea.value;
    const lines = val.split('\n');
    const cursorPos = textarea.selectionStart;
    
    let charCount = 0;
    let currentLineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLengthWithNewline = lines[i].length + 1;
      if (cursorPos >= charCount && cursorPos <= charCount + lines[i].length) {
        currentLineIndex = i;
        break;
      }
      charCount += lineLengthWithNewline;
    }
    
    const currentLine = lines[currentLineIndex] || "";
    const isPrintableKey = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
    const isSelected = textarea.selectionStart !== textarea.selectionEnd;

    if (e.key === 'Enter') {
      if (lines.length >= MAX_ROWS && !isSelected) {
        e.preventDefault();
        showToast('Maximum 5 lines allowed!', 'error', 2500);
        return;
      }
    }
    
    if (isPrintableKey && !isSelected) {
      if (currentLine.length >= MAX_CHARS_PER_ROW) {
        e.preventDefault();
        showToast(`Maximum ${MAX_CHARS_PER_ROW} characters per line allowed!`, 'error', 2500);
        return;
      }
    }
  }

  // Handle pastes and clean them up
  function handlePasteCleanup(textarea, e) {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const currentText = textarea.value;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const fullText = currentText.substring(0, start) + pastedText + currentText.substring(end);
    
    const lines = fullText.split('\n');
    const cleanedLines = lines.map(line => line.substring(0, MAX_CHARS_PER_ROW));
    const limitedLines = cleanedLines.slice(0, MAX_ROWS);
    
    const finalVal = limitedLines.join('\n');
    textarea.value = finalVal;
    
    const newCursorPos = Math.min(start + pastedText.length, finalVal.length);
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    
    updateCounter(textarea);
    textarea.dispatchEvent(new Event('input'));
    
    if (lines.length > MAX_ROWS || lines.some(l => l.length > MAX_CHARS_PER_ROW)) {
      showToast('Pasted text was formatted to fit limits (5 lines, 45 chars/line).', 'info', 3000);
    }
  }

  // Update dynamic counter text below textarea
  function updateCounter(textarea) {
    const config = textareasToManage.find(t => t.el === textarea);
    if (!config || !config.counter) return;

    const val = textarea.value;
    const lines = val.split('\n');
    const cursorPos = textarea.selectionStart;
    
    let charCount = 0;
    let currentLineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLengthWithNewline = lines[i].length + 1;
      if (cursorPos >= charCount && cursorPos <= charCount + lines[i].length) {
        currentLineIndex = i;
        break;
      }
      charCount += lineLengthWithNewline;
    }
    
    const linesCount = lines.length === 1 && lines[0] === "" ? 0 : lines.length;
    const currentLineText = lines[currentLineIndex] || "";
    const currentLineLength = currentLineText.length;
    
    config.counter.className = 'textarea-counter';
    if (currentLineLength >= MAX_CHARS_PER_ROW || linesCount >= MAX_ROWS) {
      config.counter.classList.add('limit-reached');
    } else if (currentLineLength > 40 || linesCount === 4) {
      config.counter.classList.add('limit-near');
    }
    
    config.counter.textContent = `Line ${currentLineIndex + 1}: ${currentLineLength}/${MAX_CHARS_PER_ROW} chars | ${linesCount}/${MAX_ROWS} lines`;
  }

  // Setup textareas event listeners
  textareasToManage.forEach(({ el }) => {
    if (!el) return;
    
    el.addEventListener('keydown', (e) => enforceConstraints(el, e));
    el.addEventListener('paste', (e) => handlePasteCleanup(el, e));
    
    ['input', 'keyup', 'click', 'focus'].forEach(evt => {
      el.addEventListener(evt, () => updateCounter(el));
    });
  });

  // --- Mirroring (Syncing) Shipper & Consignee Details ---
  
  function handleSyncInit() {
    if (syncShipperToggle.checked) {
      shipperDetailsBottom.value = shipperDetailsTop.value;
      shipperDetailsBottom.setAttribute('readonly', 'true');
      shipperSyncBadge.textContent = 'Sync Active';
      shipperSyncBadge.classList.remove('inactive');
      updateCounter(shipperDetailsBottom);
    }
    
    if (syncConsigneeToggle.checked) {
      consigneeDetailsBottom.value = consigneeDetailsTop.value;
      consigneeDetailsBottom.setAttribute('readonly', 'true');
      consigneeSyncBadge.textContent = 'Sync Active';
      consigneeSyncBadge.classList.remove('inactive');
      updateCounter(consigneeDetailsBottom);
    }
  }

  shipperDetailsTop.addEventListener('input', () => {
    if (syncShipperToggle.checked) {
      shipperDetailsBottom.value = shipperDetailsTop.value;
      updateCounter(shipperDetailsBottom);
    }
  });

  consigneeDetailsTop.addEventListener('input', () => {
    if (syncConsigneeToggle.checked) {
      consigneeDetailsBottom.value = consigneeDetailsTop.value;
      updateCounter(consigneeDetailsBottom);
    }
  });

  syncShipperToggle.addEventListener('change', () => {
    if (syncShipperToggle.checked) {
      shipperDetailsBottom.value = shipperDetailsTop.value;
      shipperDetailsBottom.setAttribute('readonly', 'true');
      shipperSyncBadge.textContent = 'Sync Active';
      shipperSyncBadge.classList.remove('inactive');
      updateCounter(shipperDetailsBottom);
      showToast('Shipper details synced and locked.', 'info', 2000);
    } else {
      shipperDetailsBottom.removeAttribute('readonly');
      shipperSyncBadge.textContent = 'Sync Inactive';
      shipperSyncBadge.classList.add('inactive');
      showToast('Shipper details unsynced. Custom edits allowed.', 'info', 2000);
    }
  });

  syncConsigneeToggle.addEventListener('change', () => {
    if (syncConsigneeToggle.checked) {
      consigneeDetailsBottom.value = consigneeDetailsTop.value;
      consigneeDetailsBottom.setAttribute('readonly', 'true');
      consigneeSyncBadge.textContent = 'Sync Active';
      consigneeSyncBadge.classList.remove('inactive');
      updateCounter(consigneeDetailsBottom);
      showToast('Consignee details synced and locked.', 'info', 2000);
    } else {
      consigneeDetailsBottom.removeAttribute('readonly');
      consigneeSyncBadge.textContent = 'Sync Inactive';
      consigneeSyncBadge.classList.add('inactive');
      showToast('Consignee details unsynced. Custom edits allowed.', 'info', 2000);
    }
  });

  // --- Copy if Same as Consignee Notify Logic ---
  btnCopyConsignee.addEventListener('click', () => {
    if (!consigneeDetailsTop.value.trim()) {
      showToast('Consignee details are empty. Nothing to copy!', 'error', 3000);
      return;
    }
    notifyDetails.value = consigneeDetailsTop.value;
    updateCounter(notifyDetails);
    showToast('Consignee details copied to Notify details.', 'success', 2500);
    notifyDetails.focus();
  });

  // --- Port & Vessel Edit Toggle ---
  btnToggleEditPort.addEventListener('click', () => {
    isEditingPort = !isEditingPort;
    const inputs = portDetailsContainer.querySelectorAll('.detail-value-input');
    
    if (isEditingPort) {
      inputs.forEach(input => input.removeAttribute('readonly'));
      btnToggleEditPort.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Lock Details</span>
      `;
      btnToggleEditPort.classList.remove('btn-secondary-outline');
      btnToggleEditPort.classList.add('btn-secondary');
      showToast('Port & Vessel details are now editable.', 'info', 2000);
    } else {
      inputs.forEach(input => input.setAttribute('readonly', 'true'));
      btnToggleEditPort.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        <span>Edit Details</span>
      `;
      btnToggleEditPort.classList.remove('btn-secondary');
      btnToggleEditPort.classList.add('btn-secondary-outline');
      showToast('Port & Vessel details locked.', 'info', 2000);
    }
  });

  // --- Container Table Render logic (Automatic) ---
  
  function renderContainerRows(containers) {
    containerTableBody.innerHTML = '';
    
    containers.forEach((c, idx) => {
      const row = document.createElement('tr');
      row.className = 'table-row-item';
      
      row.innerHTML = `
        <td class="td-sino text-center font-semibold">${idx + 1}</td>
        <td>
          <!-- Read-Only Container No -->
          <input type="text" name="containerNo[]" class="table-input val-container-no" value="${c.containerNo}" readonly required autocomplete="off">
        </td>
        <td>
          <!-- Read-Only Container Type represented as an elegant text field -->
          <input type="text" name="containerType[]" class="table-input val-container-type" value="${c.type}" readonly required autocomplete="off">
        </td>
        <td>
          <input type="text" name="sealNo[]" class="table-input" value="${c.sealNo}" placeholder="Enter Seal No" required autocomplete="off">
        </td>
        <td>
          <input type="number" name="noOfPkgs[]" class="table-input text-right val-number" value="${c.noOfPkgs}" min="1" step="1" placeholder="0" required autocomplete="off">
        </td>
        <td>
          <input type="text" name="pkgUnit[]" class="table-input" value="${c.pkgUnit}" placeholder="e.g. CART" required autocomplete="off">
        </td>
        <td>
          <input type="number" name="grossWt[]" class="table-input text-right val-number-decimal" value="${c.grossWt.toFixed(3)}" min="0.001" step="0.001" placeholder="0.00" required autocomplete="off">
        </td>
        <td>
          <input type="number" name="netWt[]" class="table-input text-right val-number-decimal" value="${c.netWt.toFixed(3)}" min="0.001" step="0.001" placeholder="0.00" required autocomplete="off">
        </td>
        <td>
          <div class="table-select-wrapper">
            <select name="wtUnit[]" class="table-select val-wt-unit" required>
              <option value="KGS" ${c.wtUnit === 'KGS' ? 'selected' : ''}>KGS</option>
              <option value="LBS" ${c.wtUnit === 'LBS' ? 'selected' : ''}>LBS</option>
            </select>
          </div>
        </td>
        <td>
          <input type="number" name="volume[]" class="table-input text-right val-number-decimal" value="${c.volume.toFixed(3)}" min="0.001" step="0.001" placeholder="0.00" required autocomplete="off">
        </td>
      `;

      // Clear validation borders and auto-recalculate Volume Details on edit in real-time
      row.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', () => {
          input.classList.remove('input-invalid');
          calculateVolumeDetails(false); // real-time dynamic calculations
        });
      });

      containerTableBody.appendChild(row);
    });
  }

  // --- Volume Calculation Logic (Read-Only fields output) ---
  
  function calculateVolumeDetails(showFeedback = true) {
    const rows = containerTableBody.querySelectorAll('tr');
    let totalGrossWtKGS = 0;
    let totalNetWtKGS = 0;
    let totalCBM = 0;
    let totalPkgs = 0;
    
    let mixedWtUnits = false;
    let baseWtUnit = '';
    let uniquePkgUnits = new Set();

    rows.forEach((row, index) => {
      const pUnit = row.querySelector('input[name="pkgUnit[]"]').value.trim().toUpperCase();
      const pkgs = parseInt(row.querySelector('input[name="noOfPkgs[]"]').value) || 0;
      let gWt = parseFloat(row.querySelector('input[name="grossWt[]"]').value) || 0;
      let nWt = parseFloat(row.querySelector('input[name="netWt[]"]').value) || 0;
      const wtUnit = row.querySelector('.val-wt-unit').value;
      const vol = parseFloat(row.querySelector('input[name="volume[]"]').value) || 0;

      if (wtUnit === 'LBS') {
        gWt = gWt * 0.45359237;
        nWt = nWt * 0.45359237;
      }
      
      if (index === 0) {
        baseWtUnit = wtUnit;
      } else if (wtUnit !== baseWtUnit) {
        mixedWtUnits = true;
      }

      if (pUnit) {
        uniquePkgUnits.add(pUnit);
      }

      totalGrossWtKGS += gWt;
      totalNetWtKGS += nWt;
      totalCBM += vol;
      totalPkgs += pkgs;
    });

    let displayGross = totalGrossWtKGS;
    let displayNet = totalNetWtKGS;

    if (!mixedWtUnits && baseWtUnit === 'LBS') {
      displayGross = totalGrossWtKGS / 0.45359237;
      displayNet = totalNetWtKGS / 0.45359237;
    }

    volumeGrossWeight.value = displayGross.toFixed(3);
    volumeNetWeight.value = displayNet.toFixed(3);
    volumeCBM.value = totalCBM.toFixed(3);
    totalNoContainers.value = rows.length;
    volumeNoOfPackages.value = totalPkgs;

    // Detect package unit matching and set the readonly package unit input
    if (uniquePkgUnits.size === 1) {
      volumePackageUnit.value = Array.from(uniquePkgUnits)[0];
    } else if (uniquePkgUnits.size > 1) {
      volumePackageUnit.value = "MIXED";
    } else {
      volumePackageUnit.value = "NONE";
    }

    if (showFeedback) {
      if (mixedWtUnits) {
        showToast('Weights calculated and converted to unified metric KGS (Mixed container units detected).', 'info', 4500);
      } else {
        showToast(`Calculations finished in unified unit: ${baseWtUnit || 'KGS'}.`, 'success', 3000);
      }
    }
  }

  btnCalculate.addEventListener('click', () => calculateVolumeDetails(true));

  // --- Page Initialization Logic (Load Mock Data) ---
  
  function initSiApplication() {
    // 1. Job No and Booking Party
    document.getElementById('headerJobNo').textContent = initialSiData.jobNo;
    document.getElementById('headerBookingParty').textContent = initialSiData.bookingParty;
    document.getElementById('headerBookingParty').title = initialSiData.bookingParty;
    
    // 2. Load Addresses
    shipperDetailsTop.value = initialSiData.shipperDetails;
    consigneeDetailsTop.value = initialSiData.consigneeDetails;
    notifyDetails.value = initialSiData.notifyDetails;
    
    // 3. Load B/L configurations
    document.getElementById('noOfOriginalBL').value = initialSiData.blConfiguration.noOfOriginalBL;
    document.getElementById('blType').value = initialSiData.blConfiguration.blType;

    // 4. Render Container details automatically (No manual input/add)
    renderContainerRows(initialSiData.containers);

    // 5. Load Port Details
    document.querySelector('input[name="portReceipt"]').value = initialSiData.portAndVessel.portReceipt;
    document.querySelector('input[name="portLoading"]').value = initialSiData.portAndVessel.portLoading;
    document.querySelector('input[name="portDischarge"]').value = initialSiData.portAndVessel.portDischarge;
    document.querySelector('input[name="finalDestination"]').value = initialSiData.portAndVessel.finalDestination;
    document.querySelector('input[name="vessel"]').value = initialSiData.portAndVessel.vessel;
    document.querySelector('input[name="voyage"]').value = initialSiData.portAndVessel.voyage;

    // 6. Handle Address sync mirroring
    handleSyncInit();

    // 7. Render dynamic textareas row/char counters
    textareasToManage.forEach(({ el }) => {
      if (el) updateCounter(el);
    });

    // 8. Auto-calculate volume details summary
    calculateVolumeDetails(false);
  }

  // --- Submission Form Validation & Success State ---
  
  siForm.addEventListener('submit', (e) => {
    e.preventDefault();
    document.querySelectorAll('.input-invalid').forEach(el => el.classList.remove('input-invalid'));
    
    let isValid = true;
    let errors = [];

    function markInvalid(element, errorMsg) {
      element.classList.add('input-invalid');
      isValid = false;
      errors.push(errorMsg);
    }

    // 1. Textarea Constraints Validations
    const textareaValidations = [
      { el: shipperDetailsTop, name: 'Shipper Details (Top)' },
      { el: consigneeDetailsTop, name: 'Consignee Details (Top)' },
      { el: notifyDetails, name: 'Notify Details' },
      { el: shipperDetailsBottom, name: 'Shipper Details (Bottom)' },
      { el: consigneeDetailsBottom, name: 'Consignee Details (Bottom)' }
    ];

    textareaValidations.forEach(({ el, name }) => {
      const val = el.value.trim();
      if (!val) {
        markInvalid(el, `${name} is required.`);
        return;
      }
      
      const lines = el.value.split('\n');
      if (lines.length > MAX_ROWS) {
        markInvalid(el, `${name} exceeds maximum of ${MAX_ROWS} rows.`);
      }
      
      lines.forEach((line, idx) => {
        if (line.length > MAX_CHARS_PER_ROW) {
          markInvalid(el, `${name} has line ${idx + 1} exceeding ${MAX_CHARS_PER_ROW} characters.`);
        }
      });
    });

    // 2. B/L Configurations
    const noOfOriginalBL = document.getElementById('noOfOriginalBL');
    if (!noOfOriginalBL.value) {
      markInvalid(noOfOriginalBL, 'Please select the number of Original Bill of Ladings.');
    }

    const blType = document.getElementById('blType');
    if (!blType.value) {
      markInvalid(blType, 'Please select the Bill of Lading Type.');
    }

    // 3. Container Rows validations
    const rows = containerTableBody.querySelectorAll('tr');
    if (rows.length === 0) {
      isValid = false;
      errors.push('At least one container details row is required.');
    }

    const containerRegex = /^[A-Z]{4}\d{5,7}$/i;

    rows.forEach((row, idx) => {
      const containerInput = row.querySelector('.val-container-no');
      const cNo = containerInput.value.trim();
      const sealInput = row.querySelector('input[name="sealNo[]"]');
      const pkgsInput = row.querySelector('input[name="noOfPkgs[]"]');
      const gWtInput = row.querySelector('input[name="grossWt[]"]');
      const nWtInput = row.querySelector('input[name="netWt[]"]');
      const volInput = row.querySelector('input[name="volume[]"]');

      if (!cNo) {
        markInvalid(containerInput, `Row ${idx + 1}: Container Number is required.`);
      } else if (!containerRegex.test(cNo)) {
        markInvalid(containerInput, `Row ${idx + 1}: Container No. "${cNo}" is invalid (must be 4 letters + 5-7 digits).`);
      }

      if (!sealInput.value.trim()) {
        markInvalid(sealInput, `Row ${idx + 1}: Seal Number is required.`);
      }

      const pkgs = parseInt(pkgsInput.value) || 0;
      if (pkgs <= 0) {
        markInvalid(pkgsInput, `Row ${idx + 1}: Packages must be greater than 0.`);
      }

      const gWt = parseFloat(gWtInput.value) || 0;
      if (gWt <= 0) {
        markInvalid(gWtInput, `Row ${idx + 1}: Gross Weight must be greater than 0.`);
      }

      const nWt = parseFloat(nWtInput.value) || 0;
      if (nWt <= 0) {
        markInvalid(nWtInput, `Row ${idx + 1}: Net Weight must be greater than 0.`);
      } else if (nWt > gWt) {
        markInvalid(nWtInput, `Row ${idx + 1}: Net Weight cannot exceed Gross Weight.`);
      }

      const vol = parseFloat(volInput.value) || 0;
      if (vol <= 0) {
        markInvalid(volInput, `Row ${idx + 1}: Volume (CBM) must be greater than 0.`);
      }
    });

    if (!isValid) {
      errors.forEach(err => showToast(err, 'error', 5000));
      
      const firstInvalid = document.querySelector('.input-invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus();
      }
      return;
    }

    // --- SUCCESS SUBMIT FLOW ---
    calculateVolumeDetails(false);

    const containersData = [];
    rows.forEach((row, idx) => {
      containersData.push({
        siNo: idx + 1,
        containerNo: row.querySelector('.val-container-no').value.trim().toUpperCase(),
        // Note: Read containerType from the readonly input value as updated in layout
        type: row.querySelector('input[name="containerType[]"]').value,
        sealNo: row.querySelector('input[name="sealNo[]"]').value.trim(),
        noOfPkgs: parseInt(row.querySelector('input[name="noOfPkgs[]"]').value),
        pkgUnit: row.querySelector('input[name="pkgUnit[]"]').value.trim().toUpperCase(),
        grossWt: parseFloat(row.querySelector('input[name="grossWt[]"]').value),
        netWt: parseFloat(row.querySelector('input[name="netWt[]"]').value),
        wtUnit: row.querySelector('.val-wt-unit').value,
        volume: parseFloat(row.querySelector('input[name="volume[]"]').value)
      });
    });

    const portData = {
      portReceipt: document.querySelector('input[name="portReceipt"]').value.trim(),
      portLoading: document.querySelector('input[name="portLoading"]').value.trim(),
      portDischarge: document.querySelector('input[name="portDischarge"]').value.trim(),
      finalDestination: document.querySelector('input[name="finalDestination"]').value.trim(),
      vessel: document.querySelector('input[name="vessel"]').value.trim(),
      voyage: document.querySelector('input[name="voyage"]').value.trim()
    };

    const submissionPayload = {
      jobNo: document.getElementById('headerJobNo').textContent,
      bookingParty: document.getElementById('headerBookingParty').textContent,
      shipperDetails: {
        top: shipperDetailsTop.value,
        bottom: shipperDetailsBottom.value,
        synchronized: syncShipperToggle.checked
      },
      consigneeDetails: {
        top: consigneeDetailsTop.value,
        bottom: consigneeDetailsBottom.value,
        synchronized: syncConsigneeToggle.checked
      },
      notifyDetails: notifyDetails.value,
      blConfiguration: {
        noOfOriginalBL: noOfOriginalBL.value,
        blType: blType.value
      },
      containers: containersData,
      volumeDetails: {
        grossWeight: parseFloat(volumeGrossWeight.value),
        netWeight: parseFloat(volumeNetWeight.value),
        cbm: parseFloat(volumeCBM.value),
        totalNoContainers: parseInt(totalNoContainers.value),
        noOfPackages: parseInt(volumeNoOfPackages.value),
        packageUnit: volumePackageUnit.value
      },
      portAndVessel: portData,
      submittedAt: new Date().toISOString()
    };

    modalJobNo.textContent = submissionPayload.jobNo;
    jsonSummaryContent.textContent = JSON.stringify(submissionPayload, null, 2);
    
    successModal.classList.add('open');
    showToast('Shipping Instructions submitted successfully!', 'success', 4000);
  });

  // --- Success Modal actions ---
  btnDismissModal.addEventListener('click', () => {
    successModal.classList.remove('open');
  });

  btnCopyToClipboard.addEventListener('click', () => {
    const rawText = jsonSummaryContent.textContent;
    navigator.clipboard.writeText(rawText).then(() => {
      showToast('Payload copied to clipboard!', 'success', 2500);
    }).catch(err => {
      showToast('Failed to copy payload text.', 'error', 2500);
      console.error(err);
    });
  });

  successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
      successModal.classList.remove('open');
    }
  });

  // --- Trigger Initialization ---
  initSiApplication();
});
