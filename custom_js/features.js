//================================================================================================
/*
 * features.js - 所有功能
 *
 * 【結構】每個功能都是一個獨立區塊，格式固定為：
 *     [ 兩條斜線 ]#region 功能：名稱     ← 區塊開始
 *        1. 該功能的內部函式
 *        2. registerFeature({ ... })    ← 向 core.js 登記
 *     [ 兩條斜線 ]#endregion 功能：名稱  ← 區塊結束
 *
 *   （上面刻意不寫成真的標記，避免解析工具把這段說明也當成一個區塊）
 *
 * 【移除功能】把整個區塊(從 #region 到 #endregion)刪掉即可，
 *   core.js 與其他功能都不受影響。
 * 【新增功能】複製任一區塊改寫，不需要動 core.js 或 index.html。
 *
 * 【#region】是通用慣例，VS Code 等編輯器可直接收合，方便整塊檢視或折疊。
 */
//================================================================================================


//#region 功能：複製日期  ────────────────────────────────────────────────
//   說明：把 915 / 0915 / 20210915 這類簡寫，轉成指定格式的完整日期
//   原始檔：custom_js/copy_Date.js
/**
 * 當「今日」checkbox 變更時觸發
 * @param {Event} event - 變更事件
 */
function IsTodayChange(event) {
    toggleTodayInput(event.target.checked, true);
}
// 加入防抖處理
const debouncedIsTodayChange = debounce(IsTodayChange, 300);
//-------------------------------------------------------------
/**
 * 控制 勾選「今日」 與 輸入框 的同步更新
 * @param {boolean} isToday - 是否 設定為今日
 * @param {boolean} isClean - 是否 清空輸入框(取消勾選今日)
 */
function toggleTodayInput(isToday, isClean) {
    const todayCheckbox = document.querySelector('input[name="today-checkbox"]'); // 今日 checkbox
	if (todayCheckbox) {
		const input = document.getElementById('chat-input'); // 輸入框
		if (isToday) {
			todayCheckbox.checked = true;
			const today = new Date();
			const month = String(today.getMonth() + 1).padStart(2, '0');
			const day = String(today.getDate()).padStart(2, '0');
			input.value = `${month}${day}`; // 填寫今日的 mmdd 格式
		} else {
			todayCheckbox.checked = false;
			if (isClean) {
				input.value = ''; // 清空輸入框
			}
		}
	}
}
//-------------------------------------------------------------
// 自訂格式支援的標記(說明書表格由此自動生成，改這裡即可同步)
// 注意：大小寫有別 —— MM 是月份、mm 是分鐘
const DATE_TOKENS = [
    { token: 'cyy',  desc: '民國年（西元-1911）', get: d => String(d.getFullYear() - 1911) },
    { token: 'yyyy', desc: '西元年（四位）',     get: d => String(d.getFullYear()) },
    { token: 'yy',   desc: '西元年（末兩位）',   get: d => String(d.getFullYear()).slice(-2) },
    { token: 'MM',   desc: '月份（補零）',       get: d => String(d.getMonth() + 1).padStart(2, '0') },
    { token: 'M',    desc: '月份（不補零）',     get: d => String(d.getMonth() + 1) },
    { token: 'dd',   desc: '日期（補零）',       get: d => String(d.getDate()).padStart(2, '0') },
    { token: 'd',    desc: '日期（不補零）',     get: d => String(d.getDate()) },
    { token: 'dddd', desc: '星期（完整）',       get: d => d.toLocaleDateString('zh-TW', { weekday: 'long' }) },
    { token: 'ddd',  desc: '星期（簡短）',       get: d => d.toLocaleDateString('zh-TW', { weekday: 'short' }) },
    { token: 'HH',   desc: '時（24小時，補零）', get: d => String(d.getHours()).padStart(2, '0') },
    { token: 'H',    desc: '時（24小時）',       get: d => String(d.getHours()) },
    { token: 'hh',   desc: '時（12小時，補零）', get: d => String(d.getHours() % 12 || 12).padStart(2, '0') },
    { token: 'h',    desc: '時（12小時）',       get: d => String(d.getHours() % 12 || 12) },
    { token: 'mm',   desc: '分（補零）',         get: d => String(d.getMinutes()).padStart(2, '0') },
    { token: 'm',    desc: '分（不補零）',       get: d => String(d.getMinutes()) },
    { token: 'ss',   desc: '秒（補零）',         get: d => String(d.getSeconds()).padStart(2, '0') },
    { token: 's',    desc: '秒（不補零）',       get: d => String(d.getSeconds()) },
    { token: 'tt',   desc: '上午 / 下午',        get: d => (d.getHours() < 12 ? '上午' : '下午') }
];
//-------------------------------------------------------------
/**
 * 依自訂格式字串產生日期文字
 * 　標記以「長的優先」比對，避免 ddd 被 dd 先吃掉
 * 　'單引號內' 的內容原樣輸出；\\x 可跳脫單一字元
 * @param {string} pattern - 格式字串，例如 "所在日期yyyyMMdd，那天是ddd"
 * @param {Date} date - 日期物件
 * @returns {string} - 回傳格式化後的文字
 */
function formatDateByPattern(pattern, date) {
    const tokens = DATE_TOKENS.map(t => t.token).sort((a, b) => b.length - a.length);
    const regex = new RegExp(`\\\\(.)|'([^']*)'|(${tokens.join('|')})`, 'g');

    return pattern.replace(regex, (match, escaped, literal, token) => {
        if (escaped !== undefined) {
            return escaped; // \\yyyy => 原樣輸出 yyyy 的 y
        }
        if (literal !== undefined) {
            return literal; // '任意文字' => 原樣輸出
        }
        return DATE_TOKENS.find(t => t.token === token).get(date);
    });
}
/* 測試範例
	formatDateByPattern('所在日期yyyyMMdd，那天是ddd', new Date(2026,7,16));
	// => 所在日期20260816，那天是週日
	formatDateByPattern("yyyy'年'M'月'd'日' tt hh:mm", new Date(2026,7,16,21,5));
	// => 2026年8月16日 下午 09:05
*/
//-------------------------------------------------------------
/**
 * 決定實際要格式化的時間點，依序判斷：
 * 　1. 輸入已指定時間(如 1231.115959) → 直接採用
 * 　2. 未指定時間，且是「今天」        → 用現在時刻
 * 　3. 未指定時間，其他日期            → 該日的 00:00:00
 * @param {Object} parsed - parseDateString() 的結果 { date, hasTime }
 * @returns {Date} - 回傳實際使用的日期物件
 */
function resolveDateTime(parsed) {
    if (parsed.hasTime) {
        return parsed.date; // 使用者已明確指定時間，不覆寫
    }

    const now = new Date();
    const isToday = parsed.date.getFullYear() === now.getFullYear()
        && parsed.date.getMonth() === now.getMonth()
        && parsed.date.getDate() === now.getDate();
    return isToday ? now : parsed.date;
}
//-------------------------------------------------------------
/**
 * 自訂格式輸入框的 focus / blur 連動
 * 　點進去   → 直接切到「自訂格式」，不必先回頭點單選鈕
 * 　離開且是空的 → 視為沒有要用自訂格式，退回第一個選項
 *
 * 【為什麼不加防抖】
 * 　防抖是給高頻重複事件(打字、捲動)用的，blur 一次互動只觸發一次，加了只是單純延遲。
 * 　要判斷「焦點跑去哪」，正確工具是 event.relatedTarget —— 它在 blur 當下就知道，
 * 　不必等到 click(mouseup) 才反應，所以不會出現「先跳回第一個、再跳到你點的那個」的閃爍。
 * @param {boolean} isFocus - true：取得焦點；false：失去焦點
 * @param {FocusEvent} [event] - blur 事件，用來取得 relatedTarget
 */
function toggleCustomFormatRadio(isFocus, event) {
    const input = document.getElementById('date-custom-format');
    if (!input) {
        return;
    }

    if (isFocus) {
        const custom = document.querySelector('input[name="date-format"][value="custom"]');
        if (custom) {
            custom.checked = true;
        }
    } else if (input.value.trim() === '') {
        // 焦點正要移到同一組的其他選項 → 那次點擊自己會選好，不要先跳回第一個造成閃爍
        const nextFocus = event ? event.relatedTarget : null;
        const isSameGroup = nextFocus && nextFocus.name === 'date-format';

        if (!isSameGroup) {
            // 退回 DOM 上的第一個選項（順序調整時會跟著變，這是刻意的）
            const first = document.querySelector('input[name="date-format"]');
            if (first) {
                first.checked = true;
            }
        }
    }
    updateCustomFormatPreview();
}
//-------------------------------------------------------------
/**
 * 即時預覽自訂格式的結果
 */
function updateCustomFormatPreview() {
    const input = document.getElementById('date-custom-format');
    const preview = document.getElementById('date-custom-preview');
    if (!input || !preview) {
        return;
    }

    // 空白判定一律用 trim()，與 toggleCustomFormatRadio() 保持同一標準
    // (若這裡用 !== '' ，只打空白時會把剛退回的選項又勾回 custom)
    const isEmpty = input.value.trim() === '';

    // 一開始打字就自動選中「自訂格式」，省得使用者還要回去點單選鈕
    const radio = document.querySelector('input[name="date-format"][value="custom"]');
    if (radio && !isEmpty) {
        radio.checked = true;
    }

    if (isEmpty) {
        preview.textContent = '（輸入格式後這裡會即時顯示結果）';
        return;
    }
    preview.textContent = formatDateByPattern(input.value, resolveDateTime({ date: new Date(), hasTime: true }));
}
//-------------------------------------------------------------
/**
 * 把解析結果講成人話，讓 t、1231 這類縮寫在預覽裡看得懂
 * @param {string} raw - 使用者原本打的字
 * @param {Object} parsed - parseDateString() 的結果
 * @returns {string}
 */
function describeParsedDate(raw, parsed) {
    const d = resolveDateTime(parsed);
    const now = new Date();
    const isToday = d.getFullYear() === now.getFullYear()
        && d.getMonth() === now.getMonth()
        && d.getDate() === now.getDate();

    const ymd = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    const week = d.toLocaleDateString('zh-TW', { weekday: 'short' });
    const hms = (parsed.hasTime || isToday)
        ? ` ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
        : '';

    return `${raw.trim()} ＝ ${ymd}(${week})${hms}${isToday ? '　今日' : ''}`;
}
//-------------------------------------------------------------
/**
 * 判斷 parseDateString 失敗的輸入，是「還沒打完」還是「已經打完但是錯的」。
 *
 * 不能只看形狀（0~8 位數字＋可選的「.」加 0~6 位數字）——這樣沒辦法分辨
 * 「位數還沒到、可能繼續打就對了」跟「位數已經到位、但數值本身不合法」。
 * 例如 20231301（月份 13 不存在）、1231.2565（時間 25:65 不合法）都是
 * 剛好 8 位數／時間剛好 4 位數，形狀完全符合，但已經是「打完了、就是錯的」，
 * 再打下去也救不回來，不該顯示成「還沒打完」的灰色提示。
 *
 * 日期段合法長度：3／4／7／8（M+DD、MM+DD、YYYY+M+DD、YYYY+MM+DD）
 * 時間段合法長度：2／4／6（HH、HHmm、HHmmss）
 * 只有「還沒打到任何合法長度、但還有機會繼續打」時才算「還在打」；
 * 一旦某一段的位數已經到位，parseDateString 卻還是失敗，
 * 代表那段的數值本身有問題（月份/日期/時分秒超出範圍），是確定的錯誤。
 * @param {string} trimmed - 已經 trim() 過的輸入
 * @returns {boolean}
 */
function isTypingDate(trimmed) {
    if (/^(t|to|tod|toda|today|今|今天)$/i.test(trimmed)) {
        return true;
    }
    const shape = trimmed.match(/^(\d*)(\.(\d*))?$/);
    if (!shape) {
        return false; // 含其他符號、超過一個「.」，形狀本身就不對
    }

    const DATE_TARGETS = [3, 4, 7, 8];
    const dateLen = shape[1].length;
    if (!DATE_TARGETS.includes(dateLen)) {
        return dateLen < 8; // 還沒到任何合法長度，只要沒超過最大長度就還有機會
    }

    const hasDot = shape[2] !== undefined;
    if (!hasDot) {
        // 日期段位數已到位，卻還是解析失敗 → 只可能是數值本身無效，確定錯誤
        return false;
    }

    const TIME_TARGETS = [2, 4, 6];
    const timeLen = shape[3].length;
    if (!TIME_TARGETS.includes(timeLen)) {
        return timeLen < 6;
    }

    // 日期、時間位數都已到位，仍解析失敗 → 至少一段數值無效，確定錯誤
    return false;
}
//-------------------------------------------------------------
/**
 * 【純計算】把輸入算成最終文字，不做任何複製或改畫面
 * @param {string} userMessage - 使用者輸入的日期字串
 * @param {string} dateFormat - 日期格式類型
 * @param {boolean} [silent] - 預覽時傳 true，不輸出 console 錯誤
 * @returns {Object} - { text } 成功／{ error } 失敗／{ need } 需要補資料
 */
function buildDateText(userMessage, dateFormat, silent) {
    const parsed = parseDateString(userMessage, silent);
    if (!parsed) {
        const typing = isTypingDate(userMessage.trim());
        return typing
            ? { error: '還沒是完整的日期（例：1231、20211231、today）', incomplete: true }
            : { error: '無法解析的日期格式' };
    }

    if (dateFormat === 'custom') {
        const input = document.getElementById('date-custom-format');
        const pattern = input ? input.value : '';
        if (pattern.trim() === '') {
            return { need: '格式字串', parsed: parsed };
        }
        return { text: formatDateByPattern(pattern, resolveDateTime(parsed)) };
    }

    // 既有的四種格式只用到年月日，時間部分不影響
    return { text: getFormatDate(dateFormat, parsed.date) };
}
//-------------------------------------------------------------
/**
 * 產生可複製日期區塊 HTML
 * @param {string} userMessage - 使用者輸入的日期字串
 * @param {string} dateFormat - 日期格式類型
 * @returns {string|Object} - HTML，或需要補資料時回傳 { prompt, resume }
 */
function getFormatDateHtmlC(userMessage, dateFormat) {
    const built = buildDateText(userMessage, dateFormat);

    if (built.error) {
        return `<div class="bubble assistant">${built.error}</div>`;
    }

    // 還沒給格式 → 回問一句，把已解析好的日期記在閉包裡等答案
    if (built.need) {
        const input = document.getElementById('date-custom-format');
        const parsed = built.parsed;
        return {
            prompt: '這個日期要用什麼格式？（例：yyyy年M月d日）　Esc 取消',
            resume: (answer) => {
                if (answer.trim() === '') {
                    return `<div class="bubble assistant">已取消</div>`;
                }
                if (input) {
                    input.value = answer;
                    updateCustomFormatPreview();
                }
                return getCopyableHmtl(formatDateByPattern(answer, resolveDateTime(parsed)));
            }
        };
    }
    return getCopyableHmtl(built.text);
}
//-------------------------------------------------------------
/**
 * 根據 格式類型 和 日期，生成格式化文字
 * @param {string} type - 日期格式類型
 * @param {Date} [date] - 傳入的日期物件，如果未提供則使用目前日期
 */
function getFormatDate(type, date) {
    const tDate = date || new Date(); // 如果未傳入日期，則使用目前日期

    const year = tDate.getFullYear();
    const month = tDate.getMonth() + 1; // 月份從 0 開始，所以加 1
    const day = tDate.getDate();
    const week = tDate.toLocaleDateString('zh-TW', { weekday: 'long' });

    let formattedDate = '';

    // 根據類型格式化日期
    switch (type) {
        case '/': // 格式：/ YYYY年M月D日 星期
            formattedDate = `/ ${year}年${month}月${day}日 ${week}`;
            break;
        case '()': // 格式：(YYYY.M.D)
            formattedDate = `(${year}.${month}.${day})`;
            break;
        case '(pp)': // 格式：YYYYMMDD(人照)
            formattedDate = `${year * 10000 + month * 100 + day}(人照)`;
            break;
        case '(by)m': // 格式：YYYYMMDD(by媽手機)
            formattedDate = `${year * 10000 + month * 100 + day}(by媽手機)`;
            break;
        default:
            formattedDate = '不支持的格式';
            console.error('Unsupported date format type:', type);
            break;
    }
    return formattedDate;
}
//-------------------------------------------------------------
/**
 * 將日期字串轉換為 Date 物件，時間部分可省略
 * 支援格式：
 * - "0915" 或 "915"  => 今年 9 月 15 日
 * - "20210915"       => 2021 年 9 月 15 日
 * - 日期後可接 "." 加時間，時間為 HH / HHmm / HHmmss
 *   "1231.11"        => 12 月 31 日 11:00:00
 *   "1231.1159"      => 12 月 31 日 11:59:00
 *   "1231.115959"    => 12 月 31 日 11:59:59
 * @param {string} dateStr - 要辨識的字串
 * @returns {Object|null} - { date: Date, hasTime: boolean }；失敗返回 null
 */
function parseDateString(dateStr, silent) {
    // 以「.」拆出日期與時間兩段，超過一個「.」視為無效
    const parts = dateStr.split('.');
    if (parts.length > 2) {
        if (!silent) { console.error(`無法辨識的格式: ${dateStr}`); }
        return null;
    }
    const datePart = parts[0];
    const timePart = parts[1]; // 沒寫時間時為 undefined

    // 今天的捷徑：t / today / 今天
    const today = new Date();
    const isTodayShortcut = /^(t|today|今天)$/i.test(datePart);

    let year;
    let month;
    let day;

    if (isTodayShortcut) {
        year = today.getFullYear();
        month = today.getMonth();
        day = today.getDate();
    } else {
        // 日期：匹配 "0915", "915", 或 "20210915"
        const matches = datePart.match(/^(\d{4})?(\d{1,2})(\d{2})$/);
        if (!matches) {
            if (!silent) { console.error(`無法辨識的日期格式: ${dateStr}`); }
            return null;
        }

        const [, yearMatch, monthMatch, dayMatch] = matches;

        // 確定年份：如果匹配不到年份，則使用目前年份
        year = yearMatch ? parseInt(yearMatch, 10) : today.getFullYear();
        month = parseInt(monthMatch, 10) - 1; // 月份是 0 基數
        day = parseInt(dayMatch, 10);
    }

    // 時間：可省略；有寫的話必須是 2、4 或 6 位數
    let hour = 0;
    let minute = 0;
    let second = 0;
    let hasTime = false;

    if (timePart !== undefined) {
        const timeMatches = timePart.match(/^(\d{2})(\d{2})?(\d{2})?$/);
        if (!timeMatches) {
            if (!silent) { console.error(`無法辨識的時間格式: ${timePart}`); }
            return null;
        }
        hour = parseInt(timeMatches[1], 10);
        minute = timeMatches[2] ? parseInt(timeMatches[2], 10) : 0;
        second = timeMatches[3] ? parseInt(timeMatches[3], 10) : 0;

        // 檢查時間合法性
        if (hour > 23 || minute > 59 || second > 59) {
            if (!silent) { console.error(`無效的時間: ${timePart}`); }
            return null;
        }
        hasTime = true;
    }

    // 檢查日期合法性（例如 2 月 30 日無效）
    const resultDate = new Date(year, month, day, hour, minute, second);
    if (
        resultDate.getFullYear() === year &&
        resultDate.getMonth() === month &&
        resultDate.getDate() === day
    ) {
        return { date: resultDate, hasTime: hasTime };
    } else {
        if (!silent) { console.error(`無效的日期: ${dateStr}`); }
        return null;
    }
}
/* 測試範例
	parseDateString("t");           // 今天（today / 今天 亦可）
	parseDateString("t.0930");      // 今天 09:30
	parseDateString("0915");        // 今年的 9 月 15 日，hasTime=false
	parseDateString("915");         // 同上
	parseDateString("20210915");    // 2021 年 9 月 15 日
	parseDateString("1231.115959"); // 今年 12 月 31 日 11:59:59，hasTime=true
	parseDateString("1231.11");     // 今年 12 月 31 日 11:00:00
	parseDateString("20231301");    // 無效的日期，返回 null
	parseDateString("1231.2565");   // 無效的時間，返回 null
	parseDateString("abcd");        // 無法辨識，返回 null
*/
//-------------------------------------------------------------
registerFeature({
    key: '複製日期',
    cmd: 'date',
    usage: '[選項] &lt;日期[.時間]&gt;',
    examples: '<code>1231</code> <code>today</code> <code>p 1231</code> <code>cust today</code>',
    buttons: `
		<div id="today-checkbox-group" class="checkbox-group">
			<label><input type="checkbox" name="today-checkbox" value="today" class="checkbox" onchange="debouncedIsTodayChange(event)">今日</label>
		</div>
		<div id="date-format-group" class="radio-group">
			<label class="radio-option"><input type="radio" name="date-format" value="/" data-cmd="s" checked> / 格式</label>
			<label class="radio-option"><input type="radio" name="date-format" value="()" data-cmd="b"> () 格式</label>
			<label class="radio-option"><input type="radio" name="date-format" value="(pp)" data-cmd="p"> 人照</label>
			<label class="radio-option"><input type="radio" name="date-format" value="(by)m" data-cmd="ma"> by媽 格式</label>
			<label class="radio-option" id="date-custom-option">
				<input type="radio" name="date-format" value="custom" data-cmd="cust"> 自訂格式
				<textarea id="date-custom-format" class="clip-textarea" rows="3" placeholder="yyyyMMdd&#10;可以直接按 Enter 換行" oninput="updateCustomFormatPreview()" onfocus="toggleCustomFormatRadio(true)" onblur="toggleCustomFormatRadio(false, event)"></textarea>
			</label>
			<div id="date-custom-preview" class="clip-preview"></div>
		</div>
    `,
    help: `
		<h3 class="help-title">複製日期：把簡寫日期轉成完整格式</h3>
		<p class="help-desc">在下方輸入框打日期後送出，會依選定格式輸出並自動複製。<br>
			可接受 <code>915</code>、<code>0915</code>（今年9月15日）、<code>20210915</code>（2021年9月15日）。<br>
			勾選「今日」會自動填入今天的 mmdd。<br>
			打 <code>t</code>（或 <code>today</code>、<code>今天</code>）就是今天，不用查日期。</p>
		<p class="help-desc"><b>鍵盤一次到位</b>：<code>選項編號</code> + 空格 + <code>日期</code>，
			切換格式與輸出一次完成。</p>
		<div class="help-example">
			<table class="help-table">
				<tr><th>打什麼</th><th>結果</th></tr>
				<tr><td><code>3 1231</code></td><td>用「人照」格式輸出 12月31日</td></tr>
				<tr><td><code>1 t</code></td><td>用「/」格式輸出今天</td></tr>
				<tr><td><code>t</code></td><td>沿用目前選項，輸出今天</td></tr>
				<tr><td><code>5 1231</code></td><td>自訂格式；若還沒給格式字串，會先回問你</td></tr>
			</table>
		</div>
		<div class="help-example">
			<div class="help-io">輸入 <code>1231</code>（假設今年為 2026）</div>
			<div class="code-block">/ 格式    → / 2026年12月31日 星期四
() 格式   → (2026.12.31)
人照      → 20261231(人照)
by媽 格式 → 20261231(by媽手機)</div>
		</div>

		<p class="help-desc"><b>日期後面可以加「<code>.</code>時間」</b>，時間寫 2、4 或 6 位數：</p>
		<div class="help-example">
			<table class="help-table">
				<tr><th>輸入</th><th>解讀成</th></tr>
				<tr><td><code>1231</code></td><td>12月31日（沒有指定時間）</td></tr>
				<tr><td><code>1231.11</code></td><td>12月31日 11:00:00</td></tr>
				<tr><td><code>1231.1159</code></td><td>12月31日 11:59:00</td></tr>
				<tr><td><code>1231.115959</code></td><td>12月31日 11:59:59</td></tr>
				<tr><td><code>20211231.115959</code></td><td>2021年12月31日 11:59:59</td></tr>
			</table>
		</div>
		<p class="help-desc">時間只有「自訂格式」的時分秒標記會用到；
			其他四種格式只輸出年月日，加了時間也不影響。</p>

		<h3 class="help-title">自訂格式：想怎麼排就怎麼排</h3>
		<p class="help-desc">選「自訂格式」並在它旁邊的框輸入格式字串。
			非標記的文字會原樣保留，所以中文、標點都能直接混著寫。輸入時下方會即時預覽。<br>
			<b>可以直接按 Enter 換行</b>，換行會原樣保留到複製結果裡。<br>
			點進輸入框會自動選到「自訂格式」；離開時若是空的，會退回第一個選項。</p>
		<div class="help-example">
			<div class="help-io">格式 <code>所在日期yyyyMMdd，那天是ddd</code>　輸入 <code>0816</code></div>
			<div class="code-block">所在日期20260816，那天是週日</div>
			<div class="help-io">格式 <code>yyyy-MM-dd HH:mm:ss</code>　輸入 <code>1231.115959</code></div>
			<div class="code-block">2026-12-31 11:59:59</div>
			<div class="help-io">格式 <code>yy/M/d(ddd) tt hh:mm</code>　輸入 <code>1231.2105</code></div>
			<div class="code-block">26/12/31(週四) 下午 09:05</div>
			<div class="help-io">格式 <code>民國cyy年M月d日</code>　輸入 <code>1231</code></div>
			<div class="code-block">民國115年12月31日</div>
			<div class="help-io">格式含換行（直接按 Enter）</div>
			<div class="code-block">日期：yyyy/MM/dd
時間：HH:mm:ss
　↓
日期：2026/12/31
時間：11:59:59</div>
		</div>

		<p class="help-desc"><b>全部可用的格式標記</b>（大小寫有別：<code>MM</code> 是月份、<code>mm</code> 是分鐘）<br>
			<code>cyy</code> 是民國年 —— JavaScript 原生沒有民國年，這是本工具自訂的擴充標記。<br>
			<b>點表格左欄的標記即可直接複製</b>，貼進上面的自訂格式框就好。<br>
			以下結果皆以 <b>2026-08-16（星期日）21:05:07</b> 為準：</p>
		<div class="help-example">
			<table class="help-table">
				<tr><th>標記</th><th>說明</th><th>結果</th></tr>
				${DATE_TOKENS.map(t => `<tr><td class="token-cell" title="點一下複製「${t.token}」" onclick="copyToClipboard('${t.token}')"><code>${t.token}</code></td><td>${t.desc}</td><td>${t.get(new Date(2026, 7, 16, 21, 5, 7))}</td></tr>`).join('')}
			</table>
		</div>

		<p class="help-desc"><b>兩個特殊寫法</b> —— 當你要輸出的文字剛好會被當成標記時：<br>
			<code>'單引號內'</code> 的內容原樣輸出，<code>\\</code> 可跳脫單一字元。<br>
			中文不受影響，所以 <code>yyyy年M月d日</code> 可以直接寫。</p>
		<div class="help-example">
			<div class="help-io">要輸出英文字母 <code>d</code> 本身（否則會被當成日期標記）</div>
			<div class="code-block">yyyy'day'    →   2026day
yyyy\\d\\a\\y   →   2026day</div>
		</div>

		<p class="help-desc"><b>時、分、秒從哪來？</b>依序判斷：</p>
		<div class="help-example">
			<table class="help-table">
				<tr><th>情況</th><th>時間來源</th></tr>
				<tr><td>輸入有指定時間　<code>1231.115959</code></td><td>就用你指定的 <b>11:59:59</b></td></tr>
				<tr><td>沒指定時間，且是<b>今天</b>　<code>0816</code></td><td>帶入<b>現在時刻</b></td></tr>
				<tr><td>沒指定時間，其他日期　<code>1231</code></td><td>該日的 <code>00:00:00</code></td></tr>
			</table>
		</div>
    `,
    onSubmit: (userMessage, state) => getFormatDateHtmlC(userMessage, state.dateFormat),
    // 預覽：用純計算，silent=true 避免打字時洗 console
    onPreview: (userMessage, state, optionValue) => {
        const built = buildDateText(userMessage, optionValue || state.dateFormat, true);
        const parsed = parseDateString(userMessage, true);
        if (parsed) {
            built.as = describeParsedDate(userMessage, parsed);
        }
        return built;
    },
    onRender: () => {
        // 重建按鈕區後，同步「今日」勾選與輸入框
        const input = document.getElementById('chat-input');
        toggleTodayInput(input.value.trim() === '', true);
        updateCustomFormatPreview(); // 初始化自訂格式預覽
    }
});
//#endregion 功能：複製日期


//#region 功能：剪貼簿  ──────────────────────────────────────────────────
//   說明：複製-重複文字(自訂次數) / 複製-特殊字元(換行、Tab、空白類)
//   原始檔：custom_js/cmd_clipboard.js (原內容為 shopee.js 的重複複製，已重寫)

// 可複製的特殊字元清單(單選)
const SPECIAL_CHARS = [
    { key: 'newline',   cmd: 'nl',  label: '換行 \\n',        char: '\n',       note: '真正的換行字元' },
    { key: 'tab',       cmd: 'tab', label: 'Tab \\t',         char: '\t',       note: '定位字元，貼到試算表可分欄' },
    { key: 'zwsp',      cmd: 'zw',  label: '零寬空格 U+200B', char: '​',   note: '看不見但佔位置' },
    { key: 'fullwidth', cmd: 'fw',  label: '全形空格 U+3000', char: '　',   note: '寬度等於一個中文字' }
];
//-------------------------------------------------------------
/**
 * 產生重複文字的結果字串(直接黏接，不加任何分隔)
 * @param {string} text  - 要重複的文字
 * @param {number} count - 重複次數
 * @returns {string} - 回傳重複後的結果
 */
function buildRepeatText(text, count) {
    return text.repeat(count);
}
//-------------------------------------------------------------
/**
 * 只給預覽用：把空白、換行、Tab 這類看不見的字元換成看得見的符號，
 * 不然像「80 個空格」這種結果，不管是聊天框的即時預覽還是上方欄位的預覽，
 * 看起來都跟沒打字一樣，沒辦法確認到底對不對。
 * 只影響預覽顯示，複製到剪貼簿的內容仍然是原始、沒被替換過的文字。
 *
 * 換行、Tab 先各自換成看得懂的箭頭；剩下「看不見」的字元
 * （一般空格、全形空格、不斷行空格 NBSP、零寬空格 ZWSP、其他 Unicode
 * 格式／控制字元…）不逐一列舉，一律用跟空格同一個符號 · 表示 ——
 * 反正預覽只是要讓你確認「這裡有東西、不是空的」，不需要分辨是哪一種。
 * @param {string} text
 * @returns {string}
 */
function visualizeForPreview(text) {
    // 單一 pass 用 replace(regex, function) 處理，不要分成好幾次 .replace() 串接——
    // 分開做的話，換行先變成「↵ + 真正的換行」，那個新插入的換行又符合
    // \p{Cc}，會被下一輪 catch-all 再次吃掉變成 ·，反而看不到真正的斷行。
    return text.replace(/[\p{Zs}\p{Cf}\p{Cc}]/gu, (ch) => {
        if (ch === '\t') return '⇥';
        if (ch === '\n') return '↵\n';
        return '·';
    });
}
//-------------------------------------------------------------
/**
 * 讀取畫面上的輸入框，回傳整理後的參數
 * @returns {Object|null} - 欄位不存在時回傳 null
 */
function getRepeatParams() {
    const textInput = document.getElementById('repeat-text');    // 要重複的文字
    const countInput = document.getElementById('repeat-count');  // 重複次數
    if (!textInput || !countInput) {
        return null;
    }

    // 次數限制 1~1000，避免手誤打出過長字串
    const count = Math.min(1000, Math.max(1, parseInt(countInput.value, 10) || 1));
    countInput.value = count;

    return { text: textInput.value, count: count };
}
//-------------------------------------------------------------
/**
 * 聊天框一有新輸入，就清空方框 UI 殘留的「上一次送出」紀錄。
 * 　方框本來就是拿來顯示上次送出的文字／次數（getRepeatHtmlC 送出後會同步進去），
 * 　但只要聊天框開始打新東西，那份舊紀錄跟現在要打的內容已經無關，
 * 　留著容易讓人誤以為方框顯示的就是「現在」對應的內容，所以直接清空。
 * 　不呼叫 updateRepeatPreview()／getRepeatParams()，因為那邊會把空次數
 * 　夾回預設值 1，反而清不乾淨。
 */
function clearRepeatFieldsOnChatInput() {
    const textInput = document.getElementById('repeat-text');
    const countInput = document.getElementById('repeat-count');
    const preview = document.getElementById('repeat-preview');
    if (textInput) {
        textInput.value = '';
    }
    if (countInput) {
        countInput.value = '';
    }
    if (preview) {
        preview.textContent = ''; // .clip-preview:empty 會自動把整個框隱藏
    }
}
//-------------------------------------------------------------
/**
 * 即時預覽重複結果(過長時截斷，並顯示總字數)
 */
function updateRepeatPreview() {
    const preview = document.getElementById('repeat-preview');
    const param = getRepeatParams();
    if (!preview || !param) {
        return;
    }

    if (param.text === '') {
        preview.textContent = '（請先輸入要重複的文字）';
        return;
    }

    const result = buildRepeatText(param.text, param.count);
    const shown = result.length > 60 ? result.slice(0, 60) + ' …' : result;
    preview.textContent = `${visualizeForPreview(shown)}\n（共 ${result.length} 字元）`;
}
//-------------------------------------------------------------
/**
 * 複製重複文字
 */
function copyRepeatText() {
    const param = getRepeatParams();
    if (!param) {
        return;
    }
    if (param.text === '') {
        alert('請先輸入要重複的文字');
        return;
    }
    copyToClipboard(buildRepeatText(param.text, param.count)); // 在 core.js
}
/* 測試範例
	buildRepeatText('哈', 25);  // 哈哈哈…共 25 個
	buildRepeatText('=', 40);   // 分隔線
*/
//-------------------------------------------------------------
/**
 * 複製被選中的特殊字元
 */
function copySpecialChar() {
    const checked = document.querySelector('input[name="clip-mode"]:checked'); // 取得被選中的單選按鈕
    const item = checked ? SPECIAL_CHARS.find(c => c.key === checked.value) : null;

    if (!item) {
        alert('目前選的是「重複文字」，請改選一個特殊字元');
        return;
    }
    copyToClipboard(item.char); // 在 core.js
}
//-------------------------------------------------------------
/**
 * 剪貼簿的鍵盤入口：解析「<文字> <次數>」
 *
 * 【為什麼要求嚴格】
 * 　單行時，分隔文字與次數的只有空白，所以「文字尾端本身就有空白」和
 * 　「這個空白是分隔符」無法區分。與其猜，不如把有歧義的格式一律擋下來，
 * 　並提供多行寫法作為明確的出口（最後一行是次數，前面原樣保留）。
 *
 * 　單行：<文字> 空白 <純數字>　　最後一段不是數字就是錯誤
 * 　多行：文字…（可含空白與換行）換行 <純數字>
 *
 * @param {string} userMessage
 * @returns {string} - 回傳 HTML 結果
 */
function parseRepeatInput(userMessage) {
    const hint = '格式為「文字 次數」，例如 <b>哈 25</b>。'
        + '<br>文字尾端要保留空白、或文字本身像選項代號時，請用 Shift+Enter 換行，最後一行寫次數。';

    let text;
    let countText;

    // incomplete=true 代表「還沒打完」而非「打錯了」——
    // 預覽會顯示成灰色提示，送出時才當成錯誤擋下。
    if (userMessage.includes('\n')) {
        // 多行：最後一行是次數，前面全部原樣保留（含空白與換行）
        const lines = userMessage.split('\n');
        countText = lines[lines.length - 1].trim();
        text = lines.slice(0, -1).join('\n');
    } else {
        // 單行：最後一段是次數。lazy 比對配上 (\S+)$ 會自動落在最後一個空白處
        const matched = userMessage.match(/^([\s\S]*?)\s+(\S+)$/);
        if (!matched) {
            return { error: `還差次數 —— 在後面空一格寫數字。${hint}`, incomplete: true };
        }
        text = matched[1];
        countText = matched[2];
    }

    if (!/^\d+$/.test(countText)) {
        // 打到一半時最後一段本來就還不是數字，不算錯
        return { error: `還差次數 —— 最後${userMessage.includes('\n') ? '一行' : '一段'}要是數字。${hint}`, incomplete: true };
    }
    if (text === '') {
        return { error: `還差要重複的文字。${hint}`, incomplete: true };
    }

    const count = parseInt(countText, 10);
    if (count < 1 || count > 1000) {
        // 數字已經完整，只是超出範圍 —— 這是確定的錯誤
        return { error: `次數要在 1~1000 之間（你給的是 ${count}）。` };
    }
    return { text: text, count: count };
}
//-------------------------------------------------------------
/**
 * 產生可複製區塊 HTML，並把解析結果同步回畫面欄位
 * @param {string} userMessage
 * @returns {string} - 回傳 HTML 結果
 */
function getRepeatHtmlC(userMessage) {
    const parsed = parseRepeatInput(userMessage);
    if (parsed.error) {
        return `<div class="bubble assistant">${parsed.error}</div>`;
    }

    // 同步回畫面欄位
    const textInput = document.getElementById('repeat-text');
    const countInput = document.getElementById('repeat-count');
    if (textInput) {
        textInput.value = parsed.text;
    }
    if (countInput) {
        countInput.value = parsed.count;
    }
    updateRepeatPreview();

    return getCopyableHmtl(buildRepeatText(parsed.text, parsed.count));
}
/* 測試範例
	getRepeatHtmlC('哈 25');           // 哈 x25
	getRepeatHtmlC('hello world 3');   // "hello world" x3（只有最後一段算次數）
	getRepeatHtmlC('哈');              // ✗ 沒給次數 → 擋下
	getRepeatHtmlC('5');               // ✗ 沒給次數 → 擋下（不會變成「重複 5 這個字」）
	getRepeatHtmlC('哈 abc');          // ✗ 最後一段不是數字 → 擋下
	getRepeatHtmlC('哈 0');            // ✗ 超出 1~1000 → 擋下
	getRepeatHtmlC('n\n5');            // "n" x5（多行不會被誤判成 nl 選項）
	getRepeatHtmlC('第一行\n第二行\n3');  // 含換行的文字 x3，換行原樣保留
	getRepeatHtmlC('哈 \n3');           // 文字尾端的空白被保留 → "哈 哈 哈 "
*/
//-------------------------------------------------------------
registerFeature({
    key: '剪貼簿',
    cmd: 'clip',
    usage: '[選項] &lt;文字&gt; &lt;次數&gt;',
    examples: '<code>哈 25</code>　<code>2</code> 直接給你換行字元　文字要含空白或換行時用 <code>Shift+Enter</code>',
    buttons: `
		<div id="repeat-group" class="button-group">
			<label class="radio-option">重複
				<input type="text" id="repeat-text" class="clip-text" placeholder="哈" oninput="updateRepeatPreview()">
			</label>
			<label class="radio-option">
				，
				<input type="number" id="repeat-count" class="clip-count" min="1" max="1000" value="25" oninput="updateRepeatPreview()">
				次
			</label>
			<button class="action-button" onclick="copyRepeatText()">複製-重複文字</button>
		</div>
		<div id="repeat-preview" class="clip-preview"></div>

		<div id="clip-mode-group" class="radio-group">
			<label class="radio-option"><input type="radio" name="clip-mode" value="repeat" data-cmd="rep" checked> 重複文字</label>
			${SPECIAL_CHARS.map(c => `<label class="radio-option" title="${c.note}"><input type="radio" name="clip-mode" value="${c.key}" data-cmd="${c.cmd}"> ${c.label}</label>`).join('')}
			<button class="action-button" onclick="copySpecialChar()">複製-特殊字元</button>
		</div>
    `,
    help: `
		<h3 class="help-title">剪貼簿：重複文字 / 特殊字元</h3>

		<p class="help-desc"><b>複製-重複文字</b>：把一段文字重複指定次數後直接黏起來複製。<br>
			上方欄位可直接用；也可以在聊天框打 <code>哈 25</code>，欄位會跟著同步。</p>
		<div class="help-example">
			<table class="help-table">
				<tr><th>打什麼</th><th>結果</th></tr>
				<tr><td><code>哈 25</code></td><td>25 個哈</td></tr>
				<tr><td><code>hello world 3</code></td><td><code>hello world</code> 重複 3 次（只有最後一段算次數）</td></tr>
				<tr><td><code>= 40</code></td><td>40 個等號，可當分隔線</td></tr>
			</table>
		</div>

		<p class="help-desc"><b>次數一定要寫</b>。少了它、或最後一段不是數字，都會直接擋下來不執行 ——
			因為那種情況沒辦法確定你要的是什麼，猜錯不如不做。</p>
		<div class="help-example">
			<table class="help-table">
				<tr><th>打什麼</th><th>為什麼擋</th></tr>
				<tr><td><code>5</code></td><td>沒給次數。這樣既像「重複 5 這個字」，也像「次數設為 5」</td></tr>
				<tr><td><code>哈</code></td><td>沒給次數</td></tr>
				<tr><td><code>哈 abc</code></td><td>最後一段不是數字</td></tr>
				<tr><td><code>哈 0</code></td><td>次數要在 1~1000 之間</td></tr>
			</table>
		</div>

		<p class="help-desc"><b>兩種情況要改用換行寫</b>（<code>Shift+Enter</code>）——
			最後一行是次數，前面全部原樣保留：</p>
		<div class="help-example">
			<div class="help-io">① 文字尾端要保留空白　單行做不到，因為那個空白會被當成分隔符</div>
			<div class="code-block">單行  哈 3      →  哈哈哈      （空白被吃掉）
多行  哈 ⏎ 3    →  哈 哈 哈    （空白保留）</div>
			<div class="help-io">② 文字剛好像選項代號　例如 <code>n</code>、<code>tab</code></div>
			<div class="code-block">n
5        →  nnnnn</div>
			<div class="help-io">文字本身含換行也可以</div>
			<div class="code-block">第一行
第二行
3</div>
		</div>

		<p class="help-desc"><b>複製-特殊字元</b>：複製那些「打不出來」的字元本身（看不見是正常的）。<br>
			在聊天框打編號 <code>2</code>~<code>5</code> 或代號，<b>選到就直接複製</b>，
			不必再按按鈕 —— 因為這幾個選項不需要參數。</p>
		<div class="help-example">
			<table class="help-table">
				<tr><th>#</th><th>代號</th><th>選項</th><th>用來做什麼</th></tr>
				<tr><td>1</td><td><code>rep</code></td><td>重複文字</td><td>唯一需要參數的選項，見上</td></tr>
				<tr><td>2</td><td><code>nl</code></td><td>換行</td><td>貼到不讓你按 Enter 的輸入框（IG 簡介、某些表單）</td></tr>
				<tr><td>3</td><td><code>tab</code></td><td>Tab</td><td>貼到試算表可以跳下一欄</td></tr>
				<tr><td>4</td><td><code>zw</code></td><td>零寬空格</td><td>看不見但佔位置，可繞過「不能只留空白」的驗證</td></tr>
				<tr><td>5</td><td><code>fw</code></td><td>全形空格</td><td>寬度等於一個中文字，中文首行縮排用</td></tr>
			</table>
		</div>
		<p class="help-desc">因為只有選項 1 需要參數，<b>只要你給了參數就一定是要重複文字</b> ——
			這時會自動幫你切回選項 1，不必先切換。</p>
    `,
    // 選項本身就是動作：選到特殊字元就直接複製它，選到「重複文字」則只是切換
    onOptionChange: (optionValue) => {
        const item = SPECIAL_CHARS.find(c => c.key === optionValue);
        return item ? getCopyableHmtl(item.char) : null;
    },
    // 有參數一定是要重複文字（特殊字元不吃參數），故順便把選項歸位
    onSubmit: (userMessage) => {
        const repeatRadio = document.querySelector('input[name="clip-mode"][value="repeat"]');
        if (repeatRadio) {
            repeatRadio.checked = true;
        }
        return getRepeatHtmlC(userMessage);
    },
    onPreview: (userMessage) => {
        const parsed = parseRepeatInput(userMessage);
        if (parsed.error) {
            // 能走到這個 onPreview 的輸入，形狀上只可能是「重複文字」
            // （唯一吃參數的選項）——所以就算還沒打完，也該先講清楚會解讀成什麼，
            // 不要讓使用者猜「現在到底切到哪個選項了」。
            return {
                as: '複製-重複文字',
                // 預覽只留第一句；完整的格式教學留給送出時的錯誤訊息
                error: parsed.error.replace(/<[^>]+>/g, '').split('。')[0],
                incomplete: parsed.incomplete
            };
        }
        const result = buildRepeatText(parsed.text, parsed.count);
        const shown = result.length > 60 ? `${result.slice(0, 60)} …` : result;
        return {
            // 文字本身也可能全是空白／換行（例如打算做 80 個空格），
            // 「進入」列也一併換成看得見的符號，不然「「        」重複 80 次」
            // 看起來就跟沒打字一樣。
            as: `「${visualizeForPreview(parsed.text)}」重複 ${parsed.count} 次`,
            text: `${visualizeForPreview(shown)}（共 ${result.length} 字元）`
        };
    },
    onRender: updateRepeatPreview
});
//#endregion 功能：剪貼簿


//#region 功能：連結轉換  ────────────────────────────────────────────────
//   說明：蝦皮口令 / Line入群 / APP深連結，三者流程相同故整併為一個功能
//   原始檔：custom_js/shopee.js、custom_js/line.js
// 連結類型的顯示名稱（預覽用）
const LINK_MODE_NAMES = {
    shopee: '蝦皮口令',
    line: 'Line入群',
    applink: 'APP深連結',
    unknown: '無法辨識'
};
//-------------------------------------------------------------
/**
 * 依 功能按鈕區的單選鈕 或 字串特徵，分派到對應的轉換
 * @param {string} userMessage - 使用者輸入的字串
 * @returns {string} - 回傳 HTML 結果
 */
function buildLinkText(userMessage, modeOverride) {
    const modeElement = document.querySelector('input[name="link-mode"]:checked'); // 取得被選中的單選按鈕
    const checkedValue = modeElement ? modeElement.value : 'auto';
    let linkMode = modeOverride || checkedValue;
    // 是否為「使用者明確指定類型」：可能是這次指令帶的 modeOverride，
    // 也可能是畫面上單選鈕本來就切到非 auto（例如用滑鼠點選、或前一次指令切過去）。
    // 只看 modeOverride 會漏掉後者，導致明明選了「APP深連結」卻解析失敗時，
    // 錯誤訊息還是講成「自動辨識還沒貼完」那一套。
    const explicitMode = Boolean(modeOverride) || checkedValue !== 'auto';

    // 自動辨識時，改由字串特徵決定
    if (linkMode === 'auto') {
        linkMode = detectLinkType(userMessage);
    }

    let result = null;
    switch (linkMode) {
        case 'shopee':  result = buildShopeeText(userMessage); break;
        case 'line':    result = buildLineText(userMessage); break;
        case 'applink': result = buildAppLinkText(userMessage); break;
        default:        return { error: '還認不出這是哪種連結', incomplete: true };
    }
    if (result !== null) {
        return { text: result };
    }
    // 使用者已明確指定類型 → 內容對不上是確定的錯誤
    // 自動辨識 → 可能只是還沒貼完，不要用 ✗
    return explicitMode
        ? { error: `這段內容無法用「${LINK_MODE_NAMES[linkMode] || linkMode}」解析` }
        : { error: '還認不出這是哪種連結', incomplete: true };
}
//-------------------------------------------------------------
/**
 * 產生可複製區塊 HTML
 * @param {string} userMessage - 使用者輸入的字串
 * @returns {string} - 回傳 HTML 結果
 */
function routeLinkConvert(userMessage) {
    const built = buildLinkText(userMessage);
    return built.error
        ? `<div class="bubble assistant">${built.error}</div>`
        : getCopyableHmtl(built.text);
}
//-------------------------------------------------------------
/**
 * 自動辨識連結類型
 * @param {string} text - 輸入的字符串
 * @returns {string} - 'shopee' | 'line' | 'applink' | 'unknown'
 */
function detectLinkType(text) {
    const tText = text.trim();

    if (/play\.google\.com\/store\/apps|androidapp:\/\//.test(tText)) {
        return 'applink';
    }
    if (/line\.me|「.+?」/.test(tText)) {
        return 'line';
    }
    if (/shp\.ee|shopee|『.+?』/.test(tText)) {
        return 'shopee';
    }
    return 'unknown';
}
//-------------------------------------------------------------
/**
 * 清理網址，移除查詢參數
 * @param {string} url - 原始網址
 * @returns {string} - 清理後的潔淨網址
 */
function cleanUrlParams(url) {
    const urlObject = new URL(url);
    urlObject.search = '';  // 清除查詢參數
    return urlObject.toString();
}
//------------------------------- 蝦皮口令 -------------------------------
/**
 * 蝦皮分享-商品特定格式(回傳 可複製區塊 HTML)
 * @param {string} userMessage - 使用者輸入的字串
 * @returns {string} - 回傳 HTML 結果
 */
function buildShopeeText(userMessage) {
    const parsedShopeeShare = paramShopeeShare(userMessage.trim()); // 解析蝦皮分享
    if (!parsedShopeeShare.isValid) {
        return null;
    }

    // 取得 回傳字串：售價連結資訊
    const template = returnMsgStorage.rType.find(item => item.key === 'linkPrice')?.value;

    return new Function('title', 'url', 'price', `return \`${template}\`;`)(
        parsedShopeeShare.title
        , parsedShopeeShare.url
        , parsedShopeeShare.price
    );
}
/**
 * 從字符串中提取特定內容(從蝦皮分享，取得陣列：售價連結資訊)
 * @param {string} text - 輸入的字符串
 * @returns {Object} - 返回提取的結果對象
 */
function paramShopeeShare(text) {
    const result = {};

    // 提取『』中的內容
    const titleMatch = text.match(/『(.+?)』/);
    result.title = titleMatch ? titleMatch[1] : null;

    // 提取 $和！之間的內容
    const priceMatch = text.match(/\$(.+?)！/);
    result.price = priceMatch ? priceMatch[1] : null;

    // 提取網址
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    result.url = urlMatch ? urlMatch[0] : null;

    // 三個欄位都要有才算數
    // (原本只要任一欄位非空就通過，缺欄位時會把 null 直接印進結果)
    result.isValid = (result.title !== null && result.url !== null && result.price !== null);
    return result;
}
/* 測試範例
	我發現超棒的東西『aaa』，售價$10-12！分享給你 https://tw.shp.ee/  → [aaa](網址)，售價$10-12
	我發現超棒的東西『aaa』！分享給你 https://tw.shp.ee/              → null　缺售價，格式不完整
	https://tw.shp.ee/abc123                                  → null　缺標題與售價
*/
//------------------------------- Line入群 -------------------------------
/**
 * Line入群分享連結簡化-取得標題與潔淨網址(回傳 可複製區塊 HTML)
 * @param {string} userMessage - 使用者輸入的訊息
 * @returns {string} - 回傳 HTML 結果
 */
function buildLineText(userMessage) {
    const parsedLineJoinLink = paramLineJoinLink(userMessage.trim()); // 解析LineJoinLink
    if (parsedLineJoinLink.isValid) {
        // 取得回傳字串：標題和連結(潔淨)資訊
        const tmpLink = returnMsgStorage.rType.find(item => item.key === 'lineJoinLink')?.value;
        const rtnStr = new Function('title', 'url', `return \`${tmpLink}\`;`)(
			parsedLineJoinLink.title
			, cleanUrlParams(parsedLineJoinLink.url) // 潔淨連結
		);
        return rtnStr;
    }
    return null;
}
/**
 * 從字符串中提取特定內容(從Line分享，取得陣列：標題&網址)
 * @param {string} text - 輸入的字符串
 * @returns {Object} - 返回提取的結果對象
 */
function paramLineJoinLink(text) {
    const result = {};

    // 提取「」中的內容
    const titleMatch = text.match(/「(.+?)」/);
    result.title = titleMatch ? titleMatch[1] : 'Line入群連結';

    // 提取網址
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    result.url = urlMatch ? urlMatch[0] : null;

    // 網址是必要的，沒有網址就無法轉換
    result.isValid = (result.url !== null);
    return result;
}
/* 測試範例
	您已被邀請加入「筋膜保養師大熊的放鬆技巧」！請點選以下連結加入社群！https://line.me/ti/g2/cZK0vWPgtT?utm_source=invitation
*/
//------------------------------- APP深連結 -------------------------------
/**
 * 商店網址/APP深連結 互轉(回傳 可複製區塊 HTML)
 * @param {string} userMessage - 使用者輸入的字串
 * @returns {string} - 回傳 HTML 結果
 */
function buildAppLinkText(userMessage) {
    const parsedAppLink = paramAppLink(userMessage.trim()); // 解析APP連結
    if (parsedAppLink.isValid) {
        // 來源是商店網址 => 轉成深連結；反之 => 轉成商店網址
        return (parsedAppLink.from === 'store')
            ? `androidapp://${parsedAppLink.pkg}`
            : `https://play.google.com/store/apps/details?id=${parsedAppLink.pkg}`;
    }
    return null;
}
/**
 * 從字符串中提取特定內容(取得：套件名稱 與 來源格式)
 * @param {string} text - 輸入的字符串
 * @returns {Object} - 返回提取的結果對象
 */
function paramAppLink(text) {
    const result = {};
    result.pkg = null;
    result.from = null;

    // 提取 商店網址 的 id 參數
    // id= 後面到 & 或空白為止，原樣取用 —— 不檢查它像不像套件名稱。
    // 轉換器的工作只是把兩種寫法互換，內容合不合理是使用者的事。
    const storeMatch = text.match(/play\.google\.com\/store\/apps\/details\?[^\s]*\bid=([^&\s]+)/);
    if (storeMatch) {
        result.pkg = storeMatch[1];
        result.from = 'store';
    }

    // 提取 androidapp:// 之後的內容，一樣原樣取用
    const deepMatch = text.match(/androidapp:\/\/(\S+)/);
    if (!result.pkg && deepMatch) {
        result.pkg = deepMatch[1];
        result.from = 'deeplink';
    }

    result.isValid = (result.pkg !== null);
    return result;
}
/* 測試範例
	https://play.google.com/store/apps/details?id=com.abc.def  <->  androidapp://com.abc.def
	id= 後面原樣取用，不驗證內容：
	https://play.google.com/store/apps/details?id=com.有的沒的APP  ->  androidapp://com.有的沒的APP
	https://play.google.com/store/apps/details?id=com.a.b&hl=zh_TW ->  androidapp://com.a.b（&之後不算）
*/
//-------------------------------------------------------------
registerFeature({
    key: '連結轉換',
    cmd: 'link',
    usage: '&lt;分享文字或連結&gt;',
    examples: '可多行貼上；蝦皮／Line 的分享訊息直接貼即可',
    buttons: `
		<div id="link-mode-group" class="radio-group">
			<label class="radio-option"><input type="radio" name="link-mode" value="auto" data-cmd="auto" checked> 自動辨識</label>
			<label class="radio-option"><input type="radio" name="link-mode" value="shopee" data-cmd="sp"> 蝦皮口令</label>
			<label class="radio-option"><input type="radio" name="link-mode" value="line" data-cmd="line"> Line入群</label>
			<label class="radio-option"><input type="radio" name="link-mode" value="applink" data-cmd="app"> APP深連結</label>
		</div>
    `,
    help: `
		<h3 class="help-title">連結轉換：貼上原始字串 → 轉成乾淨格式</h3>
		<p class="help-desc">在下方輸入框貼上整段分享文字後送出，結果會自動複製。<br>
			預設「自動辨識」會判斷類型；辨識錯誤時可手動指定上方的單選鈕。</p>

		<div class="help-example">
			<div class="help-io">① 蝦皮口令</div>
			<div class="code-block">輸入：我發現超棒的東西『無線滑鼠』，售價$299-399！分享給你 https://tw.shp.ee/abc123
輸出：[無線滑鼠](https://tw.shp.ee/abc123)，售價$299-399</div>
		</div>

		<div class="help-example">
			<div class="help-io">② Line入群（標題 + 去掉 ?utm_source 等參數的潔淨網址）</div>
			<div class="code-block">輸入：您已被邀請加入「範例」！請點選以下連結加入社群！https://line.me/ti/g2/aBC1vWPgtT?utm_source=invite
輸出：[範例](https://line.me/ti/g2/aBC1vWPgtT)</div>
		</div>

		<div class="help-example">
			<div class="help-io">③ APP深連結　商店網址 ⇄ 深連結</div>
			<div class="code-block">輸入： https://play.google.com/store/apps/details?id=com.有的沒的APP
輸出： androidapp://com.有的沒的APP</div>
			<div class="code-block">輸入： androidapp://com.有的沒的APP
輸出： https://play.google.com/store/apps/details?id=com.有的沒的APP</div>
		</div>
		<p class="help-desc"><code>id=</code> 後面的內容<b>原樣取用，不做驗證</b> ——
			轉換器的工作只是把兩種寫法互換，內容合不合理是你的事。
			中文、符號、純數字都照轉；網址若有其他參數（<code>&amp;hl=zh_TW</code>）會自動忽略。</p>
    `,
    onSubmit: (userMessage) => routeLinkConvert(userMessage),
    onPreview: (userMessage, state, optionValue) => {
        const built = buildLinkText(userMessage, optionValue);
        const modeElement = document.querySelector('input[name="link-mode"]:checked');
        const mode = optionValue || (modeElement ? modeElement.value : 'auto');
        // 自動辨識時，把實際判定的類型講出來
        if (mode === 'auto') {
            const detected = detectLinkType(userMessage);
            built.as = `自動辨識為「${LINK_MODE_NAMES[detected] || detected}」`;
        }
        return built;
    }
});
//#endregion 功能：連結轉換


//#region 功能：計算機  ────────────────────────────────────────────────
//   說明：在聊天框直接打算式就得到答案（仿 LINE 電腦版的對話框計算機）
//   參考：LINE 電腦版可在訊息框輸入算式，再打一個 = 即自動算出結果
//         支援 + - * /、遵循先乘除後加減、不支援 %

// 全形與符號別名 → 標準運算子
// (中文輸入法很容易打出全形，LINE 沒有這層，但這只是輸入容錯，不影響計算規則)
const CALC_ALIASES = {
    '×': '*', '✕': '*', '＊': '*', '＋': '+', '－': '-', '−': '-', '—': '-',
    '÷': '/', '／': '/', '（': '(', '）': ')', '．': '.', '，': '',
    '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
    '５': '5', '６': '6', '７': '7', '８': '8', '９': '9'
};
//-------------------------------------------------------------
/**
 * 把算式切成 token
 * @param {string} expr
 * @returns {Array|null} - 遇到不認識的字元回傳 null
 */
function tokenizeExpression(expr) {
    const normalized = expr.split('').map(c => (c in CALC_ALIASES ? CALC_ALIASES[c] : c)).join('');
    const tokens = [];
    let i = 0;

    while (i < normalized.length) {
        const c = normalized[i];

        if (/\s/.test(c)) {
            i += 1;
        } else if (/[0-9.]/.test(c)) {
            const matched = normalized.slice(i).match(/^\d*\.?\d+|^\d+\./);
            if (!matched) {
                return null;
            }
            tokens.push({ type: 'num', value: parseFloat(matched[0]) });
            i += matched[0].length;
        } else if ('+-*/()'.includes(c)) {
            tokens.push({ type: c });
            i += 1;
        } else {
            return null; // 不認識的字元
        }
    }
    return tokens;
}
//-------------------------------------------------------------
/**
 * 計算算式（遞迴下降，不使用 eval）
 *   expression := term (('+'|'-') term)*
 *   term       := factor (('*'|'/') factor)*
 *   factor     := ('+'|'-')? primary
 *   primary    := number | '(' expression ')'
 * @param {string} expr - 使用者輸入的算式
 * @returns {Object} - { value } 或 { error }
 */
function evaluateExpression(expr) {
    const tokens = tokenizeExpression(expr);
    if (tokens === null) {
        return { error: '算式裡有不認識的符號（只支援 + - * / 與括號）' };
    }
    if (!tokens.length) {
        return { error: '請輸入算式', incomplete: true };
    }

    let pos = 0;
    let failed = null;

    const peek = () => tokens[pos];
    const fail = (msg) => { failed = failed || msg; return 0; };

    function parseExpression() {
        let value = parseTerm();
        while (peek() && (peek().type === '+' || peek().type === '-')) {
            const op = tokens[pos].type;
            pos += 1;
            const right = parseTerm();
            value = (op === '+') ? value + right : value - right;
        }
        return value;
    }

    function parseTerm() {
        let value = parseFactor();
        while (peek() && (peek().type === '*' || peek().type === '/')) {
            const op = tokens[pos].type;
            pos += 1;
            const right = parseFactor();
            if (op === '/') {
                if (right === 0) {
                    return fail('不能除以 0');
                }
                value = value / right;
            } else {
                value = value * right;
            }
        }
        return value;
    }

    function parseFactor() {
        if (peek() && (peek().type === '+' || peek().type === '-')) {
            const op = tokens[pos].type;
            pos += 1;
            const value = parseFactor();
            return (op === '-') ? -value : value;
        }
        return parsePrimary();
    }

    function parsePrimary() {
        const token = peek();
        if (!token) {
            return fail('算式不完整');
        }
        if (token.type === 'num') {
            pos += 1;
            return token.value;
        }
        if (token.type === '(') {
            pos += 1;
            const value = parseExpression();
            if (!peek() || peek().type !== ')') {
                return fail('括號沒有成對');
            }
            pos += 1;
            return value;
        }
        return fail('算式不完整');
    }

    const value = parseExpression();

    if (failed) {
        // 「算式不完整」「括號沒有成對」都是打到一半的正常狀態
        return { error: failed, incomplete: failed !== '不能除以 0' };
    }
    if (pos !== tokens.length) {
        return { error: '算式不完整', incomplete: true };
    }
    if (!isFinite(value)) {
        return { error: '算不出來' };
    }
    return { value: value };
}
//-------------------------------------------------------------
/**
 * 把結果整理成好看的數字
 *   浮點數會有 0.1+0.2=0.30000000000000004 這種雜訊，取 12 位有效位數再去掉尾零
 * @param {number} value
 * @returns {string}
 */
function formatCalcResult(value) {
    if (Number.isInteger(value)) {
        return String(value);
    }
    return String(parseFloat(value.toPrecision(12)));
}
//-------------------------------------------------------------
/**
 * 【純計算】把算式算成結果字串
 * @param {string} userMessage - 可帶結尾的 =（仿 LINE 的習慣），會被忽略
 * @returns {Object} - { text, as } 或 { error }
 */
function buildCalcText(userMessage) {
    const expr = userMessage.trim().replace(/[=＝]\s*$/, '').trim();
    const result = evaluateExpression(expr);

    if (result.error) {
        return { error: result.error, incomplete: result.incomplete };
    }
    return { text: formatCalcResult(result.value), as: `${expr} =` };
}
//-------------------------------------------------------------
/**
 * 產生可複製區塊 HTML
 */
function getCalcHtmlC(userMessage) {
    const built = buildCalcText(userMessage);
    return built.error
        ? `<div class="bubble assistant">${built.error}</div>`
        : getCopyableHmtl(built.text);
}
/* 測試範例
	evaluateExpression('1+2*3');     // 7　先乘除後加減
	evaluateExpression('(1+2)*3');   // 9
	evaluateExpression('10/4');      // 2.5
	evaluateExpression('-3+5');      // 2
	evaluateExpression('1/0');       // error 不能除以 0
	evaluateExpression('1+');        // error 算式不完整
	evaluateExpression('50%');       // error 不支援 %（與 LINE 相同）
	buildCalcText('1+2*3=');         // 結尾的 = 會被忽略
*/
//-------------------------------------------------------------
registerFeature({
    key: '計算機',
    cmd: 'calc',
    usage: '&lt;算式&gt;',
    examples: '<code>1+2*3</code> <code>(5+3)/2</code> <code>1+2*3=</code>',
    buttons: '',
    help: `
		<h3 class="help-title">計算機：在對話框直接算</h3>
		<p class="help-desc">仿 LINE 電腦版的對話框計算機 —— 打算式就得到答案，結果自動進剪貼簿。<br>
			支援 <code>+</code> <code>-</code> <code>*</code> <code>/</code> 與括號，
			遵循<b>先乘除後加減</b>。</p>
		<div class="help-example">
			<table class="help-table">
				<tr><th>打什麼</th><th>得到</th></tr>
				<tr><td><code>1+2*3</code></td><td>7　（先乘除後加減）</td></tr>
				<tr><td><code>(1+2)*3</code></td><td>9</td></tr>
				<tr><td><code>10/4</code></td><td>2.5</td></tr>
				<tr><td><code>-3+5</code></td><td>2</td></tr>
				<tr><td><code>1+2*3=</code></td><td>7　（結尾的 <code>=</code> 會忽略，習慣 LINE 的打法也通）</td></tr>
			</table>
		</div>
		<p class="help-desc">邊打邊看：輸入框上方的預覽會即時顯示答案，
			按 <code>Enter</code> 才會送出並複製。</p>
		<p class="help-desc"><b>不支援百分比</b> <code>%</code>，這點與 LINE 相同 ——
			要算百分比請自行換成小數，例如 <code>1200*0.15</code>。</p>
		<p class="help-desc">全形符號（<code>＋</code> <code>－</code> <code>×</code> <code>÷</code> <code>（）</code>）
			與全形數字都會自動轉換，中文輸入法直接打也沒問題。</p>
	`,
	onSubmit: (userMessage) => getCalcHtmlC(userMessage),
	onPreview: (userMessage) => buildCalcText(userMessage)
});
//#endregion 功能：計算機


//#region 功能：default (預設)  ────────────────────────────────
//   說明：沒有選擇任何功能時的通用按鈕與回覆。刪掉此區塊會退回空白畫面。
registerFeature({
    key: 'default',
    buttons: '',
    help: `
		<h3 class="help-title">操作說明</h3>
		<p class="help-desc">這個對話框可以完全不碰滑鼠。打指令、按 Enter，就這樣。<br>
			上方對話框裡有目前可用的功能一覽。</p>
		<div class="help-example">
			<table class="help-table">
				<tr><th>在哪</th><th>打什麼</th><th>會怎樣</th></tr>
				<tr><td>主選單</td><td><code>1</code> 或 <code>date</code></td><td>進入該功能（代號打前幾個字也行）</td></tr>
				<tr><td>主選單</td><td><code>1 1 t</code></td><td><b>一次到位</b>：功能(1)+選項(1)+參數(t)，略過「已進入」畫面直接執行</td></tr>
				<tr><td>功能內</td><td>直接打參數</td><td>執行，例如 <code>1231</code></td></tr>
				<tr><td>功能內</td><td><code>3</code> 或 <code>p</code></td><td>切換選項（編號或代號皆可）</td></tr>
				<tr><td>功能內</td><td><code>p 1231</code></td><td><b>切換選項並直接執行</b> —— 一次到位，不必分兩步</td></tr>
				<tr><td>功能內</td><td>多行輸入</td><td>一律當成純參數，不解析選項</td></tr>
				<tr><td>任何地方</td><td>打 <code>x</code></td><td><b>返回</b> —— 有提問就取消提問，否則回主選單</td></tr>
			</table>
		</div>

		<p class="help-desc"><b>返回的兩種方式</b><br>
			打 <code>x</code> 送出　—— 手機也能用，這是主要方式<br>
			按 <code>Esc</code>　—— 桌機順手；輸入框有字時是先清空，再按一次才返回</p>

		<p class="help-desc"><b>其他按鍵</b><br>
			<code>Tab</code>　補全指令，多個候選就循環<br>
			<code>Enter</code>　送出（空的不做事）　<code>Shift+Enter</code>　換行</p>

		<p class="help-desc">輸入框上方有<b>即時預覽</b>，邊打邊顯示送出後會得到什麼 ——
			包含它<b>怎麼解讀你的輸入</b>（例如 <code>t</code> 會顯示成今天的日期）、
			會切到哪個選項、以及最終結果或失敗原因。</p>

		<p class="help-desc"><b>如果功能還缺東西</b>，它會回問一句，
			你下一句話就是答案（例如選了「自訂格式」卻還沒給格式字串）。
			此時打 <code>x</code> 是取消提問，不會離開功能。</p>

		<p class="help-desc">上方的下拉選單與單選鈕仍然可用，且與指令<b>雙向同步</b> ——
			打指令時它們會跟著動，用滑鼠點它們也照樣生效。</p>
    `
    // 主選單不接受一般訊息，一律由 core.js 的指令層處理
});
//#endregion 功能：default (預設)
