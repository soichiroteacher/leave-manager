// アプリの初期化とイベント配線。

document.addEventListener("DOMContentLoaded", () => {
  appData = loadData();
  currentYear = currentYearFromToday();

  refreshAll();
  switchTab("dashboard");

  // タブ切り替え
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => { switchTab(btn.dataset.tab); fitTopScrollbars(); });
  });

  // 年度セレクタ
  document.getElementById("year-select").addEventListener("change", e => {
    currentYear = parseInt(e.target.value, 10);
    renderDashboard();
    renderRecordsTable();
  });

  // 付与・繰越の調整(ダッシュボードのカード内ボタン + モーダル)
  document.getElementById("dashboard-cards").addEventListener("click", e => {
    const btn = e.target.closest(".btn-adjust-balance");
    if (btn) openBalanceModal(btn.dataset.typeId);
  });
  document.getElementById("balance-form").addEventListener("submit", handleBalanceFormSubmit);
  document.getElementById("balance-cancel").addEventListener("click", closeBalanceModal);
  document.getElementById("balance-reset").addEventListener("click", resetBalanceOverrides);
  document.getElementById("balance-modal-overlay").addEventListener("click", e => {
    if (e.target.id === "balance-modal-overlay") closeBalanceModal();
  });

  // 記録の追加ボタン(ダッシュボード・記録一覧の両方)
  document.getElementById("btn-add-record").addEventListener("click", () => openRecordModal(null));
  document.getElementById("btn-add-record-2").addEventListener("click", () => openRecordModal(null));

  // 記録モーダル
  document.getElementById("record-cancel").addEventListener("click", closeRecordModal);
  document.getElementById("modal-overlay").addEventListener("click", e => {
    if (e.target.id === "modal-overlay") closeRecordModal();
  });
  document.getElementById("record-form").addEventListener("submit", handleRecordFormSubmit);
  document.getElementById("record-unit").addEventListener("change", updateRecordAmountUnitUI);

  // 記録一覧: フィルタと行アクション
  document.getElementById("filter-type").addEventListener("change", renderRecordsTable);
  document.querySelector("#records-table tbody").addEventListener("click", e => {
    const editBtn = e.target.closest(".btn-edit-record");
    const delBtn = e.target.closest(".btn-delete-record");
    if (editBtn) {
      const rec = appData.records.find(r => r.id === editBtn.dataset.id);
      if (rec) openRecordModal(rec);
    } else if (delBtn) {
      deleteRecord(delBtn.dataset.id);
    }
  });

  // 設定: 年度開始月
  document.getElementById("fiscal-start-month").addEventListener("change", e => {
    appData.settings.fiscalYearStartMonth = parseInt(e.target.value, 10);
    saveData(appData);
    currentYear = currentYearFromToday();
    refreshAll();
  });

  // 設定: 休暇種別テーブル
  document.querySelector("#types-table tbody").addEventListener("change", e => {
    if (e.target.closest(".btn-delete-type")) return;
    saveTypesFromTable();
  });
  document.querySelector("#types-table tbody").addEventListener("click", e => {
    const delBtn = e.target.closest(".btn-delete-type");
    if (delBtn) {
      const row = delBtn.closest("tr");
      deleteType(row.dataset.id);
    }
  });
  document.getElementById("btn-add-type").addEventListener("click", addNewType);

  // データ管理
  document.getElementById("btn-export").addEventListener("click", () => exportDataToFile(appData));
  document.getElementById("btn-import").addEventListener("click", () => {
    document.getElementById("import-file").click();
  });
  document.getElementById("import-file").addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) handleImportFile(file);
    e.target.value = "";
  });
  document.getElementById("btn-reset").addEventListener("click", resetAllData);

  addTopScrollbars();
});

// 表の上にも横スクロールバーを付ける(下のスクロールバーと連動させる)。
// 表の一番下まで縦にスクロールしないと横に動かせない、ということがないようにするため。
// 表の上に「表と同じ幅の中身を持つ空の枠」を置き、互いの scrollLeft を合わせている。
function addTopScrollbars() {
  document.querySelectorAll(".table-wrap").forEach(wrap => {
    const top = document.createElement("div");
    top.className = "top-scroll";
    const inner = document.createElement("div");
    top.appendChild(inner);
    wrap.parentNode.insertBefore(top, wrap);

    // 値が同じなら代入しない(互いの scroll イベントで行ったり来たりしないように)
    top.addEventListener("scroll", () => {
      if (wrap.scrollLeft !== top.scrollLeft) wrap.scrollLeft = top.scrollLeft;
    });
    wrap.addEventListener("scroll", () => {
      if (top.scrollLeft !== wrap.scrollLeft) top.scrollLeft = wrap.scrollLeft;
    });

    // 表の幅が変わったら(行の追加・画面の大きさの変更・タブの切り替え)合わせ直す
    const fit = () => {
      inner.style.width = wrap.scrollWidth + "px";
      top.classList.toggle("hidden", wrap.scrollWidth <= wrap.clientWidth + 1);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    const table = wrap.querySelector("table");
    if (table) ro.observe(table);
    topScrollFits.push(fit);
    fit();
  });
}
const topScrollFits = [];
// 念のため、タブを切り替えたときにも合わせ直す(隠れていた表は幅が 0 で計算されているため)
function fitTopScrollbars() {
  requestAnimationFrame(() => topScrollFits.forEach(fit => fit()));
}
