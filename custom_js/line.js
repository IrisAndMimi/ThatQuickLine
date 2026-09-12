//================================================================================================
/*
 * 以下語法由AI產生，提示詞為：
	我會有這種固定字串
		您已被邀請加入「筋膜保養師大熊的放鬆技巧」！請點選以下連結加入社群！https://line.me/ti/g2/cZK0vWPgtTYnNmLm1WsECfuBU-cCpx3OEyRjjA?utm_source=invitation
	想取出「」之內的東西 和 最後的潔淨網址(去除URL中的查詢參數)
 */
//================================================================================================
/**
 * Line入群分享連結簡化-取得標題與潔淨網址(回傳 可複製區塊 HTML)
 * @param {string} userMessage - 使用者輸入的訊息
 * @returns {string} - 回傳 HTML 結果
 */
function getLineJoinLinkHtml(userMessage) {
    const parsedLineJoinLink = paramLineJoinLink(userMessage.trim()); // 解析LineJoinLink
    if (parsedLineJoinLink.isValid) {
        // 取得回傳字串：標題和連結(潔淨)資訊
        const tmpLink = returnMsgStorage.rType.find(item => item.key === 'lineJoinLink')?.value;
        const rtnStr = new Function('title', 'url', `return \`${tmpLink}\`;`)(
			parsedLineJoinLink.title
			, cleanUrlParams(parsedLineJoinLink.url) // 潔淨連結
		);
        // 回傳可複製區塊HTML
        return getCopyableHmtl(rtnStr);
    } else {
        return `<div class="bubble assistant">${userMessage}</div>`;
    }
}
//-------------------------------------------------------------
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

    // 檢查是否所有欄位都是 null
    result.isValid = Object.values(result).some((value) => value !== null);
    return result;
}

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

/* 測試範例
    const text = `
    您已被邀請加入「筋膜保養師大熊的放鬆技巧」！請點選以下連結加入社群！https://line.me/ti/g2/cZK0vWPgtTYnNmLm1WsECfuBU-cCpx3OEyRjjA?utm_source=invitation
    `;
    const extracted = paramLineJoinLink(text);
    console.log(extracted);
*/
//================================================================================================







