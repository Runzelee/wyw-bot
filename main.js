const bot = require('./prod_config');
//const { _env, bot } = require("./dev_config");
const MD5 = require('./utils/md5');
const fetch = require('node-fetch');
const https = require('https');
const cheerio = require('cheerio');
const replaceIllegalChar = require('./utils/char_replace');

bot.onText(/(\/start$)|(\/start\s+)/, msg => {
    bot.sendMessage(msg.chat.id,
        "大佬们好，在外网冲浪不由自主会回想起传统文化，本bot负责查询、翻译古诗文。" +
        "\n目前实现的功能：" +
        "\n\n✅ 文言文白话文互译（机翻）" +
        "\n✅ 按照内容或标题查找古诗文" +
        "\n✅ 查找古诗文作者及其古诗文" +
        "\n\n/help 查询全部命令和功能" +
        "\n\n享受时代穿梭的快乐吧！",
        { parse_mode: 'MarkdownV2' }
    );
})

bot.onText(/(\/help$)|(\/help\s+)/, msg => {
    bot.sendMessage(msg.chat.id,
        "欢迎使用文言文bot，使用下面的指令快速上手：\n" +
        "\n/mo2tr \\[内容\\] \\- 白话文翻译文言文" +
        "\n/tr2mo \\[内容\\] \\- 文言文翻译白话文" +
        "\n/search \\[内容\\] \\- 查找古诗文" +
        "\n/rsearch \\[内容\\] \\- 查找作者（若搜索内容完全匹配作者名，会自动查找其古诗文）" +
        "\n\n文言白话互译目前使用百度翻译API，古诗文查询爬虫自[古诗文网](https://www.gushiwen.com/)。" +
        "\n欢迎star本项目的[Github仓库](https://github.com/Runzelee/wyw-bot)！",
        { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
    );
})

bot.onText(/(\/mo2tr$)|(\/mo2tr\s+)/, msg => {
    if (msg.text.match(/\/mo2tr$/)) {
        bot.sendMessage(msg.chat.id,
            "请输入要翻译的内容。\n\n用法：/mo2tr \\[内容\\]",
            { parse_mode: 'MarkdownV2' }
        );
    }
    else {
        var _msg = "白话文\\-\\>文言文：\n\n";
        translate(msg.text.match(/\/mo2tr\s+([\s\S]*)$/)[1], false).then(res => {
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
            "请输入要翻译的内容。\n\n用法：/mo2tr \\[内容\\]",
            { parse_mode: 'MarkdownV2' }
        );
    }
    else {
        var _msg = "文言文\\-\\>白话文：\n\n";
        translate(msg.text.match(/\/tr2mo\s+([\s\S]*)$/)[1], true).then(res => {
            bot.sendMessage(msg.chat.id,
                _msg + res.trans_result[0].dst,
                { parse_mode: 'MarkdownV2' }
            );
        });
    }
})

bot.onText(/(\/search$)|(\/search\s+)/, msg => {
    if (msg.text.match(/\/search$/)) {
        bot.sendMessage(msg.chat.id,
            "请输入要搜索的内容。\n\n用法：/search \\[内容\\]",
            { parse_mode: 'MarkdownV2' }
        );
    }
    else {
        bot.sendMessage(msg.chat.id,
            "正在请求数据\\.\\.\\.", {
            parse_mode: 'MarkdownV2',
            //reply_to_message_id: msg.message_id
        }).then(rmsg => {
            search(msg.text.match(/\/search\s+([\s\S]*)$/)[1], 'wenzhang', rmsg);
        });
    }
})

bot.onText(/(\/rsearch$)|(\/rsearch\s+)/, msg => {
    if (msg.text.match(/\/rsearch$/)) {
        bot.sendMessage(msg.chat.id,
            "请输入要搜索的内容。\n\n用法：/rsearch \\[内容\\]",
            { parse_mode: 'MarkdownV2' }
        );
    }
    else {
        bot.sendMessage(msg.chat.id,
            "正在请求数据\\.\\.\\.", {
            parse_mode: 'MarkdownV2',
            //reply_to_message_id: msg.message_id
        }).then(rmsg => {
            search(msg.text.match(/\/rsearch\s+([\s\S]*)$/)[1], 'zuozhe', rmsg);
        });
    }
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

/*
function getSearchPagesAmount(q, type) {
    let url = 'https://www.gushiwen.com/search';
    return new Promise((resolve, reject) => {
        https.get(`${url}/${type}/${decodeURI(q)}/p/1.html`, res => {
            try {
                let html = '';
                res.on('data', chunk => {
                    html += chunk;
                })
                res.on('end', () => {
                    const $ = cheerio.load(html);
                    return resolve($('div.fenye a:contains("最后页")').attr('href').match(/\/p\/(.+)\.html$/)[1]);
                })
            } catch (error) {
                return reject(error);
            }

        })
    })
}
*/


function getSearchData(q, type) {
    let url = 'https://www.gushiwen.com/search';
    return new Promise((resolve, reject) => {
        //惊喜地发现0.html直接呈现所有项目，不用处理分页懒加载
        https.get(`${url}/${type}/${decodeURI(q)}/p/0.html`, res => {
            let html = '';
            res.on('data', chunk => {
                html += chunk;
            })
            res.on('end', () => {
                try {
                    const $ = cheerio.load(html);
                    let data = [];
                    $('ul.i_gx.kl.search_2 li').each((i, ele) => {
                        if (ele.firstChild.type === 'tag') {
                            var title = '';
                            var author = $('h2 a', ele.firstChild).text();
                            var intro = $('div.jj', ele.firstChild).text();
                            var href = $('h2 a', ele.firstChild).attr('href');
                        } else {
                            var title = $('div[class=""] h2 a', ele.children).text();
                            //你妈给古人评分吗？
                            var author = $('div[class=""] div.zz', ele.children).text().match(/^(.+)\s\d/)[1];
                            var intro = $('div[class=""] div.jj', ele.children).text();
                            var href = $('div[class=""] h2 a', ele.children).attr('href');
                        }
                        [title, author, intro] = replaceIllegalChar([title, author, intro], false);
                        data.push({
                            title, author, intro, href
                        });
                    })
                    //console.log(data);
                    return resolve(data);
                } catch (error) {
                    return reject(error);
                }

            });
        })
    })

}

function getItemContent(href) {
    let url = 'https://www.gushiwen.com';
    return new Promise((resolve, reject) => {
        https.get(`${url}${href}`, res => {
            let html = '';
            res.on('data', chunk => {
                html += chunk;
            })
            res.on('end', () => {
                try {
                    const $ = cheerio.load(html);
                    if ($('div#main h1.f24.mt10.fwb.lh180').length > 0) {
                        var title = '';
                        var dynasty = '';
                        var author = $('div#main h1.f24.mt10.fwb.lh180').text();
                        var content = $('div#main div.lh180.f14.p10 div:nth-child(2)').text();
                    } else {
                        var title = $('div#main h1').text();
                        var dynasty = $('div#main div.p10.lh180 div.f12 p:nth-child(1)').text().match(/：(.+)$/)[1];
                        var author = $('div#main div.p10.lh180 div.f12 p:nth-child(2)').text().match(/：(.+)$/)[1];
                        var content = $('div#main div.p10.lh180 div.view').html().match(/[<p><\/p>]?([\s\S]*)<div class="kc"><\/div>/)[1];
                    }
                    [title, dynasty, author] = replaceIllegalChar([title, dynasty, author], false);
                    [content] = replaceIllegalChar([content], true);
                    return resolve([
                        title, dynasty, author, content
                    ])
                } catch (error) {
                    return reject(error);
                }
            });
        })
    })
}

function arrangeSearch(data, count, total) {
    //每5个项目在一条消息中呈现，最后一页余数处理除外
    //console.log(data);
    var _msg = '';
    for (let i = 0; i < data.length; i++) {
        if (data[i].title !== '') {
            //长度大于30自动缩略
            if (data[i].intro.length >= 30) {
                _msg += `${count + i}\\. *${data[i].title}* ${data[i].author}\n${data[i].intro.substring(0, 30)}\\.\\.\\.\n\n`;
            } else {
                _msg += `${count + i}\\. *${data[i].title}* ${data[i].author}\n${data[i].intro}\n\n`;
            }
        } else {
            if (data[i].intro.length >= 30) {
                _msg += `${count + i}\\. *${data[i].author}*\n${data[i].intro.substring(0, 30)}\\.\\.\\.\n\n`;
            } else {
                _msg += `${count + i}\\. *${data[i].author}*\n${data[i].intro}\n\n`;
            }
        }
    }
    //console.log(total);
    _msg += `第${(count - 1) / 5 + 1}页，共${getPageAmount(total)}页。`;
    //console.log(_msg);
    return _msg;
}

function arrangeItemContent(title, dynasty, author, content, if_display_full) {
    if (title === '') var _msg = `*${author}*\n\n`;
    else var _msg = `*${title}*\n\n${dynasty}·${author}\n\n`;
    if (content.length > 100 && !if_display_full) _msg += `${content.substring(0, 100)}\\.\\.\\.`;
    else _msg += content;
    return _msg;
}

function getPageAmount(total) {
    var total_page = Math.ceil((total - 1) / 5);
    if (total_page === 0) total_page = 1;
    return total_page;
}

async function search(q, type, msg) {
    var _opts = keyboard => {
        return {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            parse_mode: 'MarkdownV2',
            reply_markup: {
                inline_keyboard: keyboard
            }
        }
    }
    var opts = (count, length, ptk) => {
        var page_turning_keyboard = [[], [
            { text: '上一页', callback_data: `down&${msg.chat.id}&${msg.message_id}` },
            { text: '下一页', callback_data: `up&${msg.chat.id}&${msg.message_id}` }
        ]]
        for (let i = 0; i < length; i++) {
            page_turning_keyboard[0].push({
                text: count + i, callback_data: `item${count + i}&${msg.chat.id}&${msg.message_id}`
            })
        }
        if (ptk === 1) page_turning_keyboard[1].pop();
        else if (ptk === 2) page_turning_keyboard[1].shift();
        else if (ptk === 3) page_turning_keyboard[1] = [];
        return _opts(page_turning_keyboard);
    }
    var data = await getSearchData(q, type);
    var count = 0;
    if (data.length === 0) bot.editMessageText('没有搜索结果，搜搜其他的吧！', _opts([]));
    else if (data.length < 5 && data.length !== 0) {
        bot.editMessageText(arrangeSearch(data.slice(0, data.length), 1, data.length), opts(1, data.length, 3));
    } else {
        bot.editMessageText(arrangeSearch(data.slice(0, 5), 1, data.length), opts(1, 5, 2));
    }

    bot.on('callback_query', async function (query) {
        //console.log(query.data);
        if (query.data === `up&${msg.chat.id}&${msg.message_id}`) {
            if (count / 5 + 1 < getPageAmount(data.length)) count += 5;
            //提前判断防止趁editMessageText还没执行完狂点下一页导致溢出，下面的向上切换同理
            if (count / 5 + 1 === getPageAmount(data.length)) {
                bot.editMessageText(arrangeSearch(data.slice(count, data.length - 1), count + 1, data.length), opts(count + 1, data.length - 1 - count, 1));
            } else bot.editMessageText(arrangeSearch(data.slice(count, count + 5), count + 1, data.length), opts(count + 1, 5, 0));
        }
        if (query.data === `down&${msg.chat.id}&${msg.message_id}`) {
            if (count > 0) count -= 5;
            if (count <= 0) bot.editMessageText(arrangeSearch(data.slice(0, 5), 1, data.length), opts(1, 5, 2));
            else bot.editMessageText(arrangeSearch(data.slice(count, count + 5), count + 1, data.length), opts(count + 1, 5, 0));
        }
        if (query.data === `reload&${msg.chat.id}&${msg.message_id}`) {
            if (data.length < 5) {
                bot.editMessageText(arrangeSearch(data.slice(0, data.length), 1, data.length), opts(1, data.length, 3));
            } else if (count / 5 + 1 === getPageAmount(data.length)) {
                bot.editMessageText(arrangeSearch(data.slice(count, data.length - 1), count + 1, data.length), opts(count + 1, data.length - 1 - count, 1));
            } else if (count <= 0) bot.editMessageText(arrangeSearch(data.slice(0, 5), 1, data.length), opts(1, 5, 2));
            else bot.editMessageText(arrangeSearch(data.slice(count, count + 5), count + 1, data.length), opts(count + 1, 5, 0));
        }
        var see_full_keyboard = (order, href, buttons) => {
            var keyboard = [[
                { text: '返回', callback_data: `reload&${msg.chat.id}&${msg.message_id}` }
            ], [
                { text: '收起全文', callback_data: `item${order}&${msg.chat.id}&${msg.message_id}` },
                { text: '展开全文', callback_data: `seefull${order}&${msg.chat.id}&${msg.message_id}` },
                { text: '查看原链接', url: `https://www.gushiwen.com${href}` }
            ]]
            if (buttons === 1) keyboard[1].shift();
            else if (buttons === 2) keyboard[1].splice(1, 1);
            else if (buttons === 3) keyboard[1].splice(0, 2);
            return keyboard;
        }
        if (new RegExp(`[item|seefull][0-9]+\&${msg.chat.id}\&${msg.message_id}$`).test(query.data)) {
            if (/^item/.test(query.data)) {
                var order = query.data.match(/^item(.+)\&.+\&/)[1]
                //console.log(order);
                var href = data[order - 1].href;
                var item = await getItemContent(href);
                var _msg = arrangeItemContent(item[0], item[1], item[2], item[3], false);
                if (item[3].length <= 100) var _see_full_keyboard = see_full_keyboard(order, href, 3);
                else var _see_full_keyboard = see_full_keyboard(order, href, 1);
            } else {
                var order = query.data.match(/^seefull(.+)\&.+\&/)[1];
                var href = data[order - 1].href;
                var item = await getItemContent(href);
                var _msg = arrangeItemContent(item[0], item[1], item[2], item[3], true);
                //电报消息4096长度限制，否则400 Bad Request: MESSAGE_TOO_LONG
                if (_msg.length > 4000) _msg = `${_msg.substring(0, 4000)}\\.\\.\\.\n\n全文过长，请查看原链接阅读全文。`
                var _see_full_keyboard = see_full_keyboard(order, href, 2);
            }
            bot.editMessageText(_msg, _opts(_see_full_keyboard));
        }
    })
}


//bot.on("polling_error", console.log);
