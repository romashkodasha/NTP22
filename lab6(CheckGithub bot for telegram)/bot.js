const { Telegraf } = require("telegraf");
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
    auth: ''
})
function GetReposInfo(name,repos){
    return new Promise((resolve, reject)=>{
    resolve(octokit.request('GET /repos/{owner}/{repo}', {
        owner: name,
        repo: repos
    }))
    })
}
function GetUser(name){
    return new Promise((resolve, reject)=>{
    resolve(octokit.request('GET /users/{username}/repos', {
        username: name
    }))
    })
}
function GitSearch(name){
    return new Promise((resolve, reject)=>{
        resolve(octokit.request(`GET /search/users?q=${name}`, {}))
    })
}
function CheckCommits(name,repo,date){
    return new Promise((resolve, reject)=>{
        resolve(octokit.request(`GET /repos/{owner}/{repo}/commits?q=${date}`, {
            owner: name,
            repo: repo,
            since: date
          }))
    })
}
const bot = new Telegraf("");

// Обработчик начала диалога с ботом
bot.start((ctx) =>
  ctx.reply(
    `Приветствую, ${
       ctx.from.first_name ? ctx.from.first_name : "хороший человек"
    }! Набери /help и увидишь, что я могу.`
  )
);

// Обработчик команды /help
bot.help((ctx) => ctx.reply("/repos username - репозитории пользователя\n/search username - поиск пользователя GitHub\n /reposlist - список отслеживаемых репозиториев\n /addreposlist username reposname - добавить репозиторий в список по имени пользователя и названию репозитория\n /checkreposlist date - проверить обновления в reposlist после date в формате YYYY-MM-DDTHH:MM:SSZ"));

//-----------------------------------------------------------------------ИМПОРТ И ЭКСПОРТ
var fs = require('fs');
var json_data={}
json_data.reposlist =[]; //список отслеживаемых репозиториев
var config = require('./reposlist.json');
json_data=config;
for (i=0;i<json_data.reposlist.length;i++)
{
    console.log(json_data.reposlist[i]);
}
//------------------------------------------------------------------------ИМПОРТ И ЭКСПОРТ

bot.command("repos", async (ctx) => {
    const resp=ctx.message.text.split(' ')[1];;
    var result = await GetUser(resp);
    for (var i=0;i<result.data.length; i++){
        var reqURL=result.data[i].svn_url;
        ctx.replyWithHTML(reqURL);
    }
});
bot.command("search",async (ctx) => {
    const resp=ctx.message.text.split(' ')[1];
    var result = await GitSearch(resp);
    for (var i=0;i<result.data.total_count; i++){
        var reqURL=result.data.items[i].html_url;
        var login=result.data.items[i].login;
        ctx.replyWithHTML(login);
        ctx.replyWithHTML(reqURL);
    }
});
bot.command("reposlist", (ctx) => {
    for (i=0;i<json_data.reposlist.length;i++){
        ctx.replyWithHTML(json_data.reposlist[i]);
    }
});
bot.command("addreposlist",async (ctx) => {
    const username=ctx.message.text.split(' ')[1];//имя
    const reposname=ctx.message.text.split(' ')[2];//имя ропозитория
    var result = await GetReposInfo(username,reposname);
    var obj = {
        username: username,
        reposname: reposname,
        link: result.data.html_url
    }
    json_data.reposlist.push(obj);
    fs.writeFile ("reposlist.json", JSON.stringify(json_data), function(err) {
        if (err) throw err;
        console.log('complete');
        }
    );
});
bot.command("checkcommits",async (ctx) => {
    const mydate=ctx.message.text.split(' ')[1];//дата
    for (var i=0;i<json_data.reposlist.length;i++){
        var result = await CheckCommits(json_data.reposlist[i].username,json_data.reposlist[i].reposname, mydate);
        for(j=0;j<result.data.length;j++){
            ctx.replyWithMarkdown(`Имя: ${result.data[j].commit.author.name} \nДата: ${result.data[j].commit.author.date} \nСодержание: ${result.data[j].commit.message}`);
        }
    }
});
// Обработчик простого текста
bot.on("text", (ctx) => {
  return ctx.reply(ctx.message.text);
});

// Запуск бота
bot.launch();