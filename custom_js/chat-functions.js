//================================================================================================
/*
 * 以下語法由AI產生，功能為：
 * Chat Functions - 動態更新對話框的相關功能
 */
//================================================================================================
// 全域變數，用於儲存畫面上元素的狀態
const state = {
    headerSelect: '', // 儲存下拉選單的值
    userMessage: '',  // 儲存使用者的訊息
    dateFormat: '()', // 預設日期格式
};
//================================================================================================
// 頁面載入，初始化事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    // 初始化：訊息發送按鈕
    const button = document.querySelector('.chat-footer button');
    button.addEventListener('click', addMessage); // 點擊按鈕觸發添加訊息
    
    // 初始化：訊息輸入框
    const input = document.querySelector('.chat-footer input'); 
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            addMessage(); // 按下 Enter 鍵，觸發添加訊息
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

    // 初始化：今日 checkbox > 以 copy_Date.js 的 IsTodayChange 來觸發
    const todayCheckbox = document.querySelector('input[name="today-checkbox"]');
    if (todayCheckbox) {
        // 初次載入時，若 輸入框為空or已勾選，填入今日日期並勾選
        toggleTodayInput(input.value.trim() === '' || todayCheckbox.checked, true);
    }

    // 初始化：更新全域變數狀態
    updateState();
});
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
    const input = document.querySelector('.chat-footer input'); // 輸入框
    const content = document.querySelector('.chat-content'); // 對話內容區
    state.userMessage = input.value.trim(); // 更新全域變數中的使用者訊息

    if (state.userMessage) {
        // 建立使用者的訊息氣泡
        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble user';
        userBubble.innerHTML = `<div class="bubble user">${state.userMessage}</div>`;
        content.appendChild(userBubble);

        // 更新狀態
        updateState();

        // 根據狀態生成回應
        const assistantResponse = generateResponse(state);

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
    }
}
//-------------------------------------------------------------
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
 * 根據下拉選單的值，動態更新 對應的功能按鈕
 * 
 * HTML 結構要求：
 * - 功能按鈕區域的容器需要有 ID 為 "action-buttons"
 * - 按鈕內容根據選擇的值生成。
 */
function updateActionButtons() {
    // 更新狀態
    updateState();
	
    // 動態更新功能按鈕
    const selectedValue = state.headerSelect;
    const actionButtons = document.getElementById('action-buttons');
    actionButtons.innerHTML = selectedActButton.sType.find(item => item.key === selectedValue)?.value
		|| selectedActButton.sType.find(item => item.key === 'default')?.value || '';
}
//================================================================================================
// 根據全域狀態生成回覆
function generateResponse(state) {
    const { headerSelect, userMessage, dateFormat } = state;

    if (headerSelect === '複製日期') {
		// 產生特定日期格式，且可複製 > 在 copy_Date.js
		return getFormatDateHtmlC(userMessage, dateFormat);
    } else if (headerSelect === '蝦皮口令') {
		// 產生蝦皮字串，且可複製 > 在 shopee.js
		return getShopeeShareHtmlC(userMessage);
    } else {
        if (userMessage === '3') {
            const codeBlockId = `code-block-${Date.now()}`;
            return `
                <div class="bubble assistant">
                    以下是可複製的文字：
                    <div class="code-block" id="${codeBlockId}">console.log('Hello, World!');</div>
                    <button class="copy-button" onclick="copyCodeblock('${codeBlockId}')">複製</button>
                </div>
            `;
        } else {
            return `<div class="bubble assistant">${parseInt(userMessage) + 1 || '這是預設回覆'}</div>`;
        }
    }
}
//================================================================================================
/**
 * 產生可複製區塊 HTML
 * @param {string} userMessage - 使用者輸入的日期字串
 * @param {string} dateFormat - 日期格式類型
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
//================================================================================================
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
            // alert('複製失敗，請檢查瀏覽器權限或功能支援！');
        });
	/* 舊方法
    const input = document.createElement('input'); // 建立一個隱藏的輸入框
    input.value = text;
    document.body.appendChild(input);
    input.select(); // 選取內容
    try {
        document.execCommand('copy'); // 複製到剪貼簿
        alert('已複製到剪貼簿！');
    } catch (err) {
        console.error('複製失敗：', err);
    }
    document.body.removeChild(input); // 移除輸入框
	*/
}
/* 測試範例
	CopyDate('/', new Date(2023, 11, 31));   // / 2023年12月31日 星期日
	CopyDate('()', new Date(2024, 1, 15));   // (2024.2.15)
	CopyDate('(by)', new Date(2025, 4, 20)); // 20250520(by媽手機)
	CopyDate('/');                           // 使用目前日期，例如：/ 2025年1月20日 星期一
*/
//-------------------------------------------------------------
// 將文字複製到剪貼簿
function copyCodeblock(id) {
    const codeBlock = document.getElementById(id); // 找到代碼區域
    if (codeBlock) {
        const text = codeBlock.textContent || codeBlock.innerText; // 獲取文字內容
		copyToClipboard(text);
    }
}
//-------------------------------------------------------------
/*
 * 功能：動態內容渲染 模板字串
	// 取得模板
	const template = returnMsgStorage.rType.find(item => item.key === 'expIns')?.value;
	// 替換參數
	const renderedHTML = new Function('codeBlockId', 'copyText', `return \`${template}\`;`)(
		`code-block-${Date.now()}`
		,'copyTextString'
	);
	console.log(renderedHTML);
 * 功能：動態發動功能
	returnMsgStorage.cType.find(item => item.key === 'example')?.value("測試參數");
*/
//================================================================================================
