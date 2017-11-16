// ==UserScript==
// @name           Nifty Chat Monitor
// @namespace      http://somewhatnifty.com
// @description    reformats twitch chat for display on a chat monitor
// @match        https://www.twitch.tv/*/chat?display*
// @version    0.200
// @updateURL https://raw.githubusercontent.com/paul-lrr/nifty-chat-monitor/master/chat-monitor.js
// @downloadURL https://raw.githubusercontent.com/paul-lrr/nifty-chat-monitor/master/chat-monitor.js
// @require  https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require  https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @require  https://raw.githubusercontent.com/sizzlemctwizzle/GM_config/master/gm_config.js
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_log
// @resource style http://www.myshelter.net/chat-monitor.css
// @resource material-icons https://fonts.googleapis.com/icon?family=Material+Icons
// ==/UserScript==

let getQS = (str)=>{
    let a, q = {},r = /([^?=&\r\n]+)(?:=([^&\r\n]*))?/g;
    while ((a = r.exec(str)) !== null) {
        q[a[1]] = a[2]||'';
    }
    return q;
};

var qs = getQS(location.search);

var inlineImages = false;

//Create config page fields
//Fields appear in the order written below.
//Maybe in the future this could be loaded from a JSON file? It would be easier to maintain.
var configFields = {
    "HideChatInput": { //Id for field in html
        "label" : "Hide Chat Input Area", //Label that appears on the config
        "type" : "checkbox",
        "default" : false
    },
    "ReverseDirection": {
        "label" : "New messages appear on top",
        "type" : "checkbox",
        "default" : false
    },
    "InlineImages": {
        "label" : "Display images that are linked",
        "type" : "checkbox",
        "default" : true
    },
    "UsernamesToHighlight": {
        "label" : "Username(s)",
        "section" : ["Username Highlighting", "Change the color of any of the usernames listed below. Separate with commas"],
        "type" : "text",
        "title" : "seperate usernames with commas, case sensitive",
        //These as defaults as I can't imagine Paul will mind, and I know I don't mind.
        "default" : ""
    },
    "UsernameHighlightingColor": {
        "label" : "Highlight Color",
        "type" : "text",
        "default" : "#ff6696" //Its pink. Its a good color bront.
    },
    "KeywordsToHighlight": {
        "label" : "Keyword(s)",
        "section" : ["Keyword Highlighting", "Change the background color of any messages that use the keywords listed below. Separate with commas"],
        "type" : "text",
        "title" : "seperate keywords with commas, case sensitive",
        "default" : ""
    },
    "KeywordHighlightingBackgroundColor": {
        "label" : "Highlight Background Color",
        "type" : "text",
        "default" : "#560b33" //Its also pink.
    },
    "CustomHighlighting": {
        "label" : "",
        "section" : ["CSS User Highlighting"],
        "type" : "textarea",
        //Keeping CSS in from chat-monitor-highlight.css as an example of what you can do
        "default" : ".chat-lines li[data-badges*='Moderator'] .from {\n" +
                        "\tcolor: #8383f9 !important;\n" +
                    "}\n" +
                    ".chat-lines li[data-badges*='Broadcaster'] {\n" +
                        "\tbackground-color: #000090 !important;\n" +
                    "}\n" +
                    ".chat-lines li[data-badges*='Broadcaster'] .from {\n" +
                        "\tcolor: #00b5e0 !important;\n" +
                    "}\n" +
                    ".chat-lines li[data-user='LRRbot'] .from {\n" +
                        "\tcolor:purple !important;\n" +
                    "}\n" +
                    ".chat-lines li[data-user='LRRbot'][data-message*='thanks for']{\n" +
                        "\tbackground-color:purple !important;\n" +
                    "}\n" +
                    ".chat-lines li[data-user='LRRbot'][data-message*='thanks for'] .from{\n" +
                        "\tcolor:black !important;\n" +
                    "}\n" +
                    ".chat-lines li[data-message*='loadingreadyrun'] {\n" +
                        "\tbackground-color: #00005d !important;\n" +
                    "}"
    },
    "RefreshReminder": {
        "label": "",
        "section" : ["After saving, be sure to refresh the page to have your new settings apply!"],
        "type" : "hidden"
    }
};

initConfig();
waitForKeyElements (".chat-lines", onChatLoad);

function onChatLoad() {
    loadSettings();
    actionFunction();
}

//Creates , inits the config handler
//See https://github.com/sizzlemctwizzle/GM_config/wiki for details
function initConfig() {
    GM_config.init({
        "id" : "chat-config",
        "title" : "Nifty Chat Monitor Settings",
        "fields" : configFields,
        // I need a better way of settings this css attribute. I'm thinking of converting
        // it to a variable, because I could use new lines in that and keep it somewhere
        // out of sight, but thats for later-Jack
        "css" : "#chat-config .field_label { font-size: 32px !important; line-height: 35px !important; font-family: 'Open Sans Condensed', sans-serif !important; font-weight: normal !important; } .config_var input[type=checkbox] {  transform: scale(2.0); } #chat-config_field_CustomHighlighting { width: 90%; height: 500px; }" //adds CSS to the config page
    });
}

//Checks all config options and loads them appropriately
function loadSettings() {
    //Add settings wheel to page
    $( ".ember-chat-container").append("<div id=\"settings-wheel\"> <i class=\"material-icons\">settings</i> </div>");
    $( "#settings-wheel").click(function() {
      GM_config.open();
    });

    //Reverse messages
    if(typeof qs.reverse !== 'undefined' || GM_config.get("ReverseDirection")) {
        $( ".tse-content" ).addClass('reverse');
    }

    //Hide chat interface
    if(GM_config.get("HideChatInput")) {
        $( ".qa-chat" ).addClass("hide-chat-interface");
    }

    //Check if we should be adding inline images or not
    if(typeof qs.img !== 'undefined' || GM_config.get("InlineImages")) {
        inlineImages = true;
    }

    //Handles UsernamesToHighlight, UsernameHighlightingColor, CustomHighlighting config fields
    addCssFromConfig(generateCss());
}

//Adds the CSS from the config fields
//generatedCss will be added to the CSS on the page.
function addCssFromConfig(generatedCss) {
    //Add CSS from text area
    var customHighlighting = GM_config.get("CustomHighlighting");
    var head = document.getElementsByTagName("head")[0];
    var newCss = document.createElement("style");
    newCss.type = "text/css";
    newCss.innerHTML = generatedCss + "\n" + customHighlighting;
    head.appendChild(newCss);
}

//Creates CSS from config fields
function generateCss() {
    //Stores CSS generated by various options
    var generatedCss = "";
    generatedCss += generateUsernameHighlightingCss();
    generatedCss += generateKeywordHighlightingCss();
    return generatedCss;
}

//Handles UsernamesToHighlight section, returns CSS as a string
function generateUsernameHighlightingCss() {
    var generatedCss = "";
    //Load config options, Check if contains data
    var usernamesToHighlight = GM_config.get("UsernamesToHighlight");
    var usernameHighlightColor = GM_config.get("UsernameHighlightingColor");
    if(usernamesToHighlight && usernameHighlightColor) {
        //Split into array on commas
        var usernameList = usernamesToHighlight.split(",");
        //Adds rule for each username. This could just add one rule, and save a bit of space, but I think this works just as well.
        for(var i = 0; i < usernameList.length; i++) {
            //Add css to variable
            generatedCss += ".chat-lines li[data-user=\"" + usernameList[i].trim() + "\"] .from {\n\tcolor: " + usernameHighlightColor + " !important;\n }\n";
        }
    }
    return generatedCss;
}

//Handles KeywordsToHighlight section, returns CSS as a string
function generateKeywordHighlightingCss() {
    var generatedCss = "";
    //Load config options, Requires either Text or Background color, but not both
    //data-message attribute makes everything lowercase, so we do the same to our keywords.
    var keywordsToHighlight = GM_config.get("KeywordsToHighlight").toLowerCase();
    var keywordHighlightBackgroundColor = GM_config.get("KeywordHighlightingBackgroundColor");
    if(keywordsToHighlight && keywordHighlightBackgroundColor) {
        //Split into array on commas
        var keywordList = keywordsToHighlight.split(",");
        //Adds rule for each username. This could just add one rule, and save a bit of space, but I think this works just as well.
        for(var i = 0; i < keywordList.length; i++) {
            //Add css to variable
            generatedCss += ".chat-lines li[data-message*=\"" + keywordList[i] + "\"] {\n";
            generatedCss += "\tbackground-color: " + keywordHighlightBackgroundColor + " !important;\n";
            generatedCss += "}\n";
        }
    }
    return generatedCss;
}

function actionFunction() {
    // The node to be monitored
    var target = $( ".chat-lines" )[0];
    // Create an observer instance
    var observer = new MutationObserver(function( mutations ) {
        mutations.forEach(function( mutation ) {
            var newNodes = mutation.addedNodes; // DOM NodeList
            if( newNodes !== null ) { // If there are new nodes added
                var $node = $(newNodes[0]);
                if( $node.hasClass( "ember-view" ) ) {

                    let from = $node.find('.from');
                    let rgb = from[0].style.color.match(/[0-9.]+/g);
                    let luminance = (rgb[0]/128 + rgb[1]/85 + rgb[2]/255) / 6;
                    if (luminance < 0.4) {
                        rgb = [255 - rgb[0], 255 - rgb[1], 255 - rgb[2]];
                        from.style.color = 'rgb(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ')';
                    }

                    //add data-user=<username> for user-based highlighting
                    $node.attr('data-user', from.text());

                    //add data-badges=<badges> for badge-based highlighting
                    var badges = [];
                    $node.find('.badges .badge').each(function(){
                        badges.push($(this).attr('alt'));
                    });
                    $node.attr('data-badges',badges.join(','));

                    //add data-message=<message> for keyword-based highlighting
                    $node.attr('data-message',$node.find('.message').text().replace(/(\r|\s{2,})/gm," ").trim().toLowerCase());

                    //add inline images
                    if(inlineImages) {
                        var $links = $node.find('.message a');
                        $links.each(function(i){
                            var re = /(.*(?:jpg|png|gif))$/mg;
                            if(re.test($(this).text())){
                                $(this).html('<img src="'+$(this).text()+'" alt="'+$(this).text()+'"/>');
                            }
                        });
                    }

                    //add 'odd' class for zebra striping. Checks the last 10 lines in case of chat flooding
                    $('.chat-lines > .ember-view').slice(-10).each(function(){
                        if(!$(this).prev().hasClass('odd')){
                            $(this).addClass('odd');
                        }
                    });

                }
            }
        });
    });

    // Configuration of the observer:
    var config = {
        attributes: true,
        childList: true,
        characterData: true
    };

    // Pass in the target node, as well as the observer options
    observer.observe(target, config);
}

//inject custom stylessheet
var style = GM_getResourceText('style');
GM_addStyle(style);
var materialIcons = GM_getResourceText('material-icons');
GM_addStyle(materialIcons);
