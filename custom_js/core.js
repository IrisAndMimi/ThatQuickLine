//================================================================================================
/*
 * core.js - 對話框核心
 *
 * 【重要】本檔案不認識任何功能。
 *   所有功能都由 features.js 呼叫 registerFeature() 自行登記，
 *   核心只負責：產生選單、切換按鈕/說明、把訊息交給對應功能處理。
 *   => 要移除某功能，只需刪掉它的 registerFeature 區塊，core.js 完全不用改。
 */
//================================================================================================
// 返回指令：單獨打這個字等同按 Esc（手機沒有 Esc 鍵）
const BACK_COMMAND = 'x';
//-------------------------------------------------------------
// 工具名稱：分「對外」與「對內」兩種
// 　APP_NAME       全名。用在還不知道這是什麼的地方 —— 分頁標題（一堆分頁裡要認得出來）
// 　APP_SHORT_NAME 簡寫。用在已經身在其中的地方 —— 下拉選單第一項
const APP_NAME = '那個 QuickLine';
const APP_SHORT_NAME = 'QuickLine';
//-------------------------------------------------------------
// 全域變數，用於儲存畫面上元素的狀態
const state = {
    headerSelect: '', // 儲存下拉選單的值
    userMessage: '',  // 儲存使用者的訊息
    dateFormat: '()', // 預設日期格式
    pending: null,    // 待補參數：功能說它還缺東西時，暫存在這裡
};

// 已登記的功能清單 (key = 下拉選單的值)
const FEATURES = {};
//-------------------------------------------------------------
/**
 * 登記一個功能
 * @param {Object} cfg
 * @param {string}   cfg.key       下拉選單的值(同時是顯示文字)
 * @param {string}  [cfg.buttons]  功能按鈕區 HTML
 * @param {string}  [cfg.help]     說明書區塊 HTML
 * @param {Function}[cfg.onSubmit] 送出訊息時的處理 (userMessage, state) => HTML
 * @param {Function}[cfg.onRender] 按鈕區重建後要做的初始化
 */
function registerFeature(cfg) {
    FEATURES[cfg.key] = cfg;
}
//================================================================================================
// 頁面載入，初始化事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    // 初始化：依已登記的功能，補上下拉選單的選項
    buildHeaderOptions();

    // 初始化：訊息發送按鈕
    const button = document.querySelector('.chat-footer button');
    button.addEventListener('click', addMessage); // 點擊按鈕觸發添加訊息

    // 初始化：訊息輸入框
    const input = document.getElementById('chat-input');
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            if (event.shiftKey) {
                return; // Shift+Enter 換行，交給瀏覽器預設行為
            }
            event.preventDefault(); // 不要讓 Enter 在輸入框裡留下換行
            addMessage();
        } else if (event.key === 'Tab') {
            event.preventDefault(); // 不要讓焦點跑掉
            completeCommand();
        } else if (event.key === 'Escape') {
            // 依序：取消待補提問 → 清空輸入 → 退回主選單
            if (state.pending || input.value === '') {
                goBack();
            } else {
                input.value = '';
                autoGrowInput();
                updateCmdHint();
                updateLivePreview();
            }
        }
    });
    input.addEventListener('input', () => {
        updateCmdHint();     // 即時提示
        autoGrowInput();     // 高度隨行數長高
        debouncedPreview();  // 送出後會得到什麼

        // 若剪貼簿的方框 UI 存在，聊天框一有新輸入就清空方框殘留的上次送出紀錄
        // （沿用下面 today-checkbox 那個「查有沒有這個元素」的作法，core 不需要認識剪貼簿本身）
        if (document.getElementById('repeat-text')) {
            clearRepeatFieldsOnChatInput();
        }
    });
    input.addEventListener('focus', () => {
        // 若 今日 checkbox 存在，清空輸入框 且 取消勾選今日
        const todayCheckbox = document.querySelector('input[name="today-checkbox"]');
        if (todayCheckbox) {
            toggleTodayInput(false, true);
        }
    });
    input.addEventListener('blur', debounce((event) => {
        // 當輸入框為空時，自動填入今日日期並勾選；反之，有值也不清空
        toggleTodayInput(event.target.value.trim() === '', false);
    }, 300));

    // 初始化：更新全域變數狀態
    updateState();

    // 初始化：依下拉選單「目前實際的值」重建功能按鈕
    // (瀏覽器重新載入會還原 select 的值，但不會觸發 onchange)
    updateActionButtons();

    // 初始化：比對 functionMap.xml 與實際登記的功能
    checkFunctionMap();

    // 初始化：指令提示列與輸入框高度
    updateCmdHint();
    autoGrowInput();
    updateLivePreview();

    // 初始化：開場先在對話框列出功能一覽（只在真正載入時做，bfcache 還原不重複）
    echo(getMenuHtml());

    // 初始化：一開始就把游標放進輸入框，全鍵盤操作不必先點一下
    input.focus();

    // 網址帶參數可直接送出：?q=1 1 t 開啟頁面後，等同貼上「1 1 t」並按下 Enter。
    // 用途是做捷徑連結／書籤——點開網址就直接跑完一個指令，不用手動打字。
    // 只在真正載入時處理一次（跟上面的 echo 同一個道理，bfcache 還原不重複觸發）。
    const autoQuery = new URLSearchParams(window.location.search).get('q');
    if (autoQuery) {
        input.value = autoQuery;
        addMessage();
        // 用掉就從網址上拿掉，避免使用者重新整理時又送一次
        window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
});
//-------------------------------------------------------------
// 頁面由 bfcache 還原時，重新同步功能按鈕
// (手機離線後再進入，不觸發 DOMContentLoaded，只觸發 pageshow)
window.addEventListener('pageshow', updateActionButtons);
//-------------------------------------------------------------
// 依已登記的功能，動態補上下拉選單的選項
function buildHeaderOptions() {
    const select = document.getElementById('chat-header-select');
    const exists = Array.from(select.options).map(opt => opt.value);

    // 第一項顯示工具名稱（簡寫）
    const firstOption = select.options[0];
    if (firstOption && firstOption.value === '') {
        firstOption.textContent = APP_SHORT_NAME; // 人已經在裡面了，簡寫就夠
    }

    Object.keys(FEATURES).forEach(key => {
        // 'default' 是沒選功能時的後備，不列為選項
        if (key !== 'default' && exists.indexOf(key) === -1) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = key;
            select.appendChild(opt);
        }
    });
}
//-------------------------------------------------------------
// 防抖函式(debounce)
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer); // 清除之前的定時器
        timer = setTimeout(() => func.apply(this, args), delay); // 最後一次事件處理
    };
}
//-------------------------------------------------------------
// 訊息發送按鈕：添加使用者的訊息到對話框
function addMessage() {
    const input = document.getElementById('chat-input'); // 輸入框
    const raw = input.value;
    // 多行輸入本來就是要保留原樣的空白／換行（例如剪貼簿想重複「80 個空格」，
    // 開頭那一整行就是純空白）——trim() 只用在單行，避免不小心多打的頭尾空白
    // 被誤判成內容；多行時整段照原樣使用，不然開頭的空白行反而會被吃掉。
    state.userMessage = raw.includes('\n') ? raw : raw.trim(); // 更新全域變數中的使用者訊息

    // 空字串不做事；退出與取消一律交給 Esc
    if (state.userMessage === '') {
        return;
    }

    // 單鍵 x = 返回（手機沒有 Esc 鍵，需要一個打得出來的等價指令）
    // 放在最前面，所以在待補提問中也能用它取消
    if (state.userMessage.toLowerCase() === BACK_COMMAND) {
        goBack();
        return;
    }

    // 有待補參數時，這句話就是答案（優先於一切指令解析）
    if (state.pending) {
        const pending = state.pending;
        state.pending = null;
        pushMessage(pending.resume(state.userMessage));
        return;
    }

    // 先交給指令層；已處理就不再往下走
    if (handleCommand(state.userMessage)) {
        input.value = '';
        input.focus();
        autoGrowInput();
        updateCmdHint();
        updateLivePreview();
        return;
    }

    pushMessage();
}
//-------------------------------------------------------------
// 把輸入送給目前功能，並產生氣泡
function pushMessage(presetResponse) {
    const input = document.getElementById('chat-input'); // 輸入框
    const content = document.querySelector('.chat-content'); // 對話內容區
    // 泡泡顯示使用者實際打的內容：多行時原樣顯示（開頭空白行也是內容的一部分，
    // 跟 addMessage() 的 trim 規則一致，不然泡泡跟實際送出的內容會對不上）
    const displayText = (input.value.includes('\n') ? input.value : input.value.trim()) || state.userMessage;

    if (state.userMessage) {
        // 建立使用者的訊息氣泡
        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble user';
        userBubble.innerHTML = `<div class="bubble user">${displayText}</div>`;
        content.appendChild(userBubble);

        // 更新狀態
        updateState();

        // 根據狀態生成回應
        const assistantResponse = presetResponse !== undefined ? presetResponse : generateResponse(state);

        // 功能說它還缺東西 → 記下來，下一句話就是答案
        if (assistantResponse && typeof assistantResponse === 'object' && assistantResponse.prompt) {
            state.pending = assistantResponse;
            echo(assistantResponse.prompt);
            content.scrollTop = content.scrollHeight;
            input.value = '';
            input.focus();
            autoGrowInput();
            updateCmdHint();
            return;
        }

        // 針對回應行為進行處理
        if (assistantResponse) {
            // 建立助理的回覆氣泡
            const assistantBubble = document.createElement('div');
            assistantBubble.className = 'chat-bubble assistant';
            assistantBubble.innerHTML = assistantResponse;
            content.appendChild(assistantBubble);
        }

        // 將滾動條滾動到底部以顯示最新訊息
        content.scrollTop = content.scrollHeight;

        input.value = ''; // 清空輸入框
        input.focus();
        autoGrowInput();
        updateCmdHint();
        updateLivePreview();
    }
}
//================================================================================================
/*
 * 指令層 —— 讓聊天框可以全鍵盤操作
 *
 * 設計原則：不用前綴、不用旗標，靠「模式」避開衝突
 *   主選單(尚未選功能) → 輸入被當成「指令」：功能代號、編號、或功能全名
 *   功能模式中         → 輸入被當成「該功能的參數」
 *   　　　　　　　　　　→ 但單獨輸入數字 1~n 時，切換該功能的第 n 個選項
 *   空白 Enter         → 退出目前功能，回到主選單
 *
 * 指令表由 FEATURES 自動生成，新增功能時不必改這裡。
 */
//================================================================================================
// 主選單上的功能清單（排除 default）
function getMenuFeatures() {
    return Object.keys(FEATURES).filter(key => key !== 'default');
}
//-------------------------------------------------------------
// 目前功能的選項單選鈕（取第一組 radio，數字指令對應它）
function getCurrentOptions() {
    const groups = {};
    document.querySelectorAll('#action-buttons input[type="radio"]').forEach(radio => {
        if (!groups[radio.name]) {
            groups[radio.name] = [];
        }
        groups[radio.name].push(radio);
    });
    const firstGroup = Object.keys(groups)[0];
    return firstGroup ? groups[firstGroup] : [];
}
//-------------------------------------------------------------
/**
 * 主選單：把輸入解析成功能 key
 * 接受 功能代號(cmd)、編號、功能全名，以及三者的唯一前綴
 * @param {string} text
 * @returns {string|null} - 對應的功能 key
 */
function resolveFeatureKey(text) {
    const menu = getMenuFeatures();
    const word = text.trim().toLowerCase();

    // 編號
    const index = parseInt(word, 10);
    if (String(index) === word && index >= 1 && index <= menu.length) {
        return menu[index - 1];
    }

    // 完全相符：cmd 或 功能全名
    const exact = menu.find(key => (FEATURES[key].cmd || '').toLowerCase() === word || key.toLowerCase() === word);
    if (exact) {
        return exact;
    }

    // 唯一前綴
    const hits = menu.filter(key => (FEATURES[key].cmd || '').toLowerCase().startsWith(word) || key.startsWith(text.trim()));
    return hits.length === 1 ? hits[0] : null;
}
//-------------------------------------------------------------
/**
 * 指令層總入口
 * @param {string} text - 使用者輸入
 * @returns {boolean} - true 表示已被指令層處理，不必再送給功能
 */
function handleCommand(text) {
    // 在功能模式中：「編號」切換選項，「編號 參數」則切換後直接執行
    if (state.headerSelect !== '') {
        // 多行輸入一律視為純參數
        // （選項是單一 token 的概念，不可能跨行；有換行就代表使用者在給資料）
        if (text.includes('\n')) {
            return false;
        }

        const options = getCurrentOptions();
        const matched = text.match(/^(\S+)(?:\s+(.+))?$/);
        if (!options.length || !matched) {
            return false; // 沒有選項或不是這種形式，交給功能自己處理
        }

        const target = resolveOption(matched[1], options);
        if (!target) {
            return false; // 第一段不是編號也不是代號，整串當一般參數
        }

        // 切換選項
        options.forEach(radio => { radio.checked = false; });
        target.checked = true;
        updateState();

        // 只有編號／代號 → 切換完就結束
        // 但若該選項本身就是一個動作(例如「複製換行字元」)，交給功能立刻執行
        const rest = matched[2];
        if (rest === undefined) {
            const feature = FEATURES[state.headerSelect] || {};
            const done = (typeof feature.onOptionChange === 'function')
                ? feature.onOptionChange(target.value)
                : null;

            if (done) {
                pushMessage(done);
            } else {
                echo(`已切換選項：${getOptionName(target)}` + getOptionTableHtml());
            }
            return true;
        }

        // 編號 + 參數 → 參數交給功能執行，泡泡仍顯示原始輸入
        state.userMessage = rest.trim();
        return false;
    }

    // 主選單：多行不會是指令
    if (text.includes('\n')) {
        echo('主選單只接受指令，請先選一個功能' + getMenuHtml());
        return true;
    }

    // 主選單：解析成功能，也支援「功能 選項 參數」一次到位的路徑指令
    // 　例：1 1 t　＝　進複製日期(1) + 選 / 格式(1) + 今天(t)，不必先看到「已進入」畫面
    const matched = text.match(/^(\S+)(?:\s+(.+))?$/);
    const key = matched ? resolveFeatureKey(matched[1]) : null;
    if (key) {
        const rest = matched[2];
        if (rest === undefined) {
            enterFeature(key);
            return true;
        }
        // 直接路徑：先切到該功能（同步下拉選單與按鈕區），
        // 剩下的字串交給「功能內」那段邏輯處理（選項／參數判斷完全共用，不重寫一份）。
        // 先把 state.userMessage 設成 rest，這樣即使 rest 解析不到選項代號，
        // 也會被當成單純的參數，而不是整段原始輸入（含前面選功能的那個編號）。
        document.getElementById('chat-header-select').value = key;
        updateActionButtons();
        state.userMessage = rest.trim();
        return handleCommand(rest);
    }
    echo(`找不到指令「${text}」<br>${getMenuHtml()}`);
    return true;
}
//-------------------------------------------------------------
// 進入某功能（同步下拉選單與按鈕區，達成鍵盤／滑鼠雙向同步）
function enterFeature(key) {
    const select = document.getElementById('chat-header-select');
    select.value = key;
    updateActionButtons();

    const feature = FEATURES[key];
    echo(`已進入「${key}」${feature.usage ? '<br>用法：' + feature.usage : ''}`
        + (feature.examples ? `<br>例：${feature.examples}` : '')
        + getOptionTableHtml()
        + '<div class="cmd-note">打「編號」或「代號」切換選項，後面接參數可一次執行'
        + '<br>參數要換行或保留空白時用 <b>Shift+Enter</b>（多行一律當成純參數，不解析選項）'
        + '<br>打 <b>x</b> 返回</div>');
}
//-------------------------------------------------------------
// 取得選項的顯示名稱（從包住它的 label 取第一行文字）
function getOptionName(radio) {
    const label = radio.closest('label');
    return label ? label.textContent.trim().split('\n')[0].trim() : radio.value;
}
//-------------------------------------------------------------
/**
 * 把一段文字解析成某個選項
 * 　可用「編號」或「代號」(data-cmd)，代號可打唯一前綴
 * @param {string} text
 * @param {Array} options - 目前功能的選項單選鈕
 * @returns {Element|null}
 */
function resolveOption(text, options) {
    const word = text.trim().toLowerCase();

    // 編號
    const index = parseInt(word, 10);
    if (String(index) === word && index >= 1 && index <= options.length) {
        return options[index - 1];
    }

    // 代號完全相符
    const exact = options.find(radio => (radio.dataset.cmd || '').toLowerCase() === word);
    if (exact) {
        return exact;
    }

    // 代號唯一前綴
    const hits = options.filter(radio => (radio.dataset.cmd || '').toLowerCase().startsWith(word) && word !== '');
    return hits.length === 1 ? hits[0] : null;
}
//-------------------------------------------------------------
/**
 * 把目前功能的選項排成表格（與主選單同一種呈現）
 * @returns {string} - 沒有選項時回傳空字串
 */
function getOptionTableHtml() {
    const options = getCurrentOptions();
    if (!options.length) {
        return '';
    }

    // 不特別標示「目前選到哪個」——下方輸入格式本身就看得出來，不需要重複講一次。
    const rows = options.map((radio, i) =>
        `<tr><td>${i + 1}</td><td><code>${radio.dataset.cmd || ''}</code></td><td>${getOptionName(radio)}</td></tr>`
    ).join('');

    return `<table class="help-table opt-table">
        <tr><th>#</th><th>代號</th><th>選項</th></tr>
        ${rows}
    </table>`;
}
//-------------------------------------------------------------
/**
 * 返回：Esc 與單鍵 x 共用同一套行為
 * 　有待補提問 → 取消提問，留在原功能
 * 　否則      → 退回主選單
 */
function goBack() {
    const input = document.getElementById('chat-input');

    if (state.pending) {
        state.pending = null;
        input.value = '';
        echo('已取消');
        autoGrowInput();
        updateCmdHint();
        updateLivePreview();
        return;
    }
    exitToMainMenu();
}
//-------------------------------------------------------------
// 退出到主選單
function exitToMainMenu() {
    state.pending = null; // 離開就放棄未完成的提問
    const select = document.getElementById('chat-header-select');
    const wasIn = select.value;
    select.value = '';
    updateActionButtons();
    echo(wasIn ? `已退出「${wasIn}」<br>${getMenuHtml()}` : getMenuHtml());
    const input = document.getElementById('chat-input');
    input.value = '';
    input.focus();
    autoGrowInput();
    updateCmdHint();
    updateLivePreview();
}
//-------------------------------------------------------------
// 產生主選單指令表（由 FEATURES 自動生成）
function getMenuHtml() {
    const rows = getMenuFeatures().map((key, i) => {
        const f = FEATURES[key];
        return `<tr><td>${i + 1}</td><td><code>${f.cmd || ''}</code></td><td>${key}</td><td>${f.usage || ''}</td></tr>`;
    }).join('');
    return `<b>主選單</b>　打「編號」或「代號」進入功能
        <table class="help-table">
            <tr><th>#</th><th>代號</th><th>功能</th><th>用法</th></tr>
            ${rows}
        </table>`;
}
//================================================================================================
/*
 * 即時預覽 —— 邊打邊顯示「送出之後會得到什麼」
 *
 * 另有 onOptionChange(optionValue)：當使用者只指定選項、沒帶參數時呼叫。
 * 回傳 HTML 表示「這個選項本身就是一個動作，已經做完了」；回傳 null 則只是單純切換。
 *
 * 功能只要提供 onPreview(userMessage, state, optionValue)，回傳：
 * 　{ text }  送出後會得到這段文字
 * 　{ error } 這樣送出會失敗，附上原因
 * 　{ error, incomplete: true }
 * 　          還沒打完 —— 顯示成灰色提示而非紅色錯誤。
 * 　          預覽是「邊打邊看」，輸入到一半本來就不合法，用 ✗ 嚇人是錯的。
 * 　{ need }  還缺東西，送出後會回問
 * 　{ as }    （選填）它把你的輸入解讀成什麼 —— 讓「2 t」這種縮寫看得懂
 * 沒提供 onPreview 的功能就不顯示預覽，不會出錯。
 *
 * 前提：功能的「算結果」必須與「複製／改畫面」分離，
 * 　　　否則光是預覽就會把東西寫進剪貼簿。features.js 的 buildXxx() 系列即為此而拆。
 */
//================================================================================================
const debouncedPreview = debounce(updateLivePreview, 120);

function updateLivePreview() {
    const box = document.getElementById('live-preview');
    const input = document.getElementById('chat-input');
    if (!box || !input) {
        return;
    }

    const raw = input.value;
    if (raw.trim() === '') {
        box.innerHTML = '';
        return;
    }

    // 單鍵 x = 返回
    if (raw.trim().toLowerCase() === BACK_COMMAND) {
        box.innerHTML = previewRow('返回', state.pending ? '取消這個提問' : (state.headerSelect ? '回到主選單' : '已經在主選單了'));
        return;
    }

    // 待補提問中：這句話會被當成答案
    if (state.pending) {
        box.innerHTML = previewRow('回答', escapeHtml(raw.trim()));
        return;
    }

    // 主選單：預覽會進入哪個功能，也支援「編號 選項 參數」的路徑指令
    if (state.headerSelect === '') {
        if (raw.includes('\n')) {
            box.innerHTML = previewRow('✗', '主選單不接受多行輸入');
            return;
        }
        const matched = raw.trim().match(/^(\S+)(?:\s+(.+))?$/);
        const key = matched ? resolveFeatureKey(matched[1]) : null;
        if (!key) {
            box.innerHTML = previewRow('✗', `找不到指令「${escapeHtml(raw.trim())}」`);
            return;
        }
        // 只給到「會跳進哪個功能、帶著什麼路徑」；實際選項/參數怎麼解析，
        // 留給進去之後同一套邏輯處理，這裡不重算一次（避免兩邊各寫一套判斷）。
        box.innerHTML = matched[2] === undefined
            ? previewRow('進入', key)
            : previewRow('進入', `${escapeHtml(key)}　→　直接帶入「${escapeHtml(matched[2])}」`);
        return;
    }

    // 功能內：先看有沒有指定選項，再把剩下的交給功能預覽
    let message = raw;
    let optionValue = null;
    let optionNote = '';

    if (!raw.includes('\n')) {
        const matched = raw.match(/^(\S+)(?:\s+(.+))?$/);
        const target = matched ? resolveOption(matched[1], getCurrentOptions()) : null;
        if (target) {
            optionValue = target.value;
            optionNote = `「${getOptionName(target)}」`;
            if (matched[2] === undefined) {
                box.innerHTML = previewRow('切換', `「${getOptionName(target)}」`);
                return;
            }
            message = matched[2];
        }
    }

    const feature = FEATURES[state.headerSelect] || {};
    if (typeof feature.onPreview !== 'function') {
        box.innerHTML = '';
        return;
    }

    const result = feature.onPreview(message, state, optionValue) || {};

    // 先講「怎麼解讀的」，再講「會得到什麼」
    let rows = '';
    if (optionNote) {
        rows += previewRow('選項', optionNote);
    }
    if (result.as) {
        rows += previewRow('進入', escapeHtml(result.as));
    }

    if (result.error && result.incomplete) {
        box.innerHTML = rows + previewRow('…', escapeHtml(result.error), 'pending');
    } else if (result.error) {
        box.innerHTML = rows + previewRow('✗', escapeHtml(result.error));
    } else if (result.need) {
        box.innerHTML = rows + previewRow('？', `送出後會回問你「${escapeHtml(result.need)}」`);
    } else if (typeof result.text === 'string') {
        box.innerHTML = rows + previewRow('得到', `<span class="preview-text">${escapeHtml(result.text)}</span>`);
    } else {
        box.innerHTML = rows;
    }
}
//-------------------------------------------------------------
// 預覽的一列：標籤 + 內容
function previewRow(label, html, className) {
    return `<div class="preview-row${className ? ' ' + className : ''}"><span class="preview-label">${label}</span>${html}</div>`;
}
//-------------------------------------------------------------
// 預覽是把使用者輸入直接放進 innerHTML，必須先跳脫
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
//-------------------------------------------------------------
// 讓輸入框的高度隨內容行數變化（超過 CSS 的 max-height 後改為內部捲動）
function autoGrowInput() {
    const input = document.getElementById('chat-input');
    if (!input) {
        return;
    }
    // 先歸零再量，否則縮短內容時量到的是舊高度
    // （CSS 的 min-height 保證不會低於一行，max-height 之後改內部捲動）
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
}
//-------------------------------------------------------------
/**
 * Tab 自動補全：只在主選單有效
 * 　唯一候選 → 直接補完　多個候選 → 依序循環
 */
let cmdTabIndex = -1;
let cmdTabPrefix = null;

function completeCommand() {
    const input = document.getElementById('chat-input');
    if (state.headerSelect !== '') {
        return; // 功能模式中沒有指令可補
    }

    // 第一次按 Tab 時記住當時的字首，之後就以它為準循環
    if (cmdTabPrefix === null || !input.value.startsWith(cmdTabPrefix) || input.value === '') {
        cmdTabPrefix = input.value.trim().toLowerCase();
        cmdTabIndex = -1;
    }

    const candidates = getCommandCandidates(cmdTabPrefix);
    if (!candidates.length) {
        return;
    }
    cmdTabIndex = (cmdTabIndex + 1) % candidates.length;
    input.value = candidates[cmdTabIndex];
    updateCmdHint();
}
//-------------------------------------------------------------
// 取得符合字首的指令代號清單
function getCommandCandidates(prefix) {
    const word = (prefix || '').trim().toLowerCase();
    return getMenuFeatures()
        .map(key => FEATURES[key].cmd)
        .filter(cmd => cmd && cmd.toLowerCase().startsWith(word));
}
//-------------------------------------------------------------
/**
 * 提示列：顯示「你在哪、能做什麼」
 *
 * 【分工】三個地方各司其職，不互相重複：
 * 　對話框氣泡    進入功能時列出完整的選項表與例子（資訊量最大，但會被捲走）
 * 　提示列        常駐，只講「你在哪、該打什麼形狀的東西」
 * 　即時預覽      唯一解讀輸入內容的地方，講「這次送出會怎樣」
 *
 * 　提示列刻意不評斷輸入內容 —— 兩邊都解讀同一段輸入的話，不但重複，
 * 　還會因為各寫一套比對邏輯而彼此矛盾
 * 　（曾經發生：提示列說「找不到 1」，預覽說「進入 複製日期」，而按下去真的會進去）。
 */
function updateCmdHint() {
    const hint = document.getElementById('cmd-hint');
    if (!hint) {
        return;
    }

    // 功能模式：你在哪、該打什麼形狀的東西
    if (state.headerSelect !== '') {
        const feature = FEATURES[state.headerSelect] || {};
        hint.innerHTML = `<b>${state.headerSelect}</b>　${feature.usage || ''}`;
        return;
    }

    // 主選單：功能清單在上方氣泡裡，這裡只留位置與唯一不在氣泡裡的提示
    hint.innerHTML = '<b>主選單</b>　Tab 補全指令　也可直接打「編號 選項 參數」一次到位';
}
//-------------------------------------------------------------
// 在對話區插入一則助理訊息
function echo(html) {
    const content = document.querySelector('.chat-content');
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble assistant';
    bubble.innerHTML = `<div class="bubble assistant">${html}</div>`;
    content.appendChild(bubble);
    content.scrollTop = content.scrollHeight;
}
//================================================================================================
// 更新全域變數的狀態
function updateState() {
    state.headerSelect = document.getElementById('chat-header-select').value; // 更新下拉選單的值

    const dateFormatElement = document.querySelector('input[name="date-format"]:checked'); // 獲取被選中的單選按鈕
    if (dateFormatElement) {
        state.dateFormat = dateFormatElement.value; // 更新日期格式
    }
}
//================================================================================================
/**
 * 根據下拉選單的值，動態更新 功能按鈕區 與 說明書區塊
 *
 * HTML 結構要求：
 * - 功能按鈕區域的容器需要有 ID 為 "action-buttons"
 * - 說明書區塊的容器需要有 ID 為 "help-block"
 */
function updateActionButtons() {
    // 更新狀態
    updateState();

    const feature = FEATURES[state.headerSelect] || FEATURES['default'] || {};

    // 動態更新功能按鈕與說明書（允許傳函式，讓內容在渲染當下才生成）
    document.getElementById('action-buttons').innerHTML = resolveContent(feature.buttons);
    document.getElementById('help-block').innerHTML = resolveContent(feature.help);

    // 重建後，交給該功能自行初始化
    if (typeof feature.onRender === 'function') {
        feature.onRender();
    }

    updateTitle();
    updateLivePreview(); // 切換功能或選項後，預覽要跟著重算
}
//-------------------------------------------------------------
// 依目前所在的功能更新分頁標題
// 　主選單 → 那個 QuickLine
// 　功能內 → 複製日期 · 那個 QuickLine
function updateTitle() {
    document.title = state.headerSelect ? `${state.headerSelect} · ${APP_NAME}` : APP_NAME;
}
//-------------------------------------------------------------
/**
 * 取出 buttons / help 的內容，支援字串或函式
 * @param {string|Function} content
 * @returns {string} - 回傳 HTML
 */
function resolveContent(content) {
    if (typeof content === 'function') {
        return content();
    }
    return content || '';
}
//================================================================================================
// 根據全域狀態生成回覆
function generateResponse(state) {
    const feature = FEATURES[state.headerSelect] || FEATURES['default'] || {};

    if (typeof feature.onSubmit === 'function') {
        return feature.onSubmit(state.userMessage, state);
    }
    return `<div class="bubble assistant">這是預設回覆</div>`;
}
//================================================================================================
/**
 * 產生可複製區塊 HTML
 * @param {string} copyText - 要複製的文字
 * @returns {string} - 回傳 HTML 結果
 */
function getCopyableHmtl(copyText) {
	copyToClipboard(copyText); // 自動複製到剪貼簿
	// 產生可複製區塊 HTML
	const tmpHtml = returnMsgStorage.rType.find(item => item.key === 'copyCodeBlock')?.value;
	const renderedHTML = new Function('codeBlockId', 'copyText', `return \`${tmpHtml}\`;`)(
		`code-block-${Date.now()}`
		, copyText
	);
	return renderedHTML;
}
//-------------------------------------------------------------
/**
 * 將文字複製到剪貼簿
 * @param {string} text - 要複製的文字
 */
function copyToClipboard(text) {
    // 使用現代 Clipboard API
    navigator.clipboard.writeText(text)
        .then(() => {
            alert('已複製到剪貼簿！');
			console.log(`Copied to clipboard: ${text}`);
        })
        .catch(err => {
            console.error('複製失敗：', err);
        });
}
//-------------------------------------------------------------
// 將指定區塊的文字複製到剪貼簿
function copyCodeblock(id) {
    const codeBlock = document.getElementById(id); // 找到代碼區域
    if (codeBlock) {
        const text = codeBlock.textContent || codeBlock.innerText; // 獲取文字內容
		copyToClipboard(text);
    }
}
//================================================================================================
/**
 * 自我檢查：比對 functionMap.xml 的紀錄 與 實際登記的功能
 *
 * - 以 http(s) 開啟時：會真的讀取 xml 並比對，不一致就在 console 告警
 * - 以 file:// 直接雙擊開啟時：瀏覽器 CORS 會擋下讀取，此時僅印出實際清單供人工核對
 *   (功能本身完全不受影響，這只是開發時的提醒)
 */
function checkFunctionMap() {
    const actual = Object.keys(FEATURES).filter(k => k !== 'default').sort();
    console.log('[functionMap] 實際登記的功能：', actual.join(', '));

    fetch('functionMap.xml')
        .then(res => res.text())
        .then(text => {
            const xml = new DOMParser().parseFromString(text, 'application/xml');
            const listed = Array.from(xml.querySelectorAll('function'))
                .filter(node => node.getAttribute('listed') !== 'false') // listed="false" 不列入比對
                .map(node => node.getAttribute('key')).sort();

            const missing = listed.filter(k => actual.indexOf(k) === -1); // xml 有、程式沒有
            const extra = actual.filter(k => listed.indexOf(k) === -1);   // 程式有、xml 沒有

            if (missing.length === 0 && extra.length === 0) {
                console.log('[functionMap] ✓ 與 functionMap.xml 一致');
                return;
            }
            if (missing.length) {
                console.warn('[functionMap] ✗ xml 有紀錄但實際未載入：', missing.join(', '));
            }
            if (extra.length) {
                console.warn('[functionMap] ✗ 實際已載入但 xml 未紀錄：', extra.join(', '));
            }
        })
        .catch(() => {
            console.log('[functionMap] (以 file:// 開啟，略過 xml 比對；請人工核對上方清單)');
        });
}
//================================================================================================
