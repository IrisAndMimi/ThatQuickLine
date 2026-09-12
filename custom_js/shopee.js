//================================================================================================
/*
 * 以下語法由AI產生，提示詞為：
    我會有這種固定字串
		我發現超棒的東西『aaa』，售價$10-12！分享給你 https://tw.shp.ee/
	想取出『』之內的東西 和 $！之內的東西 和 最後的網址
 */
//================================================================================================
/**
 * 蝦皮分享-商品特定格式(回傳 可複製區塊 HTML)
 * @param {string} userMessage - 使用者輸入的日期字串
 * @param {string} dateFormat - 日期格式類型
 * @returns {string} - 回傳 HTML 結果
 */
function getShopeeShareHtmlC(userMessage, dateFormat) {
    const parsedShopeeShare = paramShopeeShare(userMessage.trim()); // 解析蝦皮分享
    if (parsedShopeeShare.isValid) {
		// 取得 回傳字串：售價連結資訊
		const tmpLinkPrice = returnMsgStorage.rType.find(item => item.key === 'linkPrice')?.value;
		const rtnStr = new Function('title', 'url', 'price', `return \`${tmpLinkPrice}\`;`)(
			parsedShopeeShare.title
			, parsedShopeeShare.url
			, parsedShopeeShare.price
		);
		// 回傳 可複製區塊 HTML
        return getCopyableHmtl(rtnStr);
    } else {
        return `<div class="bubble assistant">${userMessage}</div>`;
    }
}
//-------------------------------------------------------------
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

    // 檢查是否所有欄位都是 null
    result.isValid = Object.values(result).some((value) => value !== null);
    return result;
}
/* 測試範例
	const text = `
	我發現超棒的東西『aaa』，售價$10-12！分享給你 https://tw.shp.ee/
	`;
	const extracted = paramShopeeShare(text);
	console.log(extracted);
*/
//================================================================================================







