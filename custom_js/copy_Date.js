//================================================================================================
/*
 * 以下語法由AI產生，提示詞為：
    做一個js功能
    自動辨識我的字串
    如果是0915或是915
    會知道是今年9月15日 要給我正確new date
    
    但如果我寫20210915 他也要知道是2021的9月15日
 */
//================================================================================================
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
 *  當使用者勾選或取消勾選「今日」選項時，更新輸入框內容
 *  勾選時，填寫今日的 mmdd 格式；取消時，清空輸入框
 * @param {boolean} isToday - 是否 設定為今日
 * @param {boolean} isClean - 是否 清空輸入框(取消勾選今日)
 */
function toggleTodayInput(isToday, isClean) {
    const todayCheckbox = document.querySelector('input[name="today-checkbox"]'); // 今日 checkbox
	if (todayCheckbox) {
		const input = document.querySelector('.chat-footer input'); // 輸入框
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
/**
 * 產生可複製日期區塊 HTML
 * @param {string} userMessage - 使用者輸入的日期字串
 * @param {string} dateFormat - 日期格式類型
 * @returns {string} - 回傳 HTML 結果
 */
function getFormatDateHtmlC(userMessage, dateFormat) {
    const parsedDate = parseDateString(userMessage); // 解析日期字串
    if (parsedDate) {
        const fDate = getFormatDate(dateFormat, parsedDate); // 產生的特定日期格式
		// 回傳 可複製區塊 HTML
        return getCopyableHmtl(fDate);
    } else {
        return `<div class="bubble assistant">無法解析的日期格式</div>`;
    }
}
//================================================================================================
/**
 * 根據 格式類型 和 日期，生成格式化文字
 * @param {string} type - 日期格式類型
 * @param {Date} [date] - 傳入的日期物件，如果未提供則使用目前日期。
 */
function getFormatDate(type, date) {
    // 如果未傳入日期，則使用目前日期
    const tDate = date || new Date();

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
 * 將日期字串轉換為正確的 Date 物件
 * 支援格式：
 * - "0915" 或 "915" => 今年 9 月 15 日
 * - "20210915" => 2021 年 9 月 15 日
 * @param {string} dateStr - 要辨識的日期字串
 * @returns {Date|null} - 轉換成功返回 `Date` 物件，失敗返回 `null`
 */
function parseDateString(dateStr) {
    // 正則表達式，匹配類型："0915", "915", 或 "20210915"
    const regex = /^(\d{4})?(\d{1,2})(\d{2})$/;
    const matches = dateStr.match(regex);

    if (!matches) {
        console.error(`無法辨識的日期格式: ${dateStr}`);
        return null; // 無法匹配返回 null
    }

    // 解析匹配到的字串組
    const [, yearMatch, monthMatch, dayMatch] = matches;

    // 確定年份：如果匹配不到年份，則使用目前年份
    const currentYear = new Date().getFullYear();
    const year = yearMatch ? parseInt(yearMatch, 10) : currentYear;

    // 解析月份和日期（月份需要減 1）
    const month = parseInt(monthMatch, 10) - 1; // 月份是 0 基數
    const day = parseInt(dayMatch, 10);

    // 檢查日期合法性（例如 2 月 30 日無效）
    const resultDate = new Date(year, month, day);
    if (
        resultDate.getFullYear() === year &&
        resultDate.getMonth() === month &&
        resultDate.getDate() === day
    ) {
        return resultDate;
    } else {
        console.error(`無效的日期: ${dateStr}`);
        return null;
    }
}
/* 測試範例
	console.log(parseDateString("0915"));       // 今年的 9 月 15 日
	console.log(parseDateString("915"));        // 今年的 9 月 15 日
	console.log(parseDateString("20210915"));   // 2021 年 9 月 15 日
	console.log(parseDateString("1231"));       // 今年的 12 月 31 日
	console.log(parseDateString("20231301"));   // 無效的日期，返回 null
	console.log(parseDateString("abcd"));       // 無法辨識的日期格式，返回 null
*/
//================================================================================================







