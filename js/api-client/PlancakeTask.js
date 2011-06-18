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

/*global PLANCAKE */
/*jslint white: true, devel: true, onevar: false, browser: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, safe: false, maxerr: 50, indent: 4 */

var PLANCAKE = PLANCAKE || {};

PLANCAKE.Task = function () {
    this.description = null;
    this.listId = null;
    this.isStarred = false;
    this.isHeader = false;
    this.dueDate = null; // in the yyyy-mm-dd format
    this.dueTime = null; // in the (H)Hmm 24h format (i.e.: 915, 1913) 
    this.repetitionId = null;
    this.repetitionParam = null;
    this.repetitionIcalRrule = null;
    this.note = null;
    this.tagIds = null; // comma-separated
};
