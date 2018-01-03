define(function (require, exports, module) {

	var pageModule = new PageLogic({
		getUrl: "goform/getSysTools",
		modules: "loginAuth,wanAdvCfg,lanCfg,softWare,wifiRelay,sysTime,remoteWeb,isWifiClients,systemInfo",
		setUrl: "goform/setSysTools"
	});

	pageModule.modules = [];
	pageModule.moduleName = "wifiRelay";

	pageModule.initEvent = function () {
		pageModule.update("sysTime", 5000, updateTime);
	}

	pageModule.beforeSubmit = function () {
		if (pageModule.data.lanCfg.lanIP != $("#lanIP").val()) {
			if (!confirm(_('The login IP will be changed into %s.', [$("#lanIP").val()]))) {
				return false;
			}
		}
		return true;
	};

	function updateTime(obj) {
		$("#sysTimecurrentTime").text(obj.sysTime.sysTimecurrentTime);
	}
	module.exports = pageModule;

	/*page control*/
	var pageModuleInit = new PageModuleInit();
	pageModule.modules.push(pageModuleInit);

	function PageModuleInit() {

		this.initValue = function () {
			var wifiRelayObj = pageModule.data.wifiRelay;
			if (wifiRelayObj.wifiRelayType == "ap") {
				$("#lanParame, #remoteWeb, #wanParam").addClass("none");
			}

			if (wifiRelayObj.wifiRelayType != "wisp" && wifiRelayObj.wifiRelayType != "disabled") {
				$("#reminder").text(_("At 3 a.m. each day, the router will auto-reboot."));
			} else {
				$("#reminder").text(_("During 03:00~05:00 (a.m.) each day,if no one is using the router, the router will auto-reboot."));
			}
		}
	}
	/*************END Page Control***********/

	/*
	 *
	 * @method loginPwdModule [��ʾ�����õ�¼����ģ����ص�����]
	 * @return {��}
	 */
	var loginPwdModule = new LoginPwdModule();
	pageModule.modules.push(loginPwdModule);

	function LoginPwdModule() {

		this.moduleName = "loginAuth";
		this.data = {};

		this.init = function () {
			this.addInputEvent = false;
		}
		this.initValue = function (loginObj) {

			//���ȡ��ʱ����
			$("#newPwd, #cfmPwd, #oldPwd").removeValidateTipError(true);

			$("#newPwd, #cfmPwd,#oldPwd").val("");
			this.data = loginObj;
			if (loginObj.hasLoginPwd == "true") {
				$("#oldPwdWrap").show();
			} else {
				$("#oldPwdWrap").hide();
			}

			if (!this.addInputEvent) {
				$("#oldPwd").addPlaceholder(_("Must be numbers and letters"), true);
				$("#newPwd").addPlaceholder(_("Must be numbers and letters"), true);
				this.addInputEvent = true;
			}
		}
		this.checkData = function () {
			if ($("#newPwd").val() != $("#cfmPwd").val()) {
				if ($("#cfmPwd_") && $("#cfmPwd_").length > 0) {
					if (!$.isHidden($("#cfmPwd_")[0])) {
						$("#cfmPwd_").focus();
					} else {
						$("#cfmPwd").focus();
					}
				} else {
					$("#cfmPwd").focus();
				}
				return _("Password mismatch!");
			}
			return;
		};
		this.getSubmitData = function () {
			var encode = new Encode();
			var data = {
				module1: this.moduleName,
				//oldPwd: encode($("#oldPwd").val()),
				newPwd: encode($("#newPwd").val())
			};
			if (this.data.hasLoginPwd == "true") {
				data.oldPwd = encode($("#oldPwd").val());
			}
			return objToString(data);
		}
	}
	/***********END Login Password******************/



	/*
	 * @method wanParamModule [��ʾ�����õ�¼WAN�ڸ߼�����ģ�������]
	 * @return {��}
	 */
	var wanParamModule = new WanParamModule();
	pageModule.modules.push(wanParamModule);

	function WanParamModule() {
		var hostMac, routerMac;

		this.moduleName = "wanAdvCfg";

		this.data = {};

		this.init = function () {
			this.initEvent();
		}
		this.initEvent = function () {
			$("#macClone").on("change", changeMacCloneType);
			$("#wanServer").on("change", changeWanServerType);
			$("#wanService").on("change", changeWanServiceType);

		};
		this.initValue = function (wanAdvObj) {
			$("#wanServerName, #wanServiceName, #wanMTU, #macCurrentWan").removeValidateTipError(true);
			routerMac = wanAdvObj.macRouter;
			hostMac = wanAdvObj.macHost;
			this.initHtml(wanAdvObj);

			wanAdvObj.wanServer = wanAdvObj.wanServerName == "" ? "default" : "manual";
			wanAdvObj.wanService = wanAdvObj.wanServiceName == "" ? "default" : "manual";
			initMacOption(wanAdvObj);
			inputValue(wanAdvObj);
			$("#wanSpeedCurrent").html($("#wanSpeed").find("option[value='" + wanAdvObj.wanSpeedCurrent + "']").html());

			changeMacCloneType();
			changeWanServerType();
			changeWanServiceType();
		}

		this.getSubmitData = function () {
			var wanMac = "",
				macClone = $("#macClone").val();

			if (macClone == "clone") {
				wanMac = hostMac;
			} else if (macClone == "default") {
				wanMac = routerMac;
			} else {
				wanMac = $("#macCurrentWan").val().replace(/[-]/g, ":");
			}
			var data = {
				module2: this.moduleName,
				wanServerName: $("#wanServer").val() == "default" ? "" : $("#wanServerName").val(),
				wanServiceName: $("#wanService").val() == "default" ? "" : $("#wanServiceName").val(),
				wanMTU: $("#wanMTU")[0].val(),
				macClone: $("#macClone").val(),
				wanMAC: wanMac.toUpperCase(),
				wanSpeed: $("#wanSpeed").val()
			};
			return objToString(data);
		};
		this.initHtml = function (obj) {

			if (obj.wanType == "pppoe") {
				$("#serverNameWrap").show();
				$("#wanMTU").attr("data-options", '{"type":"num", "args":[576, 1492]}');
			} else {
				$("#serverNameWrap").hide();
				$("#wanMTU").attr("data-options", '{"type":"num", "args":[576, 1500]}');
			}

			$("#wanMTU").toSelect({
				"initVal": obj.wanMTU,
				"editable": "1",
				"size": "small",
				"options": [{
					"1492": "1492",
					"1480": "1480",
					"1450": "1450",
					"1400": "1400",
					".divider": ".divider",
					".hand-set": _("Manual")
				}]
			});
		}

		function initMacOption(obj) {
			var wanMac = obj.macCurrentWan;

			if (pageModule.data.isWifiClients.isWifiClients == "true") {
				$("#macClone option[value='clone']").remove();
				//obj.macClone = "manual";
			}

			if (obj.macClone == "clone" && wanMac != hostMac) {
				obj.macClone = "manual";
			}
		}

		function changeMacCloneType() {
			$("#macCurrentWan").removeValidateTipError(true);

			var macCloneType = $("#macClone").val();
			if (macCloneType == "clone") {
				$("#macCurrenWrap").html(_("Local Host's MAC: %s", [hostMac]));
				$("#macCurrentWan").hide();
				$("#macCurrenWrap").show();
			} else if (macCloneType == "default") {
				$("#macCurrenWrap").html(_("Factory MAC: %s", [routerMac]));
				$("#macCurrentWan").hide();
				$("#macCurrenWrap").show();
			} else {
				$("#macCurrentWan").show();
				$("#macCurrenWrap").hide();
			}
			top.mainLogic.initModuleHeight();
		}

		function changeWanServerType() {
			$("#wanServerName").removeValidateTipError(true);

			var wanServerType = $("#wanServer").val();
			$("#wanServerInfoWrap, #wanServerName").addClass("none");

			if (wanServerType == "default") {
				$("#wanServerInfoWrap").removeClass("none")
			} else {
				$("#wanServerName").removeClass("none");
			}
		}

		function changeWanServiceType() {
			$("#wanServiceName").removeValidateTipError(true);

			var wanServiceType = $("#wanService").val();
			$("#wanServiceInfoWrap, #wanServiceName").addClass("none");

			if (wanServiceType == "default") {
				$("#wanServiceInfoWrap").removeClass("none")
			} else {
				$("#wanServiceName").removeClass("none");
			}
		}
	}
	/***********END WAN Parameters***************************/

	/*
	 * @method lanModule [��ʾ�����õ�¼LAN��ģ�������]
	 * @return {��}
	 */
	var lanModule = new LanModule();
	pageModule.modules.push(lanModule);

	function LanModule() {
		var _this = this;
		this.moduleName = "lanCfg";

		this.data = {};

		this.init = function () {
			this.initEvent();
		};

		this.changeIpNet = function () {
			var ipCheck = false,
				lanIP = $("#lanIP").val();
			if ((/^([1-9]|[1-9]\d|1\d\d|2[0-1]\d|22[0-3])\.(([0-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.){2}([0-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])$/).test(lanIP)) {
				ipCheck = true;
			}

			if ($("#lanMask").parent().hasClass("has-error") || $("#lanIP").parent().hasClass("has-error") || !ipCheck) {
				return;
			}

			var ipNet = "",
				ipArry = $("#lanIP").val().split(".");

			ipNet = ipArry[0] + "." + ipArry[1] + "." + ipArry[2] + ".";
			$(".ipNet").html(ipNet);

			//�жϳ�ʼ��ʱLAN IP == LAN DNS1�������޸�LAN IPʱͬʱ�ı�LAN DNS1
			if (_this.data.lanIP == _this.data.lanDns1) {
				$("#lanDns1").val($("#lanIP").val());
			}

		}

		this.initEvent = function () {
			$("#dhcpEn").on("click", changeDhcpEn);
			$("#lanIP").on("blur", _this.changeIpNet);
			$.validate.valid.lanMaskExt = {
				all: function (str) {
					var msg = $.validate.valid.mask(str);
					if (msg) {
						return msg;
					}
					if (str !== "255.255.255.0" && str !== "255.255.0.0" && str !== "255.0.0.0") {
						return _("Variable-Length Subnet Mask is not available.");
					}
				}
			}

		}
		this.initValue = function (lanCfgObj) {
			$("#lanIP, #lanMask, #lanDhcpStartIP,#lanDhcpEndIP, #lanDns1, #lanDns2").removeValidateTipError(true);

			this.data = lanCfgObj;
			inputValue(this.data);

			var ipNet = "",
				ipArry = this.data.lanDhcpStartIP.split(".");
			ipNet = ipArry[0] + "." + ipArry[1] + "." + ipArry[2] + ".";
			$(".ipNet").html(ipNet);
			$("#lanDhcpStartIP").val(this.data.lanDhcpStartIP.split(".")[3]);
			$("#lanDhcpEndIP").val(this.data.lanDhcpEndIP.split(".")[3]);
			changeDhcpEn();
		}
		this.checkData = function () {
			var lanIP = $("#lanIP").val(),
				lanMask = $("#lanMask").val(),
				startIP = $(".ipNet").eq(0).html() + $("#lanDhcpStartIP").val(),
				endIP = $(".ipNet").eq(0).html() + $("#lanDhcpEndIP").val(),
				wanIP = pageModule.data.systemInfo.statusWanIP,
				wanMask = pageModule.data.systemInfo.statusWanMask;
			var msg = checkIsVoildIpMask(lanIP, lanMask, _("LAN IP"));
			if (msg) {
				$("#lanIP").focus();
				return msg;
			}

			if ((/^([1-9]|[1-9]\d|1\d\d|2[0-1]\d|22[0-3])\.(([0-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.){2}([0-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])$/).test(wanIP)) {

				if (checkIpInSameSegment(lanIP, lanMask, wanIP, wanMask)) {
					$("#lanIP").focus();
					return _("%s and %s (%s) should not be in the same network segment.", [_("LAN IP"), _("WAN IP"), wanIP]);
				}
			}

			if (lanMask !== "255.255.255.0" && lanMask !== "255.255.0.0" && lanMask !== "255.0.0.0") {
				return _("Subnet Mask Error! Variable-Length Subnet Mask is not available.");
			}



			if ($("#dhcpEn")[0].checked) {
				if (!checkIpInSameSegment(startIP, lanMask, lanIP, lanMask)) {
					$("#lanDhcpStartIP").focus();
					return _("%s and %s must be in the same network segment.", [_("Start IP"), _("LAN IP")]);
				}

				msg = checkIsVoildIpMask(startIP, lanMask, _("Start IP"));
				if (msg) {
					$("#lanDhcpStartIP").focus();
					return msg;
				}

				if (!checkIpInSameSegment(endIP, lanMask, lanIP, lanMask)) {
					$("#lanDhcpEndIP").focus();
					return _("%s and %s must be in the same network segment.", [_("End IP"), _("LAN IP")]);
				}

				msg = checkIsVoildIpMask(endIP, lanMask, _("End IP"));
				if (msg) {
					$("#lanDhcpEndIP").focus();
					return msg;
				}

				var sipArry = startIP.split("."),
					eipArry = endIP.split("."),
					sipNumber,
					eipNumber;
				sipNumber = parseInt(sipArry[0], 10) * 256 * 256 * 256 + parseInt(sipArry[1], 10) * 256 * 256 + parseInt(sipArry[2], 10) * 256 + parseInt(sipArry[3], 10);
				eipNumber = parseInt(eipArry[0], 10) * 256 * 256 * 256 + parseInt(eipArry[1], 10) * 256 * 256 + parseInt(eipArry[2], 10) * 256 + parseInt(eipArry[3], 10);
				if (sipNumber > eipNumber) {
					$("#lanDhcpEndIP").focus();
					return _("The start IP can't be greater than the end IP.");
				}
				if ($("#lanDns1").val() == $("#lanDns2").val()) {
					return _("Preferred DNS server and Alternative DNS server can't be the same.");
				}
			}
			return;
		}
		this.getSubmitData = function () {
			var data = {
				module3: this.moduleName,
				lanIP: $("#lanIP").val(),
				lanMask: $("#lanMask").val(),
				dhcpEn: $("#dhcpEn")[0].checked == true ? "true" : "false",
				lanDhcpStartIP: $(".ipNet").eq(0).html() + $("#lanDhcpStartIP").val(),
				lanDhcpEndIP: $(".ipNet").eq(0).html() + $("#lanDhcpEndIP").val(),
				//lanDhcpLeaseTime: $("#lanDhcpLeaseTime").val(),
				lanDns1: $("#lanDns1").val(),
				lanDns2: $("#lanDns2").val()
			};
			return objToString(data);
		}

		function changeDhcpEn() {
			if ($("#dhcpEn")[0].checked) {
				$("#dnsWrap").show();
			} else {
				$("#dnsWrap").hide();
			}
			top.mainLogic.initModuleHeight();
		}
	}
	/***********EDN LAN Parameters*************/



	/***********Remote Web Management*******************/
	var remoteModule = new RemoteModule();
	pageModule.modules.push(remoteModule);

	function RemoteModule() {
		this.moduleName = "remoteWeb";
		this.init = function () {
			this.initEvent();
		};
		this.initEvent = function () {
			$("#remoteWebEn").on("click", changeRemoteEn);
			$("#remoteWebType").on("change", changeRemoteWebType);
		}
		this.initValue = function (obj) {
			inputValue(obj);
			changeRemoteEn();
			changeRemoteWebType();
		}
		this.checkData = function () {
			var lanIP = $("#lanIP").val(),
				lanMask = $("#lanMask").val(),
				remoteWebIP = $("#remoteWebIP").val();

			if ($("#remoteWebEn")[0].checked && $("#remoteWebType").val() == "specified") {
				var msg = checkIsVoildIpMask(remoteWebIP, "255.255.255.0", _("Remote IP"));
				if (msg) {
					$("#remoteWebIP").focus();
					return msg;
				}

				if (remoteWebIP == lanIP) {
					$("#remoteWebIP").focus();
					return _("%s should not be the same with the %s(%s)", [_("Remote IP"), _("LAN IP"), lanIP]);
				}

				if (checkIpInSameSegment(remoteWebIP, lanMask, lanIP, lanMask)) {
					$("#remoteWebIP").focus();
					return _("%s and %s (%s) should not be in the same network segment.", [_("Remote IP"), _("LAN IP"), lanIP]);
				}
			}
		}
		this.getSubmitData = function () {
			var data = {
				module4: this.moduleName,
				remoteWebEn: $("#remoteWebEn")[0].checked == true ? "true" : "false",
				remoteWebType: $("#remoteWebType").val(),
				remoteWebIP: $("#remoteWebIP").val(),
				remoteWebPort: $("#remoteWebPort").val()
			};
			return objToString(data);
		}

		function changeRemoteEn() {
			if ($("#remoteWebEn")[0].checked) {
				$("#remoteWrap").show();
			} else {
				$("#remoteWrap").hide();
			}
			top.mainLogic.initModuleHeight();
		}

		function changeRemoteWebType() {
			if ($("#remoteWebType").val() == "any") {
				$("#remoteWebIP").parent().hide();
			} else {
				$("#remoteWebIP").parent().show();
			}
			top.mainLogic.initModuleHeight();
		}
	}
	/***********END Remote Web Management***************/

	/***********Date & Time***************/
	var timeModule = new TimeModule();
	pageModule.modules.push(timeModule);

	function TimeModule() {

		this.moduleName = "sysTime";
		this.initValue = function (obj) {
			inputValue(obj);
			if (obj.internetState == "true") {
				$("#internetTips").show();
			} else {
				$("#internetTips").hide();
			}
		}
		this.getSubmitData = function () {
			var data = {
				module5: this.moduleName,
				sysTimeZone: $("#sysTimeZone").val()
			};
			return objToString(data);
		}
	}
	/***********END Date & Time**************/


	/*
	 * ��ʾ�����ñ����õ�ϵͳ��Ϣ
	 * @method manageModule
	 * @param {Object} softWare �Ӻ�̨��ȡ�Ĺ������õ���Ϣ
	 * @return {��}
	 */
	var manageModule = new ManageModule();
	pageModule.modules.push(manageModule);

	function ManageModule() {
		this.moduleName = "softWare";

		this.init = function () {
			this.initEvent();
			goUpgrade();
			goInport();
		};
		this.initEvent = function () {
			$("#onlineUpgrade").on("click",function(){
				var o =(new MainLogic()).onlineUpgrade;//define in index.js
				o.showModal();
				o.detecting();
				setTimeout(function(){ //detecting for at least 2s
					$.get("goform/detectNewVersion",function(res){
						res = JSON.parse(res);
						if(res.hasNewVersion === "1"){//���°汾
							o.hasNewVersion(res);
						}else{//û��
							o.noNewVersion();
						}
					});
				},2000);
			});
			$("#inport-file").on("mouseenter",function(){
				$("#inport").addClass("hover");
			});
			$("#inport-file").on("mouseout",function(){
				$("#inport").removeClass("hover");
			});
			$("#upgrade-file").on("mouseenter",function(){
				$("#upgrade").addClass("hover");
			});
			$("#upgrade-file").on("mouseout",function(){
				$("#upgrade").removeClass("hover");
			});
			$("#reboot").on("click", function () {
				if (confirm(_("Reboot the device?"))) {
					$.post("goform/sysReboot", "module1=sysOperate&action=reboot", function (str) {
						if (checkIsTimeOut(str)) {
							top.location.reload(true);
							return;
						}
						var num = $.parseJSON(str).errCode;
						if (num == 100) {
							progressLogic.init("", "reboot", 200);
							clearTimeout(pageModule.updateTimer);
						}
					});
				}
			});

			$("#restore").on("click", function () {
				if (confirm(_("Resetting to factory default will clear all settings of the router."))) {
					$.post("goform/sysRestore", "module1=sysOperate&action=restore", function (str) {
						if (checkIsTimeOut(str)) {
							top.location.reload(true);
							return;
						}
						var num = $.parseJSON(str).errCode;
						if (num == 100) {
							var jumpIp = (window.location.href.indexOf('meukeo.local') == -1 ? '10.0.0.1' : '');
							progressLogic.init(_("Resetting...Please wait..."), "restore", 200, jumpIp);
							clearTimeout(pageModule.updateTimer);
						}
					});
				}
			});

			$("#export").on("click", function () {
				window.location = "/cgi-bin/DownloadSyslog/RouterSystem.log?" + Math.random();
			});

			$("#exportConfig").on("click", function () {
				window.location = "/cgi-bin/DownloadCfg/RouterCfm.cfg?" + Math.random();
			});
		};
		this.initValue = function (softObj) {
			$("#autoMaintenanceEn")[0].checked = (softObj.autoMaintenanceEn == "true");
			$("#firmwareVision").html(softObj.softVersion);
		};
		this.checkData = function () {
			return;
		};
		this.getSubmitData = function () {
			pageModule.rebootIP = $("#lanIP").val();
			var data = {
				module6: this.moduleName,
				autoMaintenanceEn: $("#autoMaintenanceEn")[0].checked == true ? "true" : "false"
			};
			return objToString(data);
		};
		
		function goUpgrade() {
			pageModule.upgradeLoad = new AjaxUpload("upgrade", {
				action: './cgi-bin/upgrade',
				name: 'upgradeFile',
				responseType: 'json',

				onSubmit: function (file, ext) {
					if (confirm(_('Upgrade the device?'))) {
						if (!ext) {
							return false;
						}
						//  if (!(ext && /^(bin|trx)$/.test(ext))) {  
						//    alert("��ѡ���ļ����� ��trx�� �� ��bin����β���ļ�");  
						//    return false;  
						//  }  
					} else {
						document.upgradefrm.reset();
						return false;
					}
				},
				onComplete: function (file, msg) {
					if (typeof msg == 'string' && checkIsTimeOut(msg)) {
						top.location.reload(true);
						return;
					}
					var num = msg.errCode;
					if (num == "100") {
						parent.progressLogic.init("", "upgrade");
					} else if (num == "201") {
						mainLogic.showModuleMsg(_("Firmware error!") + " " + _("The router will reboot."));
						setTimeout(function () {
							progressLogic.init("", "reboot", 200);
						}, 2000);
						clearTimeout(pageModule.updateTimer);
					} else if (num == "202") {
						mainLogic.showModuleMsg(_("Upgrade failed!"));
					} else if (num == "203") {
						mainLogic.showModuleMsg(_("Firmware size is too large!") + " " + _("The router will reboot."));
						setTimeout(function () {
							progressLogic.init("", "reboot", 200);
						}, 2000)
						clearTimeout(pageModule.updateTimer);
					}
				}
			});
		}

		function goInport() {
			pageModule.inport = new AjaxUpload("inport", {
				action: './cgi-bin/UploadCfg',
				name: 'inportFile',
				responseType: 'json',

				onSubmit: function (file, ext) {
					if (confirm(_('Restore now?'))) {
						if (!ext) {
							return false;
						}

					} else {
						document.inportfrm.reset();
						return false;
					}
				},
				onComplete: function (file, msg) {
					if (typeof msg == 'string' && checkIsTimeOut(msg)) {
						top.location.reload(true);
						return;
					}
					var num = msg.errCode;
					if (num == "100") {
						progressLogic.init("", "reboot", 200);
					} else if (num == "201") {
						mainLogic.showModuleMsg(_("Firmware error!") + " " + _("The router will reboot."));
						setTimeout(function () {
							progressLogic.init("", "reboot", 200);
						}, 2000);
					} else if (num == "202") {
						mainLogic.showModuleMsg(_("Failed to import the configurations!"));
						setTimeout(function () {
							progressLogic.init("", "reboot", 200);
						}, 2000);
					}
					clearTimeout(pageModule.updateTimer);
				}
			});
		}

	}
	/***********END Device Management**********/
})