const request = require("request");
const http    = require("http");
const mysql   = require('mysql');
const schedule = require('node-schedule');
const url = require('url');
var ytdl = require('ytdl-core');
const ImagesClient = require('google-images');
var express = require('express');
var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 5000;
const nani = require("nani").init(process.env.NANIID, process.env.NANISECRET);
app.use(express.static(__dirname + '/public'));
let client = new ImagesClient(process.env.GGIMAGEID, process.env.GGIMAGEAPI);
server.listen(port);

const prefix = "$";
let servants = {};
var commands = {};
var emoji = {};
var reply = {};
let event = "";
var ascii = {};
let dispatcher;
function defyNull(obj) {
	for (var key in obj) {
		if (obj[key] === null) obj[key] = "";
	}
	return obj;
}
function aniDetail(type, data) {
	switch (type) {
		case "manga":
			temp = data.description;
			temp = temp.replace(/<br \/>/g, "");
			if (temp.length > 400) temp = temp.slice(0, 396);
			data = "**" + data.title_romaji + "**\n" + data.title_english + "\n\n" +
				"Genre: " + data.genres.join(", ") + "\n" +
				"Chapter: " + data.total_chapters + " (" + data.publishing_status + ")\n" +
				"Score: " + data.average_score + "\n" +
				"Type: " + data.type + "\n\n" + 
				"Synopsis:\n" + temp;
		case "anime":
			temp = data.description;
			temp = temp.replace(/<br \/>/g, "");
			if (temp.length > 400) temp = temp.slice(0, 396);
			data = "**" + data.title_romaji + "**\n" + data.title_english + "\n\n" +
				"Genre: " + data.genres.join(", ") + "\n" +
				"Episode: " + data.total_episodes + " (" + data.airing_status + ")\n" +
				"Score: " + data.average_score + "\n" +
				"Type: " + data.type + "\n\n" +
				"Synopsis:\n" + temp;
			break;
		case "staff":
			temp = data.info;
			temp = temp.replace(/<br \/>/g, "");
			if (temp.length > 400) temp = temp.slice(0, 396);
			data = "**" + data.name_first + " " + data.name_last + "***\n" + data.name_first_japanese + " " + data.name_last_japanese + "\n\n" + temp;
			break;
		case "studio":
			data = "**" + data.studio_name + "**\n\n" +	"Wiki: " + data.studio_wiki;
			break;
		case "character":
			console.log(data);
			temp = data.info;
			temp = temp.replace(/<br \/>/g, "");
			if (temp.length > 400) temp = temp.slice(0, 396);
			data = "**" + data.name_first + " " + data.name_last + "**\n" + data.name_japanese + "\n\n" + temp + "\n\n: Link: http://anilist.co/character/" + data.id;
			break;
		default:
			data = "";
			break;
	}
	return data;
}
var jsonUrl = "http://www.moesocial.com/discordbot.json";
function load_custom_command() {
	commands = [];
	request({
		url: jsonUrl,
		json: true
	}, function (error, response, body) {

		if (!error && response.statusCode === 200) {
			tempObj = body.customcommand;
			for (i = 0; i < tempObj.length; i++) {
				commands[tempObj[i].command] = tempObj[i].respond;
			}
			tempObj = body.emoji;
			for (i = 0; i < tempObj.length; i++) {
				emoji[tempObj[i].command] = tempObj[i].respond;
			}
			rndSpam = body.random;
			ascii = body.ascii;
			servants = body.servant;
			CE = body.CE;
		}
	});
}
load_custom_command();
io.on('connection', function (socket) {
	socket.on('load', function (data, callback) {
		load_custom_command();
		switch(data) {
			case "servant":
				callback(servants);
				break;
			case "ce":
				callback(CE);
				break;
		}
	});
});


nobuBot.on('ready', () => {
	console.log("Nobu!");
});
atkType = {
	"01": "Quick",
	"02": "Arts",
	"03": "Buster"
}
nobuBot.on('message', (message) => {
	var msg = message.content.trim();
	msgArray = msg.split(' ');
	if (msg.includes("I love you")) message.channel.sendMessage("I love Emilia");
	else if (!message.member.bot) {
		switch (msgArray[0])
		{
			case prefix + "say":
				if (message.author.id == "184369428002111488") {
					nobuBot.channels.get(msgArray[1]).sendMessage(msgArray.slice(2).join(' '));
				}
				break;
			case prefix + "banner":
				msgArg = msgArray.slice(1).join(' ');
				temp = "http://moesocial.com/banner.php?text=" + encodeURI(msgArg);
				message.channel.sendFile(temp, "banner.png");
				break;
			case prefix + "ascii":
				msgArg = msg.slice(msg.indexOf(' ') + 1).toLowerCase();
				if (/^[a-z ]*$/.test(msgArg) != false) {
					msgArg = msgArg.split("");
					data = ["", "", "", ""];
					for (i = 0; i <= msgArg.length; i++) {
						if (i == msgArg.length) message.channel.sendMessage("```\n" + data.join("\n") + "```");
						else {
								item = msgArg[i];
							if (item in ascii) {
								data[0] += ascii[item][0];
								data[1] += ascii[item][1];
								data[2] += ascii[item][2];
								data[3] += ascii[item][3];
							} else if (item == " ") {
								data[0] += "  ";
								data[1] += "  ";
								data[2] += "  ";
								data[3] += "  ";
							}
						}
					}
				} else message.channel.sendMessage("Invalid character");
				break;
			case prefix + "anilist":
				tempArray = msgArray;
				if (tempArray[1] == "custom") {
					message.channel.sendMessage("Searching...").then(msg => {
						nani.get(encodeURI(tempArray.slice(1).join(' '))).then(data => {
							msg.edit(JSON.stringify(data, null, "    "));
						}).catch(console.log);
					});
				} else if (["anime", "manga", "staff", "character", "studio"].indexOf(tempArray[1]) >= 0) {
					message.channel.sendMessage("Searching...").then(msg => {
						nani.get(tempArray[1] + "/search/" + encodeURI(tempArray.slice(2).join(' '))).then(data => {
							if (data.error) {
								msg.edit("No result found");
							} else if (data.length == 1) {
								data = defyNull(data[0]);
								if (data.adult || !data.image_url_med) msg.edit(aniDetail(tempArray[1], data));
								else {
									msg.delete();
									message.channel.sendFile(data.image_url_med, "Image.png", aniDetail(tempArray[1], data));
								}
							} else {
								temp = "";
								resultObj = {};
								data.forEach(item => {
									item = defyNull(item);
									switch (tempArray[1]) {
										case "anime":
										case "manga":
											temp += "ID: " + item.id + "\nTitle: " + item.title_romaji + " (" + item.title_english + ")\nType: " + item.type + "\n\n";
											break;
										case "staff":
										case "character":
											temp += "ID: " + item.id + "\nName: " + item.name_first + " " + item.name_last + "\n\n";
											break;
										case "studio":
											temp += "ID: " + item.id + "\nName: " + item.studio_name + "\n\n";
											break;
									}
									resultObj[item.id] = item;
								});
								msg.edit(temp + "**" + message.author + ", please type `$id <id number>` to pick one, or `$id 0` to cancel**").then(msg => {
									//collector = message.channel.createCollector(m => (m.author.id == message.author.id && m.content.startsWith("$id ")));
									collector = message.channel.createCollector(m => (m.author.id == message.author.id && m.content.startsWith("!id ")), {time: 60000});
									collector.on("message", m => {
										m = m.content.slice(4);
										if (m === "0") collector.stop();
										else if (m) {
											if (m in resultObj) {
												message.channel.sendMessage("Searching...").then(anotherMsg => {
													deep = resultObj[m];
													if (!debug) {
														console.log(aniDetail(tempArray[1], deep));
														if (deep.adult || !deep.image_url_med) anotherMsg.edit(aniDetail(tempArray[1], deep)).then(temp => { collector.stop(); });
														else {
															anotherMsg.delete();
															message.channel.sendFile(deep.image_url_med, "Image.png", aniDetail(tempArray[1], deep)).then(temp => { collector.stop(); });
														}
													} else message.channel.sendMessage(JSON.stringify(deep, null, "    "), {split: true});
												});
											} else message.channel.sendMessage("ID " + m + " is not found in the result list");
										} else message.channel.sendMessage("Please provide an ID, thank you");
									});
									collector.on("end", (collection, reason) => {
										if (reason == "time") message.channel.sendMessage("1 minute have passed, searching ended");
										msg.delete();
									});
								});
							}
						}).catch(console.log);
					});
				}
				break;
			case prefix + "touhou":
				msgArg = msg.slice(msg.indexOf(' ') + 1);
				msgArg = "http://touhou.wikia.com/api/v1/Search/List?lang=en&limit=1&batch=1&query=" + encodeURI(msgArg);
				request({ url: msgArg, json: true }, function(err, res, body) {
					if (body.items) {
						msgArg = "http://touhou.wikia.com/api/v1/Articles/Details?abstract=500&ids=" + body.items[0].id;
						request({ url: msgArg, json: true }, function(err, res, body2) {
							body2 = body2.items[body.items[0].id];
							if (body2.thumbnail) message.channel.sendFile(body2.thumbnail, "image.png", body2.abstract.replace(/\[view\] \u2022 \[talk\] /g, "") + "\n\n<http://touhou.wikia.com" + body2.url + ">");
							else message.channel.sendMessage(body2.abstract.replace(/\[view\] \u2022 \[talk\] /g, "") + "\n\n<http://touhou.wikia.com" + body2.url + ">");
						});
					} else message.channel.sendMessage("Not found");
				});
				break;
			case prefix + "ce":
				if (msgArray.length > 1) {
					message.channel.sendMessage("Searching...").then(mes => {
						args = msg.slice(msg.indexOf(' ') + 1).split(' ');
						if (args.length >= 2) {
							results = [];
							key2 = args[0];
							if (key2 == "id") results.push(args.slice(1).join(' ').toLowerCase());
							else {
								if (key2 == "class") key2 = "servantClass";
								for (var key in CE.list) {
									if (CE.list[key][key2].toLowerCase().includes(args.slice(1).join(' ').toLowerCase())) {
										results.push(key);
									}
								}
							}
							if (results.length == 1) {
								result = CE.list[results[0]];
								mes.delete();
								message.channel.sendFile(result.image, "image.png", "**" + result.name + " (ID: " + results[0] + ")**").then(mes2 => {
									message.channel.sendMessage("**Link:** <" + result.link
										+ ">\n\n**Cost:** " + result.cost
										+ "\n**HP:** " + result.baseHP + " (" + result.maxHP + "\n**ATK:** " + result.baseATK + " (" + result.maxATK
										+ "\n\n**Description:**\n" + result.desc + "\n\n**Note:** " + result.note, {"split": true }
									);
								});
							} else if (results.length > 1) {
								temp = "";
								for (i = 0; i <= results.length; i++) {
									if (i == results.length) mes.edit(temp);
									else temp += results[i] + ": " + CE.list[results[i]].name + "\n";
								}
							} else mes.edit("Cannot found CE");
						} else mes.edit("Wrong syntax");
					});
				} else { 
					message.channel.sendMessage("Check the list of servants here: https://lmaobot.herokuapp.com/?mode=ce");
				}
				break;
			case prefix + "servant":
				if (msgArray.length > 1) {
					message.channel.sendMessage("Searching...").then(mes => {
						args = msg.slice(msg.indexOf(' ') + 1).split(' ');
						if (args.length >= 2) {
							results = [];
							key2 = args[0];
							if (key2 == "id") results.push(args.slice(1).join(' ').toLowerCase());
							else {
								if (key2 == "class") key2 = "servantClass";
								for (var key in servants.list) {
									if (servants.list[key][key2].toLowerCase().includes(args.slice(1).join(' ').toLowerCase())) {
										results.push(key);
									}
								}
							}
							if (results.length == 1) {
								result = servants.list[results[0]];
								attacks = result.attacks;
								attacks = attacks.map(function(atk) { return atkType[atk]; });
								mes.delete();
								message.channel.sendFile(result.image, "image.png", "**" + result.name + " (ID: " + results[0] + ")**").then(mes2 => {
									message.channel.sendMessage("**Link:** <" + result.link
										+ ">\n\n**Class:** " + result.servantClass + "\n**Cost:** " + result.cost
										+ "\n**HP:** " + result.baseHP + " (" + result.maxHP + "\n**ATK:** " + result.baseATK + " (" + result.maxATK
										+ "\n**Attacks:** " + attacks.join(", ") + "\n\n**NP:**\nType: " + atkType[result.NP.slice(0,2)] + "\n" + result.NP.slice(3)
										+ "\n\n**Skills:**\n" + result.skills + "\n\n**Note:**\n" + result.note, {"split": true }
									);
								});
							} else if (results.length > 1) {
								temp = "";
								for (i = 0; i <= results.length; i++) {
									if (i == results.length) mes.edit(temp);
									else temp += results[i] + ": " + servants.list[results[i]].name + " (" + servants.list[results[i]].servantClass + ")\n";
								}
							} else mes.edit("Cannot found Servant");
						} else mes.edit("Wrong syntax");
					});
				} else { 
					message.channel.sendMessage("Check the list of servants here: https://lmaobot.herokuapp.com/?mode=ce");
				}
				break;
			case prefix + "cirno":
				message.channel.sendFile("http://moesocial.com/cirno.php?text=" + encodeURI(msgArray.slice(1).join(" ")), "cirno.png"); 
				break;
			case prefix + "search":
				switch (msgArray[1]) {
					case "image":
						client.search(msgArray.slice(2).join(' ')).then(function (images) {
							console.log(images);
							message.channel.sendFile(images[0].url, "image.png");
						});
						break;
					case "yt":
						request({
							url: "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" +
								msgArray.slice(2).join(" ") + "&key=" + process.env.YTTOKEN2,
							json: true
						}, function (error, response, body) {
							item = body.items[0].id;
							switch (item.kind) {
								case "youtube#video":
									message.reply("First result: <https://www.youtube.com/watch?v=" + item.videoId + ">");
									break;
								case "youtube#channel":
									message.reply("First result: <https://www.youtube.com/channel/" + item.channelId + ">");
									break;
								case "youtube#playlist":
									message.reply("First result: <https://www.youtube.com/playlist?list=" + item.channelId + ">");
									break
							}
						});
						break;
				}
				break;
			case prefix + "help":
				message.channel.sendMessage("" +
					//"**Music:** `$play <url | playlist url>` `$next` `$leave` `$current` `$queue` `$vol <number from 0 to 1>`\n\n" +
					"**Fate Grand Order:** `$ce <search category: name|id|class> <search term>` `$servant <search category: name|id|class> <search term>`\n\n" +
					"**Wikia:** `$touhou <search term>`\n\n" + 
					"**Others:** `$image <image search term>`\n\n" +
					//"**Setting:** `$setting <setting name> <value>` (use `$setting` only to see available settings, omit value to check current value)"
					+ ""
				);
				break;
			case prefix + "cload":
				if (message.author.id == "184369428002111488") {
					load_custom_command();
					message.channel.sendMessage("Successfully loaded");
				}
				break;
			default:
				if (msg in emoji) message.channel.sendFile(emoji[msg]);
				else if (msg.charAt(0) == prefix && msg.slice(1) in commands) message.channel.sendMessage(commands[msg]);
				break;
		}
	}
});
nobuBot.on("guildMemberAdd", (guild, member) => {
	guild.defaultChannel.sendMessage("Welcome " + member.user + " to " + guild.name);
});
setInterval(function() {
	load_custom_command();
	http.get("http://lmaobot.herokuapp.com");
}, 300000);














process.on('uncaughtException', function(err) {
  // Handle ECONNRESETs caused by `next` or `destroy`
  if (err.code == 'ECONNRESET') {
    // Yes, I'm aware this is really bad node code. However, the uncaught exception
    // that causes this error is buried deep inside either discord.js, ytdl or node
    // itself and after countless hours of trying to debug this issue I have simply
    // given up. The fact that this error only happens *sometimes* while attempting
    // to skip to the next video (at other times, I used to get an EPIPE, which was
    // clearly an error in discord.js and was now fixed) tells me that this problem
    // can actually be safely prevented using uncaughtException. Should this bother
    // you, you can always try to debug the error yourself and make a PR.
    console.log('Got an ECONNRESET! This is *probably* not an error. Stacktrace:');
    console.log(err.stack);
	return;
  } else {
    // Normal error handling
    console.log(err);
    console.log(err.stack);
	return;
  }
});