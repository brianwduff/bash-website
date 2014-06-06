//TODO: same first letter files
//TODO: same second letter everything

TABKEY = 9;
UPKEY = 38;
DOWNKEY = 40;

var curPath="~";
var tabPressed = 0;
var numCommands = 0;
var curCommand = 0;
var commands = new Array();
var findArray = new Array();
var http = createRequestObject();
function createRequestObject() {
  var objAjax;
  var browser = navigator.appName;
  if(browser == "Microsoft Internet Explorer"){
    	objAjax = new ActiveXObject("Microsoft.XMLHTTP");
  }else{
    	objAjax = new XMLHttpRequest();
  }
  return objAjax;
}

$(document).ready(function(e){
  window.location.href="http://www.brianwduff.com/?#";
  refocus();
  $("#oldContent").html("");
  postXml("output", "welcome");
});

function keyCatch(e) {
  if (e.keyCode == TABKEY) {
    tabCatch(e);
  } else {
    tabPressed = 0;
  }
  
  if (e.keyCode == UPKEY) {
    upCatch();
  } else if (e.keyCode == DOWNKEY) {
    downCatch();
  }else {
    curCommand = numCommands;
  }
}

function upCatch() {
  if (curCommand == numCommands) {
    commands[numCommands] = $("#userInput").val();
  }
  if (curCommand >= 1) {
    curCommand--;
    $("#userInput").val(commands[curCommand]);
  }
}

function downCatch() {
  if (curCommand < numCommands) {
    curCommand++;
    $("#userInput").val(commands[curCommand]);
  }
}

function tabCatch(e) {
  tabPressed++;
  e.preventDefault ? e.preventDefault() : e.returnValue = false;
  refocus();
  var curEntry = $("#userInput").val();
  var splitEntry = curEntry.split(" ");
  var curWord = splitEntry[splitEntry.length-1];
  
  // A space is the last thing entered
  if (curWord == "") {
    if (tabPressed > 1) {
      postContent("guest@brianwduff:"+curPath+"> "+curEntry+"<br>");
      if (splitEntry.length == 1) {
        listCommands();
      } else if (splitEntry.length == 2 && splitEntry[0] == "cd") {
        listFolders(curPath);
      } else {
        ls();
      }
      return;
    } else {
      refocus();
    }
  }
  
  // Part of a command has been entered
  if (splitEntry.length == 1) {
    $.ajax({
      type: "GET",
      url: "man.xml",
      dataType: "xml",
      success: function(xml) {
        var commandArray = new Array();
        $(xml).find("command").each(function() {
          if ($(this).attr("name").substring(0,curWord.length) == curWord) {
            commandArray.push($(this).attr("name"));
          }
        });
        if (commandArray.length == 1) {
          var userInput="";
          for (var i = 0; i < splitEntry.length-1; i++) {
            userInput += splitEntry[i];
          }
          userInput += commandArray[0]+" ";
          $("#userInput").val(userInput);
          tabPressed = 0;
        } else if (commandArray.length > 1) {
          postContent("guest@brianwduff:"+curPath+"> "+curEntry+"<br>");
          for (var i = 0; i < commandArray.length; i++) {
            postContent(commandArray[i]+"<br>");
          }
        }
      }
    });

  // Part of a directory has been entered
  } else if(splitEntry.length == 2) {
    var workingPath;
    var truncPath="";
    var lastWord;
    var parent;
    if (isValidPath(splitEntry[1])) {
      workingPath = splitEntry[1];
      lastWord = "";
    } else {
      splitAdditionalPath = splitEntry[1].split("/");
      
      for (var i=0; i<splitAdditionalPath.length-1; i++) {
        truncPath = truncPath + splitAdditionalPath[i]+"/";
      }
      workingPath = getNewPath(truncPath);
      lastWord = splitAdditionalPath[splitAdditionalPath.length-1];
    }
    if (isValidPath(workingPath)) {
      $.ajax({
        type: "GET",
        url: "files.xml",
        dataType: "xml",
        success: function(xml) {
          var folders = $(xml).find("folder");
          folders.each(function() {
            if ($(this).attr("path") == workingPath) {
              if (lastWord == "") {
                postContent("guest@brianwduff:"+curPath+"> "+curEntry+"<br>");
                listFolders(workingPath);
                listFiles(workingPath);
              } else {
                $(this).children().each(function() {
                  if ($(this).attr("name").substring(0,lastWord.length) == lastWord) {
                    var userInput="";
                    for (var i = 0; i < splitEntry.length-1; i++) {
                      userInput += splitEntry[i]+" ";
                    }
                    userInput += truncPath + $(this).attr("name");
                    if ($(this).attr("type") == "folder") {
                      userInput += "/";
                    }
                    $("#userInput").val(userInput);
                    tabPressed = 0;
                  }
                });
              }
            }
          });
        }
      });
    }
  }
}

function refocus() {
  $("#userInput").focus();
}

function postXml(file, command) {
  $.ajax({
    type: "GET",
    url: file+".xml",
    dataType: "xml",
    success: function(xml) {
      var output = $(xml).find(command);
      if (output.size() == 0) {
        postContent("Command '"+command+"' not recognised. Try 'help'<br>");
      } else {
        output.each(function() {
          $(this).find("line").each(function() {
            postContent($(this).text()+"<br>");
          });
        });
      }
    }
  });
}

function listFolders(path) {
  $.ajax({
    type: "GET",
    url: "files.xml",
    dataType: "xml",
    success: function(xml) {
      var output = $(xml).find("folder").each(function(){
        if ($(this).parent().attr('path') == path) {
          postContent($(this).attr('name')+"<br>");
        }
      });
    }
  });
}

function listFiles(path) {
  $.ajax({
    type: "GET",
    url: "files.xml",
    dataType: "xml",
    success: function(xml) {
      var output = $(xml).find("file").each(function(){
        if ($(this).parent().attr('path') == path) {
          postContent($(this).attr('name')+"<br>");
        }
      });
    }
  });
}

function listCommands() {
  $.ajax({
    type: "GET",
    url: "man.xml",
    dataType: "xml",
    success: function(xml) {
      var output = $(xml).find("command").each(function(){
        postContent($(this).attr('name')+"<br>");
      });
    }
  });
}

function ls() {
  listFolders(curPath);
  listFiles(curPath);
}

function getNewPath(new_path) {
  var splitCurPath = curPath.split("/");
  var splitAdditionalPath = new_path.split("/");
  var newLength = splitCurPath.length;
  for (i=0;i<splitAdditionalPath.length; i++) {
    if (splitAdditionalPath[i] == "..") {
      if (newLength > 1) {
        newLength--;
      }
    } else if (splitAdditionalPath[i] =="~") {
      newLength = 1;
    } else if (splitAdditionalPath[i] == "") {
    } else {
      splitCurPath[newLength++] = splitAdditionalPath[i];
    }
  }
  var path = "";
  for (i=0; i<newLength-1; i++){
    path = path + splitCurPath[i]+"/";
  }
  path = path+splitCurPath[newLength-1];
  return path;
}

function isValidPath(path) {
  var success = 0;
  $.ajax({
    type: "GET",
    url: "files.xml",
    dataType: "xml",
    async: false,
    success: function(xml) {
      var output = $(xml).find("folder").each(function(){
        if ($(this).attr('path') == path) {
          success = 1;
          return;
        }
      });
    }
  });
  return success;
}

function cd(new_path) {
  var path = getNewPath(new_path);
  if (isValidPath(path)) {
    curPath = path;
    $("#cur_path").html(curPath);
    splitCurPath = curPath.split("/");
  } else {
    postContent("cd: "+path+": No such directory.<br>");
  }
}

function postContent(content) {
  $("#oldContent").append(content);
  $('html, body').animate({scrollTop: $(document).height()}, 10);
}

// TODO: Could be combined with postXml?
function man(command) {
  var success = 0;
  $.ajax({
    type: "GET",
    url: "man.xml",
    dataType: "xml",
    success: function(xml) {
      $(xml).find("command").each(function() {
        if ($(this).attr("name") == command) {
          success = 1;
          $(this).find("line").each(function() {
            postContent($(this).text()+"<br>");
          });
        }
      });
      if (success == 0) {
        postContent("Command '"+command+"' not recognised. Try 'help'<br>");
      }
    }
  });
}

function displayTextFile() {
  if(http.readyState == 4){
    var file = http.responseText;
    var lines = file.split('\n');
    for (var i = 0; i < lines.length; i++) {
      postContent(lines[i] + "<br>");
    }
  }
}

function cat(filePath) {
  var path = getNewPath(filePath);
  $.ajax({
    type: "GET",
    url: "files.xml",
    dataType: "xml",
    async: false,
    success: function(xml) {
      $(xml).find("file").each(function() {
        if ($(this).attr("path") == path) {
          http.open('get', $(this).attr("location"));
          http.onreadystatechange = displayTextFile;
          http.send(null);
        }
      });
    }
  });
}

function clear() {
  $("#oldContent").html("");
}

function find(commandLength, inputPath) {
  if (commandLength == 1) {
    findHelper(curPath);
  } else {
    path = getNewPath(inputPath);
    if (isValidPath(path)) {
      findHelper(path);
    } else {
      postContent("find: '"+inputPath+"' is not a valid path.<br>");
    }
  }
}


function findHelper(path) {
  postContent(path+"<br>");
  $.ajax({
    type: "GET",
    url: "files.xml",
    dataType: "xml",
    success: function(xml) {
      // Display all files
      var output = $(xml).find("file").each(function(){
        if ($(this).parent().attr('path') == path) {
          postContent(path+"/"+$(this).attr('name')+"<br>");
        }
      });
      // Add all the folders to the stack
      $(xml).find('folder').each(function() {
        if ($(this).parent().attr("path") == path) {
          findArray.push($(this).attr("path"));
        }
      });
      // Get the top of the stack and recurse
      var top = findArray.shift();
      if (top != undefined) {
        findHelper(top);
      }
    }
  });
}

function gui() {
  window.location = "gui.html";
}

function submitEnter() {
  var userInput = $("#userInput").val();
  $("#userInput").val("");
  postContent("guest@brianwduff:"+curPath+"> "+userInput+"<br>");

  if (userInput == '') {
    return;
  }
  commands[numCommands] = userInput;
  numCommands++;
  curCommand = numCommands;

  var splitInput = userInput.split(" ");
  var command = splitInput[0];
  var commandLength = splitInput.length;

  if (command == "gui" || command == "quit") {
    gui();
  } else if (command == "ls") {
    ls();
  } else if (command == "clear") {
    clear();
  } else if (command == "find") {
    find(commandLength, splitInput[1]);
  } else if (command == "man") {
    if (commandLength > 1) {
      man(splitInput[1]);
    } else {
      postXml("output", command);
    }
  } else if (command == "cd") {
    if (commandLength > 1) {
      cd(splitInput[1]);
    } else {
      postXml("output", command);
    }
  } else if (command=="cat" || command=="vim" || command=="emacs") {
    if (commandLength > 1) {
      cat(splitInput[1]);
    } else {
      postXml("output", command);
    }
  } else {
    postXml("output", command);
  }
}