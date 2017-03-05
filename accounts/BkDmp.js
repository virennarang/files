var parsing_bk_results = [],
    parsed_bk_result_format = '',
    bkPhints,
    ecmCampaign,
    ecmCookie,
    mktDomain,
    aoDomain,
    bkDomain,
    bkTimeout,
    updateTimeout,
    ecmNames;

var bk = {
	parseBkData: function(bkResponse) {
		parsed_bk_result_format = '';
		(typeof bk_results == 'undefined') && (bk_results = bkResponse);
		if (bk_results.campaigns.length == 1 && ecmCampaign == bk_results.campaigns[0].campaign) {
			bk_results.campaigns.length = 0;
			return;
		}
		if (!Array.prototype.reduce || !Array.prototype.map){
			for (i = 0; i < bk_results.campaigns.length; i++) {
				var c, campaignid, categoriesTotal = '';
			    c = bk_results.campaigns[i];
                campaignid = parseInt(c.campaign);
                categoriesTotal = '';
                for (j = 0; j < c.categories.length; j++) {
                    var cid = parseInt(c.categories[j].categoryID);
                    if (j != c.categories.length - 1)
                        categoriesTotal = categoriesTotal + cid + "|";
                    else
                        categoriesTotal = categoriesTotal + cid;
                }
                if (i != bk_results.campaigns.length - 1)
                	parsed_bk_result_format = parsed_bk_result_format + campaignid + ":" + categoriesTotal + "-";
                else
                	parsed_bk_result_format = parsed_bk_result_format + campaignid + ":" + categoriesTotal; 
            }
		}else{
		    bk_results.campaigns.reduce(function(i, v) {
		        parsing_bk_results.push(v.campaign + ':' + v.categories.map(function(elem) {
		            return elem.categoryID;
		        }).join("|"));
		    }, true);
		    parsed_bk_result_format = parsing_bk_results.join('-');
		}
	},
	
	createCookie: function(cname, cvalue, exdays, domainName){
		//Creating Blukai cookie for session
		document.cookie = cname + "=" + cvalue + ";secure; path=/; domain=" + domainName;
	},
	
	callSom: function() {
		isBKDMPDeleted = 'N';
		if(pageDef === "jcbol_common_Dashboard"){
			offerService();
		}
		
		if (parsed_bk_result_format === undefined) {
	        parsed_bk_result_format = '';
		}
		
		bk.sendDmpUpdates();
	},
	
	sendDmpUpdates: function() {
		$.ajax({
			url : aoDomain + "/cards/svc/BKDMPSync.do",
			type : "POST",
			data: "token=" + parsed_bk_result_format,
			dataType : "script",
			success : function (data, status, jqxHR) {
			}
		});
		$.ajax({
			url : mktDomain + "/credit-cards/senddmp.do",
			type : "POST",
			data: "token=" + parsed_bk_result_format,
			dataType : "script",
			success : function (data, status, jqxHR) {
			}
		});
	},
	
	updateDmpCache: function(){
		$.ajax({
	        url:"/US/DMP/BKDmpUpdate.action"+"?JFP_TOKEN="+ JFP_CSRF_TOKEN,
	        type: 'POST',
	        timeout: updateTimeout, //500
	        global: false,
	     	error: function(x, t, m) {
	        	if (t === "timeout") {
	        		bk.callSom();
				} else {
					bk.callSom();
				}
	        },
	        success:function(response){
	        	bk.callSom();
	        }
		});
	},
	
	bkCallTimeout: function(){
		bk.createCookie("BKDMP", '', 1, domainName);
		bk.updateDmpCache();
		//bk.sendDmpUpdates();
	},
	
	bkCall: function(){
	    var ecmCookieSplit, ecmNamesMap;
	    var cbolecm = getCookie("CBOLECM");
	    if(cbolecm) {
	    	ecmCookieSplit = cbolecm.split("-");
	    }
	    ecmNamesMap = $.parseJSON(JSON.stringify(ecmNames));
	    bkPhints = "";
	    if(ecmCookieSplit){
		    for (var i = 0; i < ecmCookieSplit.length; i++) {
		        if (String(ecmNamesMap[String(i + 1)]) != 'undefined') {
		            bkPhints = bkPhints + "&phint=" + ecmNamesMap[String(i + 1)] + "%3D" + ecmCookieSplit[i];
		        }
		    }
	    }
	    /*$.ajax({
			url : bkDomain + bkPhints,
			type: "POST",
			dataType : "script",
			timeout : bkTimeout,  //500
			global : false,
			success : function (data, status, jqxHR) {
		    	if (typeof bk_results == 'undefined') {
		    		bk.createCookie("BKDMP", '', 1, domainName);
		    		bk.updateDmpCache();
		        	//bk.sendDmpUpdates();
		            return;
		        } else {
		        	bk.parseBkData();
		        	bk.createCookie("BKDMP", parsed_bk_result_format, 1, domainName);
		        	bk.updateDmpCache();
		            //bk.sendDmpUpdates();
		        }
			},
			error : function (x, t, m) {
				if (t === "timeout") {
					bk.bkCallTimeout();
				} else {
					bk.bkCallTimeout();
				}
			}
		});*/

		$.ajax({
			url : bkDomain, 
			type: "GET", 
			dataType : "json", 
			timeout : bkTimeout,  
			global : false,
			xhrFields: {
				withCredentials: true
			},
			success : function (data, status, jqxHR) {
		    	if (typeof data == 'undefined') {
		    		bk.createCookie("BKDMP", '', 1, domainName);
		    		bk.updateDmpCache();
		        	//bk.sendDmpUpdates();
		            return;
		        } else {
		        	bk.parseBkData(data);
		        	bk.createCookie("BKDMP", parsed_bk_result_format, 1, domainName);
		        	bk.updateDmpCache();
		            //bk.sendDmpUpdates();
		        }
			},
			error : function (x, t, m) {
				if (t === "timeout") {
					bk.bkCallTimeout();
				} else {
					bk.bkCallTimeout();
				}
			}
		});
	}
};