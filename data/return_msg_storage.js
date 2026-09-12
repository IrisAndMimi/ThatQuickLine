const returnMsgStorage = {
    "rType": [
        {
            "key": "linkPrice",
            value: `[\${title}](\${url})，售價$\${price}`
        },
        {
            "key": "lineJoinLink",
            value: `[\${title}](\${url})`
        },
        {
            "key": "copyCodeBlock",
            value: `
                <div class="bubble assistant">
                    以下是可複製的文字：
                    <div class="code-block" id="\${codeBlockId}">\${copyText}</div>
                    <button class="copy-button" onclick="copyCodeblock('\${codeBlockId}')">複製</button>
                </div>
            `
        },
        {
            "key": "shopeeCodeGenerated",
            "value": "生成蝦皮口令成功！"
        },
        {
            "key": "copySuccess",
            "value": "已複製到剪貼簿！"
        },
        {
            "key": "copyFail",
            "value": "複製失敗，請檢查瀏覽器權限或功能支援！"
        },
        {
            "key": "copyableTextHTML",
            "value": "複製失敗，請檢查瀏覽器權限或功能支援！"
        }
    ],
    "cType": [ // clipboard
        {
            "key": "gd",
            value: `
				- 摺疊
					${'```'}
					
					${'```'}
			`
        },
        {
            key: "aa",
            value: () => {
				// 這裡是函式內容
				console.log("- 摺疊\n``` \n\n```");
            }
			// cType['aa'].value(); // 執行第一個功能
        },
        {
            key: "example",
            value: (param) => {
				// 可以接受參數並執行邏輯
				console.log(`執行參數為：${param}`);
            }
			// cType['example'].value("測試參數"); // 執行第二個功能並傳遞參數
        }
    ]
};
const selectedActButton = {
    "sType": [
        {
            "key": "",
            value: `<div></div>`
        },
        {
            "key": "剪貼簿",
            value: `<div></div>`
        },
        {
            "key": "複製日期",
            value: `
				<div id="today-checkbox-group" class="checkbox-group">
					<label><input type="checkbox" name="today-checkbox" value="today" class="checkbox" onchange="debouncedIsTodayChange(event)">今日</label>
				</div>
				<div id="date-format-group" class="radio-group">
					<label class="radio-option"><input type="radio" name="date-format" value="/" checked> / 格式</label>
					<label class="radio-option"><input type="radio" name="date-format" value="()"> () 格式</label>
					<label class="radio-option"><input type="radio" name="date-format" value="(pp)"> 人照</label>
					<label class="radio-option"><input type="radio" name="date-format" value="(by)m"> by媽 格式</label>
				</div>
            `
        },
        {
            "key": "蝦皮口令",
            value: `
				<div id="shopee-group" class="button-group">
					<button class="action-button" onclick="alert('生成蝦皮口令')">生成蝦皮口令</button>
					<button class="action-button" onclick="alert('複製蝦皮口令')">複製蝦皮口令</button>
				</div>
            `
        },
        {
            "key": "default",
            value: `
				<div id="default-group" class="button-group">
					<button class="action-button" onclick="alert('舉例說明')">舉例說明</button>
					<button class="action-button" onclick="alert('提供細節')">提供細節</button>
					<button class="action-button" onclick="alert('翻譯成繁中')">翻譯成繁中</button>
					<button class="action-button" onclick="alert('翻譯成英文')">翻譯成英文</button>
				</div>
            `
        }
    ]
};
