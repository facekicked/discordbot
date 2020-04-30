#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const ytdl = require('ytdl-core');
const Discord = require('discord.js');
const bot = new Discord.Client();
const path = require('path');
const audioFolder = './audio/';
const audioFormats = ['.mp3', '.webm', '.wav'];

const TOKEN = process.env.TOKEN;
var isReady = true;
var voiceChannel = null;

bot.login(TOKEN);

/**
 * 
 */
var getFolderContent = function(folder) {
    const directoryPath = path.join(__dirname, folder);
    var returnFiles = new Array();
    
    try {
        //passsing directoryPath and callback function
        returnFiles = fs.readdirSync(directoryPath);
    } catch(err) {
        console.log(err);
    }
    
    return returnFiles;
};

/**
 * 
 */
var getFile = function(folder, searchFile, allowedExtensions) {
  var files = getFolderContent(folder);
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    if(!file.startsWith(searchFile)) {
      continue;
    }
    var fileEnding = file.slice(searchFile.length);
    
    /* empty extensions = all */
    var allowed = (!allowedExtensions ||allowedExtensions.includes(fileEnding));
    
    if(allowed) {
      return folder + file;
    }
  }
  
  return null;
};

/**
 * 
 */
var soundCommand = async function(msg, argument) {
    if(!msg.member.voice) {
        return;
    }
    
    /* @todo check if same server */
    var userVoiceChannel = msg.member.voice.channel;
    
    if(!userVoiceChannel) {
        return;
    }
    
    var audioFile = getFile(audioFolder, argument, audioFormats);
    
    if(!audioFile) {
        msg.reply('Sound "' + argument + '" not found');
        return;
    }
    
    voiceChannel = userVoiceChannel;
    var connection = await voiceChannel.join();
    var dispatcher = connection.play(
        fs.createReadStream(audioFile),
        {
            volume: 0.5
        }
    );
    
    dispatcher.on("finish", end => {
        voiceChannel.leave();
        dispatcher.destroy();
    });
};

/**
 * 
 */
var soundsCommand = async function(msg, argument) {
  var files = getFolderContent(audioFolder);
  var text = 'Options for "!play [soundName]"' + '\n';
  
  console.log(files);
  
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    
    try {
        var fileEnding =  file.split('.').pop();
        
    } catch (err) {
        continue;
    }
    
    if(!fileEnding) {
       continue;
    }
    
    /* Append '.' on file ending */
    fileEnding = '.' + fileEnding;
    
    /* empty extensions = all */
    var allowed = (audioFormats.includes(fileEnding));
    
    if(!allowed) {
      continue;
    }
    
    var fileWithoutExtension = file.split('.').slice(0, -1).join('.');
    
    text += fileWithoutExtension + "\n";
  }
  
  msg.reply(text);
};

/**
 * 
 */
var youtubeCommand = async function(msg, argument) {
    
    if(!msg.member.voice) {
        return;
    }
    
    /* @todo check if same server */
    var userVoiceChannel = msg.member.voice.channel;
    
    if(!userVoiceChannel) {
        return;
    }
    
    voiceChannel = userVoiceChannel;
    var connection = await voiceChannel.join();
    try {
        var youtubeAudioStream = ytdl(argument, { filter: 'audioonly' });
        var dispatcher = connection.play(
            youtubeAudioStream,
            {
                volume: 0.5
            }
        );
    } catch (err) {
        msg.reply('Video is not playable');
        return ;
    }
    
    
    dispatcher.on("finish", end => {
        voiceChannel.leave();
        dispatcher.destroy();
    });
};

/**
 * 
 */
var stopCommand = async function(msg, argument) {
    if(voiceChannel) {
        voiceChannel.leave();
    }
};

/**
 * 
 */
var commands = {
    'play ': soundCommand,
    'stop': stopCommand,
    'youtube ': youtubeCommand,
    'sounds': soundsCommand
};


bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});


bot.on('message', async msg => {
  
  if(!msg.content) {
    return;
  }
    
  var messageCommand = msg.content.toLowerCase();
  
  /* Iterate command object for matching function */
  Object.entries(commands).forEach(([key, commandMethod]) => {
    var checkForCommand = '!' + key;
    /* Remove command from message to get command arguments strings */
    var commandArgument = msg.content.slice(checkForCommand.length);
    if(messageCommand.startsWith(checkForCommand)) {
        commandMethod(msg, commandArgument);
        return ;
    }
  });
});