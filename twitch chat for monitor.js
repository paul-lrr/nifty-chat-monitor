// ==UserScript==
// @name           Twitch Chat display for monitor
// @namespace      http://somewhatnifty.com
// @description    reformats twitch chat for display on a chat monitor
// @match        https://www.twitch.tv/*/chat?display=true*
// @version    0.1
// @require  https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require  https://gist.github.com/raw/2625891/waitForKeyElements.js
//@grant       GM_getResourceText
//@grant       GM_addStyle
//@resource style http://localhost/chat-monitor.css
//@resource highlight http://localhost/chat-monitor-highlight.css
// ==/UserScript==

var qs = JSON.parse('{"' + decodeURI(location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');

waitForKeyElements (".chat-lines", actionFunction);
function actionFunction(){
    if(typeof qs.reverse !== 'undefined'){
        $( ".chat-lines" ).addClass('reverse');
    }
    // The node to be monitored
    var target = $( ".chat-lines" )[0];
    // Create an observer instance
    var observer = new MutationObserver(function( mutations ) {
        mutations.forEach(function( mutation ) {
            var newNodes = mutation.addedNodes; // DOM NodeList
            if( newNodes !== null ) { // If there are new nodes added
                var $node = $(newNodes[0]);
                if( $node.hasClass( "ember-view" ) ) {

                    //add data-user=<username> for user-based highlighting
                    $node.attr('data-user',$node.find('.from').text());

                    //add data-badges=<badges> for badge-based highlighting
                    var badges = [];
                    $node.find('.badges .badge').each(function(){
                        badges.push($(this).attr('alt'));
                    });
                    $node.attr('data-badges',badges.join(','));

                    //add data-message=<message> for keyword-based highlighting
                    $node.attr('data-message',$node.find('.message').text().replace(/(\r|\s{2,})/gm," ").trim().toLowerCase());

                    //add inline images
                    if(typeof qs.img !== 'undefined'){
                        var $links = $node.find('.message a');
                        $links.each(function(i){
                            var re = /(.*(?:jpg|png|gif))$/mg;
                            if(re.test($(this).text())){
                                $(this).html('<img src="'+$(this).text()+'">');
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
var highlight = GM_getResourceText('highlight');
GM_addStyle(highlight);