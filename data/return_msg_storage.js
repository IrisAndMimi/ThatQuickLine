//================================================================================================
/*
 * return_msg_storage.js - 純資料層：可重複使用的字串模板
 *
 * 只放「多個功能共用」或「常需要調整措辭」的模板。
 * 各功能專屬的按鈕/說明 HTML 已改放在 features.js 的 registerFeature 內，
 * 以確保「一個功能 = 一個區塊」，刪除時不會有殘留。
 *
 * 用法：
 *   const tmp = returnMsgStorage.rType.find(item => item.key === 'linkPrice')?.value;
 *   const str = new Function('title','url','price', `return \`${tmp}\`;`)(t, u, p);
 */
//================================================================================================
const returnMsgStorage = {
    "rType": [
        {
            // 蝦皮口令的輸出格式
            "key": "linkPrice",
            value: `[\${title}](\${url})，售價$\${price}`
        },
        {
            // Line入群連結的輸出格式
            "key": "lineJoinLink",
            value: `[\${title}](\${url})`
        },
        {
            // 「可複製區塊」的外框，由 core.js 的 getCopyableHmtl() 使用
            "key": "copyCodeBlock",
            value: `
                <div class="bubble assistant">
                    以下是可複製的文字：
                    <div class="code-block" id="\${codeBlockId}">\${copyText}</div>
                    <button class="copy-button" onclick="copyCodeblock('\${codeBlockId}')">複製</button>
                </div>
            `
        }
    ]
};
//================================================================================================
