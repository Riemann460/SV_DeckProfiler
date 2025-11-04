let currentDcklType = 'elm';
let PosDisp=true;

let selectionFilters={};
let filterHistory={};
let rangeFilters={};
let dckl={};
dckl["elm"]=dckl_elm;
dckl["fin"]=dckl_fin;

if (typeof previewFlg === "undefined") {
    // まだ定義されていないなら初期化
    window.previewFlg = false;
}

// 条件で切り替え
if (window.location.href.includes("preview_entry")) {
    previewFlg = true;
}

const isAllZero={};
isAllZero["elm"] = Object.values(dckl_elm).every(table =>
    Array.isArray(table["順位"]) ? table["順位"].every(val => val === 0) : false
);
isAllZero["fin"] = Object.values(dckl_fin).every(table =>
    Array.isArray(table["順位"]) ? table["順位"].every(val => val === 0) : false
);
if (isAllZero["elm"]) {
    document.getElementById('PosNameButton').style.display ='';
}

function switchPosName(){
    const posName=document.getElementById('PosNameButton');
    PosDisp=!PosDisp;
    if (PosDisp) {
        posName.textContent="選手表示";
    } else {
        posName.textContent="順位表示";
    }
    applyFilterAndUpdate({ [deckSelects[currentDcklType].value]: dckl[currentDcklType][deckSelects[currentDcklType].value] }, currentDcklType);
}

function switchDeckType(type) {
    if (previewFlg) {
        switchDeckType_init(type);
    } else{
        const params = new URLSearchParams();
        params.set("type", type);

        const exists = Array.from(deckSelects[type].options).some(opt => opt.value === deckSelects[currentDcklType].value);
        if (exists) {
            params.set("deck", deckSelects[currentDcklType].value);
        } else {
            params.set("deck", deckSelects[type].options[0].value);
        }
        location.href = "?" + params.toString();
    }
}

function switchDeckType_init(type) {
    currentDcklType = type; 
    selectionFilters = type === 'elm' ? selectionFilters_elm : selectionFilters_fin;
    filterHistory = type === 'elm' ? filterHistory_elm : filterHistory_fin;
    rangeFilters = type === 'elm' ? rangeFilters_elm : rangeFilters_fin;

    const PosNameButton=document.getElementById('PosNameButton');
    if (PosNameButton){
        if (isAllZero[type]){
            PosNameButton.style.display ='none';
            PosDisp=false;
        } else {
            PosNameButton.style.display ='';
        }
    }

    // セレクト表示切り替え
    document.getElementById('deckname_select_elm').style.display = (type === 'elm') ? 'inline-block' : 'none';
    const dname_sel_fin=document.getElementById('deckname_select_fin');
    if(dname_sel_fin){
        dname_sel_fin.style.display = (type === 'fin') ? 'inline-block' : 'none';
    }

    // 範囲フィルター
    document.getElementById('range_filters_elm').style.display = (type === 'elm') ? 'block' : 'none';
    const range_fil_fin=document.getElementById('range_filters_fin');
    if (range_fil_fin){
        range_fil_fin.style.display = (type === 'fin') ? 'block' : 'none';
    }

  // Undo・Reset
  const fil_undo_fin=document.getElementById('filter_undo_container_fin');
    if ( type === 'elm') {
        if (Object.keys(filterHistory).length !== 0) {
            document.getElementById('filter_undo_container_elm').style.display='';
        }
        if(fil_undo_fin)fil_undo_fin.style.display='none';
    } else {
        if (Object.keys(filterHistory).length !== 0) {
            if(fil_undo_fin)fil_undo_fin.style.display='';
        }
        document.getElementById('filter_undo_container_elm').style.display='none';
    }

    document.getElementById('filter_reset_container_elm').style.display = (type === 'elm') ? 'block' : 'none';
    const fil_reset_fin=document.getElementById('filter_reset_container_fin');
    if(fil_reset_fin)fil_reset_fin.style.display = (type === 'fin') ? 'block' : 'none';
    // Undo・Reset
    if (Object.keys(dckl_fin).length !== 0) {
        document.getElementById('finButton').style.display= (type === 'elm') ? '' : 'none';
        document.getElementById('elmButton').style.display = (type === 'fin') ? '' : 'none';
    }
    // 表の再描画
    setupRangeFilterUI(dckl[currentDcklType][deckSelects[currentDcklType].value], currentDcklType);
    applyFilterAndUpdate({ [deckSelects[currentDcklType].value]: dckl[currentDcklType][deckSelects[currentDcklType].value] }, currentDcklType);
}


// --- 共通変数の分離 ---
let selectionFilters_elm = {};  // dckl_elm用
let filterHistory_elm = [];
let rangeFilters_elm = {
    '順位': { min: null, max: null },
    '連勝数': { min: null, max: null },
    'レート': { min: null, max: null },
    '使用日': { min: null, max: null },
    'ランク': { min: null, max: null },
    'グループ': { min: null, max: null }
};

let selectionFilters_fin = {};  // dckl_fin用
let filterHistory_fin = [];
let rangeFilters_fin = JSON.parse(JSON.stringify(rangeFilters_elm));

// --- フィルターリセット ---
function resetFilters() {
    const sFilters = selectionFilters;
    const fHistory = filterHistory;
    const rFilters = rangeFilters;

    for (const key in sFilters) delete sFilters[key];
    fHistory.length = 0;
    for (const key in rFilters) rFilters[key] = { min: null, max: null };

    updateAll(deckSelects[currentDcklType].value, currentDcklType);
    document.getElementById(`filter_undo_container_${currentDcklType}`).style.display = 'none';
}

// --- 範囲フィルターの適用 ---
function applyRangeFilters() {
    const rFilters = rangeFilters;
    ['順位', '連勝数', 'レート', '使用日'].forEach(key => {
        const minEl = document.getElementById(`filter_${key}_min_${currentDcklType}`);
        const maxEl = document.getElementById(`filter_${key}_max_${currentDcklType}`);

        if (minEl && maxEl) {
            let minValue=parseInt(minEl.value);
            let maxValue=parseInt(maxEl.value);
            if (minValue > maxValue) {
                const tmp = minValue;
                minValue = maxValue;
                maxValue = tmp;
            }
            rFilters[key] = {
                min: minValue,
                max: maxValue
            };
        }
    });
    const data = dckl[currentDcklType];
    applyFilterAndUpdate({ [deckSelects[currentDcklType].value]: data[deckSelects[currentDcklType].value] }, currentDcklType);
}




function setupRangeFilterUI(deckData) {
    const filterDiv = document.getElementById(`range_filters_${currentDcklType}`);
    filterDiv.innerHTML = '';

    if (!isAllZero[currentDcklType] && deckData['順位']) {
        const el = createRangeSelects(deckData['順位'], '順位', null, formaRankLabel);
        filterDiv.appendChild(el);
    }
    if (deckData['連勝数']) {
        const el = createRangeSelects(deckData['連勝数'], '連勝数');
        filterDiv.appendChild(el);
    }
    if (deckData['レート']) {
        const el = createRangeSelects(deckData['レート'], 'レート');
        filterDiv.appendChild(el);
    }
    if (deckData['使用日']) {
        const el = createRangeSelects([...new Set(deckData['使用日'])], '使用日', null, formatDateLabel);
        filterDiv.appendChild(el);

        // 改行条件：rank_no か group_no のどちらかが存在
        if (deckData['ランク'] || deckData['グループ']) {
            const br = document.createElement('div');
            br.style.flexBasis = '100%';  // 改行相当
            filterDiv.appendChild(br);
        }
    }
    if (deckData['ランク'] && !(deckData['ランク'].every(val => Number(val) === 0))){
        const el = createMultiSelectButtons(deckData['ランク'], 'ランク', rankLabels);
        filterDiv.appendChild(el);
    }
    if (deckData['グループ'] && !(deckData['グループ'].every(val => Number(val) === 0))){
        const el = createMultiSelectButtons(deckData['グループ'], 'グループ', groupLabels);
        filterDiv.appendChild(el);
    }
}



function createResetButton() {
    const container = document.getElementById(`filter_reset_container_${currentDcklType}`);
    container.innerHTML = ''; // 既存ボタンがあれば消す

    const btn = document.createElement('button');
    btn.id = 'filter_reset_btn';
    btn.textContent = 'データなし（クリックでリセット）';
    btn.style.padding = '6px 12px';
    btn.style.fontSize = '1.5em';
    btn.style.fontColor = 'red';
    btn.style.cursor = 'pointer';

    btn.addEventListener('click', () => {
        container.style.display = 'none';
        document.getElementById('table_container').style.display = 'block';
        document.getElementsByClassName('decklist_main')[0].style.display = '';
        resetFilters();
    });

    container.appendChild(btn);
    container.style.display = 'block';
}


// --- Undoボタン作成 ---
function createUndoButton(deck_table, dcklType) {
    const container = document.getElementById(`filter_undo_container_${currentDcklType}`);
    if (!container) return;
    container.innerHTML = '';

    const sFilters = selectionFilters;
    const fHistory = filterHistory;

    const btn = document.createElement('button');
    btn.textContent = '一つ戻る';
    btn.style.fontSize = '1em';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => {
        if (fHistory.length === 0) return;
        const [lastCard, lastCount] = fHistory.pop();
        sFilters[lastCard].delete(lastCount);
        if (sFilters[lastCard].size === 0) delete sFilters[lastCard];
        if (fHistory.length === 0) {
            container.style.display = 'none';
            updateAll(deckSelects[currentDcklType].value, currentDcklType);
        } else {
            applyFilterAndUpdate(deck_table, currentDcklType);
        }
    });
    container.appendChild(btn);
    container.style.display = '';
}

// --- 適用フィルターに一致するインデックス抽出 ---
function createValidIndexes(data) {
    const sFilters = selectionFilters;
    const rFilters = rangeFilters;

    const validIndexes = [];
    const totalCols = data[Object.keys(data)[0]].length;
    for (let i = 0; i < totalCols; i++) {
        let match = true;

        for (const [card, counts] of Object.entries(sFilters)) {
            const val = data[card]?.[i];
            if (!counts.has(val)) {
                match = false;
                break;
            }
        }

        for (const key of Object.keys(rFilters)) {
            const info = rFilters[key];
            const val = data[key]?.[i];
            if (val == null || val === '') continue;
            if ('min' in info && (info.min !== null && val < info.min || info.max !== null && val > info.max)) {
                match = false;
                break;
            }
            if ('values' in info && info.values !== null && !info.values.includes(val)) {
                match = false;
                break;
            }
        }

        if (match) validIndexes.push(i);
    }
    return validIndexes;
}

// --- フィルター適用と更新 ---
function applyFilterAndUpdate(deck_table, dcklType) {
    const deckname = Object.keys(deck_table)[0];
    const data = deck_table[deckname];
    const validIndexes = createValidIndexes(data);

    if (validIndexes.length === 0) {
        document.getElementById('table_container').style.display = 'none';
        document.getElementsByClassName('decklist_main')[0].style.display = 'none';
        createResetButton();
        return;
    } else {
        document.getElementById('table_container').style.display = 'block';
        document.getElementById(`filter_reset_container_${currentDcklType}`).style.display = 'none';
        //円グラフ作成
        // if (typeof CreateData_Chart === "function") {
        //     CreateData_Chart();  // 実行
        // }
    }

    const filtered = {};
    filtered[deckname] = {};
    for (const key of Object.keys(data)) {
        filtered[deckname][key] = validIndexes.map(idx => data[key][idx]);
    }

    updateHeader(deckname, filtered);
    updateTable(filtered, cardids, cardimg, cardnos, cardnms, currentDcklType);
    enableCellHoverHighlight();
}


function makeQRCodeOverlay(url) {
    const overlay = document.getElementById('qrcode_overlay');
    const container = document.getElementById('qrcode_container');
    container.innerHTML = '';  // 前回のQRを消す

    const qr = new QRious({
        element: document.createElement('canvas'),
        value: url,
        size: 200
    });

    container.appendChild(qr.element);
    overlay.style.display = 'flex';
}

function closeQRCodeOverlay(event) {
    const box = document.getElementById('qrcode_box');
    if (!box.contains(event.target)) {
        document.getElementById('qrcode_overlay').style.display = 'none';
    }
}


const class_map = {
    'エルフ': 1, 'E': 1,
    'ロイヤル': 2, 'R': 2,
    'ウィッチ': 3, 'W': 3,
    'ドラゴン': 4, 'D': 4,
    'ナイトメア': 5, 'Ni': 5,
    'ビショップ': 6, 'B': 6,
    'ネメシス': 7, 'Nm': 7
};

var rank_map = ['-','Bgn','D','C','B','A','AA','Master','GM'];
var group_map=['-','emr','thp','rby','sph','dia','epic','ult','lgd','byd'];

rank_map = rank_map.map((item, index) => {
    return index === 0 ? item : "<img width='30px' height='30px' src='https://blog-imgs-162.fc2.com/d/u/e/duesemi/WBrank_"+ item + ".png'>";
});
group_map = group_map.map((item, index) => {
    return index === 0 ? item : "<img width='30px' height='30px' src='https://blog-imgs-162.fc2.com/d/u/e/duesemi/WBgr_"+ item + ".png'>";
});

const rankLabels = {
    0:'不明',1: 'Beginner', 2: 'D', 3: 'C', 4: 'B', 5: 'A', 6: 'AA', 7: 'Master', 8: 'GM'
};

const groupLabels = {
    0:'不明',1: 'エメラルド', 2: 'トパーズ', 3: 'ルビー', 4: 'サファイア', 5: 'ダイヤモンド',6: 'EPIC', 7: 'ULTIMATE', 8: 'LEGEND', 9: 'BEYOND'
};

function formatDateLabel(yyMMdd) {
    const str = String(yyMMdd).padStart(6, '0');
    const mm = parseInt(str.slice(2, 4), 10);
    const dd = parseInt(str.slice(4, 6), 10);
    return `${mm}月${dd}日`;
}

function formaRankLabel(val) {
    if (val===0) {
        return "敗退"
    } else {
        return val + "位"
    }
}

function createMultiSelectButtons(values, key, labelMap) {
    const wrapper = document.createElement('label');
    wrapper.setAttribute('for', 'group-select');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.minWidth = '100px';
    wrapper.innerHTML = `<span>${key}</span>`;
    wrapper.dataset.key = key;

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '4px';

    const unique = [...new Set(values)].sort((a, b) => a - b).filter(v => v > 0);
    unique.forEach(val => {
        const btn = document.createElement('button');
        btn.textContent = labelMap[val];
        btn.dataset.value = val;
        btn.classList.add('filter-btn');

        btn.onclick = (e) => {
            e.preventDefault();
            btn.classList.toggle('selected');
            updateMultiFilterSelection(key);
        };

        container.appendChild(btn);
    });

    wrapper.appendChild(container);
    return wrapper;
}

// --- マルチセレクト更新 ---
function updateMultiFilterSelection(key, dcklType) {
    const rFilters = rangeFilters;
    const label = document.querySelector(`label[data-key="${key}"]`);
    if (!label) return;

    const selectedButtons = label.querySelectorAll('.filter-btn.selected');
    const selectedValues = Array.from(selectedButtons).map(btn => parseInt(btn.dataset.value));

    rFilters[key] = {
        values: selectedValues.length > 0 ? selectedValues : null
    };

    const data = dckl[currentDcklType];
    applyFilterAndUpdate({ [deckSelects[currentDcklType].value]: data[deckSelects[currentDcklType].value] }, currentDcklType);
}

// --- セレクトボックス分岐 ---
const deckSelects = {
    elm: document.getElementById('deckname_select_elm'),
    fin: document.getElementById('deckname_select_fin')
};

// --- セレクト変更時のイベント ---
Object.entries(deckSelects).forEach(([type, select]) => {
    if(select){
        select.innerHTML = '';
        
        Object.keys(dckl[type]).forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            select.appendChild(opt);
        });
        select.addEventListener('change', () => {
            if (previewFlg) {
                resetFilters();
            } else {
                const params = new URLSearchParams();
                params.set("deck", deckSelects[currentDcklType].value);
                params.set("type", currentDcklType);
                location.href = "?" + params.toString();
            }
        });
    }
});


function createRangeSelects(values, key, labelMap = null, formatter = null) {
    const label = document.createElement('label');
    label.dataset.key = key;
    label.style.display = 'flex';
    label.style.flexDirection = 'column';
    label.style.minWidth = '120px';
    label.innerHTML = `<span>${key}</span>`;

    const unique = [...new Set(values)].sort((a, b) => {
        if (a === 0) return 1;   // aが0なら後ろへ
        if (b === 0) return -1;  // bが0ならaの方を先に
        return a - b;            // 通常の昇順
    });
    const minVal = unique[0];
    const maxVal = unique[unique.length - 1];

    const selMin = document.createElement('select');
    const selMax = document.createElement('select');
    selMin.id = `filter_${key}_min_${currentDcklType}`;
    selMax.id = `filter_${key}_max_${currentDcklType}`;

    unique.forEach(val => {
    const text = (labelMap?.[val] || (formatter ? formatter(val) : val));
        selMin.appendChild(new Option(text, val));
        selMax.appendChild(new Option(text, val));
    });

    // 初期値を最小・最大に設定
    selMin.value = minVal;
    selMax.value = maxVal;

    // 1行に並べる
    const line = document.createElement('div');
    line.className = 'range-line';
    line.appendChild(selMin);
    line.appendChild(document.createTextNode(' ～ '));
    line.appendChild(selMax);

    // イベント即時反映
    selMin.onchange = selMax.onchange = () => {
        applyRangeFilters();
    };

    label.appendChild(line);
    return label;
}





const lineHead = '3px solid gray';
const lineColumn = '5px solid gray';

function getClassNo(deckname) {
    for (const [key, val] of Object.entries(class_map)) {
        if (deckname.includes(key)) return val;
    }
    return 0;
}

function createDeckCode(deckname, cardnames, data, i) {
    const x = getClassNo(deckname);
    var codes = '';
    for (const cardname of cardnames) {
        if (data.hasOwnProperty(cardname)) {
            codes += ('.' + cardname).repeat(data[cardname][i])
        }
    }
    return `2.${x}${codes}`;
}

function makePostURL(post_id) {
    return `https://x.com/${post_id.replace('/', '/status/')}`;
}

function median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    let result;

    if (sorted.length % 2) {
        result = sorted[mid];
    } else {
        result = (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // 小数第1位で切り捨て
    const truncated = Math.floor(result * 10) / 10;

    // .0 のときは整数表示、それ以外は小数1桁表示
    return (truncated % 1 === 0) ? truncated.toString() : truncated.toFixed(1);
}

function mean(arr) {
    if (!arr.length) return '-';
    const sum = arr.reduce((a, b) => a + b, 0);
    const avg = sum / arr.length;
    return (Math.floor(avg * 10) / 10).toFixed(1);  // 小数第1位で切り捨てし、"d.d" 形式で文字列表示
}

function countValues(arr, val) {
    return arr.filter(x => x === val).length;
}

function updateHeader(deckname, deck_table) {

    const thead = document.getElementById('table_header');
    thead.innerHTML = '';

    const firstDeck = deck_table[deckname];
    const renshoCount = firstDeck[Object.keys(firstDeck)[0]]?.length || 1;
    let rateFlg=false;
    let ren_jun='';
    if (firstDeck['連勝数']) {
        ren_jun='連勝数';
    } else if (firstDeck['レート']) {
        ren_jun='レート';
        rateFlg=true;
    } else if (firstDeck['順位']) {
        ren_jun='順位';
    }

    const renshos = firstDeck[ren_jun] || [];
    const renshoFlg = !(ren_jun==='');

    const tr1 = document.createElement('tr');
    const thDeck = document.createElement('th');
    thDeck.rowSpan = 2;
    thDeck.style.borderRight = lineHead;
    thDeck.textContent = deckname;
    thDeck.classList.add('sticky-top');
    tr1.appendChild(thDeck);

    if (!PosDisp && (firstDeck["選手"] || firstDeck["チーム"])){
        (firstDeck["選手"] || firstDeck["チーム"]).forEach((name, i) => {
            const thRensho = document.createElement('th');
            if (firstDeck["timg"] && firstDeck["timg"][i]){
                thRensho.innerHTML=`<img width="30px" height="30px" src="https://blog-imgs-${firstDeck["timg"][i]}.fc2.com/d/u/e/duesemi/${firstDeck["チーム"][i]}.png"><br>`;
                if(firstDeck["選手"] && firstDeck["選手"][i]) {
                    thRensho.innerHTML+=`${firstDeck["チーム"][i]}<br>`;
                }
            }

            thRensho.id = 'rensho_or_count';
            thRensho.innerHTML+= name;
            thRensho.style.maxWidth = '50px';                // 最大幅を制限
            thRensho.style.whiteSpace = 'normal';            // 折り返しを許可
            thRensho.style.fontSize = '12px';                // フォントサイズ

            // 採用枚数の最後の列（中央値の前）に太線を入れる
            if (i === renshos.length - 1) {
                thRensho.style.borderRight = lineColumn;
            }
            thRensho.rowSpan=2;
            tr1.appendChild(thRensho);
        });
    } else {
        const thRensho = document.createElement('th');
        thRensho.id = 'rensho_or_count';
        thRensho.style.borderRight = lineColumn;
        thRensho.colSpan = renshoCount;
        thRensho.textContent = renshoFlg ? ren_jun : '採用枚数';
        thRensho.style.borderBottom = renshoFlg ? lineHead : 'none';
        thRensho.rowSpan = renshoFlg ? 1 : 2;
        tr1.appendChild(thRensho);
    }

    const shouldOmitStats = Object.keys(selectionFilters).length === 0 && renshoCount <= 2;

    if (!shouldOmitStats) {
        // ---- 固定列: 中央値・平均・枚数毎 ----
        const thMedian = document.createElement('th');
        thMedian.rowSpan = 2;
        thMedian.textContent = '中央';
        tr1.appendChild(thMedian);

        const thMean = document.createElement('th');
        thMean.rowSpan = 2;
        thMean.textContent = '平均';
        thMean.style.borderRight = '5px solid gray';
        tr1.appendChild(thMean);

        const thCount = document.createElement('th');
        thCount.colSpan = 4;
        thCount.style.borderBottom = lineHead;
        thCount.textContent = '枚数毎の採用者数';
        tr1.appendChild(thCount);

    }

    thead.appendChild(tr1);

    // ---- ヘッダー2列目（連勝数 or 採用枚数）----
    const tr2 = document.createElement('tr');
    if (!(!PosDisp && (firstDeck["選手"]||firstDeck["チーム"]))){
        if (renshoFlg) {
            renshos.forEach((ren, i) => {
                const th = document.createElement('th');
                th.textContent = ren === 0 ? "X" : ren;

                if (rateFlg){
                    th.style.fontSize = "14px";
                }

                // 採用枚数の最後の列（中央値の前）に太線を入れる
                if (i === renshos.length - 1) {
                    th.style.borderRight = lineColumn;
                }

                tr2.appendChild(th);
            });
        }
    }

    if (!shouldOmitStats) {
        // ---- 2行目（3枚,2枚,1枚,0枚）----
        ['3枚', '2枚', '1枚', '0枚'].forEach(label => {
            const th = document.createElement('th');
            th.textContent = label;
            tr2.appendChild(th);
        });
        thead.appendChild(tr2);


        // --- フィルター列を追加（selectionFiltersに値があるときのみ） ---
        if (Object.keys(selectionFilters).length > 0) {
            const headerRows = thead.querySelectorAll('tr');
            if (headerRows.length >= 2) {
                const th1 = document.createElement('th');
                th1.rowSpan = 2;
                th1.textContent = '条件';
                headerRows[0].appendChild(th1);
            }
        }
    }else{
        thead.appendChild(tr2);
    }

}

function removeLastCardFromHistory(cardName,count) {
    for (let i = filterHistory.length - 1; i >= 0; i--) {
        if (filterHistory[i][0] === cardName && filterHistory[i][1] === count) {
            filterHistory.splice(i, 1);
            break;
        }
    }
}

function updateTable(deck_table, cardids, cardimg, cardnos, cardnms) {
    const tbody = document.getElementById('decklist_body');
    tbody.innerHTML = '';

    const deckname = Object.keys(deck_table)[0];
    const data = deck_table[deckname];

    const renshos = data['連勝数'] || [];
    const useDays = data['使用日'] || [];
    const posts = data['元ポスト'] || [];
    const cardnames = Object.keys(data).filter(k => !['元ポスト', '連勝数', 'レート','順位','選手','チーム', '使用日','ランク','グループ'].includes(k));

    const deckLength=data[Object.keys(data)[0]].length;
    // 各カード行
    let rowCount = 0;  // 表示された行数をカウント

    for (let i = 0; i < cardids.length; i++) {
        const cid = cardids[i];
        if (!(cid in data)) continue;  // 存在しないカードはスキップ

        //選択無しで全部0ならスキップ
        const val = data[cid].map(Number);
        if (!(cid in selectionFilters) && val.every(v => v === 0))continue;

        const tr = document.createElement('tr');
        const td_img = document.createElement('td');

        // 実際に表示する行数で偶奇を判定
        if (rowCount % 2 === 0){
            tr.style.backgroundColor = 'white';
            td_img.classList.add('sticky-col'); 
        }else{
            tr.style.backgroundColor = 'rgb(221,235,247)';
            td_img.classList.add('sticky-col2'); 
        }
        rowCount++;

        td_img.innerHTML = `
<div class="name_backimg2">
    <img src="https://blog-imgs-${cardimg[i]}.fc2.com/d/u/e/duesemi/L_${cardnos[i]}.png">
    <div>${cardnms[i]}</div>
</div>`;
        tr.appendChild(td_img);

        const shouldOmitStats = Object.keys(selectionFilters).length === 0 && deckLength <= 2;
        
        let values = [...val];
        if (!shouldOmitStats) {
            values.push(
                median(val),
                mean(val),
                countValues(val, 3),
                countValues(val, 2),
                countValues(val, 1),
                countValues(val, 0)
            );
        }
        const colors = [null, 'blue', 'green', 'red']; // インデックス = 値。0は無色扱い

        values.forEach((v, colIdx) => {
            const td = document.createElement('td');
            td.textContent = v;

            if (colIdx < val.length) {
                // vが1〜3なら対応色、なければ無色
                td.style.color = colors[v] || '';
            }

            const isEvenCol = (colIdx % 2 === 1);
            td.style.borderRight = `1px dotted ${isEvenCol ? 'rgb(30,144,255)' : 'rgb(255,140,0)'}`;

            // 「中央値」の1つ前の列の右側に太線
            if (colIdx === val.length - 1) {
                td.style.borderRight = lineColumn;
            }

            // 「平均」の列の右側に太線
            if (colIdx === val.length + 1) {
                td.style.borderRight = lineColumn;
            }


            // カード採用数（val部分）と採用者数（3枚〜0枚）は位置が異なる
            const isCountCell = colIdx >= val.length + 2 && colIdx <= val.length + 5;
            if (isCountCell) {
                const count = 3 - (colIdx - (val.length + 2));  // colIdxから3/2/1/0を算出
                td.style.cursor = 'pointer';

                td.addEventListener('click', (e) => {
                    e.stopPropagation(); // 他のイベントを止める
                    const card = cid;

                    if (Object.keys(selectionFilters).length === 0) {
                        createUndoButton({ [deckname]: dckl[currentDcklType][deckname] });
                    }

                    if (!(card in selectionFilters)) {
                        selectionFilters[card] = new Set();
                    }

                    if (selectionFilters[card].has(count)) {
                        selectionFilters[card].delete(count);
                        if (selectionFilters[card].size === 0) {
                            delete selectionFilters[card];
                        }
                        removeLastCardFromHistory(card, count);
                        if (filterHistory.length == 0) {
                            updateAll(deckSelects[currentDcklType].value);
                            document.getElementById(`filter_undo_container_${currentDcklType}`).style.display = 'none';
                        }
                    } else {
                        selectionFilters[card].add(count);
                        filterHistory.push([card, count]);
                    }
                    applyFilterAndUpdate({ [deckname]: dckl[currentDcklType][deckname] },currentDcklType);
                });
            }

            // 列点線、色、太線などのスタイル設定は元のまま
            tr.appendChild(td);
        });

        // --- フィルター列を追加（selectionFiltersに値があるときのみ） ---
        if (Object.keys(selectionFilters).length > 0) {
            const td = document.createElement('td');
            if (cid in selectionFilters) {
                const arr = Array.from(selectionFilters[cid]).sort((a, b) => b - a);
                td.textContent = arr.join(',');
            } else {
                td.textContent = '-';
            }
            td.style.fontWeight = 'bold';
            td.style.color = 'darkmagenta';
            td.style.borderLeft = '2px solid black';
            tr.appendChild(td);
        }



        tbody.appendChild(tr);
    }

    
    if (data['使用日'] && data['使用日'][0]!=''){
        // 使用日行
        const tr_days = document.createElement('tr');
        const td_label_days = document.createElement('td');
        td_label_days.style.borderBottom = '1px solid black';
        td_label_days.textContent = '使用日';

        // 実際に表示する行数で偶奇を判定
        if (rowCount % 2 === 0){
            tr_days.style.backgroundColor = 'white';
            td_label_days.classList.add('sticky-col'); 
        }else{
            tr_days.style.backgroundColor = 'rgb(221,235,247)';
            td_label_days.classList.add('sticky-col2'); 
        }
        rowCount++;

        tr_days.appendChild(td_label_days);

        // 使用日データを反映
        (data['使用日'] || []).forEach((dateNum, i) => {
            const td = document.createElement('td');
            td.style.fontSize = '70%';

            // mm/dd 表示にしつつ、0は非表示
            if (!dateNum || String(dateNum) === '0') {
                td.textContent = '';
            } else {
                const str = String(dateNum).padStart(6, '0');
                const mm = parseInt(str.slice(2, 4), 10);
                const dd = parseInt(str.slice(4, 6), 10);
                td.textContent = `${mm}/${dd}`;
            }

            // 列の偶奇で点線色を変える（1列目が使用日なので i+1 で判定）
            const isEvenCol = ((i + 1) % 2 === 0);
            td.style.borderRight = `1px dotted ${isEvenCol ? 'rgb(30,144,255)' : 'rgb(255,140,0)'}`;

            tr_days.appendChild(td);
        });

        tbody.appendChild(tr_days);
    }

    // ランク行
    if (data['ランク'] && !(data['ランク'].every(val => Number(val) === 0))){
        const tr_rank = document.createElement('tr');
        const td_label_rank = document.createElement('td');
        td_label_rank.style.borderBottom = '1px solid black';
        td_label_rank.textContent = 'ランク';

        // 実際に表示する行数で偶奇を判定
        if (rowCount % 2 === 0){
            tr_rank.style.backgroundColor = 'white';
            td_label_rank.classList.add('sticky-col'); 
        }else{
            tr_rank.style.backgroundColor = 'rgb(221,235,247)';
            td_label_rank.classList.add('sticky-col2'); 
        }
        rowCount++;

        tr_rank.appendChild(td_label_rank);

        (data['ランク'] || []).forEach((dateNum, i) => {
            const td = document.createElement('td');
            td.style.borderBottom = '1px solid black';
            td.innerHTML = rank_map[dateNum];

            // 列の偶奇で点線色を変える（1列目が使用日なので i+1 で判定）
            const isEvenCol = ((i + 1) % 2 === 0);
            td.style.borderRight = `1px dotted ${isEvenCol ? 'rgb(30,144,255)' : 'rgb(255,140,0)'}`;

            tr_rank.appendChild(td);
        });
        
        tbody.appendChild(tr_rank);
    }

    // グループ行
    if (data['グループ'] && !(data['グループ'].every(val => Number(val) === 0))){
        const tr_group = document.createElement('tr');
        const td_label_group = document.createElement('td');
        td_label_group.style.borderBottom = '1px solid black';
        td_label_group.textContent = 'グループ';
        // 実際に表示する行数で偶奇を判定
        if (rowCount % 2 === 0){
            tr_group.style.backgroundColor = 'white';
            td_label_group.classList.add('sticky-col'); 
        }else{
            tr_group.style.backgroundColor = 'rgb(221,235,247)';
            td_label_group.classList.add('sticky-col2'); 
        }
        rowCount++;

        tr_group.appendChild(td_label_group);

        (data['グループ'] || []).forEach((dateNum, i) => {
            const td = document.createElement('td');
            td.style.borderBottom = '1px solid black';
            td.innerHTML = group_map[dateNum];

            // 列の偶奇で点線色を変える（1列目が使用日なので i+1 で判定）
            const isEvenCol = ((i + 1) % 2 === 0);
            td.style.borderRight = `1px dotted ${isEvenCol ? 'rgb(30,144,255)' : 'rgb(255,140,0)'}`;

            tr_group.appendChild(td);
        });
        
        tbody.appendChild(tr_group);
    }

    // デッキコード行
    const tr_code = document.createElement('tr');
    const td_label_code = document.createElement('th');
    td_label_code.style.borderBottom = '1px solid black';
    td_label_code.innerHTML = '<div>デッキコード</div><br>(★はQR)';
    td_label_code.classList.add('sticky-col');
    tr_code.appendChild(td_label_code);

    for (let i = 0; i < deckLength; i++) {
        const code = createDeckCode(deckname, cardnames, data, i);
        const td = document.createElement('th');
        td.style.borderBottom = '1px solid black';
        td.innerHTML = `
            <div><a href="https://shadowverse-wb.com/ja/deck/detail/?hash=${code}" style="color:white; text-decoration:none; margin-bottom:0.5em;">■</a></div><br>
            <a href="javascript:void(0)" onclick="makeQRCodeOverlay('https://shadowverse-wb.com/ja/deck/detail/?hash=${code}')" style="color:white; text-decoration:none;">★</a>`;
        tr_code.appendChild(td);
    }
    tbody.appendChild(tr_code);


    
    if (data['元ポスト'] && data['元ポスト'][0]!=''){
        // 元ポスト行
        const tr_post = document.createElement('tr');
        const td_label_post = document.createElement('th');
        td_label_post.style.borderBottom = '1px solid black';
        td_label_post.textContent = '元ポスト';
        td_label_post.classList.add('sticky-col');
        tr_post.appendChild(td_label_post);

        posts.forEach(post_id => {
            const td = document.createElement('th');
            td.style.borderBottom = '1px solid black';
            td.innerHTML = `
                <a href="${makePostURL(post_id)}">
                <img width="30px" height="30px" src="https://blog-imgs-162.fc2.com/d/u/e/duesemi/Xpost.png">
                </a>
            `;
            tr_post.appendChild(td);
        });
        tbody.appendChild(tr_post);
    }
}


// --- 共通更新処理 ---
function updateAll(deckname, dcklType) {
    updateHeader(deckname, dckl[currentDcklType]);
    updateTable({ [deckname]: dckl[currentDcklType][deckname] }, cardids, cardimg, cardnos, cardnms, currentDcklType);
    enableCellHoverHighlight();
    setupRangeFilterUI(dckl[currentDcklType][deckname], currentDcklType);
}

function enableCellHoverHighlight() {
    const tbody = document.getElementById('decklist_body');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.forEach((tr, rowIndex) => {
        const cells = Array.from(tr.children).filter(el => el.tagName === 'TD');

        cells.forEach((cell, colIndex) => {
            cell.style.cursor = 'default';

            cell.addEventListener('mouseenter', () => {
                // 背景リセット
                tbody.querySelectorAll('td').forEach(td => td.style.backgroundColor = '');

                // 行ハイライト（すべてのセル）
                cells.forEach((td, idx) => {
                    if (idx === 0) return; // 1列目はスキップ
                    td.style.backgroundColor = 'rgb(240,230,130)';
                });

                // 列ハイライト
                rows.forEach((r, i) => {
                    const tds = Array.from(r.children).filter(el => el.tagName === 'TD');
                    if (tds[colIndex] && colIndex > 0) {
                        tds[colIndex].style.backgroundColor = 'rgb(240,230,130)';
                    }
                });
            });

        });
    });

    // tbody からマウスが離れたらハイライト解除
    tbody.addEventListener('mouseleave', () => {
        tbody.querySelectorAll('td').forEach(td => td.style.backgroundColor = '');
    });

}

// 拡大縮小処理
let zoomLevel = 1.0;

const zoomInBtn = document.getElementById('zoom_in');
const zoomOutBtn = document.getElementById('zoom_out');
const zoomDisplay = document.getElementById('zoom_display');

function updateZoom() {
    const zoomContainer = document.getElementById('zoom_container');
    zoomContainer.style.zoom = zoomLevel;
    zoomDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
}

zoomInBtn.addEventListener('click', () => {
    zoomLevel = Math.min(2.0, zoomLevel + 0.1);
    updateZoom();
});

zoomOutBtn.addEventListener('click', () => {
    zoomLevel = Math.max(0.5, zoomLevel - 0.1);
    updateZoom();
});

// 初期表示
updateZoom();

function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

let reptFlg=false;
window.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
        overlay.style.display = "";  // CSSのdisplay:noneを解除
    }
    
    let tarType = getParam('type');
    if (tarType) {
        reptFlg=true;
    } else {
        tarType='elm';  // または 'fin'
    }

    const tarDeck = getParam('deck');
    if (tarDeck!=null){
        deckSelects[tarType].value = tarDeck;
    }else{
        const firstName = Object.keys(dckl[tarType])[0];
        deckSelects[tarType].value = firstName;
    }
    switchDeckType_init(tarType);
});


window.addEventListener("load", () => {
    if (reptFlg){
        // パラメータが1つでもあるなら .tweets まで進める
        const target = document.querySelector(".decklist_main");
        if (target) target.scrollIntoView({ behavior: "auto" });
    }

    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
        overlay.style.display = "none";
    }
});