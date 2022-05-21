const bot = require('./prod_config');
//const bot = require("./dev_config");
const MD5 = require('./md5');
const fetch = require('node-fetch')

bot.onText(/(\/start$)|(\/start\s+)/, msg => {
    bot.sendMessage(msg.chat.id,
        "大佬们好，在外网冲浪不由自主会回想起传统文化，我负责专门搞一些古诗文的事情~来破四旧~捏。" +
        "\n功能尚在完善中：" +
        "\n\n✅ 文言文白话文互译" +
        "\n🔲 按照作者查找古诗文" +
        "\n🔲 按照选段查找所在古诗文" +
        "\n🔲 实现文言文群管理" +
        "\n🔲 无穷无尽，持续开发\\.\\.\\.\\.\\.\\." +
        "\n\n/help 查询全部命令和功能" +
        "\n\n享受时代穿梭的快乐吧！",
        { parse_mode: 'MarkdownV2' }
    );
})

bot.onText(/(\/help$)|(\/help\s+)/, msg => {
    bot.sendMessage(msg.chat.id,
        "欢迎使用文言文bot，使用下面的指令快速上手：\n" +
        "\n/mo2tr \\<内容\\>    白话文翻译文言文" +
        "\n/tr2mo \\<内容\\>    文言文翻译白话文" +
        "\n/search \\<内容\\>   查找古诗文或作者" +
        "\n/rsearch \\<内容\\>  按照选段查找所在古诗文"+
        "\n\n文言白话互译目前使用百度翻译API"+
        "\nGithub仓库：https://github\\.com/Runzelee/wyw\\-bot",
        { parse_mode: 'MarkdownV2' }
    );
})

bot.onText(/(\/mo2tr$)|(\/mo2tr\s+)/, msg => {
    if (msg.text.match(/\/mo2tr$/)) {
        bot.sendMessage(msg.chat.id,
            "请输入要翻译的内容。\n\n用法：/mo2tr \\<内容\\>",
            { parse_mode: 'MarkdownV2' }
        );
    }
    else {
        var _msg = "白话文\\-\\>文言文：\n\n";
        translate(msg.text.match(/\/mo2tr\s+(.+)$/)[1], false).then(res => {
            bot.sendMessage(msg.chat.id,
                _msg + res.trans_result[0].dst,
                { parse_mode: 'MarkdownV2' }
            );
        });
    }


})

bot.onText(/(\/tr2mo$)|(\/tr2mo\s+)/, msg => {
    if (msg.text.match(/\/tr2mo$/)) {
        bot.sendMessage(msg.chat.id,
            "请输入要翻译的内容。\n\n用法：/mo2tr \\<内容\\>",
            { parse_mode: 'MarkdownV2' }
        );
    }
    else {
        var _msg = "文言文\\-\\>白话文：\n\n";
        translate(msg.text.match(/\/tr2mo\s+(.+)$/)[1], true).then(res => {
            bot.sendMessage(msg.chat.id,
                _msg + res.trans_result[0].dst,
                { parse_mode: 'MarkdownV2' }
            );
        });
    }
})

bot.onText(/(\/search$)|(\/search\s+)/, msg => {
    bot.sendMessage(msg.chat.id,
        "功能尚在开发中，敬请期待！\n\n/help 查看其他命令",
        { parse_mode: 'MarkdownV2' }
    );
})

bot.onText(/(\/rsearch$)|(\/rsearch\s+)/, msg => {
    bot.sendMessage(msg.chat.id,
        "功能尚在开发中，敬请期待！\n\n/help 查看其他命令",
        { parse_mode: 'MarkdownV2' }
    );
})

async function translate(q, isReserve) {
    let url = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
    let salt = Math.floor(Math.random() * (9999999999 - 1000000000)) + 1000000000;
    let app_id = process.env.APP_ID;
    let sign = MD5(app_id + q + salt + process.env.KEY);
    if (!isReserve) var fromTo = 'from=zh&to=wyw';
    else var fromTo = 'from=wyw&to=zh';
    try {
        const response = await fetch(`${url}?q=${encodeURI(q)}&${fromTo}&appid=${app_id}&salt=${salt}&sign=${sign}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
    }
}

//bot.on("polling_error", console.log);
