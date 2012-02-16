/*************************************************************************************
* ===================================================================================*
* Software by: Danyuki Software Limited                                              *
* This file is part of Plancake.                                                     *
*                                                                                    *
* Copyright 2009-2010-2011 by:     Danyuki Software Limited                          *
* Support, News, Updates at:  http://www.plancake.com                                *
* Licensed under the AGPL version 3 license.                                         *                                                       *
* Danyuki Software Limited is registered in England and Wales (Company No. 07554549) *
**************************************************************************************
* Plancake is distributed in the hope that it will be useful,                        *
* but WITHOUT ANY WARRANTY; without even the implied warranty of                     *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the                      *
* GNU Affero General Public License for more details.                                *
*                                                                                    *
* You should have received a copy of the GNU Affero General Public License           *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.              *
*                                                                                    *
**************************************************************************************/

/*global PLANCAKE, $, chrome, localStorage */
/*jslint white: true, devel: true, onevar: false, browser: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, safe: false, maxerr: 50, indent: 4 */

var PLANCAKE = PLANCAKE || {};

var PLANCAKE_CHROME_EXTENSION = {};
PLANCAKE_CHROME_EXTENSION.plancakeApiClient = null; // this properties is for implementing a Singleton

PLANCAKE_CHROME_EXTENSION.apiKey = 'efe21c2f0e034b0c76c7cf6be60b0842f280ee8c'; // obtain an API key from http://www.plancake.com/api-documentation
PLANCAKE_CHROME_EXTENSION.apiSecret = 'g4q82y4UxhYP69Ss'; // obtain an API secret from http://www.plancake.com/api-documentation
PLANCAKE_CHROME_EXTENSION.apiEndpointUrl = 'http://api.plancake.com/api.php';


PLANCAKE_CHROME_EXTENSION.userKeyStorageName = 'userKey';
PLANCAKE_CHROME_EXTENSION.tokenStorageName = 'token';
PLANCAKE_CHROME_EXTENSION.listsStorageName = 'lists';
PLANCAKE_CHROME_EXTENSION.cookieLifetimeInDays = 60;
PLANCAKE_CHROME_EXTENSION.defaultUrl = 'http://www.plancake.com';

$(document).ready(function () {
    var plancakeApiClient = null;     
    
    var displayUserKeyScreen = function () {
        $('form#enterUserKey').show();
        $('#userKeyValue').focus();
        $('#resetLink').hide();
        $('#getUrlLink').hide();      
    }
    
    var hideUserKeyScreen = function () {
        $('form#enterUserKey').hide();
        $('form#enterTask').show();   
    }    

    var displayAddTaskScreen = function () {
        $('form#enterTask').show();

        try {
            plancakeApiClient = PLANCAKE_CHROME_EXTENSION.getPlancakeApiClient();

            PLANCAKE_CHROME_EXTENSION.populateListsCombo();            
        } catch (e) {
            alert(e.name + ': ' + e.message);
        }
        $('#enterTaskValue').focus();
        $('#resetLink').show();
        $('#getUrlLink').show();          
    }       
    
    if (!$.cookie(PLANCAKE_CHROME_EXTENSION.userKeyStorageName)) {
        displayUserKeyScreen();
    } else {
        displayAddTaskScreen();
    }
    
    $('a').click(function () {
        var url = $(this).attr('href') || PLANCAKE_CHROME_EXTENSION.defaultUrl;
        if (url && (url.length > 1)) // the condition on the length is to ignore '#' as url
        {
            chrome.tabs.create({'url': url}, function(tab) {})
        }
    });
    
    $('form#enterUserKey').submit(function () {
        try {
            plancakeApiClient = PLANCAKE_CHROME_EXTENSION.getPlancakeApiClient($('#userKeyValue').val());

            plancakeApiClient.getServerTime({
                success: function (dataFromServer) {
                    var serverTime = dataFromServer.time;
                    if (serverTime > 0) {
                        // first request to the server was successful: we are ready to go
                        $.cookie(PLANCAKE_CHROME_EXTENSION.userKeyStorageName, $('#userKeyValue').val(), {expires: PLANCAKE_CHROME_EXTENSION.cookieLifetimeInDays});
                        hideUserKeyScreen();
                        PLANCAKE_CHROME_EXTENSION.populateListsCombo();
                        displayAddTaskScreen();
                    } else {
                        alert("Some error occurred. Are you sure the userKey was correct?");
                    }
                }
            });
        } catch (e) {
            alert("Some error occurred. Are you sure the userKey was correct? (" + e.message + ")");            
        }
        return false;
    });
    
    $('form#enterTask').submit(function () {
        var task = new PLANCAKE.Task();
        plancakeApiClient = PLANCAKE_CHROME_EXTENSION.getPlancakeApiClient();
        
        task.description = $('#enterTaskValue').val();
        task.listId = $('select#listsCombo').val();
        task.note =  $('#enterTaskNote').val();
        
        if (!task.description.length) {
            alert("You need to add a description.");
        } else {        
            plancakeApiClient.addTask(task, {
                success: function (dataFromServer) {
                    var taskId = dataFromServer.task_id;
                    if (taskId <= 0) {
                        alert("Some error occurred."); 
                    } else {
                        $('#enterTaskValue').val('');
                        return;                
                    }
                }
            });
        }
        return false;
    });   
    
    $('#refreshListsCombo').click(function () {
        PLANCAKE_CHROME_EXTENSION.refreshListsCombo();
    });
    
    $('#resetLink').click(function () {
        PLANCAKE_CHROME_EXTENSION.resetAll();
    });

    $('#getUrlLink').click(function () {
        chrome.tabs.getSelected(null, function (tab) {
            $('#enterTaskNote').val(tab.url);
        });
    });
});

/*
 * It implements a Singleton design pattern
 * @param string userKey (=null)
 */
PLANCAKE_CHROME_EXTENSION.getPlancakeApiClient = function (userKey) {
    var token;
    
    if ((userKey === null) || (userKey === undefined)) {
        userKey = $.cookie(PLANCAKE_CHROME_EXTENSION.userKeyStorageName);        
    }
    
    if (PLANCAKE_CHROME_EXTENSION.plancakeApiClient === null) {
        if (!userKey) {
            alert("You need a userKey before getting an API client");
            return null;
        }

        PLANCAKE_CHROME_EXTENSION.plancakeApiClient = new PLANCAKE.PlancakeApiClient({
            apiKey: PLANCAKE_CHROME_EXTENSION.apiKey, 
            apiSecret: PLANCAKE_CHROME_EXTENSION.apiSecret,
            apiEndpointUrl: PLANCAKE_CHROME_EXTENSION.apiEndpointUrl,
            userKey: userKey, // check Settings page
            startOfCommunicationCallback: PLANCAKE_CHROME_EXTENSION.startOfCommunicationCallback,
            endOfCommunicationWithSuccessCallback: PLANCAKE_CHROME_EXTENSION.endOfCommunicationWithSuccessCallback,
            endOfCommunicationWithErrorCallback: PLANCAKE_CHROME_EXTENSION.endOfCommunicationWithErrorCallback              
        });
        
        if (window.localStorage) {
            token = localStorage.getItem(PLANCAKE_CHROME_EXTENSION.tokenStorageName);
            if (token) {
                PLANCAKE_CHROME_EXTENSION.plancakeApiClient.token = token;
            }
        }        
    }
    return PLANCAKE_CHROME_EXTENSION.plancakeApiClient;
};

PLANCAKE_CHROME_EXTENSION.resetAll = function () {
    $.cookie(PLANCAKE_CHROME_EXTENSION.userKeyStorageName, null);
    
    if (window.localStorage) {
        localStorage.setItem(PLANCAKE_CHROME_EXTENSION.tokenStorageName, null);
        localStorage.setItem(PLANCAKE_CHROME_EXTENSION.listsCookieName, null);        
    }    
    
    $('form#enterUserKey').show();
    $('form#enterTask').hide();        
};

PLANCAKE_CHROME_EXTENSION.refreshListsCombo = function () {
    $.cookie(PLANCAKE_CHROME_EXTENSION.listsCookieName, null);
    PLANCAKE_CHROME_EXTENSION.populateListsCombo(true);
};

/**
 * @param boolean forceReload (=false)
 */
PLANCAKE_CHROME_EXTENSION.populateListsCombo = function (forceReload) {
    var lists = null;
    var plancakeApiClient = PLANCAKE_CHROME_EXTENSION.getPlancakeApiClient();
    
    if ((forceReload === null) || (forceReload === undefined)) {
        forceReload === false;
    }
    
    function buildHtml(lists) {
        var i;        
        var listItem = null;
        var listsOption = null;        
        var listsCombo = $('select#listsCombo');

        listsCombo.find('option').remove(); // removing all the old options

        for (i=0; i < lists.length; i++) {
            listItem = lists[i];
            listsOption = $('<option></option>').val(listItem.id).html(listItem.name);
            if (listItem.is_header) {
                listsOption.addClass('header');
            }
            listsCombo.append(listsOption);
        }        
    }

    if (window.localStorage) {
        lists = JSON.parse(localStorage.getItem(PLANCAKE_CHROME_EXTENSION.listsStorageName));
    }

    if (!lists || forceReload) {
        plancakeApiClient.getLists(null, null, {
            success: function (listsFromServer) {
                if (window.localStorage) {
                    localStorage.setItem(PLANCAKE_CHROME_EXTENSION.listsStorageName, JSON.stringify(listsFromServer.lists));
                }

                buildHtml(listsFromServer.lists);
            }
        });       
    } else {
        buildHtml(lists); 
    }
};

PLANCAKE_CHROME_EXTENSION.startOfCommunicationCallback = function () {
    $('#ajaxInProgress').show();

    $('form#enterTask').block({
        message: '',
        css: {border: '1px solid #ff9922', padding: '5px'},
        applyPlatformOpacityRules: false
    });
  
};

PLANCAKE_CHROME_EXTENSION.endOfCommunicationWithSuccessCallback = function () {
    function hiding() {
        $('#successFeedback').hide('fast');
    }
    
    if (window.localStorage) {
        localStorage.setItem(PLANCAKE_CHROME_EXTENSION.tokenStorageName, PLANCAKE_CHROME_EXTENSION.getPlancakeApiClient().token);
    }    
    $('#ajaxInProgress').hide();
    
    $('#successFeedback').text('Operation completed successfully.').show();
    setTimeout(hiding, 2000);

    $('form#enterTask').unblock();
};

PLANCAKE_CHROME_EXTENSION.endOfCommunicationWithErrorCallback = function (errorMessage) {
    function hiding() {
        $('#errorFeedback').hide('fast');
    }
    
    $('#ajaxInProgress').hide();
    $('#errorFeedback').text('An error occurred (error code: ' + errorMessage + ' )').show();
    setTimeout(hiding, 2000);
    
    $('form#enterTask').unblock();    
};
